import https from "node:https";

/**
 * Fetch AED CSV from MOHW with SSL verification disabled.
 * MOHW's server has a broken SSL certificate as of 2026-03.
 * Uses node:https directly so rejectUnauthorized only applies to this request.
 */
export function fetchAedCsv(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { rejectUnauthorized: false }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`AED CSV fetch error: ${response.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf-8")),
        );
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

// Parse CSV text respecting BOM and quoted fields
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Handle BOM
  const headerLine = lines[0].replace(/^\uFEFF/, "");

  // Parse CSV respecting quoted fields
  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  };

  const headers = parseRow(headerLine).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length !== headers.length) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j].trim();
    }
    rows.push(row);
  }

  return rows;
}
