/**
 * Aerodyne Fleet OS — M&E Numbering Standard (shared engine)
 *
 * Master format:  [ATA]-[Sub-Group]-[Class Code]-[Sequence]
 *   e.g. 72-000-9-0001
 *
 * Parallel schemes:
 *   Tooling:       TL-[ATA]-[Class]-[Sequence]            e.g. TL-72-7-0001
 *   Documents:    [DocType]-[ATA]-[Sequence]-Rev N        e.g. EO-72-0045-Rev 2
 *   Traceability:  DOC-[CAT]-[ATA]-[Sequence]-[Type]-Rev N e.g. DOC-ENG-72-0001-8130-Rev 1
 *   Work Order:    WO-[Tail]-[Date]-[ATA]-[Sequence]       e.g. WO-N12345-20260716-72-0012
 *   History:      HIS-[ATA]-[Class]-[Sequence]-[Event]     e.g. HIS-72-9-0001-INSTALL
 *   Scrap/BER:     SCR-[ATA]-[Class]-[Sequence]-[Reason]   e.g. SCR-32-9-0022-BER
 *   Pool:          POOL-[ATA]-[Class]-[Sequence]-[Location] e.g. POOL-72-9-0001-EWR
 *
 * Class codes (middle digit for parts, applies to many schemes):
 *   9 = Major Rotable   (serialized, high-value, pool-managed)
 *   7 = Minor Rotable    (serialized, lower-value)
 *   5 = Repairable       (non-serialized but repairable)
 *   3 = Expendable       (consumable, non-serialized)
 *   1 = Raw Material     (sheet metal, fluids, chemicals)
 */

export const CLASS_CODES: Record<string, string> = {
  9: "Major Rotable",
  7: "Minor Rotable",
  5: "Repairable",
  3: "Expendable",
  1: "Raw Material",
};

export const ATA_CHAPTERS: Array<{ code: string; name: string }> = [
  { code: "21", name: "Air Conditioning" },
  { code: "22", name: "Auto Flight" },
  { code: "23", name: "Communications" },
  { code: "24", name: "Electrical" },
  { code: "25", name: "Equipment / Cabin" },
  { code: "26", name: "Fire Protection" },
  { code: "27", name: "Flight Controls" },
  { code: "28", name: "Fuel" },
  { code: "29", name: "Hydraulics" },
  { code: "30", name: "Ice & Rain Protection" },
  { code: "31", name: "Indicating / Recording" },
  { code: "32", name: "Landing Gear" },
  { code: "33", name: "Lights" },
  { code: "34", name: "Navigation" },
  { code: "35", name: "Oxygen" },
  { code: "36", name: "Pneumatics" },
  { code: "38", name: "Water / Waste" },
  { code: "49", name: "APU" },
  { code: "52", name: "Doors" },
  { code: "56", name: "Windows" },
  { code: "57", name: "Wings" },
  { code: "71", name: "Power Plant" },
  { code: "72", name: "Engine" },
  { code: "73", name: "Engine Fuel & Control" },
  { code: "74", name: "Ignition" },
  { code: "75", name: "Engine Air" },
  { code: "76", name: "Engine Controls" },
  { code: "77", name: "Engine Indicating" },
  { code: "78", name: "Exhaust" },
  { code: "79", name: "Engine Oil" },
  { code: "80", name: "Starting" },
];

// Sub-group examples (3-digit). Spec defines examples for a few ATA chapters.
export const SUB_GROUPS_BY_ATA: Record<string, Array<{ code: string; name: string }>> = {
  "72": [
    { code: "000", name: "Whole engine" },
    { code: "110", name: "Fan" },
    { code: "210", name: "Compressor" },
    { code: "310", name: "Combustion" },
    { code: "410", name: "HPT" },
    { code: "510", name: "LPT" },
    { code: "600", name: "Gearbox" },
    { code: "700", name: "Controls" },
  ],
  "32": [
    { code: "000", name: "Assembly" },
    { code: "110", name: "Nose gear" },
    { code: "210", name: "Main gear" },
    { code: "310", name: "Brakes" },
    { code: "410", name: "Steering" },
  ],
  "27": [
    { code: "000", name: "PCU assembly" },
    { code: "310", name: "Flap track / rollers" },
    { code: "510", name: "Elevator servo" },
  ],
  "49": [
    { code: "000", name: "APU assembly" },
    { code: "210", name: "Starter motor" },
    { code: "310", name: "Oil filter" },
  ],
};

