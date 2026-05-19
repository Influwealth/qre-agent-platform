import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { BarChart3, DollarSign, Download, RefreshCw } from "lucide-react";
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
import { Layout } from "../components/Layout";
import { useBackend } from "../hooks/use-backend";
import type { Report } from "../types";

// Recharts Cell fill requires hex — these are kept as hex for SVG rendering only
const ELIGIBILITY_COLORS = {
  eligible: "#22c55e",
  borderline: "#f59e0b",
  ineligible: "#ef4444",
};

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 space-y-1",
        accent ? "border-primary/30" : "border-border",
      )}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "font-score text-2xl font-semibold tabular-nums",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AdminReportsPage() {
  const { actor, isFetching } = useBackend();
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [periodStart, setPeriodStart] = useState(yearStart);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [report, setReport] = useState<Report | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("no actor");
      return actor.generate_global_report(periodStart, periodEnd);
    },
    onSuccess: (data) => {
      setReport(data);
      toast.success("Global report generated");
    },
    onError: () => toast.error("Failed to generate report"),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !report) throw new Error("no actor or report");
      return actor.export_report_csv(report.id);
    },
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qre_global_report_${periodStart}_${periodEnd}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    },
    onError: () => toast.error("Failed to export CSV"),
  });

  const chartData = report
    ? [
        {
          name: "Eligible",
          value: Number(report.breakdown_eligible),
          color: ELIGIBILITY_COLORS.eligible,
        },
        {
          name: "Borderline",
          value: Number(report.breakdown_borderline),
          color: ELIGIBILITY_COLORS.borderline,
        },
        {
          name: "Ineligible",
          value: Number(report.breakdown_ineligible),
          color: ELIGIBILITY_COLORS.ineligible,
        },
      ].filter((d) => d.value > 0)
    : [];

  const fmtCurrency = (v: number) =>
    v.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/15">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Global R&D Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate and export QRE analytics across all users
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Report Period
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <label
                htmlFor="admin-report-start"
                className="text-xs text-muted-foreground"
              >
                Start Date
              </label>
              <input
                id="admin-report-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                data-ocid="admin.reports.period_start_input"
                className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm font-score text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <label
                htmlFor="admin-report-end"
                className="text-xs text-muted-foreground"
              >
                End Date
              </label>
              <input
                id="admin-report-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                data-ocid="admin.reports.period_end_input"
                className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm font-score text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              disabled={generateMutation.isPending || isFetching}
              onClick={() => generateMutation.mutate()}
              data-ocid="admin.reports.generate_button"
              className="inline-flex items-center gap-2 rounded-md bg-primary/15 border border-primary/30 text-primary px-5 py-2 text-sm font-medium hover:bg-primary/25 transition-smooth disabled:opacity-50 shrink-0"
            >
              {generateMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              {generateMutation.isPending ? "Generating…" : "Generate Report"}
            </button>
          </div>
        </div>

        {report && (
          <div className="space-y-6" data-ocid="admin.reports.report_panel">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                label="Global QRE Value"
                value={fmtCurrency(report.estimated_qre_value)}
                sub="Based on $150/hr loaded wage rate"
                accent
              />
              <MetricCard
                label="Total Hours"
                value={report.total_hours.toLocaleString("en-US", {
                  maximumFractionDigits: 1,
                })}
                sub="Across all activities"
              />
              <MetricCard
                label="Eligible Hours"
                value={report.eligible_hours.toLocaleString("en-US", {
                  maximumFractionDigits: 1,
                })}
                sub={`${report.total_hours > 0 ? ((report.eligible_hours / report.total_hours) * 100).toFixed(1) : 0}% of total`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartData.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    Eligibility Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "oklch(10.7% 0 0)",
                          border: "1px solid oklch(18% 0 0)",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "oklch(70% 0 0)" }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "oklch(70% 0 0)",
                            }}
                          >
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-around mt-2 text-center">
                    <div>
                      <p
                        className="font-score text-lg font-semibold"
                        style={{ color: ELIGIBILITY_COLORS.eligible }}
                      >
                        {Number(report.breakdown_eligible)}
                      </p>
                      <p className="text-xs text-muted-foreground">Eligible</p>
                    </div>
                    <div>
                      <p
                        className="font-score text-lg font-semibold"
                        style={{ color: ELIGIBILITY_COLORS.borderline }}
                      >
                        {Number(report.breakdown_borderline)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Borderline
                      </p>
                    </div>
                    <div>
                      <p
                        className="font-score text-lg font-semibold"
                        style={{ color: ELIGIBILITY_COLORS.ineligible }}
                      >
                        {Number(report.breakdown_ineligible)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ineligible
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Report Summary
                  </h2>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-score">IRS §41 QRE</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Period</span>
                    <span className="font-score text-xs">
                      {report.period_start} → {report.period_end}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">
                      Activities included
                    </span>
                    <span className="font-score text-sm font-semibold">
                      {report.activity_ids.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">
                      Eligible hours
                    </span>
                    <span className="font-score text-sm font-semibold text-eligible">
                      {report.eligible_hours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Estimated QRE</span>
                    <span className="font-score text-sm font-bold text-primary">
                      {fmtCurrency(report.estimated_qre_value)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={exportMutation.isPending}
                  onClick={() => exportMutation.mutate()}
                  data-ocid="admin.reports.export_csv_button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-secondary/40 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/70 transition-smooth disabled:opacity-50 mt-2"
                >
                  {exportMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {exportMutation.isPending ? "Exporting…" : "Export as CSV"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!report && !generateMutation.isPending && (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="admin.reports.empty_state"
          >
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              No report generated yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Select a date range and click Generate Report
            </p>
          </div>
        )}

        {generateMutation.isPending && (
          <div
            className="flex flex-col items-center justify-center py-20"
            data-ocid="admin.reports.loading_state"
          >
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">
              Aggregating global R&D data…
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
