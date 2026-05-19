import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Atom, Hash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminSuggestionChip } from "../components/AdminSuggestionChip";
import { AuditTrail } from "../components/AuditTrail";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { FourPartTestDisplay } from "../components/FourPartTestDisplay";
import { Layout } from "../components/Layout";
import { QuantumScoreDisplay } from "../components/QuantumScoreDisplay";
import { ScoreBadge } from "../components/ScoreBadge";
import { SovereignTimestamp } from "../components/SovereignTimestamp";
import { useBackend } from "../hooks/use-backend";
import {
  ActivityStatus,
  ActivityType,
  type RDActivity,
  Recommendation,
} from "../types";

const DECISION_OPTIONS = [
  { value: ActivityStatus.approved, label: "✓ Approve" },
  { value: ActivityStatus.rejected, label: "✗ Reject" },
];

function buildSuggestion(act: RDActivity) {
  const parts = [
    act.four_part_test_result.permitted_purpose,
    act.four_part_test_result.technological_in_nature,
    act.four_part_test_result.elimination_of_uncertainty,
    act.four_part_test_result.process_of_experimentation,
  ].filter(Boolean).length;
  const q = act.quantum_adjusted_score;
  const passedLabels = [
    act.four_part_test_result.permitted_purpose && "Permitted Purpose",
    act.four_part_test_result.technological_in_nature &&
      "Technological in Nature",
    act.four_part_test_result.elimination_of_uncertainty &&
      "Elimination of Uncertainty",
    act.four_part_test_result.process_of_experimentation &&
      "Process of Experimentation",
  ]
    .filter(Boolean)
    .join(", ");
  const failedLabels = [
    !act.four_part_test_result.permitted_purpose && "Permitted Purpose",
    !act.four_part_test_result.technological_in_nature &&
      "Technological in Nature",
    !act.four_part_test_result.elimination_of_uncertainty &&
      "Elimination of Uncertainty",
    !act.four_part_test_result.process_of_experimentation &&
      "Process of Experimentation",
  ]
    .filter(Boolean)
    .join(", ");
  const notes = failedLabels
    ? `Passed: ${passedLabels || "none"}. Failed: ${failedLabels}. Quantum score: ${q.toFixed(1)}.`
    : `All four parts passed. Quantum score: ${q.toFixed(1)}.`;
  if (parts === 4 && q >= 80)
    return {
      recommendation: Recommendation.approve,
      confidence: BigInt(90),
      notes,
    };
  if (parts >= 3 && q >= 60)
    return {
      recommendation: Recommendation.approve,
      confidence: BigInt(70),
      notes,
    };
  if (parts >= 2 && q >= 50)
    return {
      recommendation: Recommendation.more_info,
      confidence: BigInt(60),
      notes,
    };
  return {
    recommendation: Recommendation.reject,
    confidence: BigInt(80),
    notes,
  };
}

