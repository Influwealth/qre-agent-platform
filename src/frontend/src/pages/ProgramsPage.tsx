import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  PlusCircle,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Layout } from "../components/Layout";
import { useProfile } from "../hooks/use-auth";
import { useBackend } from "../hooks/use-backend";
import type { Enrollment, RNDProgram } from "../types";
import { EnrollmentStatus, ProgramStatus, Role } from "../types";

// ─── Enrollment status badge ──────────────────────────────────────────────────
const ENROLL_STATUS_MAP: Record<
  EnrollmentStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  [EnrollmentStatus.pending]: {
    label: "Pending",
    cls: "bg-borderline/15 text-borderline border-borderline/30",
    icon: <Clock className="w-3 h-3" />,
  },
  [EnrollmentStatus.approved]: {
    label: "Enrolled",
    cls: "bg-eligible/15 text-eligible border-eligible/30",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  [EnrollmentStatus.rejected]: {
    label: "Rejected",
    cls: "bg-ineligible/15 text-ineligible border-ineligible/30",
    icon: <XCircle className="w-3 h-3" />,
  },
};

function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const cfg = ENROLL_STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-score text-xs font-medium",
        cfg.cls,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Program card ─────────────────────────────────────────────────────────────
interface ProgramCardProps {
  program: RNDProgram;
  index: number;
  enrollment: Enrollment | undefined;
  isEnrolling: boolean;
  onEnroll: (id: string) => void;
}

