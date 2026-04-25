// Real social publisher. Looks up the per-organization integration row
// (Facebook or LinkedIn) and publishes via the platform's API using the
// organization's stored access token.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FB_API_VERSION = "v19.0";
const LI_API_VERSION = "202405"; // LinkedIn versioned APIs (YYYYMM)

interface PublishRequest {
  postId: string;
}

// ---------------- LinkedIn ----------------

async function uploadLinkedInImage(args: {
  ownerUrn: string;       // urn:li:organization:{id}
  accessToken: string;
  imageUrl: string;
}): Promise<string> {
  const { ownerUrn, accessToken, imageUrl } = args;

  // 1. Initialize image upload
  const initRes = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": LI_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({ initializeUploadRequest: { owner: ownerUrn } }),
    },
  );
  const initJson = await initRes.json();
  if (!initRes.ok) {
    throw new Error(
      initJson?.message || `LinkedIn image init failed (${initRes.status})`,
    );
  }
  const uploadUrl: string = initJson?.value?.uploadUrl;
  const imageUrn: string = initJson?.value?.image;
  if (!uploadUrl || !imageUrn) {
    throw new Error("LinkedIn image init returned no uploadUrl/image URN");
  }

  // 2. Download the source image so we can stream the bytes to LinkedIn
  const srcRes = await fetch(imageUrl);
  if (!srcRes.ok) {
    throw new Error(`Could not fetch source image: ${srcRes.status}`);
  }
  const bytes = new Uint8Array(await srcRes.arrayBuffer());

  // 3. Upload to LinkedIn's signed URL
  const upRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: bytes,
  });
  if (!upRes.ok) {
    const text = await upRes.text().catch(() => "");
    throw new Error(`LinkedIn image upload failed (${upRes.status}): ${text}`);
  }

  return imageUrn;
}

async function publishToLinkedInPage(args: {
  ownerUrn: string;
  accessToken: string;
  text: string;
  mediaUrls: string[];
}): Promise<{ id: string }> {
  const { ownerUrn, accessToken, text, mediaUrls } = args;

  // Upload images first (LinkedIn supports either single image OR multi-image carousel)
  const imageUrns: string[] = [];
  for (const url of mediaUrls) {
    const urn = await uploadLinkedInImage({ ownerUrn, accessToken, imageUrl: url });
    imageUrns.push(urn);
  }

  let content: Record<string, unknown> = {};
  if (imageUrns.length === 1) {
    content = { media: { id: imageUrns[0] } };
  } else if (imageUrns.length > 1) {
    content = {
      multiImage: {
        images: imageUrns.map((id) => ({ id })),
      },
    };
  }

  const body = {
    author: ownerUrn,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
    ...(Object.keys(content).length > 0 ? { content } : {}),
  };

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LI_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  // LinkedIn returns the new post URN in the x-restli-id header on 201
  const postUrn = res.headers.get("x-restli-id") || res.headers.get("X-RestLi-Id");
  if (res.ok && postUrn) {
    return { id: postUrn };
  }

  // Fall back to parsing JSON for error details
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.message || `LinkedIn API error ${res.status}`,
    );
  }
  return { id: json?.id ?? "unknown" };
}