export function AdminActivityDetailPage() {
  const { id } = useParams({ from: "/admin/activities/$id" });
  const navigate = useNavigate();
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();

  const [decision, setDecision] = useState<ActivityStatus>(
    ActivityStatus.approved,
  );
  const [adminNotes, setAdminNotes] = useState("");

  const { data: activity, isLoading } = useQuery<RDActivity>({
    queryKey: ["admin_activity", id],
    queryFn: async () => {
      if (!actor) throw new Error("no actor");
      const all = await actor.admin_list_activities(null, null, null);
      const found = all.find((a) => a.id === id);
      if (!found) throw new Error("Activity not found");
      return found;
    },
    enabled: !!actor && !isFetching,
  });

  const mutation = useMutation({
    mutationFn: async ({
      dec,
      notes,
    }: { dec: ActivityStatus; notes: string }) => {
      if (!actor) throw new Error("no actor");
      return actor.admin_review_activity(id, dec, notes.trim() || null);
    },
    onSuccess: () => {
      toast.success("Activity reviewed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_activities"] });
      queryClient.invalidateQueries({ queryKey: ["admin_activity", id] });
      queryClient.invalidateQueries({ queryKey: ["global_stats"] });
      navigate({ to: "/admin/activities" });
    },
    onError: () => toast.error("Failed to review activity"),
  });

  if (isLoading || !activity) {
    return (
      <Layout>
        <div
          className="p-6 max-w-4xl mx-auto space-y-4"
          data-ocid="admin.activity_detail.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-secondary/40 animate-pulse"
            />
          ))}
        </div>
      </Layout>
    );
  }

  const suggestion = buildSuggestion(activity);
  const decoherenceRisk =
    activity.quantum_adjusted_score < 60 && activity.hours_spent > 100;
  const retroCutoff = (() => {
    if (!activity.start_date) return false;
    const start = new Date(activity.start_date);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 3);
    return start < cutoff;
  })();

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/admin/activities" })}
            data-ocid="admin.activity_detail.back_button"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-smooth shrink-0 mt-0.5"
            aria-label="Back to activities queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {activity.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <EligibilityBadge label={activity.eligibility_label} size="sm" />
              <span
                className={cn(
                  "inline-flex rounded px-2 py-0.5 text-xs font-medium border",
                  activity.activity_type === ActivityType.retroactive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground bg-secondary/40",
                )}
              >
                {activity.activity_type}
              </span>
              <span
                className={cn(
                  "inline-flex rounded px-2 py-0.5 text-xs font-medium border",
                  activity.status === ActivityStatus.submitted
                    ? "border-borderline/40 bg-borderline/10 text-borderline"
                    : activity.status === ActivityStatus.approved
                      ? "border-eligible/40 bg-eligible/10 text-eligible"
                      : "border-ineligible/40 bg-ineligible/10 text-ineligible",
                )}
              >
                {activity.status}
              </span>
            </div>
          </div>
        </div>

        {decoherenceRisk && (
          <div
            className="flex items-center gap-3 rounded-lg border border-borderline/40 bg-borderline/10 px-4 py-3"
            data-ocid="admin.activity_detail.decoherence_warning"
          >
            <AlertTriangle className="w-4 h-4 text-borderline shrink-0" />
            <p className="text-sm text-borderline font-medium">
              ⚠ High IRS Scrutiny Risk — Quantum score below 60 with &gt;100
              hours claimed
            </p>
          </div>
        )}
        {retroCutoff && (
          <div className="flex items-center gap-3 rounded-lg border border-ineligible/30 bg-ineligible/10 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-ineligible shrink-0" />
            <p className="text-sm text-ineligible font-medium">
              Contemporaneous records required — activity start date is more
              than 3 years ago
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Activity Details
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    User Principal
                  </p>
                  <p className="font-score text-xs text-foreground break-all">
                    {activity.user_principal}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Hours Spent
                  </p>
                  <p
                    className={cn(
                      "font-score text-sm font-semibold",
                      activity.hours_spent > 320 && "text-borderline",
                    )}
                  >
                    {activity.hours_spent}h
                    {activity.hours_spent > 320 && (
                      <span className="ml-1.5 text-xs font-normal">
                        ⚠ overclaim flag
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Start Date
                  </p>
                  <p className="font-score text-xs">{activity.start_date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    End Date
                  </p>
                  <p className="font-score text-xs">
                    {activity.end_date ?? "—"}
                  </p>
                </div>
                {activity.program_id && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Program
                    </p>
                    <p className="font-score text-xs">{activity.program_id}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <SovereignTimestamp timestamp={activity.created_at} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </h2>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>

            {activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2"
              data-ocid="admin.activity_detail.content_hash"
            >
              <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                Content Hash
              </span>
              <span className="font-score text-xs text-foreground truncate">
                {activity.content_hash}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                IRC §41 Four-Part Test
              </h2>
              <FourPartTestDisplay result={activity.four_part_test_result} />
            </div>

            {activity.agent_reasoning && (
              <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agent Reasoning
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {activity.agent_reasoning}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Classification
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Classical Score
                  </span>
                  <ScoreBadge
                    score={activity.eligibility_score}
                    label={activity.eligibility_label}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Atom className="w-3.5 h-3.5" /> Quantum Score
                  </span>
                  <ScoreBadge
                    score={activity.quantum_adjusted_score}
                    label={activity.eligibility_label}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Eligibility
                  </span>
                  <EligibilityBadge label={activity.eligibility_label} />
                </div>
              </div>
              <QuantumScoreDisplay
                score={activity.quantum_adjusted_score}
                label={activity.eligibility_label}
                className="pt-1 border-t border-border"
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Suggestion
              </h2>
              <AdminSuggestionChip suggestion={suggestion} />
            </div>

            {activity.status === ActivityStatus.submitted && (
              <div
                className="rounded-lg border border-primary/20 bg-card p-5 space-y-4"
                data-ocid="admin.activity_detail.action_panel"
              >
                <h2 className="text-xs font-medium text-primary uppercase tracking-wider">
                  Admin Decision
                </h2>
                <div className="space-y-2">
                  <label
                    htmlFor="decision-select"
                    className="text-xs text-muted-foreground"
                  >
                    Decision
                  </label>
                  <select
                    id="decision-select"
                    value={decision}
                    onChange={(e) =>
                      setDecision(e.target.value as ActivityStatus)
                    }
                    data-ocid="admin.activity_detail.decision_select"
                    className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {DECISION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="admin-notes-textarea"
                      className="text-xs text-muted-foreground"
                    >
                      Admin Notes
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdminNotes(suggestion.notes)}
                      data-ocid="admin.activity_detail.use_suggested_notes_button"
                      className="text-xs text-primary hover:text-primary/80 transition-smooth"
                    >
                      Use Suggested Notes
                    </button>
                  </div>
                  <textarea
                    id="admin-notes-textarea"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    data-ocid="admin.activity_detail.notes_textarea"
                    rows={4}
                    placeholder="Optional notes for the contributor…"
                    className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ dec: decision, notes: adminNotes })
                  }
                  data-ocid="admin.activity_detail.submit_button"
                  className={cn(
                    "w-full rounded-md px-4 py-2.5 text-sm font-medium transition-smooth",
                    decision === ActivityStatus.approved
                      ? "bg-eligible/20 border border-eligible/40 text-eligible hover:bg-eligible/30"
                      : "bg-ineligible/20 border border-ineligible/40 text-ineligible hover:bg-ineligible/30",
                    mutation.isPending && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {mutation.isPending
                    ? "Submitting…"
                    : decision === ActivityStatus.approved
                      ? "✓ Approve Activity"
                      : "✗ Reject Activity"}
                </button>
                {mutation.isError && (
                  <p
                    className="text-xs text-ineligible"
                    data-ocid="admin.activity_detail.error_state"
                  >
                    Failed to submit decision. Please try again.
                  </p>
                )}
              </div>
            )}

            {activity.status !== ActivityStatus.submitted && (
              <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Review Status
                </p>
                <span
                  className={cn(
                    "inline-flex rounded px-2.5 py-1 text-xs font-score font-semibold border",
                    activity.status === ActivityStatus.approved
                      ? "border-eligible/40 bg-eligible/10 text-eligible"
                      : "border-ineligible/40 bg-ineligible/10 text-ineligible",
                  )}
                >
                  {activity.status.toUpperCase()}
                </span>
                {activity.admin_notes && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activity.admin_notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Audit Trail
          </h2>
          <AuditTrail entityId={id} />
        </div>
      </div>
    </Layout>
  );
}
