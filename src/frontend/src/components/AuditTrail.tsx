import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/use-backend";
import type { AuditEntry } from "../types";
import { SovereignTimestamp } from "./SovereignTimestamp";

interface AuditTrailProps {
  entityId: string;
  className?: string;
}

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-4)}`;
}

export function AuditTrail({ entityId, className }: AuditTrailProps) {
  const { actor, isFetching } = useBackend();
  const { data: entries = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ["audit", entityId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_audit_trail(entityId, BigInt(5));
    },
    enabled: !!actor && !isFetching,
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded bg-secondary/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No audit entries found.</p>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-4 rounded-md px-3 py-2 bg-secondary/40 text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-score text-primary shrink-0">
              {truncatePrincipal(entry.actor_principal)}
            </span>
            <span className="text-muted-foreground truncate">
              {entry.action}
            </span>
            <span className="text-muted-foreground/60 truncate">
              {entry.entity_type}
            </span>
          </div>
          <SovereignTimestamp timestamp={entry.timestamp} label="" />
        </div>
      ))}
    </div>
  );
}
