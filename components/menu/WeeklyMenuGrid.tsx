import { MenuItemCard } from "./MenuItemCard";
import { formatLunchDate, getWeekDates } from "@/lib/cutoff";
import type { MenuItem, Order } from "@/lib/types/database.types";

interface WeeklyMenuGridProps {
  weekStart: string;
  menuItems: (MenuItem & { restaurants: { name: string } | null })[];
  orders: Order[];
  isAllowed: boolean;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function WeeklyMenuGrid({ weekStart, menuItems, orders, isAllowed }: WeeklyMenuGridProps) {
  const weekDates = getWeekDates(weekStart);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {weekDates.map((date, idx) => {
        const dayOfWeek = idx + 1; // 1=Mon
        const dayItems = menuItems.filter((item) => item.day_of_week === dayOfWeek);
        const dayOrder = orders.find((o) => o.order_date === date && o.status !== "cancelled") ?? null;

        return (
          <div key={date} className="space-y-2">
            <div>
              <p className="text-sm font-semibold">{DAY_NAMES[idx]}</p>
              <p className="text-xs text-muted-foreground">{formatLunchDate(date)}</p>
            </div>

            {dayItems.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-4 text-center border rounded-md bg-gray-50">
                No menu
              </div>
            ) : (
              dayItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  menuItem={item}
                  orderDate={date}
                  existingOrder={dayOrder?.menu_item_id === item.id ? dayOrder : null}
                  isAllowed={isAllowed}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
