import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardList, Filter, Search } from "lucide-react";
import { useState } from "react";
import { AdminSuggestionChip } from "../components/AdminSuggestionChip";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { Layout } from "../components/Layout";
import { QuantumScoreDisplay } from "../components/QuantumScoreDisplay";
import { ScoreBadge } from "../components/ScoreBadge";
import { useBackend } from "../hooks/use-backend";
import {
  ActivityStatus,
  ActivityType,
  type RDActivity,
  Recommendation,
} from "../types";

const STATUS_OPTIONS: { value: ActivityStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: ActivityStatus.submitted, label: "Submitted" },
  { value: ActivityStatus.approved, label: "Approved" },
  { value: ActivityStatus.rejected, label: "Rejected" },
  { value: ActivityStatus.draft, label: "Draft" },
];

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 10)}…${p.slice(-4)}`;
}

function getSuggestion(act: RDActivity) {
  const parts = [
    act.four_part_test_result.permitted_purpose,
    act.four_part_test_result.technological_in_nature,
    act.four_part_test_result.elimination_of_uncertainty,
    act.four_part_test_result.process_of_experimentation,
  ].filter(Boolean).length;
  const q = act.quantum_adjusted_score;
  if (parts === 4 && q >= 80)
    return {
      recommendation: Recommendation.approve,
      confidence: BigInt(90),
      notes: "",
    };
  if (parts >= 3 && q >= 60)
    return {
      recommendation: Recommendation.approve,
      confidence: BigInt(70),
      notes: "",
    };
  if (parts >= 2 && q >= 50)
    return {
      recommendation: Recommendation.more_info,
      confidence: BigInt(60),
      notes: "",
    };
  return {
    recommendation: Recommendation.reject,
    confidence: BigInt(80),
    notes: "",
  };
}

export function AdminActivitiesPage() {
  const { actor, isFetching } = useBackend();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "">(
    ActivityStatus.submitted,
  );
  const [principalFilter, setPrincipalFilter] = useState("");

  const { data: activities = [], isLoading } = useQuery<RDActivity[]>({
    queryKey: ["admin_activities", statusFilter, principalFilter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.admin_list_activities(
        principalFilter.trim() || null,
        (statusFilter as ActivityStatus) || null,
        null,
      );
    },
    enabled: !!actor && !isFetching,
  });

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/15">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Activities Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Review and classify submitted R&D activities
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by principal…"
              value={principalFilter}
              onChange={(e) => setPrincipalFilter(e.target.value)}
              data-ocid="admin.activities.search_input"
              className="w-full rounded-md border border-input bg-secondary/40 pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ActivityStatus | "")
              }
              data-ocid="admin.activities.status_select"
              className="appearance-none rounded-md border border-input bg-secondary/40 pl-8 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded bg-secondary/40 animate-pulse"
                />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="admin.activities.empty_state"
            >
              <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No activities match the current filters
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Adjust filters or wait for users to submit
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Quantum
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Eligibility
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                      Hrs
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Suggestion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activities.map((act, i) => {
                    const suggestion = getSuggestion(act);
                    return (
                      <tr
                        key={act.id}
                        data-ocid={`admin.activities.item.${i + 1}`}
                        className="hover:bg-secondary/20 transition-smooth cursor-pointer"
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
                          <span className="font-score text-xs text-muted-foreground">
                            {truncatePrincipal(act.user_principal)}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-medium text-foreground truncate">
                            {act.title}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBadge
                            score={act.eligibility_score}
                            label={act.eligibility_label}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <QuantumScoreDisplay
                            score={act.quantum_adjusted_score}
                            label={act.eligibility_label}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <EligibilityBadge
                            label={act.eligibility_label}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "font-score text-sm tabular-nums",
                              act.hours_spent > 320 && "text-borderline",
                            )}
                          >
                            {act.hours_spent}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded px-2 py-0.5 text-xs font-medium border",
                              act.activity_type === ActivityType.retroactive
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border text-muted-foreground bg-secondary/40",
                            )}
                          >
                            {act.activity_type}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <AdminSuggestionChip suggestion={suggestion} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
