import type { Announcement } from "@/lib/types/database.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatLunchDate } from "@/lib/cutoff";

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

const typeLabels: Record<Announcement["type"], string> = {
  general: "Notice",
  menu_change: "Menu Change",
  closure: "Closure",
};

const typeVariant: Record<Announcement["type"], "default" | "destructive"> = {
  general: "default",
  menu_change: "default",
  closure: "destructive",
};

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {announcements.map((a) => (
        <Alert key={a.id} variant={typeVariant[a.type]}>
          <AlertTitle className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide">
              {typeLabels[a.type]}
            </span>
            {a.target_date && (
              <span className="text-xs text-muted-foreground font-normal">
                · {formatLunchDate(a.target_date)}
              </span>
            )}
          </AlertTitle>
          <AlertDescription>
            <p className="font-medium">{a.title}</p>
            <p className="mt-0.5 text-sm">{a.body}</p>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
