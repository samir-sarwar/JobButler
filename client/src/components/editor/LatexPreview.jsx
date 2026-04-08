import { useMemo } from 'react';

/**
 * Parse LaTeX resume source into structured sections for HTML preview.
 * Extracts data from the Jake's Resume template commands.
 */
function parseLatex(latex) {
  if (!latex) return null;

  const result = {
    name: '',
    contactLine: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
  };

  // Extract the heading block first to avoid matching \small from the preamble
  const headingBlock = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  if (headingBlock) {
    const heading = headingBlock[1];

    // Extract name from \textbf{\Huge \scshape Name}
    const nameMatch = heading.match(/\\textbf\{\\Huge\s*\\scshape\s+([^}]+)\}/);
    if (nameMatch) {
      result.name = cleanLatex(nameMatch[1]);
    }

    // Extract contact line — everything after \small within the heading block
    const contactMatch = heading.match(/\\small\s+([\s\S]*)/);
    if (contactMatch) {
      let contact = contactMatch[1];
      // Extract href display text
      contact = contact.replace(/\\href\{([^}]*(?:\\.[^}]*)*)\}\{\\underline\{([^}]*(?:\\.[^}]*)*)\}\}/g, '$2');
      contact = contact.replace(/\$\|\$/g, ' | ');
      result.contactLine = cleanLatex(contact).trim();
    }
  }

  // Extract education entries
  const eduSection = extractSection(latex, 'Education');
  if (eduSection) {
    result.education = parseSubheadings(eduSection);
  }

  // Extract experience entries
  const expSection = extractSection(latex, 'Experience');
  if (expSection) {
    result.experience = parseSubheadings(expSection);
  }

  // Extract project entries
  const projSection = extractSection(latex, 'Projects');
  if (projSection) {
    result.projects = parseProjectHeadings(projSection);
  }

  // Extract skills
  const skillsSection = extractSection(latex, 'Technical Skills');
  if (skillsSection) {
    result.skills = parseSkills(skillsSection);
  }

  return result;
}