async function publishToFacebookPage(args: {
  pageId: string;
  pageAccessToken: string;
  message: string;
  mediaUrls: string[];
}): Promise<{ id: string }> {
  const { pageId, pageAccessToken, message, mediaUrls } = args;

  // No media → simple text post
  if (mediaUrls.length === 0) {
    const url =
      `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/feed`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        access_token: pageAccessToken,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || `Facebook API error ${res.status}`);
    }
    return { id: json.id };
  }

  // Single image → /photos with message
  if (mediaUrls.length === 1) {
    const url =
      `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/photos`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        url: mediaUrls[0],
        caption: message,
        access_token: pageAccessToken,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || `Facebook API error ${res.status}`);
    }
    return { id: json.post_id || json.id };
  }

  // Multi-image → upload each as unpublished, then create a feed post
  // referencing them via attached_media
  const photoIds: string[] = [];
  for (const mediaUrl of mediaUrls) {
    const phRes = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          url: mediaUrl,
          published: "false",
          access_token: pageAccessToken,
        }),
      },
    );
    const phJson = await phRes.json();
    if (!phRes.ok || !phJson.id) {
      throw new Error(phJson?.error?.message || "Failed to upload photo");
    }
    photoIds.push(phJson.id);
  }

  const attached = photoIds.map((id) => ({ media_fbid: id }));
  const feedRes = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        attached_media: attached,
        access_token: pageAccessToken,
      }),
    },
  );
  const feedJson = await feedRes.json();
  if (!feedRes.ok) {
    throw new Error(feedJson?.error?.message || `Facebook API error ${feedRes.status}`);
  }
  return { id: feedJson.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: use service-role for DB writes but verify the caller's JWT first
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: PublishRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.postId) {
    return new Response(JSON.stringify({ error: "postId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Load the post
    const { data: post, error: postErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", body.postId)
      .single();
    if (postErr || !post) {
      return new Response(
        JSON.stringify({ error: postErr?.message || "Post not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Authorize: caller must be a member of the post's organization
    const { data: isMember } = await supabase.rpc("is_org_member", {
      _user_id: user.id,
      _org_id: post.organization_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (post.platform !== "facebook" && post.platform !== "linkedin") {
      const reason = `Publishing for "${post.platform}" is not yet supported. Connect Facebook or LinkedIn.`;
      await supabase.from("social_posts").update({
        status: "failed",
        metadata: { ...(post.metadata || {}), publish_error: reason },
      }).eq("id", post.id);
      return new Response(JSON.stringify({ error: reason }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the integration row to publish through
    const targetPageId = (post.metadata as any)?.target_page_id ?? null;
    let integrationQuery = supabase
      .from("integrations")
      .select("id, config, encrypted_tokens, status")
      .eq("organization_id", post.organization_id)
      .eq("provider", post.platform)
      .eq("status", "active");

    if (targetPageId) {
      integrationQuery = integrationQuery.contains("config", { page_id: targetPageId });
    }

    const { data: integrations } = await integrationQuery;
    const integration = integrations?.[0];
    const platformLabel = post.platform === "facebook" ? "Facebook" : "LinkedIn";
    if (!integration) {
      const reason = targetPageId
        ? `No active ${platformLabel} integration found for Page ${targetPageId}. Reconnect from Social Integrations.`
        : `No active ${platformLabel} Page connected. Connect a Page from Social Integrations first.`;
      await supabase.from("social_posts").update({
        status: "failed",
        metadata: { ...(post.metadata || {}), publish_error: reason },
      }).eq("id", post.id);
      return new Response(JSON.stringify({ error: reason }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = integration.config as any;
    const tokens = integration.encrypted_tokens as any;
    const mediaUrls: string[] = Array.isArray(post.media_urls) ? post.media_urls : [];
    const message: string = post.content ?? "";

    let publishedExternalId: string;
    let publishedPageId: string;

    if (post.platform === "facebook") {
      const pageId: string = cfg?.page_id;
      const pageAccessToken: string = tokens?.page_access_token;
      if (!pageId || !pageAccessToken) {
        const reason = "Facebook integration is missing page_id or access token. Please reconnect.";
        await supabase.from("social_posts").update({
          status: "failed",
          metadata: { ...(post.metadata || {}), publish_error: reason },
        }).eq("id", post.id);
        return new Response(JSON.stringify({ error: reason }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await publishToFacebookPage({
        pageId,
        pageAccessToken,
        message,
        mediaUrls,
      });
      publishedExternalId = result.id;
      publishedPageId = pageId;
    } else {
      // LinkedIn
      const ownerUrn: string = cfg?.page_urn;
      const accessToken: string = tokens?.access_token;
      if (!ownerUrn || !accessToken) {
        const reason = "LinkedIn integration is missing page_urn or access token. Please reconnect.";
        await supabase.from("social_posts").update({
          status: "failed",
          metadata: { ...(post.metadata || {}), publish_error: reason },
        }).eq("id", post.id);
        return new Response(JSON.stringify({ error: reason }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await publishToLinkedInPage({
        ownerUrn,
        accessToken,
        text: message,
        mediaUrls,
      });
      publishedExternalId = result.id;
      publishedPageId = cfg?.page_id ?? ownerUrn;
    }

    const publishedAt = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("social_posts")
      .update({
        status: "published",
        published_at: publishedAt,
        external_post_id: publishedExternalId,
        metadata: {
          ...(post.metadata || {}),
          published_page_id: publishedPageId,
          published_page_name: cfg?.page_name,
        },
      })
      .eq("id", post.id);
    if (updErr) {
      console.error("[social-publisher] update error", updErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        platform: post.platform,
        page_id: publishedPageId,
        external_post_id: publishedExternalId,
        published_at: publishedAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("[social-publisher] error", error);
    const reason = error?.message || "Unknown error";
    // Best-effort failure recording
    if (body?.postId) {
      try {
        await supabase.from("social_posts").update({
          status: "failed",
          metadata: { publish_error: reason, failed_at: new Date().toISOString() },
        }).eq("id", body.postId);
      } catch (recordErr) {
        console.error("[social-publisher] could not record failure", recordErr);
      }
    }
    return new Response(
      JSON.stringify({ error: reason }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
