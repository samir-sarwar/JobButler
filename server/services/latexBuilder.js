import { latexEscape, latexEscapeUrl, truncateAtWord, boldKeywords } from '../utils/latexEscape.js';

/**
 * Jake's Resume LaTeX template preamble - EXACT match to sample.tex
 */
const TEMPLATE_PREAMBLE = `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}


%----------FONT OPTIONS----------
% sans-serif
% \\usepackage[sfdefault]{FiraSans}
% \\usepackage[sfdefault]{roboto}
% \\usepackage[sfdefault]{noto-sans}
% \\usepackage[default]{sourcesanspro}

% serif
% \\usepackage{CormorantGaramond}
% \\usepackage{charter}


\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

`;

const TEMPLATE_END = `
%-------------------------------------------
\\end{document}
`;

/**
 * Build the heading section - CENTERED format matching sample.tex
 */
function buildHeading(user) {
  // Defensive null handling - use safe defaults if user fields are missing
  const name = latexEscape(user?.name || user?.email?.split('@')[0] || 'Candidate');
  const rawEmail = user?.email || '';
  const emailDisplay = latexEscape(rawEmail);
  const phone = latexEscape(user?.phone || '');
  const linkedin = user?.linkedinUrl || '';
  const github = user?.githubUrl || '';
  
  // Clean up URLs for display
  const linkedinDisplay = linkedin.replace(/^https?:\/\/(www\.)?/, '');
  const githubDisplay = github.replace(/^https?:\/\/(www\.)?/, '');
  
  let heading = `%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small `;
  
  const contactParts = [];
  
  if (phone) {
    contactParts.push(phone);
  }
  
  if (rawEmail) {
    // Use raw email in mailto: href (hyperref handles special chars), escaped email for display
    contactParts.push(`\\href{mailto:${latexEscapeUrl(rawEmail)}}{\\underline{${emailDisplay}}}`);
  }
  
  if (linkedin) {
    // Use latexEscapeUrl for href URL, latexEscape for display text
    contactParts.push(`\\href{${latexEscapeUrl(linkedin)}}{\\underline{${latexEscape(linkedinDisplay)}}}`);
  }
  
  if (github) {
    // Use latexEscapeUrl for href URL, latexEscape for display text
    contactParts.push(`\\href{${latexEscapeUrl(github)}}{\\underline{${latexEscape(githubDisplay)}}}`);
  }
  
  heading += contactParts.join(' $|$ ');
  heading += `
\\end{center}


`;
  
  return heading;
}

/**
 * Build education section
 */
function buildEducation(educationEntries) {
  if (!educationEntries || educationEntries.length === 0) {
    return '';
  }
  
  let section = `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
`;
  
  educationEntries.forEach(edu => {
    const title = latexEscape(edu.title);
    const organization = latexEscape(edu.organization || '');
    const location = latexEscape(edu.location || '');
    const dateRange = formatDateRange(edu.startDate, edu.endDate);
    
    section += `    \\resumeSubheading
      {${title}}{${dateRange}}
      {${organization}}{${location}}
`;
    
    // Add bullets if present (GPA, coursework, etc.)
    if (edu.bullets && edu.bullets.length > 0) {
      section += `      \\resumeItemListStart
`;
      edu.bullets.slice(0, 4).forEach(bullet => {
        const text = latexEscape(truncateAtWord(bullet.text, 200));
        section += `        \\resumeItem{${text}}
`;
      });
      section += `      \\resumeItemListEnd
`;
    }
  });
  
  section += `  \\resumeSubHeadingListEnd

`;
  
  return section;
}

/**
 * Build work experience section
 * @param {Array} workEntries - Work experience documents
 * @param {Object} rewrittenMap - Map of experience ID to rewritten bullets
 * @param {string[]} boldList - Keywords to bold in bullet text
 */
function buildExperience(workEntries, rewrittenMap, boldList) {
  if (!workEntries || workEntries.length === 0) {
    return '';
  }
  
  let section = `%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
`;
  
  workEntries.forEach(exp => {
    const title = latexEscape(exp.title);
    const organization = latexEscape(exp.organization || '');
    const location = latexEscape(exp.location || '');
    const dateRange = formatDateRange(exp.startDate, exp.endDate);
    
    section += `    \\resumeSubheading
      {${title}}{${dateRange}}
      {${organization}}{${location}}
      \\resumeItemListStart
`;
    
    // Use rewritten bullets if available, otherwise original
    const expId = exp._id.toString();
    let bullets = rewrittenMap[expId] || (exp.bullets || []).map(b => b.text);
    
    // Ensure 2-4 bullets
    if (bullets.length < 2 && exp.bullets) {
      bullets = (exp.bullets || []).slice(0, 4).map(b => b.text);
    }
    bullets = bullets.slice(0, 4);
    
    bullets.forEach(bullet => {
      let text = latexEscape(truncateAtWord(bullet, 200));
      if (boldList && boldList.length > 0) {
        text = boldKeywords(text, boldList);
      }
      if (text.trim()) {
        section += `        \\resumeItem{${text}}
`;
      }
    });

    section += `      \\resumeItemListEnd
`;
  });

  section += `  \\resumeSubHeadingListEnd

`;

  return section;
}

/**
 * Build projects section
 * @param {Array} projectEntries - Project experience documents
 * @param {Object} rewrittenMap - Map of experience ID to rewritten bullets
 * @param {string[]} boldList - Keywords to bold in bullet text
 */
