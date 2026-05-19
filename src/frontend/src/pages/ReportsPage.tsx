import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Award,
  BarChart3,
  Clock,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/use-auth";
import { useBackend } from "../hooks/use-backend";
import { ActivityStatus, EligibilityLabel } from "../types";
import type { RDActivity, Report } from "../types";

const STATUS_LABELS: Record<ActivityStatus, string> = {
  [ActivityStatus.draft]: "Draft",
  [ActivityStatus.submitted]: "Submitted",
  [ActivityStatus.approved]: "Approved",
  [ActivityStatus.rejected]: "Rejected",
};

const STATUS_CLS: Record<ActivityStatus, string> = {
  [ActivityStatus.draft]: "bg-secondary/60 text-muted-foreground border-border",
  [ActivityStatus.submitted]: "bg-primary/10 text-primary border-primary/20",
  [ActivityStatus.approved]: "bg-eligible",
  [ActivityStatus.rejected]: "bg-ineligible",
};

const TYPE_LABELS: Record<string, string> = {
  retroactive: "Retroactive",
  ongoing: "Ongoing",
};

const PIE_COLORS = {
  [EligibilityLabel.eligible]: "oklch(0.72 0.18 145)",
  [EligibilityLabel.borderline]: "oklch(0.82 0.16 80)",
  [EligibilityLabel.ineligible]: "oklch(0.70 0.22 25)",
};

