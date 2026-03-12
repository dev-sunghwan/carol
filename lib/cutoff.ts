/**
 * Cutoff time logic for Carol lunch ordering.
 *
 * Rules:
 *   - Monday lunch   → cutoff is Monday 09:15 Europe/London
 *   - Tue–Fri lunch  → cutoff is the previous calendar day at 16:00 Europe/London
 *
 * All calculations use Europe/London to correctly handle GMT↔BST transitions.
 */

const TIMEZONE = "Europe/London";

/**
 * Parse a YYYY-MM-DD date string as a London-local date and return
 * the day-of-week (0=Sun, 1=Mon, ..., 6=Sat) in London time.
 */
function getLondonDayOfWeek(dateStr: string): number {
  // Use Intl to determine the local weekday in London
  const date = new Date(dateStr + "T12:00:00Z"); // noon UTC avoids DST boundary issues for DOW
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
  });
  const day = fmt.format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[day] ?? -1;
}

/**
 * Build a Date representing a specific London local time on a given YYYY-MM-DD date.
 */
function londonDateTime(
  dateStr: string,
  hours: number,
  minutes: number
): Date {
  // Create a date-time string and parse it in London timezone using Intl offset trick
  // We use the offset from London at that specific moment to convert to UTC.
  const approxUtc = new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`);

  // Get London's UTC offset at approximately that time
  const londonOffsetMinutes = getLondonUTCOffsetMinutes(approxUtc);

  // Subtract the offset to get the true UTC instant
  return new Date(approxUtc.getTime() - londonOffsetMinutes * 60 * 1000);
}

/**
 * Returns London's UTC offset in minutes at the given UTC instant.
 * Positive means London is ahead of UTC (BST, +60). Zero means GMT.
 */
function getLondonUTCOffsetMinutes(utcDate: Date): number {
  const utcParts = getDateParts(utcDate, "UTC");
  const londonParts = getDateParts(utcDate, TIMEZONE);

  const utcMinutes = utcParts.hours * 60 + utcParts.minutes;
  const londonMinutes = londonParts.hours * 60 + londonParts.minutes;

  let diff = londonMinutes - utcMinutes;
  // Handle day boundary crossover
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;

  return diff;
}

function getDateParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  return {
    hours: parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10),
    minutes: parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10),
  };
}

/**
 * Add calendar days to a YYYY-MM-DD string.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the cutoff Date (UTC) for ordering a given lunch date.
 *
 * @param lunchDate YYYY-MM-DD string representing the lunch date
 */
export function getCutoffForDate(lunchDate: string): Date {
  const dow = getLondonDayOfWeek(lunchDate);

  if (dow === 1) {
    // Monday: cutoff is same day 09:15 London time
    return londonDateTime(lunchDate, 9, 15);
  } else {
    // Tue–Fri: cutoff is previous calendar day 16:00 London time
    const prevDay = addDays(lunchDate, -1);
    return londonDateTime(prevDay, 16, 0);
  }
}

/**
 * Returns true if the cutoff for the given lunch date has already passed.
 *
 * @param lunchDate YYYY-MM-DD
 * @param now       Injected for testability; defaults to new Date()
 */
export function isCutoffPassed(
  lunchDate: string,
  now: Date = new Date()
): boolean {
  return getCutoffForDate(lunchDate) < now;
}

/**
 * Returns a human-readable label for the cutoff time in London local time.
 * E.g. "Monday 09:15" or "Sunday 16:00"
 */
export function getCutoffLabel(lunchDate: string): string {
  const cutoff = getCutoffForDate(lunchDate);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(cutoff);
}

/**
 * Returns the Monday (YYYY-MM-DD) of the week containing a given date.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns YYYY-MM-DD for each working day (Mon–Fri) of the week containing `date`.
 */
export function getWeekDates(weekStart: string): string[] {
  return [0, 1, 2, 3, 4].map((offset) => addDays(weekStart, offset));
}

/**
 * Returns the orderable dates from now: Mon–Fri of the current week
 * where the cutoff has not yet passed.
 */
export function getOrderableDates(now: Date = new Date()): string[] {
  const weekStart = getWeekStart(now);
  return getWeekDates(weekStart).filter((d) => !isCutoffPassed(d, now));
}

/**
 * Format a YYYY-MM-DD as a display string (e.g. "Mon 10 Mar")
 */
export function formatLunchDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

/**
 * Format a YYYY-MM-DD for audit log messages (e.g. "Wed 12 Mar 2026")
 */
export function formatAuditDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
