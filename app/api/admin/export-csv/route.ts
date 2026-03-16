import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const from = request.nextUrl.searchParams.get("from");
  const to   = request.nextUrl.searchParams.get("to");

  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return new NextResponse("Invalid date range", { status: 400 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("order_date, status, guest_name, profiles!orders_user_id_fkey(full_name, email)")
    .gte("order_date", from)
    .lte("order_date", to)
    .neq("status", "cancelled")
    .order("order_date")
    .order("created_at");

  if (!orders) return new NextResponse("No data", { status: 404 });

  type P = { full_name: string | null; email: string } | null;
  type Order = { order_date: string; status: string; guest_name: string | null; profiles: unknown };

  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const formatDate = (d: string) => {
    const dt = new Date(`${d}T00:00:00`);
    return `${d} (${DAY[dt.getDay()]})`;
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getName  = (o: Order) => o.guest_name ? "Guest" : ((o.profiles as P)?.full_name ?? "");
  const getEmail = (o: Order) => o.guest_name ? "" : ((o.profiles as P)?.email ?? "");

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const countByDate   = new Map<string, number>();
  const countByPerson = new Map<string, { name: string; email: string; count: number }>();

  for (const o of orders as Order[]) {
    // by date
    countByDate.set(o.order_date, (countByDate.get(o.order_date) ?? 0) + 1);
    // by person
    const key = o.guest_name ? "__guest__" : getEmail(o);
    if (!countByPerson.has(key)) {
      countByPerson.set(key, { name: getName(o), email: getEmail(o), count: 0 });
    }
    countByPerson.get(key)!.count += 1;
  }

  const noShows = (orders as Order[]).filter(o => o.status === "no_show");

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orders");

  const COLS = 5; // A–E

  // Style helpers — lighter palette
  const headerFill: ExcelJS.Fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6B9BD2" } }; // soft blue
  const sectionFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7A07A" } }; // soft orange
  const altFill: ExcelJS.Fill     = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3EE" } }; // very light peach
  const white: ExcelJS.Fill       = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  const bold = (size = 11) => ({ bold: true, size });

  function addTitle(text: string) {
    const r = ws.addRow([text]);
    ws.mergeCells(r.number, 1, r.number, COLS);
    r.getCell(1).font = { bold: true, size: 14, color: { argb: "FF1F3A5F" } };
    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    r.height = 28;
  }

  function addSectionHeader(text: string) {
    ws.addRow([]);
    const r = ws.addRow([text]);
    ws.mergeCells(r.number, 1, r.number, COLS);
    r.getCell(1).fill = sectionFill;
    r.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    r.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    r.height = 22;
  }

  function addColHeaders(labels: string[]) {
    const r = ws.addRow(labels);
    r.eachCell(c => {
      c.fill = headerFill;
      c.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
      c.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    r.height = 20;
  }

  function addDataRow(values: (string | number)[], isAlt: boolean) {
    const r = ws.addRow(values);
    r.eachCell(c => {
      c.fill = isAlt ? altFill : white;
      c.alignment = { horizontal: "center", vertical: "middle" };
    });
    r.height = 18;
  }

  // ── Title ──────────────────────────────────────────────────────────────────
  addTitle("Carol — Order Export");
  const subRow = ws.addRow([`Period: ${from}  →  ${to}`]);
  ws.mergeCells(subRow.number, 1, subRow.number, COLS);
  subRow.getCell(1).font = { size: 11, color: { argb: "FF374151" } };
  subRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  subRow.height = 20;

  // ── Order list ─────────────────────────────────────────────────────────────
  addSectionHeader("Order List");
  addColHeaders(["Lunch Date", "Name", "Email", "Status", "Guest"]);

  (orders as Order[]).forEach((o, i) => {
    addDataRow([
      formatDate(o.order_date),
      getName(o),
      getEmail(o),
      o.status,
      o.guest_name ? "Yes" : "No",
    ], i % 2 === 1);
  });

  // ── Summary by date ────────────────────────────────────────────────────────
  addSectionHeader("Summary by Lunch Date");
  addColHeaders(["Lunch Date", "Order Count", "", "", ""]);

  [...countByDate.entries()].forEach(([date, count], i) => {
    addDataRow([formatDate(date), count, "", "", ""], i % 2 === 1);
  });
  const totalDateRow = ws.addRow(["Total", orders.length, "", "", ""]);
  totalDateRow.getCell(1).font = bold();
  totalDateRow.getCell(2).font = bold();
  totalDateRow.height = 18;

  // ── Summary by person ──────────────────────────────────────────────────────
  addSectionHeader("Summary by Person");
  addColHeaders(["Name", "Email", "Order Count", "", ""]);

  [...countByPerson.values()]
    .sort((a, b) => b.count - a.count)
    .forEach(({ name, email, count }, i) => {
      addDataRow([name, email, count, "", ""], i % 2 === 1);
    });

  // ── No-show summary ────────────────────────────────────────────────────────
  addSectionHeader("No-show Summary");

  if (noShows.length === 0) {
    const r = ws.addRow(["No no-shows in this period."]);
    ws.mergeCells(r.number, 1, r.number, COLS);
    r.getCell(1).font = { italic: true, color: { argb: "FF9CA3AF" } };
    r.getCell(1).alignment = { indent: 1 };
  } else {
    addColHeaders(["Lunch Date", "Name", "Email", "", ""]);
    (noShows as Order[]).forEach((o, i) => {
      addDataRow([formatDate(o.order_date), getName(o), getEmail(o), "", ""], i % 2 === 1);
    });
    const nsTotalRow = ws.addRow(["Total No-shows", noShows.length, "", "", ""]);
    nsTotalRow.getCell(1).font = bold();
    nsTotalRow.getCell(2).font = bold();
    nsTotalRow.height = 18;
  }

  // ── Column widths ──────────────────────────────────────────────────────────
  // Measure max content width per column across all rows
  const minWidths = [12, 20, 30, 14, 8];
  const colWidths = [...minWidths];

  ws.eachRow(row => {
    row.eachCell({ includeEmpty: false }, (cell, colNum) => {
      const len = String(cell.value ?? "").length;
      if (colNum <= COLS) {
        colWidths[colNum - 1] = Math.max(colWidths[colNum - 1], len + 2);
      }
    });
  });

  ws.columns = colWidths.map(width => ({ width }));

  // ── Respond ────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="carol-orders-${from}-to-${to}.xlsx"`,
    },
  });
}
