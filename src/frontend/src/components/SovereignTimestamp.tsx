import { cn } from "@/lib/utils";
import type { Timestamp } from "../types";

interface SovereignTimestampProps {
  timestamp: Timestamp;
  label?: string;
  className?: string;
}

function nanosToDate(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  return new Date(ms).toISOString().replace("T", " ").replace("Z", " UTC");
}

export function SovereignTimestamp({
  timestamp,
  label = "Sovereign Timestamp",
  className,
}: SovereignTimestampProps) {
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-score text-xs tabular-nums">
        {nanosToDate(timestamp)}
      </span>
    </span>
  );
}