function ProgramCard({
  program,
  index,
  enrollment,
  isEnrolling,
  onEnroll,
}: ProgramCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 transition-smooth hover:border-primary/30 hover:shadow-subtle"
      data-ocid={`programs.program.item.${index + 1}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-score text-base font-semibold text-foreground">
              {program.name}
            </h3>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-score text-xs text-primary">
              IRC §{program.irc_section}
            </span>
            {program.status === ProgramStatus.inactive && (
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 font-score text-xs text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {program.description}
          </p>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {enrollment ? (
            <EnrollmentStatusBadge status={enrollment.status} />
          ) : (
            <span className="font-score text-xs text-muted-foreground">
              Not enrolled
            </span>
          )}
        </div>

        {!enrollment ? (
          <Button
            type="button"
            size="sm"
            onClick={() => onEnroll(program.id)}
            disabled={isEnrolling || program.status === ProgramStatus.inactive}
            className="font-score gap-1.5"
            data-ocid={`programs.enroll_button.${index + 1}`}
          >
            {isEnrolling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Enroll
          </Button>
        ) : enrollment.status === EnrollmentStatus.rejected ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEnroll(program.id)}
            disabled={isEnrolling}
            className="font-score gap-1.5"
            data-ocid={`programs.re_enroll_button.${index + 1}`}
          >
            {isEnrolling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Re-apply
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Create program form (admin only) ─────────────────────────────────────────
interface CreateProgramFormProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateProgramForm({ onClose, onCreated }: CreateProgramFormProps) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [irc, setIrc] = useState("41");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.admin_create_program(name, desc, irc || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      onCreated();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !desc.trim()) return;
    createMutation.mutate();
  }

  return (
    <div
      className="rounded-xl border border-primary/30 bg-card p-5 mb-4"
      data-ocid="programs.create_form"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-score text-sm font-semibold text-foreground">
          Create New Program
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-smooth"
          data-ocid="programs.create_form.close_button"
          aria-label="Close create form"
        >
          ×
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="program-name-input"
            className="block text-xs font-score font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
          >
            Program Name *
          </label>
          <input
            id="program-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            placeholder="Advanced AI Infrastructure Research"
            data-ocid="programs.create_form.name_input"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="program-desc-input"
            className="block text-xs font-score font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
          >
            Description *
          </label>
          <textarea
            id="program-desc-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
            minLength={20}
            rows={3}
            placeholder="Describe the program scope, goals, and qualifying research activities…"
            data-ocid="programs.create_form.description_input"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div>
          <label
            htmlFor="program-irc-input"
            className="block text-xs font-score font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
          >
            IRC Section
          </label>
          <input
            id="program-irc-input"
            type="text"
            value={irc}
            onChange={(e) => setIrc(e.target.value)}
            placeholder="41"
            data-ocid="programs.create_form.irc_input"
            className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground font-score focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            size="sm"
            disabled={!name.trim() || !desc.trim() || createMutation.isPending}
            className="font-score gap-1.5"
            data-ocid="programs.create_form.submit_button"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            Create Program
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="font-score"
            data-ocid="programs.create_form.cancel_button"
          >
            Cancel
          </Button>
        </div>
        {createMutation.isError && (
          <p
            className="text-xs text-ineligible"
            data-ocid="programs.create_form.error_state"
          >
            Failed to create program. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ProgramsPage() {
  const { actor, isFetching } = useBackend();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollSuccessId, setEnrollSuccessId] = useState<string | null>(null);

  const isAdmin = profile?.role === Role.admin;

  const { data: programs = [], isLoading: programsLoading } = useQuery<
    RNDProgram[]
  >({
    queryKey: ["programs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.list_programs();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<
    Enrollment[]
  >({
    queryKey: ["my-enrollments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.admin_list_enrollments(null);
    },
    enabled: !!actor && !isFetching && isAdmin,
  });

  // For non-admin users we derive their enrollments from activities indirectly
  // The backend admin_list_enrollments returns all; we filter by principal for user view
  // If user is not admin, we use a separate query for their own enrollments
  const { data: myEnrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["my-enrollments-user"],
    queryFn: async () => {
      if (!actor) return [];
      // Use admin_list_enrollments with null to get own enrollments visible via backend
      return actor.admin_list_enrollments(null);
    },
    enabled: !!actor && !isFetching && !isAdmin,
  });

  const enrollmentsByProgram = (isAdmin ? enrollments : myEnrollments).reduce<
    Record<string, Enrollment>
  >((acc, e) => {
    acc[e.program_id] = e;
    return acc;
  }, {});

  const enrollMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!actor) throw new Error("No actor");
      setEnrollingId(programId);
      return actor.enroll_in_program(programId);
    },
    onSuccess: (enrollment: Enrollment) => {
      setEnrollingId(null);
      setEnrollSuccessId(enrollment.program_id);
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments-user"] });
      setTimeout(() => setEnrollSuccessId(null), 3000);
    },
    onError: () => {
      setEnrollingId(null);
    },
  });

  const activePrograms = programs.filter(
    (p) => p.status === ProgramStatus.active || isAdmin,
  );

  const isLoading = programsLoading || enrollmentsLoading;

  return (
    <Layout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto" data-ocid="programs.page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-score text-xl font-bold text-foreground">
                R&D Programs
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? "Manage and create R&D programs"
                  : "Browse and enroll in active R&D programs"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              type="button"
              size="sm"
              onClick={() => setShowCreateForm((c) => !c)}
              className="font-score gap-1.5"
              data-ocid="programs.create_program_button"
            >
              <PlusCircle className="w-4 h-4" />
              Create Program
            </Button>
          )}
        </div>

        {/* Enroll success banner */}
        {enrollSuccessId && (
          <div
            className="flex items-center gap-2.5 rounded-lg border border-eligible/30 bg-eligible/10 px-4 py-3 mb-4"
            data-ocid="programs.enroll_success_state"
          >
            <CheckCircle className="w-4 h-4 text-eligible shrink-0" />
            <p className="text-sm text-eligible font-score">
              Enrollment submitted — pending admin approval.
            </p>
          </div>
        )}

        {/* Create program form */}
        {showCreateForm && isAdmin && (
          <CreateProgramForm
            onClose={() => setShowCreateForm(false)}
            onCreated={() => setShowCreateForm(false)}
          />
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : activePrograms.length === 0 ? (
          <div
            className="rounded-xl border border-border bg-card p-12 text-center"
            data-ocid="programs.empty_state"
          >
            <ShieldAlert className="w-12 h-12 text-muted-foreground/25 mx-auto mb-3" />
            <p className="font-score text-sm font-semibold text-foreground mb-1">
              No programs available
            </p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Create the first R&D program using the button above."
                : "No active R&D programs are currently available. Check back later."}
            </p>
          </div>
        ) : (
          <div className="space-y-4" data-ocid="programs.list">
            {activePrograms.map((program, idx) => (
              <ProgramCard
                key={program.id}
                program={program}
                index={idx}
                enrollment={enrollmentsByProgram[program.id]}
                isEnrolling={
                  enrollingId === program.id && enrollMutation.isPending
                }
                onEnroll={(id) => enrollMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Enrollment error */}
        {enrollMutation.isError && (
          <p
            className="text-xs text-ineligible mt-3 text-center"
            data-ocid="programs.enroll_error_state"
          >
            Enrollment failed. You may already be enrolled or the program is
            unavailable.
          </p>
        )}
      </div>
    </Layout>
  );
}