export const DOC_TYPES: Array<{ code: string; name: string }> = [
  { code: "EO", name: "Engineering Order" },
  { code: "MMP", name: "Maintenance Manual Procedure" },
  { code: "FRM", name: "Form" },
  { code: "TSI", name: "Technical Service Instruction" },
  { code: "SB", name: "Service Bulletin" },
  { code: "AD", name: "Airworthiness Directive" },
  { code: "MEL", name: "MEL Item" },
  { code: "CDL", name: "CDL Item" },
];

export const TRACE_CATEGORIES: Array<{ code: string; name: string }> = [
  { code: "ENG", name: "Engineering" },
  { code: "CMP", name: "Component" },
];

export const TRACE_TYPES = ["8130", "SR", "MOD"];

export const HISTORY_EVENTS = ["INSTALL", "REMOVE", "SHOPVISIT", "INSPECT", "TEST"];

export const SCRAP_REASONS = ["BER", "DAMAGED", "WORN", "OBSOLETE"];

export type NumberType =
  | "me_part"
  | "tooling"
  | "document"
  | "work_order"
  | "history"
  | "scrap"
  | "pool"
  | "traceability";

export interface IssueRequest {
  number_type: NumberType;
  ata?: string;
  sub?: string;
  class_code?: string;
  doc_type?: string;
  category?: string;
  trace_type?: string;
  tail?: string;
  work_date?: string; // YYYYMMDD
  reason?: string;
  event?: string;
  location?: string;
  rev?: number;
}

export function padSeq(n: number): string {
  return String(n).padStart(4, "0");
}

export function normalizeAta(ata?: string): string {
  if (!ata) return "";
  return String(ata).padStart(2, "0").slice(-2);
}

export function normalizeSub(sub?: string): string {
  if (!sub) return "000";
  return String(sub).padStart(3, "0").slice(-3);
}

export function normalizeClass(cls?: string): string {
  const c = String(cls ?? "");
  return c.length === 1 ? c : "";
}

/** Build the canonical counter key for an issue request. */
export function buildCounterKey(req: IssueRequest): string {
  switch (req.number_type) {
    case "me_part":
      return ["PART", normalizeAta(req.ata), normalizeSub(req.sub), normalizeClass(req.class_code)].join("|");
    case "tooling":
      return ["TOOL", normalizeAta(req.ata), normalizeClass(req.class_code)].join("|");
    case "document":
      return ["DOC", req.doc_type || "FRM", normalizeAta(req.ata)].join("|");
    case "traceability":
      return ["TRACE", req.category || "CMP", normalizeAta(req.ata), req.trace_type || ""].join("|");
    case "work_order":
      return [
        "WO",
        req.tail || "UNKNOWN",
        req.work_date || "00000000",
        normalizeAta(req.ata),
      ].join("|");
    case "history":
      return ["HIS", normalizeAta(req.ata), normalizeClass(req.class_code), req.event || ""].join("|");
    case "scrap":
      return ["SCR", normalizeAta(req.ata), normalizeClass(req.class_code), req.reason || ""].join("|");
    case "pool":
      return ["POOL", normalizeAta(req.ata), normalizeClass(req.class_code), req.location || ""].join("|");
    default:
      return "PART|UNKNOWN";
  }
}

/** Build the formatted M&E number from an issue request plus the allocated seq. */
export function buildNumber(req: IssueRequest, seq: number): string {
  const s = padSeq(seq);
  switch (req.number_type) {
    case "me_part":
      return [normalizeAta(req.ata), normalizeSub(req.sub), normalizeClass(req.class_code), s].join("-");
    case "tooling":
      return ["TL", normalizeAta(req.ata), normalizeClass(req.class_code), s].join("-");
    case "document": {
      const rev = req.rev != null ? `-Rev ${req.rev}` : "";
      return [req.doc_type || "FRM", normalizeAta(req.ata), s].join("-") + rev;
    }
    case "traceability": {
      const rev = req.rev != null ? `-Rev ${req.rev}` : "";
      return [
        "DOC",
        req.category || "CMP",
        normalizeAta(req.ata),
        s,
        req.trace_type || "8130",
      ].join("-") + rev;
    }
    case "work_order":
      return [
        "WO",
        req.tail || "UNKNOWN",
        req.work_date || "00000000",
        normalizeAta(req.ata),
        String(seq).padStart(4, "0"),
      ].join("-");
    case "history":
      return ["HIS", normalizeAta(req.ata), normalizeClass(req.class_code), s, req.event || "EVENT"].join("-");
    case "scrap":
      return ["SCR", normalizeAta(req.ata), normalizeClass(req.class_code), s, req.reason || "REASON"].join("-");
    case "pool":
      return ["POOL", normalizeAta(req.ata), normalizeClass(req.class_code), s, req.location || "UNK"].join("-");
    default:
      return s;
  }
}

