"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getCutoffForDate, getCutoffLabel } from "@/lib/cutoff";

interface CutoffBadgeProps {
  lunchDate: string;
}

export function CutoffBadge({ lunchDate }: CutoffBadgeProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const cutoff = getCutoffForDate(lunchDate);
  const isPast = cutoff < now;
  const msLeft = cutoff.getTime() - now.getTime();
  const hoursLeft = msLeft / (1000 * 60 * 60);

  if (isPast) {
    return (
      <Badge variant="secondary" className="text-xs">
        Closed
      </Badge>
    );
  }

  if (hoursLeft < 1) {
    const minsLeft = Math.floor(msLeft / (1000 * 60));
    return (
      <Badge variant="destructive" className="text-xs">
        Closes in {minsLeft}m
      </Badge>
    );
  }

  if (hoursLeft < 3) {
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
        Closes {getCutoffLabel(lunchDate)}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs text-green-700 border-green-700">
      Open · closes {getCutoffLabel(lunchDate)}
    </Badge>
  );
}
