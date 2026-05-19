import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import type { FourPartTestResult } from "../types";

interface FourPartTestDisplayProps {
  result: FourPartTestResult;
  className?: string;
}

const PARTS: { key: keyof FourPartTestResult; label: string }[] = [
  { key: "permitted_purpose", label: "Permitted Purpose" },
  { key: "technological_in_nature", label: "Technological in Nature" },
  { key: "elimination_of_uncertainty", label: "Elimination of Uncertainty" },
  { key: "process_of_experimentation", label: "Process of Experimentation" },
];

export function FourPartTestDisplay({
  result,
  className,
}: FourPartTestDisplayProps) {
  const parts = PARTS.filter((p) => p.key !== "notes");
  return (
    <div className={cn("space-y-2", className)}>
      {parts.map(({ key, label }) => {
        const passed = result[key] as boolean;
        return (
          <div
            key={key}
            className="flex items-start gap-3 p-2.5 rounded-md bg-secondary/50"
          >
            {passed ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-eligible" />
            ) : (
              <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-ineligible" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  passed ? "text-eligible" : "text-ineligible",
                )}
              >
                {label}
              </p>
            </div>
          </div>
        );
      })}
      {result.notes && (
        <p className="text-xs text-muted-foreground px-2 pt-1 italic">
          {result.notes}
        </p>
      )}
    </div>
  );
}
