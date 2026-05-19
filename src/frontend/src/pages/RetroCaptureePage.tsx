import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bot,
  CheckSquare,
  ClipboardCheck,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Square,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { Layout } from "../components/Layout";
import { useBackend } from "../hooks/use-backend";
import type {
  CreateRetroSessionInput,
  RDActivity,
  RetroSession,
} from "../types";

// ─── Date helpers ────────────────────────────────────────────────────────────
function isOlderThanThreeYears(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 3);
    return d < cutoff;
  } catch {
    return false;
  }
}

function formatSovereignTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

// ─── Candidate activity card ──────────────────────────────────────────────────
interface CandidateCardProps {
  activity: RDActivity;
  index: number;
  selected: boolean;
  onToggle: (id: string) => void;
}

function CandidateCard({
  activity,
  index,
  selected,
  onToggle,
}: CandidateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(activity.id)}
      data-ocid={`retro_capture.candidate.item.${index + 1}`}
      className={cn(
        "w-full text-left rounded-lg border p-3.5 transition-smooth",
        selected
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-card/60 hover:border-primary/30 hover:bg-card",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-primary">
          {selected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {activity.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-score text-xs text-muted-foreground">
              {activity.hours_spent}h
            </span>
            <EligibilityBadge label={activity.eligibility_label} size="sm" />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Setup form ───────────────────────────────────────────────────────────────
interface SetupFormProps {
  onStart: (input: CreateRetroSessionInput) => void;
  isLoading: boolean;
}

function SetupForm({ onStart, isLoading }: SetupFormProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const retroWarning = isOlderThanThreeYears(start);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;
    onStart({ time_range_start: start, time_range_end: end });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-8 max-w-md mx-auto mt-10"
      data-ocid="retro_capture.setup_form"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-score text-base font-semibold text-foreground">
            Start Retro Session
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define the period to capture
          </p>
        </div>
      </div>

      {retroWarning && (
        <div
          className="flex items-start gap-2.5 rounded-md border border-borderline/40 bg-borderline/10 px-3 py-2.5 mb-4"
          data-ocid="retro_capture.cutoff_warning"
        >
          <AlertTriangle className="w-4 h-4 text-borderline shrink-0 mt-0.5" />
          <p className="text-xs text-borderline">
            Start date is over 3 years ago. Contemporaneous records (emails,
            commits, logs) are required by IRS for retroactive QRE claims.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="period-start-input"
            className="block text-xs font-score font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
          >
            Period Start
          </label>
          <input
            id="period-start-input"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            data-ocid="retro_capture.start_date_input"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground font-score focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="period-end-input"
            className="block text-xs font-score font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
          >
            Period End
          </label>
          <input
            id="period-end-input"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            data-ocid="retro_capture.end_date_input"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground font-score focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!start || !end || isLoading}
        className="w-full mt-6 font-score gap-2"
        data-ocid="retro_capture.start_session_button"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageSquare className="w-4 h-4" />
        )}
        {isLoading ? "Starting session…" : "Start Retro Capture"}
      </Button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function RetroCaptureePage() {
  const { actor, isFetching } = useBackend();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<RetroSession | null>(null);
  const [inputText, setInputText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Resume existing active session on load
  const { isLoading: sessionsLoading } = useQuery<RetroSession[]>({
    queryKey: ["retro-sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.list_retro_sessions();
    },
    enabled: !!actor && !isFetching,
    onSuccess: (sessions: RetroSession[]) => {
      if (!session) {
        const active = sessions.find((s) => s.status === "active");
        if (active) setSession(active);
      }
    },
  } as Parameters<typeof useQuery<RetroSession[]>>[0]);

  // Start new session
  const startMutation = useMutation({
    mutationFn: async (input: CreateRetroSessionInput) => {
      if (!actor) throw new Error("No actor");
      return actor.start_retro_session(input);
    },
    onSuccess: (newSession: RetroSession) => {
      setSession(newSession);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["retro-sessions"] });
    },
  });

  // Send message
  const messageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!actor || !session) throw new Error("No actor or session");
      return actor.add_retro_message({
        session_id: session.id,
        role: "user",
        content,
      });
    },
    onSuccess: (updated: RetroSession) => {
      setSession(updated);
    },
  });

  // Complete session & navigate
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !session) throw new Error("No actor or session");
      return actor.complete_retro_session(session.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-activities"] });
      queryClient.invalidateQueries({ queryKey: ["retro-sessions"] });
      navigate({ to: "/dashboard" });
    },
  });

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || messageMutation.isPending) return;
    setInputText("");
    messageMutation.mutate(text);
  }, [inputText, messageMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function toggleCandidate(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmSelected() {
    setIsConfirming(true);
    completeMutation.mutate();
  }

  const candidates = session?.candidate_activities ?? [];
  const conversation = session?.conversation ?? [];
  const retroWarning =
    session && isOlderThanThreeYears(session.time_range_start);

  // Loading sessions
  if (sessionsLoading || isFetching) {
    return (
      <Layout>
        <div className="p-6 max-w-6xl mx-auto" data-ocid="retro_capture.page">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="p-4 lg:p-6 h-full flex flex-col"
        data-ocid="retro_capture.page"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-score text-lg font-bold text-foreground">
                Retroactive Capture
              </h1>
              <p className="text-xs text-muted-foreground">
                Agent-guided R&D recovery session
              </p>
            </div>
          </div>
          {session && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-score gap-1.5 text-xs"
              data-ocid="retro_capture.new_session_button"
              onClick={() => {
                setSession(null);
                setSelectedIds(new Set());
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Session
            </Button>
          )}
        </div>

        {/* Setup form if no session */}
        {!session ? (
          <SetupForm
            onStart={(input) => startMutation.mutate(input)}
            isLoading={startMutation.isPending}
          />
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
            {/* ── Left: Chat panel ── */}
            <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border bg-card overflow-hidden">
              {/* Retro cutoff warning banner */}
              {retroWarning && (
                <div
                  className="flex items-start gap-2.5 px-4 py-2.5 border-b border-borderline/30 bg-borderline/10"
                  data-ocid="retro_capture.cutoff_banner"
                >
                  <AlertTriangle className="w-4 h-4 text-borderline shrink-0 mt-0.5" />
                  <p className="text-xs text-borderline">
                    Period starts before{" "}
                    {new Date(
                      Date.now() - 3 * 365.25 * 24 * 3600 * 1000,
                    ).toLocaleDateString()}
                    . Contemporaneous records required.
                  </p>
                </div>
              )}

              {/* Session metadata */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80">
                <span className="font-score text-xs text-muted-foreground">
                  Period:
                </span>
                <span className="font-score text-xs text-foreground">
                  {session.time_range_start} → {session.time_range_end}
                </span>
                <span
                  className={cn(
                    "ml-auto font-score text-xs px-2 py-0.5 rounded-full border",
                    session.status === "active"
                      ? "bg-eligible/15 text-eligible border border-eligible/30"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {session.status.toUpperCase()}
                </span>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                data-ocid="retro_capture.conversation"
              >
                {conversation.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-full"
                    data-ocid="retro_capture.conversation_empty_state"
                  >
                    <div className="text-center">
                      <Bot className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Waiting for agent response…
                      </p>
                    </div>
                  </div>
                ) : (
                  conversation.map((msg, idx) => {
                    const isAgent =
                      msg.role === "agent" || msg.role === "assistant";
                    return (
                      <div
                        key={String(msg.timestamp)}
                        className={cn(
                          "flex gap-2.5 max-w-[85%]",
                          isAgent ? "mr-auto" : "ml-auto flex-row-reverse",
                        )}
                        data-ocid={`retro_capture.message.item.${idx + 1}`}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                            isAgent
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-secondary border-border text-muted-foreground",
                          )}
                        >
                          {isAgent ? (
                            <Bot className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                            isAgent
                              ? "bg-primary/8 border border-primary/20 text-foreground rounded-tl-sm"
                              : "bg-secondary border border-border text-foreground rounded-tr-sm",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs text-muted-foreground/60 font-score mt-1">
                            {formatSovereignTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                {messageMutation.isPending && (
                  <div className="flex gap-2.5 max-w-[85%] mr-auto">
                    <div className="w-6 h-6 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm px-3.5 py-2.5 bg-primary/8 border border-primary/20">
                      <div
                        className="flex items-center gap-1.5"
                        data-ocid="retro_capture.typing_indicator"
                      >
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground font-score">
                          Agent is responding…
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {session.status === "active" && (
                <div className="border-t border-border p-3 shrink-0">
                  <div className="flex gap-2.5 items-end">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your answer… (Enter to send)"
                      rows={2}
                      disabled={messageMutation.isPending}
                      data-ocid="retro_capture.message_input"
                      className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 transition-smooth"
                    />
                    <Button
                      type="button"
                      onClick={handleSend}
                      disabled={!inputText.trim() || messageMutation.isPending}
                      size="sm"
                      className="shrink-0 gap-1.5 font-score h-[52px]"
                      data-ocid="retro_capture.send_button"
                    >
                      {messageMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/50 font-score mt-1.5 pl-1">
                    Shift+Enter for new line
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: Candidate activities panel ── */}
            <div className="w-full lg:w-[300px] shrink-0 flex flex-col">
              <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-score text-sm font-semibold text-foreground">
                      Candidate Activities
                    </h3>
                  </div>
                  {candidates.length > 0 && (
                    <span className="font-score text-xs text-muted-foreground">
                      {selectedIds.size}/{candidates.length}
                    </span>
                  )}
                </div>

                <div
                  className="flex-1 overflow-y-auto p-3 space-y-2"
                  data-ocid="retro_capture.candidates_list"
                >
                  {candidates.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center h-32 text-center"
                      data-ocid="retro_capture.candidates_empty_state"
                    >
                      <ClipboardCheck className="w-8 h-8 text-muted-foreground/25 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Activities will appear as the conversation progresses
                      </p>
                    </div>
                  ) : (
                    candidates.map((act, idx) => (
                      <CandidateCard
                        key={act.id}
                        activity={act}
                        index={idx}
                        selected={selectedIds.has(act.id)}
                        onToggle={toggleCandidate}
                      />
                    ))
                  )}
                </div>

                {candidates.length > 0 && (
                  <div className="border-t border-border p-3 shrink-0 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex-1 font-score text-xs"
                        data-ocid="retro_capture.select_all_button"
                        onClick={() =>
                          setSelectedIds(new Set(candidates.map((c) => c.id)))
                        }
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex-1 font-score text-xs"
                        data-ocid="retro_capture.deselect_all_button"
                        onClick={() => setSelectedIds(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                    <Button
                      type="button"
                      onClick={handleConfirmSelected}
                      disabled={
                        selectedIds.size === 0 ||
                        isConfirming ||
                        completeMutation.isPending
                      }
                      className="w-full font-score gap-2"
                      data-ocid="retro_capture.confirm_button"
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckSquare className="w-4 h-4" />
                      )}
                      Confirm{" "}
                      {selectedIds.size > 0
                        ? `${selectedIds.size} Selected`
                        : "Selected"}
                    </Button>
                    {completeMutation.isError && (
                      <p
                        className="text-xs text-ineligible text-center"
                        data-ocid="retro_capture.error_state"
                      >
                        Failed to complete session. Please try again.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
