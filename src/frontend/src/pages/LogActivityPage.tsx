import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminSuggestionChip } from "../components/AdminSuggestionChip";
import { DecoherenceWarning } from "../components/DecoherenceWarning";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { FourPartTestDisplay } from "../components/FourPartTestDisplay";
import { Layout } from "../components/Layout";
import { QuantumScoreDisplay } from "../components/QuantumScoreDisplay";
import { ScoreBadge } from "../components/ScoreBadge";
import { useProfile } from "../hooks/use-auth";
import { useBackend } from "../hooks/use-backend";
import type { CreateActivityResult, RNDProgram } from "../types";
import { ActivityType, EligibilityLabel } from "../types";

interface ActivityFormValues {
  title: string;
  description: string;
  activity_type: ActivityType;
  start_date: string;
  end_date: string;
  hours_spent: string;
  program_id: string;
  tags_raw: string;
}

function isMoreThan3YearsAgo(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  return d < cutoff;
}

function CredibilityBadge({
  approved,
  total,
}: { approved: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((approved / total) * 100);
  const cls =
    pct >= 70
      ? "text-eligible border-eligible/40"
      : pct >= 40
        ? "text-borderline border-borderline/40"
        : "text-ineligible border-ineligible/40";
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
      <span className="text-xs text-muted-foreground">
        Research Credibility Score
      </span>
      <span
        className={cn(
          "font-score text-sm font-bold border rounded px-1.5 py-0.5",
          cls,
        )}
      >
        {pct}%
      </span>
      <span className="text-xs text-muted-foreground font-score">
        ({approved}/{total} approved)
      </span>
    </div>
  );
}

