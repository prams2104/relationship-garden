import type { RelationshipTier } from "@/types/garden";

/**
 * Parsed row from a LinkedIn Connections CSV export.
 *
 * LinkedIn's format:
 *   First Name, Last Name, URL, Email Address, Company, Position, Connected On
 *
 * We also support a generic CSV with columns:
 *   name (or first_name + last_name), email, company, title/position, phone
 */
export interface ParsedContact {
  name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  connectedOn: string | null;
  suggestedTier: RelationshipTier;
}

/**
 * Parse CSV text into rows. Handles quoted fields with commas and newlines.
 */
function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote (double quote)
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
          i++; // skip \r\n
        }
        row.push(current.trim());
        if (row.some((cell) => cell.length > 0)) {
          rows.push(row);
        }
        row = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }

  // Final row
  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

/**
 * Normalize a header name to a canonical key.
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

/**
 * Guess tier from company/title heuristics.
 * Professional connections default to bonsai; if no company, fern.
 */
function guessTier(company: string | null, title: string | null): RelationshipTier {
  if (!company && !title) return "fern";
  return "bonsai";
}

/**
 * Parse a date string like "15 Jan 2024" or "2024-01-15" into ISO.
 */
function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Parse LinkedIn Connections CSV (or generic contact CSV) into structured data.
 */
export function parseContactsCSV(csvText: string): {
  contacts: ParsedContact[];
  headers: string[];
  totalRows: number;
  skipped: number;
} {
  const rows = parseCSVText(csvText);

  if (rows.length < 2) {
    return { contacts: [], headers: [], totalRows: 0, skipped: 0 };
  }

  const rawHeaders = rows[0];
  const headers = rawHeaders.map(normalizeHeader);

  // Build a column index map
  const col = (keys: string[]): number => {
    for (const k of keys) {
      const idx = headers.indexOf(k);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // LinkedIn format
  const iFirstName = col(["first_name"]);
  const iLastName = col(["last_name"]);
  // Generic format
  const iName = col(["name", "full_name", "contact_name"]);
  const iEmail = col(["email_address", "email", "e_mail"]);
  const iCompany = col(["company", "organization", "employer"]);
  const iTitle = col(["position", "title", "job_title"]);
  const iPhone = col(["phone", "phone_number", "mobile"]);
  const iUrl = col(["url", "linkedin_url", "profile_url"]);
  const iConnected = col(["connected_on", "connected", "date_connected", "date"]);

  const contacts: ParsedContact[] = [];
  let skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];

    // Build name
    let name = "";
    if (iName !== -1 && row[iName]) {
      name = row[iName];
    } else if (iFirstName !== -1) {
      const first = row[iFirstName] ?? "";
      const last = iLastName !== -1 ? (row[iLastName] ?? "") : "";
      name = `${first} ${last}`.trim();
    }

    if (!name) {
      skipped++;
      continue;
    }

    const email = iEmail !== -1 ? row[iEmail] || null : null;
    const company = iCompany !== -1 ? row[iCompany] || null : null;
    const title = iTitle !== -1 ? row[iTitle] || null : null;
    const phone = iPhone !== -1 ? row[iPhone] || null : null;
    const linkedinUrl = iUrl !== -1 ? row[iUrl] || null : null;
    const connectedOn = iConnected !== -1 ? parseDate(row[iConnected]) : null;

    contacts.push({
      name,
      email,
      company,
      title,
      phone,
      linkedinUrl,
      connectedOn,
      suggestedTier: guessTier(company, title),
    });
  }

  return {
    contacts,
    headers: rawHeaders,
    totalRows: rows.length - 1,
    skipped,
  };
}
