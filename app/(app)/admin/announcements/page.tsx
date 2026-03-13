import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { formatLunchDate } from "@/lib/cutoff";
import { DeactivateAnnouncementButton } from "@/components/admin/DeactivateAnnouncementButton";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, profiles!created_by(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <ButtonLink size="sm" href="/admin/announcements/new">+ New</ButtonLink>
      </div>

      {(!announcements || announcements.length === 0) && (
        <div className="text-center py-16 border rounded-lg bg-white text-muted-foreground">
          No announcements yet.
        </div>
      )}

      <div className="space-y-3">
        {announcements?.map((a) => {
          type AnnProfile = { full_name: string | null; email: string };
          const profile = a.profiles as AnnProfile | null;
          return (
            <Card key={a.id} className={a.is_active ? "" : "opacity-50"}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={a.is_active ? "default" : "secondary"} className="text-xs">
                        {a.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">{a.type}</Badge>
                      {a.target_date && (
                        <span className="text-xs text-muted-foreground">
                          · {formatLunchDate(a.target_date)}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{a.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By {profile?.full_name ?? profile?.email} · {new Date(a.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <ButtonLink variant="outline" size="sm" href={`/admin/announcements/${a.id}`}>Edit</ButtonLink>
                    {a.is_active && (
                      <DeactivateAnnouncementButton announcementId={a.id} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