export function LogActivityPage() {
  const { actor, isFetching } = useBackend();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [result, setResult] = useState<CreateActivityResult | null>(null);

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

  const { data: myActivities = [] } = useQuery({
    queryKey: ["my-activities"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.list_my_activities(null, null);
    },
    enabled: !!actor && !isFetching,
  });

  const approvedCount = myActivities.filter(
    (a: { status: string }) => a.status === "approved",
  ).length;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    defaultValues: {
      activity_type: ActivityType.ongoing,
      hours_spent: "",
      program_id: "",
      end_date: "",
    },
  });

  const watchHours = Number.parseFloat(watch("hours_spent") || "0");
  const watchStartDate = watch("start_date");
  const watchDescription = watch("description", "");
  const overclaim = watchHours > 320;
  const retroCutoff = isMoreThan3YearsAgo(watchStartDate);
  const descHint = watchDescription.length > 0 && watchDescription.length < 100;

  const mutation = useMutation({
    mutationFn: async (values: ActivityFormValues) => {
      if (!actor) throw new Error("Not connected");
      return actor.create_activity({
        title: values.title,
        description: values.description,
        activity_type: values.activity_type,
        start_date: values.start_date,
        end_date: values.end_date || undefined,
        hours_spent: Number.parseFloat(values.hours_spent),
        program_id: values.program_id || undefined,
        tags,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["my-activities"] });
      toast.success("Activity created and classified!");
    },
    onError: (err) => {
      toast.error(`Failed: ${String(err)}`);
    },
  });

  function addTag() {
    const raw = tagInput.trim().toLowerCase();
    if (!raw) return;
    const newTags = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    setTags((prev) => [...prev, ...newTags]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  const onSubmit = (values: ActivityFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Layout>
      <div
        className="p-6 max-w-3xl mx-auto space-y-6"
        data-ocid="log_activity.page"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-smooth"
            data-ocid="log_activity.back_button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-score text-xl font-bold text-foreground">
              Log R&D Activity
            </h1>
            <p className="text-sm text-muted-foreground">
              IRC §41 classification runs automatically on submit
            </p>
          </div>
        </div>

        {/* Credibility + profile */}
        {profile && (
          <CredibilityBadge
            approved={approvedCount}
            total={myActivities.length}
          />
        )}

        {/* Warnings */}
        {overclaim && (
          <div
            className="flex items-center gap-2 rounded-md border border-borderline/50 bg-borderline/10 px-4 py-3"
            data-ocid="log_activity.overclaim_warning"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-borderline" />
            <p className="text-xs text-borderline font-score">
              ⚠ Overclaim flag: {watchHours}h for a single activity may trigger
              IRS scrutiny. Ensure contemporaneous records are available.
            </p>
          </div>
        )}
        {retroCutoff && (
          <div
            className="flex items-center gap-2 rounded-md border border-ineligible/50 bg-ineligible/10 px-4 py-3"
            data-ocid="log_activity.retro_cutoff_warning"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-ineligible" />
            <p className="text-xs text-ineligible font-score">
              ⚠ Contemporaneous records required — start date is more than 3
              years ago. Retroactive capture requires documentation.
            </p>
          </div>
        )}

        {/* Form */}
        {!result ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-lg border border-border bg-card divide-y divide-border"
            data-ocid="log_activity.form"
          >
            <div className="p-5 space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="title"
                  className="font-score text-xs uppercase tracking-wide"
                >
                  Activity Title <span className="text-ineligible">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Developed novel ML pipeline for anomaly detection..."
                  data-ocid="log_activity.title_input"
                  {...register("title", {
                    required: "Title is required",
                    minLength: { value: 10, message: "Minimum 10 characters" },
                  })}
                  className={cn(errors.title && "border-ineligible/60")}
                />
                {errors.title && (
                  <p
                    className="text-xs text-ineligible"
                    data-ocid="log_activity.title_field_error"
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="font-score text-xs uppercase tracking-wide"
                >
                  Description <span className="text-ineligible">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Describe the technical uncertainty you were trying to resolve, the experiments conducted, and the outcomes..."
                  data-ocid="log_activity.description_textarea"
                  {...register("description", {
                    required: "Description is required",
                    minLength: {
                      value: 50,
                      message: "Minimum 50 characters required",
                    },
                  })}
                  className={cn(errors.description && "border-ineligible/60")}
                />
                {descHint && (
                  <p
                    className="text-xs text-borderline"
                    data-ocid="log_activity.description_hint"
                  >
                    💡 Add more detail ({watchDescription.length}/100 chars) for
                    a better classification score
                  </p>
                )}
                {errors.description && (
                  <p
                    className="text-xs text-ineligible"
                    data-ocid="log_activity.description_field_error"
                  >
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Activity type + hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-score text-xs uppercase tracking-wide">
                    Activity Type <span className="text-ineligible">*</span>
                  </Label>
                  <Controller
                    name="activity_type"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger data-ocid="log_activity.activity_type_select">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ActivityType.ongoing}>
                            Ongoing
                          </SelectItem>
                          <SelectItem value={ActivityType.retroactive}>
                            Retroactive
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="hours_spent"
                    className="font-score text-xs uppercase tracking-wide"
                  >
                    Hours Spent <span className="text-ineligible">*</span>
                  </Label>
                  <Input
                    id="hours_spent"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="9999"
                    placeholder="e.g. 40"
                    data-ocid="log_activity.hours_input"
                    {...register("hours_spent", {
                      required: "Hours required",
                      min: { value: 0.5, message: "Must be positive" },
                      max: { value: 9999, message: "Max 9999 hours" },
                    })}
                    className={cn(
                      "font-score",
                      errors.hours_spent && "border-ineligible/60",
                      overclaim && "border-borderline/60",
                    )}
                  />
                  {errors.hours_spent && (
                    <p
                      className="text-xs text-ineligible"
                      data-ocid="log_activity.hours_field_error"
                    >
                      {errors.hours_spent.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="start_date"
                    className="font-score text-xs uppercase tracking-wide"
                  >
                    Start Date <span className="text-ineligible">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    data-ocid="log_activity.start_date_input"
                    {...register("start_date", {
                      required: "Start date required",
                    })}
                    className={cn(
                      "font-score",
                      errors.start_date && "border-ineligible/60",
                    )}
                  />
                  {errors.start_date && (
                    <p
                      className="text-xs text-ineligible"
                      data-ocid="log_activity.start_date_field_error"
                    >
                      {errors.start_date.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="end_date"
                    className="font-score text-xs uppercase tracking-wide"
                  >
                    End Date{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    data-ocid="log_activity.end_date_input"
                    {...register("end_date")}
                    className="font-score"
                  />
                </div>
              </div>

              {/* Program */}
              <div className="space-y-1.5">
                <Label className="font-score text-xs uppercase tracking-wide">
                  R&D Program{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                {programsLoading ? (
                  <Skeleton className="h-9 rounded-md" />
                ) : (
                  <Controller
                    name="program_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(v) =>
                          field.onChange(v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger data-ocid="log_activity.program_select">
                          <SelectValue placeholder="No program" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No program</SelectItem>
                          {programs.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="font-score text-xs uppercase tracking-wide">
                  Tags <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="ml, prototype, algorithm (comma-separated)"
                    data-ocid="log_activity.tags_input"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    data-ocid="log_activity.add_tag_button"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-score text-primary"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-ineligible transition-smooth"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="px-5 py-4 flex items-center justify-between gap-3 bg-secondary/20">
              <p className="text-xs text-muted-foreground">
                Submitting will run IRC §41 deterministic classification
                automatically.
              </p>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="font-score gap-2 shrink-0"
                data-ocid="log_activity.submit_button"
              >
                {mutation.isPending ? (
                  <>
                    <span className="animate-pulse">Classifying...</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4" />
                    Submit &amp; Classify
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Classification Result Panel */
          <div
            className="space-y-4"
            data-ocid="log_activity.classification_result"
          >
            {/* Result header */}
            <div className="flex items-center gap-3 rounded-lg border border-eligible/30 bg-eligible/5 px-5 py-4">
              <CheckCircle2 className="w-5 h-5 text-eligible shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-score text-sm font-semibold text-foreground">
                  Classification complete
                </p>
                <p className="text-xs text-muted-foreground">
                  Activity{" "}
                  <span className="font-score text-primary">
                    {result.activity.id.slice(0, 8)}…
                  </span>{" "}
                  submitted for review
                </p>
              </div>
              <EligibilityBadge
                label={result.classification.eligibility_label}
              />
            </div>

            {/* Score row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground font-score uppercase tracking-wide mb-2">
                  Classical Score
                </p>
                <ScoreBadge
                  score={result.classification.eligibility_score}
                  label={result.classification.eligibility_label}
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground font-score uppercase tracking-wide mb-2">
                  Quantum-Adjusted
                </p>
                <QuantumScoreDisplay
                  score={result.classification.quantum_adjusted_score}
                  label={result.classification.eligibility_label}
                />
              </div>
            </div>

            {/* Decoherence warning */}
            <DecoherenceWarning
              quantumScore={result.classification.quantum_adjusted_score}
              hoursSpent={result.activity.hours_spent}
            />

            {/* Four-part test */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-score text-xs uppercase tracking-wide text-muted-foreground mb-3">
                IRC §41 Four-Part Test
              </h3>
              <FourPartTestDisplay
                result={result.classification.four_part_test}
              />
            </div>

            {/* Admin suggestion */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-score text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Agent Recommendation
              </h3>
              <AdminSuggestionChip
                suggestion={result.classification.admin_suggestion}
              />
            </div>

            {/* Agent reasoning */}
            {result.classification.agent_reasoning && (
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-score text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Agent Reasoning
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.classification.agent_reasoning}
                </p>
              </div>
            )}

            {/* Suggested tags */}
            {result.classification.suggested_tags.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-score text-xs uppercase tracking-wide text-muted-foreground mb-3">
                  Suggested Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.classification.suggested_tags.map((tag) => (
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

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                asChild
                className="gap-2 font-score"
                data-ocid="log_activity.view_detail_button"
              >
                <a
                  href={`/activities/${result.activity.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate({
                      to: "/activities/$id",
                      params: { id: result.activity.id },
                    });
                  }}
                >
                  View Full Detail <ChevronRight className="w-4 h-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/dashboard" })}
                className="font-score"
                data-ocid="log_activity.back_to_dashboard_button"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setResult(null);
                  setTags([]);
                }}
                className="font-score text-muted-foreground"
                data-ocid="log_activity.log_another_button"
              >
                Log another
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
