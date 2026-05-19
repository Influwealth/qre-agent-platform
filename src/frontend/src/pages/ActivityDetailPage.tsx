import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Hash,
} from "lucide-react";
import { AdminSuggestionChip } from "../components/AdminSuggestionChip";
import { AuditTrail } from "../components/AuditTrail";
import { DecoherenceWarning } from "../components/DecoherenceWarning";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { FourPartTestDisplay } from "../components/FourPartTestDisplay";
import { Layout } from "../components/Layout";
import { QuantumScoreDisplay } from "../components/QuantumScoreDisplay";
import { ScoreBadge } from "../components/ScoreBadge";
import { SovereignTimestamp } from "../components/SovereignTimestamp";
import { useBackend } from "../hooks/use-backend";
import type { RDActivity } from "../types";
import { ActivityStatus, ActivityType } from "../types";

function isMoreThan3YearsAgo(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  return d < cutoff;
}

const STATUS_CONFIG: Record<ActivityStatus, { label: string; cls: string }> = {
  [ActivityStatus.draft]: {
    label: "Draft",
    cls: "border-border text-muted-foreground",
  },
  [ActivityStatus.submitted]: {
    label: "Pending Review",
    cls: "border-borderline text-borderline",
  },
  [ActivityStatus.approved]: {
    label: "Approved",
    cls: "border-eligible text-eligible",
  },
  [ActivityStatus.rejected]: {
    label: "Rejected",
    cls: "border-ineligible text-ineligible",
  },
};

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="font-score text-xs uppercase tracking-widest text-muted-foreground mb-3">
      {title}
    </h2>
  );
}

function DetailRow({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border last:border-0">
      <span className="font-score text-xs text-muted-foreground uppercase tracking-wide w-36 shrink-0 mt-0.5">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ActivityDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
  );
}

