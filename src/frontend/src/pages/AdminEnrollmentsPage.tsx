import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { SovereignTimestamp } from "../components/SovereignTimestamp";
import { useBackend } from "../hooks/use-backend";
import { type Enrollment, EnrollmentStatus } from "../types";

const STATUS_OPTIONS: { value: EnrollmentStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: EnrollmentStatus.pending, label: "Pending" },
  { value: EnrollmentStatus.approved, label: "Approved" },
  { value: EnrollmentStatus.rejected, label: "Rejected" },
];

const STATUS_STYLE: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.pending]:
    "border-borderline/40 bg-borderline/10 text-borderline",
  [EnrollmentStatus.approved]:
    "border-eligible/40 bg-eligible/10 text-eligible",
  [EnrollmentStatus.rejected]:
    "border-ineligible/40 bg-ineligible/10 text-ineligible",
};

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 10)}…${p.slice(-4)}`;
}

export function AdminEnrollmentsPage() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "">(
    EnrollmentStatus.pending,
  );
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["admin_enrollments", statusFilter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.admin_list_enrollments(
        (statusFilter as EnrollmentStatus) || null,
      );
    },
    enabled: !!actor && !isFetching,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      notes,
    }: { id: string; decision: EnrollmentStatus; notes: string }) => {
      if (!actor) throw new Error("no actor");
      return actor.admin_review_enrollment(id, decision, notes.trim() || null);
    },
    onSuccess: (_, vars) => {
      toast.success(
        `Enrollment ${vars.decision === EnrollmentStatus.approved ? "approved" : "rejected"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin_enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["global_stats"] });
      setRejectTarget(null);
      setRejectNotes("");
    },
    onError: () => toast.error("Failed to update enrollment"),
  });

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/15">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Enrollments Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage user program enrollment requests
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setStatusFilter(opt.value as EnrollmentStatus | "")
              }
              data-ocid={`admin.enrollments.filter_${opt.value || "all"}.tab`}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-xs font-medium border transition-smooth",
                statusFilter === opt.value
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded bg-secondary/40 animate-pulse"
                />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="admin.enrollments.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No enrollments to display
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {statusFilter === EnrollmentStatus.pending
                  ? "No pending enrollment requests"
                  : "Try a different status filter"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Program
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Enrolled
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.map((enr, i) => (
                    <tr
                      key={enr.id}
                      data-ocid={`admin.enrollments.item.${i + 1}`}
                      className="hover:bg-secondary/10 transition-smooth"
                    >
                      <td className="px-4 py-3">
                        <span className="font-score text-xs text-muted-foreground">
                          {truncatePrincipal(enr.user_principal)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-score text-xs text-foreground">
                          {enr.program_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SovereignTimestamp
                          timestamp={enr.enrolled_at}
                          label=""
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-score font-medium",
                            STATUS_STYLE[enr.status],
                          )}
                        >
                          {enr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {enr.status === EnrollmentStatus.pending && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={reviewMutation.isPending}
                              onClick={() =>
                                reviewMutation.mutate({
                                  id: enr.id,
                                  decision: EnrollmentStatus.approved,
                                  notes: "",
                                })
                              }
                              data-ocid={`admin.enrollments.approve_button.${i + 1}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-eligible/40 bg-eligible/10 px-3 py-1.5 text-xs font-medium text-eligible hover:bg-eligible/20 transition-smooth disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(enr.id);
                                setRejectNotes("");
                              }}
                              data-ocid={`admin.enrollments.reject_button.${i + 1}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-ineligible/40 bg-ineligible/10 px-3 py-1.5 text-xs font-medium text-ineligible hover:bg-ineligible/20 transition-smooth"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}
                        {enr.review_notes &&
                          enr.status !== EnrollmentStatus.pending && (
                            <p className="text-xs text-muted-foreground text-right truncate max-w-[200px]">
                              {enr.review_notes}
                            </p>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {rejectTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            data-ocid="admin.enrollments.reject_dialog"
          >
            <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Reject Enrollment
              </h3>
              <p className="text-xs text-muted-foreground">
                Optionally provide notes explaining the rejection.
              </p>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                data-ocid="admin.enrollments.reject_notes_textarea"
                rows={3}
                placeholder="Rejection reason (optional)…"
                className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectNotes("");
                  }}
                  data-ocid="admin.enrollments.reject_cancel_button"
                  className="px-3.5 py-2 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-smooth"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      id: rejectTarget,
                      decision: EnrollmentStatus.rejected,
                      notes: rejectNotes,
                    })
                  }
                  data-ocid="admin.enrollments.reject_confirm_button"
                  className="px-3.5 py-2 text-xs rounded-md border border-ineligible/40 bg-ineligible/15 text-ineligible hover:bg-ineligible/25 transition-smooth disabled:opacity-50"
                >
                  {reviewMutation.isPending ? "Rejecting…" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
