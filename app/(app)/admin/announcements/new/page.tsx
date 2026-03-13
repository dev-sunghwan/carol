import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import Link from "next/link";

export default function NewAnnouncementPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Link href="/admin/announcements" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Announcements
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">New Announcement</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This will appear as a banner on the menu page. Use <strong>Menu Change</strong> for item updates, <strong>Closure</strong> for days with no service, or <strong>General</strong> for other notices.
      </p>
      <AnnouncementForm />
    </div>
  );
}