function buildProjects(projectEntries, rewrittenMap, boldList) {
  if (!projectEntries || projectEntries.length === 0) {
    return '';
  }
  
  let section = `%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
`;
  
  projectEntries.forEach(proj => {
    const title = latexEscape(proj.title);
    const tags = (proj.tags || []).map(t => latexEscape(t)).join(', ');
    const dateRange = formatDateRange(proj.startDate, proj.endDate);
    
    // Format: \textbf{Title} $|$ \emph{tags}
    const headingContent = tags 
      ? `\\textbf{${title}} $|$ \\emph{${tags}}`
      : `\\textbf{${title}}`;
    
    section += `      \\resumeProjectHeading
          {${headingContent}}{${dateRange}}
          \\resumeItemListStart
`;
    
    // Use rewritten bullets if available
    const projId = proj._id.toString();
    let bullets = rewrittenMap[projId] || (proj.bullets || []).map(b => b.text);
    
    // Ensure 2-4 bullets
    if (bullets.length < 2 && proj.bullets) {
      bullets = (proj.bullets || []).slice(0, 4).map(b => b.text);
    }
    bullets = bullets.slice(0, 4);
    
    bullets.forEach(bullet => {
      let text = latexEscape(truncateAtWord(bullet, 200));
      if (boldList && boldList.length > 0) {
        text = boldKeywords(text, boldList);
      }
      if (text.trim()) {
        section += `            \\resumeItem{${text}}
`;
      }
    });

    section += `          \\resumeItemListEnd
`;
  });
  
  section += `    \\resumeSubHeadingListEnd

`;
  
  return section;
}

/**
 * Build technical skills section
 */
function buildSkills(skillEntries) {
  if (!skillEntries || skillEntries.length === 0) {
    return '';
  }
  
  let section = `%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
`;
  
  const skillLines = [];
  
  skillEntries.forEach(skill => {
    const hasBullets = skill.bullets && skill.bullets.length > 0;
    const hasTags = skill.tags && skill.tags.length > 0;

    if (hasBullets) {
      // Bullet-based format: "Category: skill1, skill2, ..."
      (skill.bullets || []).forEach(bullet => {
        const text = bullet.text || '';
        const colonIndex = text.indexOf(':');

        if (colonIndex > 0 && colonIndex < 30) {
          const category = latexEscape(text.substring(0, colonIndex).trim());
          const values = latexEscape(text.substring(colonIndex + 1).trim());
          skillLines.push(`      \\textbf{${category}}{: ${values}} \\\\`);
        } else {
          skillLines.push(`      ${latexEscape(text)} \\\\`);
        }
      });
    } else if (hasTags) {
      // Tags-based format: construct line from title (category) + tags (skills)
      const category = latexEscape(skill.title || '');
      const values = skill.tags.map(t => latexEscape(t)).join(', ');
      if (category && values) {
        skillLines.push(`      \\textbf{${category}}{: ${values}} \\\\`);
      }
    }
  });

  // If no skill lines were generated, omit the entire section
  if (skillLines.length === 0) {
    return '';
  }

  section += skillLines.join('\n');
  
  section += `
    }}
 \\end{itemize}

`;
  
  return section;
}

/**
 * Format date range string
 */
function formatDateRange(startDate, endDate) {
  const start = latexEscape(startDate || '');
  const end = latexEscape(endDate || 'Present');
  
  if (!start && !end) return '';
  if (!start) return end;
  if (start === end) return start;
  
  return `${start} -- ${end}`;
}

/**
 * Build complete LaTeX document
 * @param {Array} selectedExperiences - All selected experience documents
 * @param {Object} rewrittenMap - Map of experience ID to rewritten bullets
 * @param {{jobTitle?: string, company?: string}} jobInfo - Job information for header
 * @param {Object} user - User document for contact info
 * @param {{hardSkills?: string[], roleKeywords?: string[]}} [keywords] - Extracted keywords for bolding
 * @param {Array} [tailoredSkillEntries] - Pre-tailored skill entries (reordered by relevance)
 * @returns {string} - Complete LaTeX document
 */
export function build(selectedExperiences, rewrittenMap, jobInfo, user, keywords, tailoredSkillEntries) {
  // Validate user object
  if (!user) {
    throw new Error('User object is required for building resume');
  }

  // Separate experiences by type
  const education = selectedExperiences.filter(e => e.type === 'education');
  const work = selectedExperiences.filter(e => e.type === 'work');
  const projects = selectedExperiences.filter(e => e.type === 'project');
  // Use tailored skills if provided, otherwise fall back to raw skill entries
  const skills = tailoredSkillEntries || selectedExperiences.filter(e => e.type === 'skill');

  // Sort by priority (lower = higher priority)
  work.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  projects.sort((a, b) => (a.priority || 0) - (b.priority || 0));

  // Build bold keyword list from hardSkills + top roleKeywords (skip softSkills — bolding "collaboration" looks spammy)
  const boldList = [];
  if (keywords) {
    if (keywords.hardSkills) boldList.push(...keywords.hardSkills);
    if (keywords.roleKeywords) boldList.push(...keywords.roleKeywords.slice(0, 5));
  }

  // Build document
  let latex = TEMPLATE_PREAMBLE;

  latex += buildHeading(user);
  latex += buildEducation(education);
  latex += buildExperience(work, rewrittenMap, boldList);
  latex += buildProjects(projects, rewrittenMap, boldList);
  latex += buildSkills(skills);

  latex += TEMPLATE_END;

  return latex;
}

export default { build };
