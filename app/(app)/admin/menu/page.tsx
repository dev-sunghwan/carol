import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { formatLunchDate } from "@/lib/cutoff";
import { MenuImportDialog } from "@/components/admin/MenuImportDialog";

export default async function AdminMenuPage() {
  const supabase = await createClient();

  const [{ data: menuWeeks }, { data: restaurants }] = await Promise.all([
    supabase
      .from("menu_weeks")
      .select("*, menu_items(count)")
      .order("week_start", { ascending: false })
      .limit(12),
    supabase
      .from("restaurants")
      .select("id, name")
      .eq("is_active", true)
      .limit(1)
      .single(),
  ]);

  const restaurantId = (restaurants as any)?.id ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Menu Management</h1>
        <div className="flex gap-2">
          <MenuImportDialog restaurantId={restaurantId} />
          <ButtonLink size="sm" href="/admin/menu/new">+ New Week</ButtonLink>
        </div>
      </div>

      {(!menuWeeks || menuWeeks.length === 0) ? (
        <div className="text-center py-16 border rounded-lg bg-white text-muted-foreground">
          <p>No menus yet. Create the first one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {menuWeeks.map((week) => {
            const itemCount = (week.menu_items as unknown as [{ count: number }])?.[0]?.count ?? 0;
            return (
              <Card key={week.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Week of {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(week.week_start + "T12:00:00Z"))}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={week.is_published ? "default" : "secondary"}>
                        {week.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {itemCount} menu item{itemCount !== 1 ? "s" : ""}
                    </p>
                    <ButtonLink variant="outline" size="sm" href={`/admin/menu/${week.id}`}>Edit</ButtonLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
