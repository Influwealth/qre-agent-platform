import { cn } from "@/lib/utils";
import type { EligibilityLabel } from "../types";
import { ScoreBadge } from "./ScoreBadge";

interface QuantumScoreDisplayProps {
  score: number;
  label: EligibilityLabel;
  className?: string;
}

export function QuantumScoreDisplay({
  score,
  label,
  className,
}: QuantumScoreDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-base" aria-hidden="true">
        ⚛
      </span>
      <span className="text-xs text-muted-foreground font-score">
        Quantum Score
      </span>
      <ScoreBadge score={score} label={label} size="sm" />
    </div>
  );
}
