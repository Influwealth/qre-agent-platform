import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  DollarSign,
  FlaskConical,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { Layout } from "../components/Layout";
import { ScoreBadge } from "../components/ScoreBadge";
import { SovereignTimestamp } from "../components/SovereignTimestamp";
import { useBackend } from "../hooks/use-backend";
import type { RDActivity } from "../types";
import { ActivityStatus, ActivityType, EligibilityLabel } from "../types";

function StatCard({
  label,
  value,
  icon,
  sub,
  ocid,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  ocid: string;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      data-ocid={ocid}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-score uppercase tracking-wide">
            {label}
          </p>
          <p className="font-score text-2xl font-bold text-foreground mt-1">
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<ActivityStatus, string> = {
  [ActivityStatus.draft]: "Draft",
  [ActivityStatus.submitted]: "Pending",
  [ActivityStatus.approved]: "Approved",
  [ActivityStatus.rejected]: "Rejected",
};

const STATUS_CLS: Record<ActivityStatus, string> = {
  [ActivityStatus.draft]: "border-border text-muted-foreground",
  [ActivityStatus.submitted]: "border-borderline text-borderline",
  [ActivityStatus.approved]: "border-eligible text-eligible",
  [ActivityStatus.rejected]: "border-ineligible text-ineligible",
};

const QUICK_ACTIONS = [
  {
    to: "/activities/new",
    label: "Log Activity",
    desc: "Record new R&D activity",
    icon: <PlusCircle className="w-4 h-4" />,
    ocid: "dashboard.quick_action.log_activity",
  },
  {
    to: "/retro",
    label: "Capture Past R&D",
    desc: "Retroactive session",
    icon: <RotateCcw className="w-4 h-4" />,
    ocid: "dashboard.quick_action.retro",
  },
  {
    to: "/programs",
    label: "Programs",
    desc: "Browse R&D programs",
    icon: <BookOpen className="w-4 h-4" />,
    ocid: "dashboard.quick_action.programs",
  },
  {
    to: "/experiments",
    label: "Experiments",
    desc: "Log hypothesis & results",
    icon: <FlaskConical className="w-4 h-4" />,
    ocid: "dashboard.quick_action.experiments",
  },
];

export function DashboardPage() {
  const { actor, isFetching } = useBackend();
  const navigate = useNavigate();

  const { data: activities = [], isLoading } = useQuery<RDActivity[]>({
    queryKey: ["my-activities"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.list_my_activities(null, null);
    },
    enabled: !!actor && !isFetching,
  });

  const approved = activities.filter(
    (a) => a.status === ActivityStatus.approved,
  );
  const eligibleApprovedHours = approved
    .filter((a) => a.eligibility_label === EligibilityLabel.eligible)
    .reduce((s, a) => s + a.hours_spent, 0);
  const estimatedQRE = eligibleApprovedHours * 150;
  const pending = activities.filter(
    (a) => a.status === ActivityStatus.submitted,
  ).length;
  const recent = activities.slice(0, 6);

  // Research Credibility Score
  const totalCount = activities.length;
  const approvedCount = approved.length;
  const credibilityPct =
    totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div
        className="p-6 max-w-5xl mx-auto space-y-8"
        data-ocid="dashboard.page"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-score text-xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              IRC §41 R&D activity overview — InfluWealth Consult LLC
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {totalCount > 0 && (
              <div
                className="hidden sm:flex flex-col items-end gap-0.5"
                title="Research Credibility Score"
              >
                <span className="text-xs text-muted-foreground">
                  Credibility
                </span>
                <span
                  className={cn(
                    "font-score text-sm font-bold",
                    credibilityPct >= 70
                      ? "text-eligible"
                      : credibilityPct >= 40
                        ? "text-borderline"
                        : "text-ineligible",
                  )}
                >
                  {credibilityPct}%
                </span>
              </div>
            )}
            <Button
              asChild
              size="sm"
              className="gap-1.5 font-score"
              data-ocid="dashboard.log_activity_primary_button"
            >
              <Link to="/activities/new">
                <PlusCircle className="w-4 h-4" />
                Log Activity
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Activities"
              value={activities.length}
              icon={<Activity className="w-4 h-4" />}
              ocid="dashboard.stat.total_activities"
            />
            <StatCard
              label="Approved"
              value={approved.length}
              icon={<CheckCircle className="w-4 h-4" />}
              ocid="dashboard.stat.approved"
            />
            <StatCard
              label="Est. QRE Value"
              value={`$${estimatedQRE.toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4" />}
              sub={`${eligibleApprovedHours.toFixed(1)}h eligible`}
              ocid="dashboard.stat.qre_value"
            />
            <StatCard
              label="Pending Review"
              value={pending}
              icon={<Clock className="w-4 h-4" />}
              ocid="dashboard.stat.pending"
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              data-ocid={q.ocid}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-4 hover:bg-card hover:border-primary/30 transition-smooth group"
            >
              <span className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {q.icon}
              </span>
              <div>
                <p className="text-sm font-score font-semibold text-foreground group-hover:text-primary transition-smooth">
                  {q.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent activities */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-score text-sm font-semibold">
              Recent Activities
            </h2>
            <Link
              to="/activities/new"
              className="text-xs text-primary hover:underline font-score"
              data-ocid="dashboard.view_all_link"
            >
              + New
            </Link>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div
              className="p-10 text-center"
              data-ocid="dashboard.activities.empty_state"
            >
              <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                No activities logged yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Start by logging your first R&D activity to begin earning QRE
                credits
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="font-score"
                data-ocid="dashboard.empty_state.log_button"
              >
                <Link to="/activities/new">Log first activity</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((act, idx) => (
                <button
                  type="button"
                  key={act.id}
                  onClick={() =>
                    navigate({ to: "/activities/$id", params: { id: act.id } })
                  }
                  data-ocid={`dashboard.activity.item.${idx + 1}`}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-smooth text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {act.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-score">
                        {act.hours_spent}h
                      </span>
                      <span className="text-muted-foreground/40 text-xs">
                        &bull;
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-4 font-score capitalize border-muted-foreground/20 text-muted-foreground"
                      >
                        {act.activity_type === ActivityType.retroactive
                          ? "retro"
                          : "ongoing"}
                      </Badge>
                      <span className="text-muted-foreground/40 text-xs">
                        &bull;
                      </span>
                      <span
                        className={cn(
                          "text-xs font-score border rounded px-1.5 py-0",
                          STATUS_CLS[act.status],
                        )}
                      >
                        {STATUS_LABEL[act.status]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <ScoreBadge
                      score={act.quantum_adjusted_score}
                      label={act.eligibility_label}
                      size="sm"
                    />
                    <EligibilityBadge label={act.eligibility_label} size="sm" />
                    <SovereignTimestamp
                      timestamp={act.created_at}
                      label=""
                      className="hidden lg:flex items-end"
                    />
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
