import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface DecoherenceWarningProps {
  quantumScore: number;
  hoursSpent: number;
  className?: string;
}

export function DecoherenceWarning({
  quantumScore,
  hoursSpent,
  className,
}: DecoherenceWarningProps) {
  const isHighRisk = quantumScore < 60 && hoursSpent > 100;
  if (!isHighRisk) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-borderline bg-borderline px-3 py-2 text-sm",
        className,
      )}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 text-borderline" />
      <span className="font-score text-xs font-medium text-borderline">
        High IRS Scrutiny Risk
      </span>
      <span className="text-xs text-muted-foreground">
        Low quantum score with high hours claim may trigger audit
      </span>
    </div>
  );
}
