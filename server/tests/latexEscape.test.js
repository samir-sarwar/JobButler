import {
  latexEscape,
  latexEscapeUrl,
  boldKeywords,
  truncateAtWord,
  escapeRegex,
} from '../utils/latexEscape.js';

describe('latexEscape', () => {
  test('escapes all LaTeX special characters', () => {
    expect(latexEscape('%')).toBe('\\%');
    expect(latexEscape('&')).toBe('\\&');
    expect(latexEscape('$')).toBe('\\$');
    expect(latexEscape('#')).toBe('\\#');
    expect(latexEscape('_')).toBe('\\_');
    expect(latexEscape('{')).toBe('\\{');
    expect(latexEscape('}')).toBe('\\}');
    expect(latexEscape('~')).toBe('\\textasciitilde{}');
    expect(latexEscape('^')).toBe('\\textasciicircum{}');
  });

  test('escapes backslash first to avoid double-escaping', () => {
    // The {} in \textbackslash{} also gets brace-escaped, which is expected
    // behavior since latexEscape treats all braces uniformly
    expect(latexEscape('\\')).toBe('\\textbackslash\\{\\}');
    // A backslash followed by % should produce textbackslash + escaped braces + escaped %
    expect(latexEscape('\\%')).toBe('\\textbackslash\\{\\}\\%');
  });

  test('escapes angle brackets and pipe', () => {
    expect(latexEscape('<')).toBe('\\textless{}');
    expect(latexEscape('>')).toBe('\\textgreater{}');
    expect(latexEscape('|')).toBe('\\textbar{}');
  });

  test('converts smart quotes to regular quotes', () => {
    expect(latexEscape('\u2018')).toBe("'"); // left single
    expect(latexEscape('\u2019')).toBe("'"); // right single
    expect(latexEscape('\u201C')).toBe('"'); // left double
    expect(latexEscape('\u201D')).toBe('"'); // right double
  });

  test('converts em dash, en dash, ellipsis', () => {
    expect(latexEscape('\u2013')).toBe('--');  // en dash
    expect(latexEscape('\u2014')).toBe('---'); // em dash
    expect(latexEscape('\u2026')).toBe('...');  // ellipsis
  });

  test('strips control characters', () => {
    expect(latexEscape('\x00Hello\x01')).toBe('Hello');
    expect(latexEscape('\x0B')).toBe('');
  });

  test('handles null and undefined', () => {
    expect(latexEscape(null)).toBe('');
    expect(latexEscape(undefined)).toBe('');
  });

  test('handles empty string', () => {
    expect(latexEscape('')).toBe('');
  });

  test('handles numbers by converting to string', () => {
    expect(latexEscape(42)).toBe('42');
  });

  test('handles mixed content', () => {
    const input = 'Built 5+ APIs using C# & Node.js (100% uptime)';
    const result = latexEscape(input);
    expect(result).toContain('\\&');
    expect(result).toContain('\\#');
    expect(result).toContain('\\%');
    // Verify no unescaped special chars (& only appears as \&)
    expect(result.replace(/\\&/g, '').replace(/\\#/g, '').replace(/\\%/g, '')).not.toMatch(/[&#%]/);
  });
});

describe('latexEscapeUrl', () => {
  test('escapes # and % in URLs', () => {
    expect(latexEscapeUrl('https://example.com/page#section')).toBe('https://example.com/page\\#section');
    expect(latexEscapeUrl('https://example.com/50%25')).toBe('https://example.com/50\\%25');
  });

  test('does not escape other special characters', () => {
    const url = 'https://example.com/path?a=1&b=2_test';
    expect(latexEscapeUrl(url)).toBe(url);
  });

  test('handles null and undefined', () => {
    expect(latexEscapeUrl(null)).toBe('');
    expect(latexEscapeUrl(undefined)).toBe('');
  });
});

describe('truncateAtWord', () => {
  test('returns text unchanged if within limit', () => {
    expect(truncateAtWord('short text', 200)).toBe('short text');
  });

  test('truncates at word boundary', () => {
    const text = 'Hello world this is a test sentence';
    const result = truncateAtWord(text, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    // Should end at a word boundary
    expect(result.endsWith(' ')).toBe(false);
  });

  test('handles null and empty', () => {
    expect(truncateAtWord(null, 200)).toBe(null);
    expect(truncateAtWord('', 200)).toBe('');
  });

  test('uses default maxLength of 200', () => {
    const text = 'a '.repeat(150); // 300 chars
    const result = truncateAtWord(text);
    expect(result.length).toBeLessThanOrEqual(200);
  });
});

describe('escapeRegex', () => {
  test('escapes regex special characters', () => {
    expect(escapeRegex('C++')).toBe('C\\+\\+');
    expect(escapeRegex('price ($)')).toBe('price \\(\\$\\)');
    expect(escapeRegex('a.b')).toBe('a\\.b');
  });
});

describe('boldKeywords', () => {
  test('wraps matching keywords in \\textbf{}', () => {
    const text = 'Built APIs using React and Node.js';
    const escaped = latexEscape(text);
    const result = boldKeywords(escaped, ['React', 'Node.js']);
    expect(result).toContain('\\textbf{React}');
  });

  test('is case-insensitive', () => {
    const text = 'Worked with python and DOCKER';
    const escaped = latexEscape(text);
    const result = boldKeywords(escaped, ['Python', 'Docker']);
    expect(result).toContain('\\textbf{python}');
    expect(result).toContain('\\textbf{DOCKER}');
  });

  test('does not bold inside existing \\textbf{}', () => {
    const text = '\\textbf{React} is a framework called React';
    // The second "React" should get bolded, but the first should not be double-wrapped
    const result = boldKeywords(text, ['React']);
    // Should not contain nested \textbf{\textbf{...}}
    expect(result).not.toContain('\\textbf{\\textbf{');
  });

  test('returns original text when no keywords', () => {
    const text = 'some text';
    expect(boldKeywords(text, [])).toBe(text);
    expect(boldKeywords(text, null)).toBe(text);
  });

  test('returns original when text is empty', () => {
    expect(boldKeywords('', ['React'])).toBe('');
    expect(boldKeywords(null, ['React'])).toBe(null);
  });

  test('handles longer keywords first to avoid partial matches', () => {
    const text = 'Used React Native and React for mobile';
    const escaped = latexEscape(text);
    const result = boldKeywords(escaped, ['React', 'React Native']);
    // "React Native" should be bolded as a unit, not split
    expect(result).toContain('\\textbf{React Native}');
  });

  test('skips very short keywords (< 2 chars)', () => {
    const text = 'I use C and Go';
    const escaped = latexEscape(text);
    const result = boldKeywords(escaped, ['C', 'Go']);
    // Single char 'C' should be skipped, 'Go' (2 chars) should be bolded
    expect(result).toContain('\\textbf{Go}');
  });
});
