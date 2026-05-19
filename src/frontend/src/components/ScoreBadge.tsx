import { cn } from "@/lib/utils";
import { EligibilityLabel } from "../types";

interface ScoreBadgeProps {
  score: number;
  label: EligibilityLabel;
  size?: "sm" | "md";
  className?: string;
}

const COLOR_MAP: Record<EligibilityLabel, string> = {
  [EligibilityLabel.eligible]: "bg-eligible",
  [EligibilityLabel.borderline]: "bg-borderline",
  [EligibilityLabel.ineligible]: "bg-ineligible",
};

export function ScoreBadge({
  score,
  label,
  size = "md",
  className,
}: ScoreBadgeProps) {
  const colorCls = COLOR_MAP[label] ?? COLOR_MAP[EligibilityLabel.ineligible];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 font-score font-semibold tabular-nums",
        size === "sm" ? "py-0.5 text-xs" : "py-1 text-sm",
        colorCls,
        className,
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