function formatNano(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function SummaryCard({ icon, label, value, sub, highlight }: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "bg-card border-border p-5 flex flex-col gap-2",
        highlight && "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={cn("shrink-0", highlight && "text-primary")}>
          {icon}
        </span>
        <span className="text-xs uppercase tracking-wide font-score">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "font-score text-2xl font-bold tabular-nums",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

export function ReportsPage() {
  const { actor, isFetching } = useBackend();
  const { principal } = useAuth();

  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [periodStart, setPeriodStart] = useState(yearStart);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [report, setReport] = useState<Report | null>(null);
  const [activities, setActivities] = useState<RDActivity[]>([]);
  const [filterLabel, setFilterLabel] = useState<string>("all");

  const { data: myActivities = [] } = useQuery<RDActivity[]>({
    queryKey: ["my_activities_report"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.list_my_activities(null, null);
    },
    enabled: !!actor && !isFetching,
  });

  const approvedCount = myActivities.filter(
    (a) => a.status === ActivityStatus.approved,
  ).length;
  const totalCount = myActivities.length;
  const credibilityScore =
    totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !principal) throw new Error("Not connected");
      return actor.generate_user_report(principal, periodStart, periodEnd);
    },
    onSuccess: (r) => {
      setReport(r);
      const filtered = myActivities.filter((a) => {
        if (!a.start_date) return false;
        return a.start_date >= periodStart && a.start_date <= periodEnd;
      });
      setActivities(filtered);
      toast.success("Report generated");
    },
    onError: () => {
      toast.error("Failed to generate report");
    },
  });

  const csvMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !report) throw new Error("No report");
      return actor.export_report_csv(report.id);
    },
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qre-report-${periodStart}-${periodEnd}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    },
    onError: () => {
      toast.error("Failed to export CSV");
    },
  });

  const pieData = report
    ? [
        {
          name: "Eligible",
          value: Number(report.breakdown_eligible),
          key: EligibilityLabel.eligible,
        },
        {
          name: "Borderline",
          value: Number(report.breakdown_borderline),
          key: EligibilityLabel.borderline,
        },
        {
          name: "Ineligible",
          value: Number(report.breakdown_ineligible),
          key: EligibilityLabel.ineligible,
        },
      ].filter((d) => d.value > 0)
    : [];

  const filteredActivities =
    filterLabel === "all"
      ? activities
      : activities.filter((a) => a.eligibility_label === filterLabel);

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              My Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Generate IRC §41 QRE reports for any date range.
            </p>
          </div>

          {/* Research Credibility Score */}
          <Card className="bg-card border-primary/20 px-5 py-3 flex items-center gap-4 shrink-0">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-score uppercase tracking-wide">
                Research Credibility
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "font-score text-2xl font-bold tabular-nums",
                    credibilityScore >= 70
                      ? "text-eligible"
                      : credibilityScore >= 40
                        ? "text-borderline"
                        : "text-ineligible",
                  )}
                  data-ocid="reports.credibility_score"
                >
                  {credibilityScore}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {approvedCount}/{totalCount} approved
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Date range + generate */}
        <Card className="bg-card border-border p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="period_start" className="font-score text-xs">
                Period Start
              </Label>
              <Input
                id="period_start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="bg-secondary/30 border-border font-score w-44"
                data-ocid="reports.period_start.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="period_end" className="font-score text-xs">
                Period End
              </Label>
              <Input
                id="period_end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="bg-secondary/30 border-border font-score w-44"
                data-ocid="reports.period_end.input"
              />
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={
                generateMutation.isPending || !periodStart || !periodEnd
              }
              data-ocid="reports.generate_button"
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" /> Generate Report
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Report results */}
        {generateMutation.isPending && (
          <div className="space-y-4" data-ocid="reports.loading_state">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {["skeleton-a", "skeleton-b", "skeleton-c"].map((k) => (
                <Skeleton key={k} className="h-28 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        )}

        {report && !generateMutation.isPending && (
          <div className="space-y-6" data-ocid="reports.results_section">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                icon={<Clock className="w-4 h-4" />}
                label="Total Hours"
                value={report.total_hours.toFixed(1)}
                sub={`Period: ${report.period_start} → ${report.period_end}`}
              />
              <SummaryCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Eligible Hours"
                value={report.eligible_hours.toFixed(1)}
                sub={`${report.total_hours > 0 ? Math.round((report.eligible_hours / report.total_hours) * 100) : 0}% of total`}
              />
              <SummaryCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Estimated QRE Value"
                value={`$${report.estimated_qre_value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                sub="@ $150/hr IRS loaded wage rate"
                highlight
              />
            </div>

            {/* Chart + table row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Pie chart */}
              <Card className="bg-card border-border p-5 lg:col-span-2">
                <h3 className="font-score text-sm font-semibold text-foreground mb-4">
                  Eligibility Breakdown
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={PIE_COLORS[entry.key as EligibilityLabel]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "oklch(0.12 0.016 265)",
                          border: "1px solid oklch(0.20 0.018 265)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontFamily: "var(--font-mono)",
                        }}
                        formatter={(value: number) => [
                          `${value} activities`,
                          "",
                        ]}
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    No classification data
                  </div>
                )}
              </Card>

              {/* Activities table */}
              <Card className="bg-card border-border lg:col-span-3 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <h3 className="font-score text-sm font-semibold text-foreground">
                    Activities
                  </h3>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={filterLabel} onValueChange={setFilterLabel}>
                      <SelectTrigger
                        className="h-7 text-xs bg-secondary/30 border-border w-32"
                        data-ocid="reports.filter_label.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all">All labels</SelectItem>
                        <SelectItem value={EligibilityLabel.eligible}>
                          Eligible
                        </SelectItem>
                        <SelectItem value={EligibilityLabel.borderline}>
                          Borderline
                        </SelectItem>
                        <SelectItem value={EligibilityLabel.ineligible}>
                          Ineligible
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 text-muted-foreground font-score uppercase tracking-wide">
                          Title
                        </th>
                        <th className="text-left px-3 py-2.5 text-muted-foreground font-score uppercase tracking-wide">
                          Type
                        </th>
                        <th className="text-right px-3 py-2.5 text-muted-foreground font-score uppercase tracking-wide">
                          Hrs
                        </th>
                        <th className="text-left px-3 py-2.5 text-muted-foreground font-score uppercase tracking-wide">
                          Eligibility
                        </th>
                        <th className="text-left px-3 py-2.5 text-muted-foreground font-score uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-right px-4 py-2.5 text-muted-foreground font-score uppercase tracking-wide">
                          ⚛ Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivities.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-10 text-muted-foreground"
                            data-ocid="reports.table_empty_state"
                          >
                            No activities in this period
                          </td>
                        </tr>
                      ) : (
                        filteredActivities.map((a, i) => (
                          <tr
                            key={a.id}
                            className="border-b border-border/50 hover:bg-secondary/20 transition-smooth"
                            data-ocid={`reports.activity.item.${i + 1}`}
                          >
                            <td className="px-4 py-2.5 text-foreground max-w-[160px]">
                              <span className="truncate block" title={a.title}>
                                {a.title}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                              {TYPE_LABELS[a.activity_type] ?? a.activity_type}
                            </td>
                            <td className="px-3 py-2.5 text-right font-score tabular-nums text-foreground">
                              {a.hours_spent.toFixed(1)}
                            </td>
                            <td className="px-3 py-2.5">
                              <EligibilityBadge
                                label={a.eligibility_label}
                                size="sm"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2 py-0.5 font-score text-xs font-medium",
                                  STATUS_CLS[a.status],
                                )}
                              >
                                {STATUS_LABELS[a.status]}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-score tabular-nums text-foreground">
                              {a.quantum_adjusted_score.toFixed(1)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Download */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => csvMutation.mutate()}
                disabled={csvMutation.isPending}
                data-ocid="reports.download_csv_button"
                className="gap-2"
              >
                {csvMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download CSV
                  </>
                )}
              </Button>
            </div>

            {/* Sovereign Timestamp */}
            <p className="text-xs text-muted-foreground font-score text-right">
              <span className="text-primary/60">Sovereign Timestamp:</span>{" "}
              {formatNano(report.generated_at)} (ICP nanosecond epoch)
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
