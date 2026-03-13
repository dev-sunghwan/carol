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
      <h1 className="text-2xl font-bold tracking-tight mb-6">New Announcement</h1>
      <AnnouncementForm />
    </div>
  );
}
