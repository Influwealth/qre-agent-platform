import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  Clock,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { Layout } from "../components/Layout";
import { ScoreBadge } from "../components/ScoreBadge";
import { SovereignTimestamp } from "../components/SovereignTimestamp";
import { useBackend } from "../hooks/use-backend";
import { ActivityStatus, type GlobalStats, type RDActivity } from "../types";

function StatCard({
  label,
  value,
  icon,
  accent,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3"
      data-ocid="admin.stat_card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </span>
        <span
          className={cn(
            "p-2 rounded-md bg-secondary/60",
            accent && "bg-primary/15",
          )}
        >
          {icon}
        </span>
      </div>
      <span
        className={cn(
          "text-2xl font-semibold tracking-tight",
          mono && "font-score",
          accent && "text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
  description,
  ocid,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  ocid: string;
}) {
  return (
    <Link
      to={to}
      data-ocid={ocid}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-smooth"
    >
      <span className="p-2.5 rounded-md bg-secondary/60 group-hover:bg-primary/15 transition-smooth text-muted-foreground group-hover:text-primary shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </Link>
  );
}

export function AdminDashboardPage() {
  const { actor, isFetching } = useBackend();
  const navigate = useNavigate();

  const { data: stats } = useQuery<GlobalStats>({
    queryKey: ["global_stats"],
    queryFn: async () => {
      if (!actor) throw new Error("no actor");
      return actor.get_global_stats();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: recentActivities = [] } = useQuery<RDActivity[]>({
    queryKey: ["admin_activities", "submitted"],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.admin_list_activities(
        null,
        ActivityStatus.submitted,
        null,
      );
      return all.slice(0, 5);
    },
    enabled: !!actor && !isFetching,
  });

  const fmtQRE = (v: number | undefined) =>
    v !== undefined
      ? `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : "—";
  const fmtBig = (v: bigint | undefined) =>
    v !== undefined ? Number(v).toLocaleString() : "—";

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/15">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              QRE-Agent Platform — Global Overview
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          data-ocid="admin.stats_section"
        >
          <StatCard
            label="Pending Enrollments"
            value={fmtBig(stats?.pending_enrollments)}
            icon={<Clock className="w-4 h-4 text-borderline" />}
          />
          <StatCard
            label="Submitted Activities"
            value={fmtBig(stats?.submitted_activities)}
            icon={<ClipboardList className="w-4 h-4 text-primary" />}
            accent
          />
          <StatCard
            label="Total Users"
            value={fmtBig(stats?.total_users)}
            icon={<Users className="w-4 h-4 text-muted-foreground" />}
          />
          <StatCard
            label="Global QRE Value"
            value={fmtQRE(stats?.global_qre_value)}
            icon={<DollarSign className="w-4 h-4 text-eligible" />}
            mono
          />
        </div>

        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickLink
              to="/admin/activities"
              icon={<ClipboardList className="w-4 h-4" />}
              label="Activities Queue"
              description="Review & approve submitted R&D activities"
              ocid="admin.activities_queue_link"
            />
            <QuickLink
              to="/admin/enrollments"
              icon={<Users className="w-4 h-4" />}
              label="Enrollments Queue"
              description="Manage program enrollment requests"
              ocid="admin.enrollments_queue_link"
            />
            <QuickLink
              to="/admin/reports"
              icon={<BarChart3 className="w-4 h-4" />}
              label="Global Reports"
              description="Export QRE summaries and analytics"
              ocid="admin.reports_link"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recent Submitted Activities
            </h2>
            <Link
              to="/admin/activities"
              className="text-xs text-primary hover:text-primary/80 transition-smooth"
              data-ocid="admin.view_all_activities_link"
            >
              View all →
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {recentActivities.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-center"
                data-ocid="admin.recent_activities.empty_state"
              >
                <TrendingUp className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No submitted activities yet
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                      User
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">
                      Eligibility
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentActivities.map((act, i) => (
                    <tr
                      key={act.id}
                      className="hover:bg-secondary/20 transition-smooth cursor-pointer"
                      data-ocid={`admin.recent_activities.item.${i + 1}`}
                      onClick={() =>
                        navigate({
                          to: "/admin/activities/$id",
                          params: { id: act.id },
                        })
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        navigate({
                          to: "/admin/activities/$id",
                          params: { id: act.id },
                        })
                      }
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground truncate max-w-[200px]">
                          {act.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-score">
                          {act.hours_spent}h
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-score text-xs text-muted-foreground">
                          {act.user_principal.slice(0, 10)}…
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBadge
                          score={act.eligibility_score}
                          label={act.eligibility_label}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <EligibilityBadge
                          label={act.eligibility_label}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <SovereignTimestamp
                          timestamp={act.created_at}
                          label=""
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
