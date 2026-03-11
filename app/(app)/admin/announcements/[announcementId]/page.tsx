import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import Link from "next/link";

interface Props {
  params: Promise<{ announcementId: string }>;
}

export default async function EditAnnouncementPage({ params }: Props) {
  const { announcementId } = await params;
  const supabase = await createClient();

  const { data: announcement } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .single();

  if (!announcement) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Link href="/admin/announcements" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Announcements
        </Link>
      </div>
      <h1 className="text-xl font-bold mb-6">Edit Announcement</h1>
      <AnnouncementForm announcement={announcement} />
    </div>
  );
}
