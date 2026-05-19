import { cn } from "@/lib/utils";
import { Recommendation } from "../types";
import type { AdminSuggestion } from "../types";

interface AdminSuggestionChipProps {
  suggestion: AdminSuggestion;
  className?: string;
}

const CONFIG: Record<
  Recommendation,
  { label: string; cls: string; icon: string }
> = {
  [Recommendation.approve]: {
    label: "LIKELY APPROVE",
    cls: "bg-eligible text-eligible border-eligible",
    icon: "checkmark",
  },
  [Recommendation.reject]: {
    label: "LIKELY REJECT",
    cls: "bg-ineligible text-ineligible border-ineligible",
    icon: "x",
  },
  [Recommendation.more_info]: {
    label: "REQUEST MORE INFO",
    cls: "bg-borderline text-borderline border-borderline",
    icon: "question",
  },
};

export function AdminSuggestionChip({
  suggestion,
  className,
}: AdminSuggestionChipProps) {
  const config =
    CONFIG[suggestion.recommendation] ?? CONFIG[Recommendation.more_info];
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-score font-semibold tracking-widest uppercase",
          config.cls,
        )}
      >
        {config.label}{" "}
        <span className="font-score text-xs opacity-80">
          {Number(suggestion.confidence)}%
        </span>
      </span>
      {suggestion.notes && (
        <p className="text-xs text-muted-foreground leading-relaxed pl-1">
          {suggestion.notes}
        </p>
      )}
    </div>
  );
}
