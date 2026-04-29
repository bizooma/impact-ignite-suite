import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GbpReview {
  id: string;
  gbp_profile_id: string;
  organization_id: string;
  google_review_id: string;
  reviewer_name: string;
  reviewer_photo_url: string | null;
  rating: number;
  review_text: string | null;
  review_date: string;
  reply_status: 'pending_ai' | 'awaiting_approval' | 'approved' | 'posted' | 'rejected';
  ai_generated_response: string | null;
  edited_response: string | null;
  final_response: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReviewStats {
  total: number;
  pendingApproval: number;
  avgRating: number;
  responseRate: number;
  avgResponseTime: string;
}

interface ReviewFilters {
  status?: string;
  rating?: number;
  profileId?: string;
  search?: string;
}

export const useGbpReviews = (organizationId?: string) => {
  const [reviews, setReviews] = useState<GbpReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total: 0,
    pendingApproval: 0,
    avgRating: 0,
    responseRate: 0,
    avgResponseTime: '—',
  });

  const fetchReviews = async (filters?: ReviewFilters) => {
    if (!organizationId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('gbp_reviews')
        .select('*')
        .eq('organization_id', organizationId)
        .order('review_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('reply_status', filters.status as any);
      }
      if (filters?.rating) {
        query = query.eq('rating', filters.rating);
      }
      if (filters?.profileId) {
        query = query.eq('gbp_profile_id', filters.profileId);
      }
      if (filters?.search) {
        // Sanitize: escape PostgREST `or()` reserved chars to prevent filter injection.
        // Strip commas, parens, and backslashes; collapse to a safe ilike pattern.
        const safeSearch = filters.search.replace(/[,()\\*]/g, '').trim();
        if (safeSearch) {
          const pattern = `%${safeSearch}%`;
          query = query.or(`reviewer_name.ilike.${pattern},review_text.ilike.${pattern}`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setReviews(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsData: GbpReview[]) => {
    const total = reviewsData.length;
    const pendingApproval = reviewsData.filter(r => r.reply_status === 'awaiting_approval').length;
    const avgRating = total > 0 
      ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / total 
      : 0;
    const responded = reviewsData.filter(r => r.final_response).length;
    const responseRate = total > 0 ? (responded / total) * 100 : 0;

    // Calculate average response time
    const responseTimes = reviewsData
      .filter(r => r.posted_at)
      .map(r => {
        const reviewDate = new Date(r.review_date).getTime();
        const postedDate = new Date(r.posted_at!).getTime();
        return postedDate - reviewDate;
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const hours = Math.floor(avgResponseTime / (1000 * 60 * 60));
    const avgResponseTimeStr = hours > 24 
      ? `${Math.floor(hours / 24)}d ${hours % 24}h`
      : hours > 0 
        ? `${hours}h`
        : avgResponseTime > 0 
          ? '<1h' 
          : '—';

    setReviewStats({
      total,
      pendingApproval,
      avgRating: Math.round(avgRating * 10) / 10,
      responseRate: Math.round(responseRate),
      avgResponseTime: avgResponseTimeStr,
    });
  };

  const approveReview = async (reviewId: string, editedResponse?: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) throw new Error('Review not found');

      const finalResponse = editedResponse || review.ai_generated_response;
      
      const { error } = await supabase
        .from('gbp_reviews')
        .update({
          reply_status: 'approved',
          edited_response: editedResponse || null,
          final_response: finalResponse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      // Trigger posting to Google
      await supabase.functions.invoke('gbp-post-response', {
        body: { reviewId },
      });

      toast.success('Response approved and posted to Google');
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    }
  };

  const editResponse = async (reviewId: string, newResponse: string) => {
    try {
      const { error } = await supabase
        .from('gbp_reviews')
        .update({
          edited_response: newResponse,
          final_response: newResponse,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Response updated');
      fetchReviews();
    } catch (error) {
      console.error('Error editing response:', error);
      toast.error('Failed to update response');
    }
  };

  const rejectReview = async (reviewId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('gbp_reviews')
        .update({
          reply_status: 'rejected',
          metadata: { rejection_reason: reason },
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Response rejected');
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    }
  };

  const regenerateResponse = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('gbp_reviews')
        .update({
          reply_status: 'pending_ai',
          ai_generated_response: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      // Trigger AI generation
      await supabase.functions.invoke('gbp-generate-response', {
        body: { reviewId },
      });

      toast.success('Regenerating AI response...');
      fetchReviews();
    } catch (error) {
      console.error('Error regenerating response:', error);
      toast.error('Failed to regenerate response');
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchReviews();

      // Real-time subscription for review updates
      const channel = supabase
        .channel(`gbp_reviews:${organizationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gbp_reviews',
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => {
            console.log('Review change detected:', payload);
            fetchReviews();
            
            if (payload.eventType === 'INSERT') {
              toast.info('New review received!', {
                description: 'A customer left a new review on your Google Business Profile.',
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organizationId]);

  return {
    reviews,
    reviewStats,
    loading,
    fetchReviews,
    approveReview,
    editResponse,
    rejectReview,
    regenerateResponse,
  };
};
