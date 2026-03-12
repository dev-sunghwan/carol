/**
 * PPTX Menu Parser
 *
 * Parses the weekly Korean lunch menu PPTX format:
 * - Row 0: Day headers (Monday–Friday)
 * - Rows 1–N: Menu items per day
 * - Each cell may contain "한글명\nEnglish description"
 *
 * Returns a list of parsed items ready to insert into menu_items.
 */

import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export interface ParsedMenuItem {
  dayOfWeek: number; // 1=Mon, 2=Tue, ..., 5=Fri
  name: string;
  description: string;
  displayOrder: number;
}

export interface ParsedMenu {
  items: ParsedMenuItem[];
  weekLabel: string | null; // e.g. "09 March 2026" extracted from slide text
}

/** Extract all text runs from an XML node recursively */
function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node !== "object" || node === null) return "";

  const obj = node as Record<string, unknown>;

  // a:t = text run — return immediately
  if ("a:t" in obj) {
    const t = obj["a:t"];
    if (typeof t === "string") return t;
    if (Array.isArray(t)) return t.join("");
  }

  // Recurse into child elements only — skip XML attributes (keys starting with @_)
  return Object.entries(obj)
    .filter(([key]) => !key.startsWith("@_"))
    .map(([, val]) => extractText(val))
    .join("");
}

/** Get paragraph text from a:txBody */
function getParagraphTexts(txBody: unknown): string[] {
  if (!txBody || typeof txBody !== "object") return [];
  const body = txBody as Record<string, unknown>;
  const paras = body["a:p"];
  const paraArr = Array.isArray(paras) ? paras : paras ? [paras] : [];
  return paraArr.map((p) => extractText(p)).filter((t) => t.trim() !== "");
}

/** Parse a table cell to get its full text (newline-separated paragraphs) */
function parseCellText(cell: unknown): string {
  if (!cell || typeof cell !== "object") return "";
  const c = cell as Record<string, unknown>;
  const txBody = c["a:txBody"];
  return getParagraphTexts(txBody).join("\n").trim();
}

/** Parse table rows from an a:tbl element */
function parseTable(tbl: Record<string, unknown>): string[][] {
  const trRaw = tbl["a:tr"];
  const rows: unknown[] = Array.isArray(trRaw) ? trRaw : trRaw ? [trRaw] : [];

  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    const tcRaw = r["a:tc"];
    const cells: unknown[] = Array.isArray(tcRaw) ? tcRaw : tcRaw ? [tcRaw] : [];
    return cells.map(parseCellText);
  });
}

export async function parsePptxMenu(buffer: ArrayBuffer): Promise<ParsedMenu> {
  const zip = await JSZip.loadAsync(buffer);

  // Find slide files
  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort();

  if (slideFiles.length === 0) {
    throw new Error("No slides found in PPTX file.");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["a:p", "a:r", "a:tr", "a:tc", "p:sp"].includes(name),
  });

  const items: ParsedMenuItem[] = [];
  let weekLabel: string | null = null;

  // Process first slide (menu is always on slide 1)
  const slideXml = await zip.files[slideFiles[0]].async("string");
  const parsed = parser.parse(slideXml);

  // Extract all text shapes for week label
  const spTree =
    parsed?.["p:sld"]?.["p:cSld"]?.["p:spTree"];

  if (spTree) {
    const shapes = spTree["p:sp"] ?? [];
    for (const sp of shapes) {
      const txBody = sp?.["p:txBody"];
      const texts = getParagraphTexts(txBody);
      for (const t of texts) {
        // Look for "Week commencing: DD Month YYYY" pattern
        const match = t.match(/week commencing[:\s]+(.+)/i);
        if (match) {
          weekLabel = match[1].trim();
          break;
        }
      }
    }

    // Find table (graphicFrame > a:tbl)
    const graphicFrames = spTree["p:graphicFrame"];
    const frames = Array.isArray(graphicFrames)
      ? graphicFrames
      : graphicFrames
      ? [graphicFrames]
      : [];

    for (const frame of frames) {
      const tbl =
        frame?.["a:graphic"]?.["a:graphicData"]?.["a:tbl"];
      if (!tbl) continue;

      const rows = parseTable(tbl as Record<string, unknown>);
      if (rows.length < 2) continue;

      // Row 0 = headers: skip (Mon, Tue, Wed, Thu, Fri)
      const headerRow = rows[0].map((h) => h.toLowerCase());
      const dayColumns: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
      };

      // Map column index → dayOfWeek
      const colToDow: (number | null)[] = headerRow.map(
        (h) => dayColumns[h.trim()] ?? null
      );

      // Remaining rows = menu item categories (main, sides, kimchi, soup…)
      for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const displayOrder = rowIdx - 1;

        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          const dow = colToDow[colIdx];
          if (!dow) continue;

          const cellText = row[colIdx].trim();
          if (!cellText) continue;

          // Split Korean name and English description on newline
          const lines = cellText.split("\n").map((l) => l.trim()).filter(Boolean);
          const name = lines[0] ?? cellText;
          const description = lines.slice(1).join(" ").trim();

          items.push({ dayOfWeek: dow, name, description, displayOrder });
        }
      }

      break; // Only process the first table
    }
  }

  if (items.length === 0) {
    throw new Error(
      "No menu items found. Make sure the PPTX contains a table with Monday–Friday columns."
    );
  }

  return { items, weekLabel };
}
