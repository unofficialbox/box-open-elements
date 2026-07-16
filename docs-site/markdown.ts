/**
 * Minimal, dependency-free markdown → HTML for foundation docs (trusted,
 * repo-owned content). Handles headings, lists, GFM tables, code fences,
 * inline code/bold/links, rules, and paragraphs.
 */

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const inline = (text: string): string =>
  escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, label, url) =>
        `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>`,
    );

const isTableSeparator = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  // | --- | --- |  or  |---|---|  (optional leading/trailing pipes)
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(c => c.trim());
  return cells.length > 0 && cells.every(c => /^:?-{3,}:?$/.test(c));
};

const isTableRow = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.includes("|") && !isTableSeparator(trimmed);
};

const splitCells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(c => c.trim());

const renderTable = (rows: string[]): string => {
  if (rows.length < 2) return rows.map(r => `<p>${inline(r.trim())}</p>`).join("\n");
  const [headerLine, separatorLine, ...bodyLines] = rows;
  if (!isTableSeparator(separatorLine)) {
    return rows.map(r => `<p>${inline(r.trim())}</p>`).join("\n");
  }
  const headers = splitCells(headerLine);
  const body = bodyLines.filter(isTableRow).map(splitCells);
  const thead = `<thead><tr>${headers.map(h => `<th>${inline(h)}</th>`).join("")}</tr></thead>`;
  const tbody =
    body.length === 0
      ? ""
      : `<tbody>${body
          .map(cells => `<tr>${cells.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody>`;
  return `<table class="md-table">${thead}${tbody}</table>`;
};

export const renderMarkdown = (md: string): string => {
  const out: string[] = [];
  let inList = false;
  let inCode = false;
  let code: string[] = [];
  let tableBuf: string[] = [];

  const closeList = (): void => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  const flushTable = (): void => {
    if (tableBuf.length) {
      out.push(renderTable(tableBuf));
      tableBuf = [];
    }
  };

  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        out.push(`<pre class="code-block"><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushTable();
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushTable();
      closeList();
      continue;
    }

    // Collect contiguous table rows (header + separator + body).
    if (isTableRow(line) || (tableBuf.length > 0 && isTableSeparator(line))) {
      closeList();
      tableBuf.push(line);
      continue;
    }

    flushTable();

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    if (line.trim() === "---") {
      closeList();
      out.push("<hr />");
      continue;
    }
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line.trim())}</p>`);
  }

  flushTable();
  closeList();
  if (inCode) out.push(`<pre class="code-block"><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return out.join("\n");
};