function extractSection(latex, sectionName) {
  // Match \section{Name} ... until next \section or \end{document}
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\\\section\\{${escaped}\\}([\\s\\S]*?)(?=\\\\section\\{|\\\\end\\{document\\}|%---+\\s*\\\\end)`,
    'i'
  );
  const match = latex.match(regex);
  return match ? match[1] : null;
}

function parseSubheadings(section) {
  const entries = [];
  const parts = section.split(/\\resumeSubheading\b/);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    // Extract 4 arguments: {title}{date}{subtitle}{location}
    const args = extractBraceArgs(part, 4);
    if (args.length >= 4) {
      const bullets = extractBullets(part);
      entries.push({
        title: cleanLatex(args[0]),
        date: cleanLatex(args[1]),
        subtitle: cleanLatex(args[2]),
        location: cleanLatex(args[3]),
        bullets,
      });
    }
  }

  return entries;
}

function parseProjectHeadings(section) {
  const entries = [];
  const parts = section.split(/\\resumeProjectHeading\b/);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const args = extractBraceArgs(part, 2);
    if (args.length >= 2) {
      // First arg contains \textbf{title} $|$ \emph{tags}
      let titleRaw = args[0];
      let title = '';
      let tags = '';

      const boldMatch = titleRaw.match(/\\textbf\{([^}]*)\}/);
      if (boldMatch) title = cleanLatex(boldMatch[1]);

      const emMatch = titleRaw.match(/\\emph\{([^}]*)\}/);
      if (emMatch) tags = cleanLatex(emMatch[1]);

      const bullets = extractBullets(part);
      entries.push({
        title,
        tags,
        date: cleanLatex(args[1]),
        bullets,
      });
    }
  }

  return entries;
}

function parseSkills(section) {
  const skills = [];
  // Match \textbf{Category}: values \\
  const regex = /\\textbf\{([^}]*)\}\s*:\s*([^\\]*)/g;
  let match;
  while ((match = regex.exec(section)) !== null) {
    skills.push({
      category: cleanLatex(match[1]),
      values: cleanLatex(match[2]).trim(),
    });
  }

  // Also catch plain lines without \textbf
  if (skills.length === 0) {
    const lines = section.split('\\\\').map(l => cleanLatex(l).trim()).filter(Boolean);
    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        skills.push({
          category: line.substring(0, colonIdx).trim(),
          values: line.substring(colonIdx + 1).trim(),
        });
      }
    });
  }

  return skills;
}

/**
 * Find the index of the closing '}' that matches the opening '{' at `start`.
 * Respects escaped braces (\{ and \}).
 * Returns -1 if no matching brace is found.
 */
function findMatchingBrace(text, start) {
  let depth = 0;
  for (let j = start; j < text.length; j++) {
    if (text[j] === '{' && text[j - 1] !== '\\') depth++;
    if (text[j] === '}' && text[j - 1] !== '\\') depth--;
    if (depth === 0) return j;
  }
  return -1;
}

function extractBullets(text) {
  const bullets = [];
  const marker = '\\resumeItem';
  let searchPos = 0;

  while (true) {
    const idx = text.indexOf(marker, searchPos);
    if (idx === -1) break;

    const braceStart = text.indexOf('{', idx + marker.length);
    if (braceStart === -1) break;

    const braceEnd = findMatchingBrace(text, braceStart);
    if (braceEnd === -1) break;

    const content = text.substring(braceStart + 1, braceEnd);
    const html = latexToHtml(content).trim();
    if (html) bullets.push(html);

    searchPos = braceEnd + 1;
  }

  return bullets;
}

function extractBraceArgs(text, count) {
  const args = [];
  let pos = 0;

  for (let i = 0; i < count; i++) {
    // Find next unescaped opening brace
    let start = -1;
    for (let s = pos; s < text.length; s++) {
      if (text[s] === '{' && text[s - 1] !== '\\') {
        start = s;
        break;
      }
    }
    if (start === -1) break;

    const end = findMatchingBrace(text, start);
    if (end === -1) break;

    args.push(text.substring(start + 1, end));
    pos = end + 1;
  }

  return args;
}

/**
 * Convert LaTeX formatting to HTML for rich-text preview.
 * Unlike cleanLatex() which strips formatting, this preserves bold/italic as HTML tags.
 * XSS-safe: user input is latexEscape'd server-side (< → \textless{}, > → \textgreater{}),
 * so only <strong>/<em> tags we create appear in output.
 */
function latexToHtml(text) {
  if (!text) return '';
  return text
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]*)\}/g, '$1')
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
    .replace(/\\scshape\s*/g, '')
    .replace(/\\small\s*/g, '')
    .replace(/\\Huge\s*/g, '')
    .replace(/\\\\/g, '')
    .replace(/\\vspace\{[^}]*\}/g, '')
    .replace(/\$\\vcenter\{.*?\}\$/g, '')
    .replace(/\$\|\$/g, '|')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&amp;')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\textless\{\}/g, '&lt;')
    .replace(/\\textgreater\{\}/g, '&gt;')
    .replace(/\\textbar\{\}/g, '|')
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanLatex(text) {
  if (!text) return '';
  return text
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textit\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\underline\{([^}]*)\}/g, '$1')
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
    .replace(/\\scshape\s*/g, '')
    .replace(/\\small\s*/g, '')
    .replace(/\\Huge\s*/g, '')
    .replace(/\\\\/g, '')
    .replace(/\\vspace\{[^}]*\}/g, '')
    .replace(/\$\\vcenter\{.*?\}\$/g, '')
    .replace(/\$\|\$/g, '|')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\textless\{\}/g, '<')
    .replace(/\\textgreater\{\}/g, '>')
    .replace(/\\textbar\{\}/g, '|')
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function LatexPreview({ resumeData }) {
  const parsed = useMemo(
    () => parseLatex(resumeData?.latex),
    [resumeData?.latex]
  );

  if (!parsed) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant p-8 flex items-center justify-center h-64">
        <p className="font-body text-sm text-on-surface-variant">No LaTeX content to preview</p>
      </div>
    );
  }

  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant p-8 overflow-y-auto custom-scrollbar latex-preview"
      style={{ maxHeight: 'calc(100vh - 280px)', fontFamily: "'Times New Roman', 'Georgia', serif" }}
    >
      {/* Header */}
      <div className="text-center mb-3">
        <h1 className="text-2xl font-bold tracking-wide m-0 uppercase">
          {parsed.name || 'Candidate'}
        </h1>
        {parsed.contactLine && (
          <p className="text-[0.7rem] mt-1.5 text-gray-700">
            {parsed.contactLine}
          </p>
        )}
      </div>

      {/* Education */}
      {parsed.education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[0.8rem] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
            Education
          </h2>
          {parsed.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[0.75rem] font-bold">{edu.title}</span>
                <span className="text-[0.7rem] italic">{edu.date}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[0.7rem] italic">{edu.subtitle}</span>
                <span className="text-[0.7rem] italic">{edu.location}</span>
              </div>
              {edu.bullets.length > 0 && (
                <ul className="list-disc pl-4 m-0 mt-1 space-y-0.5">
                  {edu.bullets.map((b, j) => (
                    <li key={j} className="text-[0.7rem] leading-snug" dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {parsed.experience.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[0.8rem] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
            Experience
          </h2>
          {parsed.experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[0.75rem] font-bold">{exp.title}</span>
                <span className="text-[0.7rem] italic">{exp.date}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[0.7rem] italic">{exp.subtitle}</span>
                <span className="text-[0.7rem] italic">{exp.location}</span>
              </div>
              {exp.bullets.length > 0 && (
                <ul className="list-disc pl-4 m-0 mt-1 space-y-0.5">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-[0.7rem] leading-snug" dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {parsed.projects.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[0.8rem] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
            Projects
          </h2>
          {parsed.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[0.75rem]">
                  <span className="font-bold">{proj.title}</span>
                  {proj.tags && (
                    <span className="italic text-gray-600"> | {proj.tags}</span>
                  )}
                </span>
                <span className="text-[0.7rem] italic">{proj.date}</span>
              </div>
              {proj.bullets.length > 0 && (
                <ul className="list-disc pl-4 m-0 mt-1 space-y-0.5">
                  {proj.bullets.map((b, j) => (
                    <li key={j} className="text-[0.7rem] leading-snug" dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {parsed.skills.length > 0 && (
        <section className="mb-2">
          <h2 className="text-[0.8rem] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
            Technical Skills
          </h2>
          <div className="space-y-0.5">
            {parsed.skills.map((skill, i) => (
              <p key={i} className="text-[0.7rem]">
                <span className="font-bold">{skill.category}: </span>
                {skill.values}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="mt-6 pt-2 border-t border-outline-variant text-center">
        <p className="text-[0.55rem] text-gray-500 italic">
          Generated by JobButler
        </p>
      </div>
    </div>
  );
}
