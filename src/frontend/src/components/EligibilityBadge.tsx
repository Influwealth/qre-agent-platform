import { cn } from "@/lib/utils";
import { EligibilityLabel } from "../types";

interface EligibilityBadgeProps {
  label: EligibilityLabel;
  size?: "sm" | "md";
  className?: string;
}

const LABEL_MAP: Record<EligibilityLabel, { text: string; cls: string }> = {
  [EligibilityLabel.eligible]: { text: "Eligible", cls: "bg-eligible" },
  [EligibilityLabel.borderline]: { text: "Borderline", cls: "bg-borderline" },
  [EligibilityLabel.ineligible]: { text: "Ineligible", cls: "bg-ineligible" },
};

export function EligibilityBadge({
  label,
  size = "md",
  className,
}: EligibilityBadgeProps) {
  const { text, cls } =
    LABEL_MAP[label] ?? LABEL_MAP[EligibilityLabel.ineligible];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 font-score font-medium tracking-wide",
        size === "sm" ? "py-0.5 text-xs" : "py-1 text-sm",
        cls,
        className,
      )}
    >
      {text}
    </span>
  );
}
