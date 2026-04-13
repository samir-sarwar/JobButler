/**
 * Escape special LaTeX characters in a string.
 * Must be applied to ALL user-generated content before insertion into LaTeX.
 *
 * @param {string} input - Raw user-generated string
 * @returns {string} - LaTeX-safe string
 */
export function latexEscape(input) {
  if (input == null) return '';

  return String(input)
    // Typographic Unicode → ASCII equivalents. Run BEFORE the LaTeX special-char
    // escaping so substitutions don't interfere, and BEFORE the ASCII-only safety
    // net at the end so known chars are preserved.
    .replace(/[‘’]/g, "'") // Smart single quotes
    .replace(/[“”]/g, '"') // Smart double quotes
    .replace(/–/g, '--') // En dash
    .replace(/—/g, '---') // Em dash
    .replace(/…/g, '...') // Ellipsis
    .replace(/[‐‑‒]/g, '-') // Hyphen, non-breaking hyphen, figure dash
    .replace(/[    ]/g, ' ') // NBSP, thin/hair/narrow-no-break space
    .replace(/[­​‌‍﻿]/g, '') // Soft hyphen, zero-width chars, BOM
    // LaTeX special chars — backslash first to avoid double-escaping.
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/%/g, '\\%')
    .replace(/&/g, '\\&')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}')
    .replace(/\|/g, '\\textbar{}')
    // Safety net: drop everything outside printable ASCII + tab/newline.
    // pdflatex's preamble has no inputenc — any leftover non-ASCII char would
    // fail compilation. This also covers the control-char range.
    .replace(/[^\x09\x0A\x20-\x7E]/g, '');
}

/**
 * Escape special characters in URLs for use in LaTeX \href{} command.
 * # and % must be escaped: # starts a LaTeX parameter reference, and
 * % starts a LaTeX comment at the lexer level (before hyperref processes it).
 * Other special chars like _ & are valid in URLs and handled by hyperref package.
 *
 * @param {string} url - Raw URL string
 * @returns {string} - LaTeX-safe URL for \href{}
 */
export function latexEscapeUrl(url) {
  if (url == null) return '';

  return String(url)
    .replace(/#/g, '\\#')
    .replace(/%/g, '\\%');
}

/**
 * Truncate text at word boundary before maxLength
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateAtWord(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text;

  // Find last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace);
  }

  return truncated;
}

/**
 * Escape special regex characters in a string
 * @param {string} str - Raw string
 * @returns {string} - Regex-safe string
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a given offset in `text` falls inside an existing \textbf{...} block.
 * Scans for \textbf{ markers before the offset and checks brace depth.
 */
function isInsideBold(text, offset) {
  const marker = '\\textbf{';
  let searchFrom = 0;

  while (true) {
    const idx = text.indexOf(marker, searchFrom);
    if (idx === -1 || idx >= offset) break;

    // Find the matching close brace for this \textbf{
    const braceStart = idx + marker.length - 1; // index of the '{'
    let depth = 1;
    let closeIdx = -1;

    for (let j = braceStart + 1; j < text.length; j++) {
      if (text[j] === '{') depth++;
      if (text[j] === '}') depth--;
      if (depth === 0) {
        closeIdx = j;
        break;
      }
    }

    // If offset is between the opening { and closing }, it's inside bold
    if (offset > braceStart && (closeIdx === -1 || offset < closeIdx)) {
      return true;
    }

    searchFrom = idx + marker.length;
  }

  return false;
}

/**
 * Bold keywords from the job description within already-escaped LaTeX text.
 * Wraps matching terms in \textbf{}.
 *
 * @param {string} escapedText - Text already passed through latexEscape()
 * @param {string[]} keywords - Raw (unescaped) keywords to bold
 * @returns {string} - Text with matching keywords wrapped in \textbf{}
 */
export function boldKeywords(escapedText, keywords) {
  if (!escapedText || !keywords || keywords.length === 0) return escapedText;

  // Escape each keyword through latexEscape so it matches the already-escaped text,
  // then sort longest-first to prevent partial matches (e.g. "React Native" before "React")
  const entries = keywords
    .filter(k => k && k.length >= 2)
    .map(k => ({ raw: k, escaped: latexEscape(k) }))
    .sort((a, b) => b.escaped.length - a.escaped.length);

  let result = escapedText;

  for (const { escaped } of entries) {
    // Build a case-insensitive regex with loose word boundaries
    // Use (?:^|[\s,;:()/]) instead of \b because \b fails on LaTeX escape sequences
    const pattern = new RegExp(
      `(?<=[\\s,;:()/<>]|^)${escapeRegex(escaped)}(?=[\\s,;:()/<>.,!?]|$)`,
      'gi'
    );

    result = result.replace(pattern, (match, offset) => {
      // Check against the current string state to avoid nesting \textbf{}
      if (isInsideBold(result, offset)) return match;
      return `\\textbf{${match}}`;
    });
  }

  return result;
}

export default latexEscape;
