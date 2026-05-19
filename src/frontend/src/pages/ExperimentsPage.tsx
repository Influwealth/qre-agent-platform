import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Beaker,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  HelpCircle,
  Link2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useBackend } from "../hooks/use-backend";
import { ExperimentOutcome } from "../types";
import type { CreateExperimentInput, Experiment } from "../types";

function formatNano(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const OUTCOME_CONFIG: Record<
  ExperimentOutcome,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  [ExperimentOutcome.success]: {
    label: "Success",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    cls: "bg-eligible",
  },
  [ExperimentOutcome.failure]: {
    label: "Failure",
    icon: <XCircle className="w-3.5 h-3.5" />,
    cls: "bg-ineligible",
  },
  [ExperimentOutcome.inconclusive]: {
    label: "Inconclusive",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    cls: "bg-borderline",
  },
};

interface FormValues {
  hypothesis: string;
  method: string;
  results_summary: string;
  outcome: ExperimentOutcome;
  linked_activity_id: string;
  metrics: { name: string; value: string }[];
}

interface ExperimentCardProps {
  experiment: Experiment;
  activities: { id: string; title: string }[];
}

function ExperimentCard({ experiment, activities }: ExperimentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = OUTCOME_CONFIG[experiment.outcome];
  const linkedActivity = activities.find(
    (a) => a.id === experiment.linked_activity_id,
  );

  return (
    <Card className="bg-card border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 shrink-0">
            <FlaskConical className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-score text-xs text-muted-foreground mb-0.5">
              Hypothesis
            </p>
            <p className="text-sm text-foreground line-clamp-2 leading-snug">
              {experiment.hypothesis}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-score font-medium shrink-0",
            cfg.cls,
          )}
        >
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        <span className="text-foreground/70 font-medium">Method: </span>
        {experiment.method}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-score">
          {experiment.metrics.length} metric
          {experiment.metrics.length !== 1 ? "s" : ""}
        </span>
        {linkedActivity && (
          <span className="flex items-center gap-1 text-primary/80">
            <Link2 className="w-3 h-3" />
            <span className="truncate max-w-[160px]">
              {linkedActivity.title}
            </span>
          </span>
        )}
        <span className="ml-auto font-score">
          ⏱ {formatNano(experiment.created_at)}
        </span>
      </div>

      {experiment.results_summary && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-smooth w-fit"
          data-ocid="experiment.expand_toggle"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {expanded ? "Hide results" : "Show results"}
        </button>
      )}

      {expanded && experiment.results_summary && (
        <div className="rounded-md bg-secondary/40 border border-border p-3 text-xs text-foreground/80 leading-relaxed">
          {experiment.results_summary}
        </div>
      )}

      {expanded && experiment.metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {experiment.metrics.map((m, i) => (
            <div
              key={`${m.name}-${i}`}
              className="rounded-md bg-secondary/40 border border-border px-3 py-2"
            >
              <p className="text-xs text-muted-foreground truncate">{m.name}</p>
              <p className="font-score text-sm text-foreground mt-0.5">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ExperimentsPage() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: experiments = [], isLoading } = useQuery<Experiment[]>({
    queryKey: ["my_experiments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.list_my_experiments();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: activities = [] } = useQuery<{ id: string; title: string }[]>({
    queryKey: ["my_activities_slim"],
    queryFn: async () => {
      if (!actor) return [];
      const list = await actor.list_my_activities(null, null);
      return list.map((a) => ({ id: a.id, title: a.title }));
    },
    enabled: !!actor && !isFetching,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      hypothesis: "",
      method: "",
      results_summary: "",
      outcome: ExperimentOutcome.success,
      linked_activity_id: "",
      metrics: [],
    },
  });

  const {
    fields: metricFields,
    append: appendMetric,
    remove: removeMetric,
  } = useFieldArray({
    control,
    name: "metrics",
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!actor) throw new Error("Not connected");
      const input: CreateExperimentInput = {
        hypothesis: data.hypothesis,
        method: data.method,
        results_summary: data.results_summary,
        outcome: data.outcome,
        metrics: data.metrics.filter((m) => m.name.trim()),
        linked_activity_id: data.linked_activity_id || undefined,
      };
      return actor.create_experiment(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_experiments"] });
      toast.success("Experiment created successfully");
      setModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Failed to create experiment");
    },
  });

  const onSubmit = (data: FormValues) => createMutation.mutate(data);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Beaker className="w-5 h-5 text-primary" />
              Experiments
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Document hypotheses, methods, and outcomes for your R&D
              activities.
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            data-ocid="experiments.create_button"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Experiment
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["skel-a", "skel-b", "skel-c", "skel-d"].map((k) => (
              <Skeleton key={k} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : experiments.length === 0 ? (
          <div
            data-ocid="experiments.empty_state"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <FlaskConical className="w-8 h-8 text-primary/60" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              No experiments yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Log your first experiment to document a hypothesis, method, and
              outcome for an R&D effort.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              data-ocid="experiments.empty_create_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Experiment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.map((exp, i) => (
              <div key={exp.id} data-ocid={`experiments.item.${i + 1}`}>
                <ExperimentCard experiment={exp} activities={activities} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="experiments.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FlaskConical className="w-4 h-4 text-primary" />
              New Experiment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
            {/* Hypothesis */}
            <div className="space-y-1.5">
              <Label htmlFor="hypothesis">
                Hypothesis <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="hypothesis"
                rows={3}
                placeholder="We believe that... because... we will know this is true when..."
                className="bg-secondary/30 border-border resize-none"
                data-ocid="experiments.hypothesis.textarea"
                {...register("hypothesis", {
                  required: "Hypothesis is required",
                  minLength: { value: 10, message: "Minimum 10 characters" },
                })}
              />
              {errors.hypothesis && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="experiments.hypothesis.field_error"
                >
                  {errors.hypothesis.message}
                </p>
              )}
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <Label htmlFor="method">
                Experimental Method <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="method"
                rows={4}
                placeholder="Describe the approach, tools, iterations, and experimental steps taken..."
                className="bg-secondary/30 border-border resize-none"
                data-ocid="experiments.method.textarea"
                {...register("method", {
                  required: "Method is required",
                  minLength: { value: 20, message: "Minimum 20 characters" },
                })}
              />
              {errors.method && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="experiments.method.field_error"
                >
                  {errors.method.message}
                </p>
              )}
            </div>

            {/* Results */}
            <div className="space-y-1.5">
              <Label htmlFor="results_summary">Results Summary</Label>
              <Textarea
                id="results_summary"
                rows={3}
                placeholder="What were the outcomes? Include quantitative results if available..."
                className="bg-secondary/30 border-border resize-none"
                data-ocid="experiments.results.textarea"
                {...register("results_summary")}
              />
            </div>

            {/* Outcome + Activity row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Outcome <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="outcome"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="bg-secondary/30 border-border"
                        data-ocid="experiments.outcome.select"
                      >
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value={ExperimentOutcome.success}>
                          ✓ Success
                        </SelectItem>
                        <SelectItem value={ExperimentOutcome.failure}>
                          ✗ Failure
                        </SelectItem>
                        <SelectItem value={ExperimentOutcome.inconclusive}>
                          ? Inconclusive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link to Activity</Label>
                <Controller
                  name="linked_activity_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="bg-secondary/30 border-border"
                        data-ocid="experiments.linked_activity.select"
                      >
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="">None</SelectItem>
                        {activities.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Metrics</Label>
                <button
                  type="button"
                  onClick={() => appendMetric({ name: "", value: "" })}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-smooth"
                  data-ocid="experiments.add_metric_button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add metric
                </button>
              </div>
              {metricFields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No metrics added. Click &quot;Add metric&quot; to track a
                  measurement.
                </p>
              )}
              <div className="space-y-2">
                {metricFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Metric name (e.g. Accuracy)"
                      className="bg-secondary/30 border-border flex-1"
                      {...register(`metrics.${idx}.name`)}
                    />
                    <Input
                      placeholder="Value (e.g. 94.2%)"
                      className="bg-secondary/30 border-border flex-1"
                      {...register(`metrics.${idx}.value`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeMetric(idx)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-smooth shrink-0"
                      aria-label="Remove metric"
                      data-ocid={`experiments.remove_metric_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  reset();
                }}
                data-ocid="experiments.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                data-ocid="experiments.submit_button"
              >
                {createMutation.isPending ? "Creating..." : "Create Experiment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