export function ActivityDetailPage() {
  const { id } = useParams({ from: "/activities/$id" });
  const navigate = useNavigate();
  const { actor, isFetching } = useBackend();

  const { data: activities = [], isLoading } = useQuery<RDActivity[]>({
    queryKey: ["my-activities"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.list_my_activities(null, null);
    },
    enabled: !!actor && !isFetching,
  });

  const activity = activities.find((a) => a.id === id);
  const statusCfg = activity ? STATUS_CONFIG[activity.status] : null;
  const retroCutoff = activity
    ? isMoreThan3YearsAgo(activity.start_date)
    : false;

  return (
    <Layout>
      <div
        className="p-6 max-w-3xl mx-auto space-y-6"
        data-ocid="activity_detail.page"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-smooth"
            data-ocid="activity_detail.back_button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground font-score">
              Activity Detail
            </p>
            {activity && (
              <h1 className="font-score text-lg font-bold text-foreground leading-tight">
                {activity.title}
              </h1>
            )}
          </div>
        </div>

        {isLoading ? (
          <ActivityDetailSkeleton />
        ) : !activity ? (
          <div
            className="rounded-lg border border-border bg-card p-10 text-center"
            data-ocid="activity_detail.not_found"
          >
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Activity not found
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/dashboard" })}
              className="mt-4 font-score"
            >
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <>
            {/* Warnings */}
            {retroCutoff && (
              <div
                className="flex items-center gap-2 rounded-md border border-ineligible/50 bg-ineligible/10 px-4 py-3"
                data-ocid="activity_detail.retro_cutoff_warning"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-ineligible" />
                <p className="text-xs text-ineligible font-score">
                  ⚠ Contemporaneous records required — start date is more than 3
                  years ago.
                </p>
              </div>
            )}
            <DecoherenceWarning
              quantumScore={activity.quantum_adjusted_score}
              hoursSpent={activity.hours_spent}
            />

            {/* Status + eligibility header card */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={cn(
                    "font-score text-xs border rounded-full px-3 py-1",
                    statusCfg?.cls,
                  )}
                  data-ocid="activity_detail.status_badge"
                >
                  {statusCfg?.label}
                </span>
                <Badge
                  variant="outline"
                  className="font-score text-xs capitalize border-muted-foreground/20 text-muted-foreground"
                >
                  {activity.activity_type === ActivityType.retroactive
                    ? "Retroactive"
                    : "Ongoing"}
                </Badge>
                <EligibilityBadge label={activity.eligibility_label} />
                <ScoreBadge
                  score={activity.quantum_adjusted_score}
                  label={activity.eligibility_label}
                />
              </div>

              <QuantumScoreDisplay
                score={activity.quantum_adjusted_score}
                label={activity.eligibility_label}
                className="mb-4"
              />

              <SectionHeader title="Activity Info" />
              <div className="space-y-0">
                <DetailRow label="Start Date">
                  <span className="font-score text-sm text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {activity.start_date}
                  </span>
                </DetailRow>
                {activity.end_date && (
                  <DetailRow label="End Date">
                    <span className="font-score text-sm text-foreground">
                      {activity.end_date}
                    </span>
                  </DetailRow>
                )}
                <DetailRow label="Hours Spent">
                  <span className="font-score text-sm text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {activity.hours_spent}h
                    {activity.hours_spent > 320 && (
                      <span className="text-xs text-borderline font-score ml-1">
                        (overclaim flag)
                      </span>
                    )}
                  </span>
                </DetailRow>
                {activity.program_id && (
                  <DetailRow label="Program">
                    <span className="font-score text-sm text-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      {activity.program_id}
                    </span>
                  </DetailRow>
                )}
                <DetailRow label="Created">
                  <SovereignTimestamp timestamp={activity.created_at} />
                </DetailRow>
                <DetailRow label="Content Hash">
                  <span
                    className="font-score text-xs text-muted-foreground flex items-center gap-1.5"
                    title={activity.content_hash}
                    data-ocid="activity_detail.content_hash"
                  >
                    <Hash className="w-3 h-3" />
                    SHA-256: {activity.content_hash.slice(0, 16)}…
                    {activity.content_hash.slice(-8)}
                  </span>
                </DetailRow>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-lg border border-border bg-card p-5">
              <SectionHeader title="Description" />
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>

            {/* Tags */}
            {activity.tags.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <SectionHeader title="Tags" />
                <div className="flex flex-wrap gap-1.5">
                  {activity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-score text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Classification breakdown */}
            <div className="rounded-lg border border-border bg-card p-5">
              <SectionHeader title="IRC §41 Four-Part Test" />
              <FourPartTestDisplay result={activity.four_part_test_result} />
            </div>

            {/* Agent reasoning */}
            {activity.agent_reasoning && (
              <div className="rounded-lg border border-border bg-card p-5">
                <SectionHeader title="Agent Reasoning" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.agent_reasoning}
                </p>
              </div>
            )}

            {/* Admin notes */}
            {(activity.status === ActivityStatus.approved ||
              activity.status === ActivityStatus.rejected) &&
              activity.admin_notes && (
                <div
                  className={cn(
                    "rounded-lg border p-5",
                    activity.status === ActivityStatus.approved
                      ? "border-eligible/40 bg-eligible/5"
                      : "border-ineligible/40 bg-ineligible/5",
                  )}
                  data-ocid="activity_detail.admin_notes"
                >
                  <SectionHeader
                    title={
                      activity.status === ActivityStatus.approved
                        ? "Admin Approval Notes"
                        : "Rejection Notes"
                    }
                  />
                  <p className="text-sm text-foreground leading-relaxed">
                    {activity.admin_notes}
                  </p>
                </div>
              )}

            {/* QRE estimate for approved eligible */}
            {activity.status === ActivityStatus.approved &&
              activity.eligibility_label === "eligible" && (
                <div
                  className="rounded-lg border border-eligible/30 bg-eligible/5 p-5"
                  data-ocid="activity_detail.qre_estimate"
                >
                  <SectionHeader title="Estimated QRE Contribution" />
                  <p className="font-score text-2xl font-bold text-eligible">
                    ${(activity.hours_spent * 150).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.hours_spent}h × $150 IRS loaded wage rate
                  </p>
                </div>
              )}

            {/* Audit trail */}
            <div className="rounded-lg border border-border bg-card p-5">
              <SectionHeader title="Audit Trail" />
              <AuditTrail entityId={activity.id} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
