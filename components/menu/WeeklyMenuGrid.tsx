import { DayLunchCard } from "./DayLunchCard";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
      {weekDates.map((date, idx) => {
        const dayOfWeek = idx + 1;
        const dayItems = menuItems
          .filter((item) => item.day_of_week === dayOfWeek)
          .sort((a, b) => a.display_order - b.display_order);
        const dayOrder = orders.find((o) => o.order_date === date && o.status !== "cancelled") ?? null;

        return (
          <DayLunchCard
            key={date}
            dayName={DAY_NAMES[idx]}
            date={date}
            menuItems={dayItems}
            existingOrder={dayOrder}
            isAllowed={isAllowed}
          />
        );
      })}
    </div>
  );
}
