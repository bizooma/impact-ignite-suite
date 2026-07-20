import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Check, X, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type ResultRow = {
  platform: string;
  prompt: string;
  has_mention: boolean;
  is_citation: boolean;
  competitors: string[];
  mention_text?: string | null;
};

type RunSummary = {
  id: string;
  domain: string;
  overall_score: number;
  total_checks: number;
  mention_count: number;
  citation_count: number;
  created_at: string;
  prompts: string[];
};

type ScorecardData = {
  domain: string;
  overall_score: number;
  total_checks: number;
  mention_count: number;
  citation_count: number;
  results: ResultRow[];
  prompts: string[];
};

const DEFAULT_PROMPTS = `best CRM for nonprofits
top nonprofit marketing platforms
how to run a Giving Tuesday campaign`;

export default function AiVisibility() {
  const [domain, setDomain] = useState("");
  const [promptsText, setPromptsText] = useState(DEFAULT_PROMPTS);
  const [loading, setLoading] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [history, setHistory] = useState<RunSummary[]>([]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("ai_visibility_runs")
      .select("id, domain, overall_score, total_checks, mention_count, citation_count, created_at, prompts")
      .order("created_at", { ascending: false })
      .limit(25);
    if (data) setHistory(data as any);
  };

  useEffect(() => { loadHistory(); }, []);

  const runCheck = async () => {
    const prompts = promptsText.split("\n").map((p) => p.trim()).filter(Boolean).slice(0, 20);
    if (!domain.trim()) return toast.error("Enter a domain");
    if (prompts.length === 0) return toast.error("Add at least one prompt");
    setLoading(true);
    setScorecard(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-visibility-check", {
        body: { domain: domain.trim(), prompts },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setScorecard({
        domain: data.domain,
        overall_score: data.overall_score,
        total_checks: data.total_checks,
        mention_count: data.mention_count,
        citation_count: data.citation_count,
        results: data.results.map((r: any) => ({
          platform: r.platform,
          prompt: r.prompt,
          has_mention: r.hasMention,
          is_citation: r.isCitation,
          competitors: r.competitors || [],
          mention_text: r.mentionText,
        })),
        prompts,
      });
      toast.success("AI visibility check complete");
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || "Check failed");
    } finally {
      setLoading(false);
    }
  };

  const openRun = async (runId: string) => {
    const { data: run } = await supabase.from("ai_visibility_runs").select("*").eq("id", runId).maybeSingle();
    const { data: results } = await supabase.from("ai_visibility_results").select("*").eq("run_id", runId);
    if (!run || !results) return;
    setScorecard({
      domain: run.domain,
      overall_score: run.overall_score,
      total_checks: run.total_checks,
      mention_count: run.mention_count,
      citation_count: run.citation_count,
      results: results as any,
      prompts: (run.prompts as any) || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scoreColor = (s: number) => s >= 70 ? "text-green-600" : s >= 40 ? "text-amber-600" : "text-red-600";

  // Group results by prompt for scorecard table
  const promptRows = scorecard
    ? scorecard.prompts.map((prompt) => {
        const rowResults = scorecard.results.filter((r) => r.prompt === prompt);
        const openai = rowResults.find((r) => r.platform === "openai");
        const gemini = rowResults.find((r) => r.platform === "gemini");
        const competitors = Array.from(
          new Set(
            rowResults
              .filter((r) => !r.has_mention)
              .flatMap((r) => r.competitors)
          )
        ).slice(0, 8);
        return { prompt, openai, gemini, competitors };
      })
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          AI Visibility Checker
        </h1>
        <p className="text-muted-foreground mt-1">
          See whether real AI assistants (ChatGPT, Gemini) recommend your website when buyers ask questions — and which competitors show up instead.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run a check</CardTitle>
          <CardDescription>Enter your domain and up to 20 buyer-intent questions (one per line). A full run takes about a minute.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="domain">Your domain</Label>
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="prompts">Buyer-intent prompts (one per line, max 20)</Label>
            <Textarea
              id="prompts"
              rows={8}
              value={promptsText}
              onChange={(e) => setPromptsText(e.target.value)}
              disabled={loading}
              className="font-mono text-sm"
            />
          </div>
          <Button onClick={runCheck} disabled={loading} size="lg">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running check (~1 min)...</>
            ) : (
              <>Run Check</>
            )}
          </Button>
        </CardContent>
      </Card>

      {scorecard && (
        <Card>
          <CardHeader>
            <CardTitle>Scorecard: {scorecard.domain}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-lg border bg-card text-center">
                <div className={`text-5xl font-bold ${scoreColor(scorecard.overall_score)}`}>
                  {scorecard.overall_score}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Overall Visibility</div>
              </div>
              <div className="p-6 rounded-lg border bg-card text-center">
                <div className="text-3xl font-bold">{scorecard.mention_count}</div>
                <div className="text-sm text-muted-foreground mt-1">Mentions</div>
              </div>
              <div className="p-6 rounded-lg border bg-card text-center">
                <div className="text-3xl font-bold">{scorecard.citation_count}</div>
                <div className="text-sm text-muted-foreground mt-1">Citations (linked)</div>
              </div>
              <div className="p-6 rounded-lg border bg-card text-center">
                <div className="text-3xl font-bold">{scorecard.total_checks}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Checks</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prompt</TableHead>
                    <TableHead className="text-center">ChatGPT</TableHead>
                    <TableHead className="text-center">Gemini</TableHead>
                    <TableHead>Competitors shown instead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promptRows.map((row) => (
                    <TableRow key={row.prompt}>
                      <TableCell className="font-medium max-w-xs">{row.prompt}</TableCell>
                      <TableCell className="text-center">
                        {row.openai ? (row.openai.has_mention ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-600 inline" />) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.gemini ? (row.gemini.has_mention ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-600 inline" />) : "—"}
                      </TableCell>
                      <TableCell>
                        {row.competitors.length === 0 ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {row.competitors.map((c) => (
                              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Past runs</CardTitle>
          <CardDescription>Click any run to reopen its scorecard.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No runs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Mentions</TableHead>
                  <TableHead className="text-center">Checks</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => openRun(r.id)}>
                    <TableCell className="text-sm">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{r.domain}</TableCell>
                    <TableCell className={`text-center font-bold ${scoreColor(r.overall_score)}`}>{r.overall_score}</TableCell>
                    <TableCell className="text-center">{r.mention_count}</TableCell>
                    <TableCell className="text-center">{r.total_checks}</TableCell>
                    <TableCell><ExternalLink className="w-4 h-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