/** Human-readable description for a counter context. */
export function describeCounter(req: IssueRequest): string {
  const ataName = ATA_CHAPTERS.find((a) => a.code === normalizeAta(req.ata))?.name || normalizeAta(req.ata);
  switch (req.number_type) {
    case "me_part": {
      const cls = CLASS_CODES[req.class_code || ""] || `Class ${req.class_code}`;
      return `Part · ATA ${normalizeAta(req.ata)} (${ataName}) · ${normalizeSub(req.sub)} · ${cls}`;
    }
    case "tooling": {
      const t = ATA_CHAPTERS.find((a) => a.code === normalizeAta(req.ata))?.name || "";
      return `Tooling · ATA ${normalizeAta(req.ata)}${t ? ` (${t})` : ""} · Class ${req.class_code}`;
    }
    case "document": {
      const dt = DOC_TYPES.find((d) => d.code === req.doc_type)?.name || req.doc_type;
      return `Document · ${dt} · ATA ${normalizeAta(req.ata)} (${ataName})`;
    }
    case "traceability": {
      const cat = TRACE_CATEGORIES.find((c) => c.code === req.category)?.name || req.category;
      return `Traceability · ${cat} · ATA ${normalizeAta(req.ata)} · ${req.trace_type || "8130"}`;
    }
    case "work_order":
      return `Work Order · ${req.tail || "UNKNOWN"} · ${req.work_date || ""} · ATA ${normalizeAta(req.ata)}`;
    case "history":
      return `Component History · ATA ${normalizeAta(req.ata)} · Class ${req.class_code} · ${req.event}`;
    case "scrap":
      return `Scrap / BER · ATA ${normalizeAta(req.ata)} · Class ${req.class_code} · ${req.reason}`;
    case "pool":
      return `Pool · ATA ${normalizeAta(req.ata)} · Class ${req.class_code} · ${req.location}`;
    default:
      return "Unknown context";
  }
}

/** Parse a parts-format number (72-000-9-0001) into its blocks. */
export function parsePartNumber(input: string): {
  ata: string;
  sub: string;
  cls: string;
  seq: string;
  valid: boolean;
} {
  const m = /^(\d{2})-(\d{3})-([1-9])-(\d{4})$/.exec(input.trim());
  return {
    ata: m ? m[1] : "",
    sub: m ? m[2] : "",
    cls: m ? m[3] : "",
    seq: m ? m[4] : "",
    valid: !!m,
  };
}

export function isValidClassCode(cls?: string): boolean {
  return !!cls && ["9", "7", "5", "3", "1"].includes(String(cls));
}

export function isValidAta(ata?: string): boolean {
  const a = normalizeAta(ata);
  return ATA_CHAPTERS.some((x) => x.code === a);
}

/** Generic validator — best-effort structure check for any scheme. */
export function validateNumber(input: string): { scheme: string; valid: boolean; label: string } {
  const v = input.trim().toUpperCase();
  const checks: Array<{ re: RegExp; scheme: string; label: string }> = [
    { re: /^\d{2}-\d{3}-[1-9]-\d{4}$/, scheme: "me_part", label: "M&E Part Number" },
    { re: /^TL-\d{2}-[1-9]-\d{4}$/, scheme: "tooling", label: "Tooling Number" },
    { re: /^(EO|MMP|FRM|TSI|SB|AD|MEL|CDL)-\d{2}-\d{4}(-REV\s*\d+)?$/, scheme: "document", label: "Document Number" },
    { re: /^DOC-(ENG|CMP)-\d{2}-\d{4}-(8130|SR|MOD)(-REV\s*\d+)?$/, scheme: "traceability", label: "Traceability Document" },
    { re: /^WO-[A-Z0-9]+-\d{8}-\d{2}-\d{4}$/, scheme: "work_order", label: "Work Order Number" },
    { re: /^HIS-\d{2}-[1-9]-\d{4}-(INSTALL|REMOVE|SHOPVISIT|INSPECT|TEST)$/, scheme: "history", label: "Component History Record" },
    { re: /^SCR-\d{2}-[1-9]-\d{4}-(BER|DAMAGED|WORN|OBSOLETE)$/, scheme: "scrap", label: "Scrap / BER Code" },
    { re: /^POOL-\d{2}-[1-9]-\d{4}-[A-Z]{3}$/, scheme: "pool", label: "Pool Management Code" },
  ];
  for (const c of checks) {
    if (c.re.test(v)) return { scheme: c.scheme, valid: true, label: c.label };
  }
  return { scheme: "unknown", valid: false, label: "Unrecognized format" };
}