import { latexEscape, latexEscapeUrl, truncateAtWord, boldKeywords } from '../utils/latexEscape.js';
import { reorderTags } from '../utils/skillsTailoring.js';

const LANG_LIST = ['python', 'java', 'javascript', 'typescript', 'go', 'rust', 'c', 'c++', 'c#', 'sql', 'kotlin', 'swift', 'ruby', 'php', 'scala', 'r', 'bash', 'shell'];
const FRAMEWORK_LIST = ['react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'next.js', 'nest', 'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'kafka', 'terraform', 'graphql', 'rest', 'grpc'];
const DB_LIST = ['postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'dynamodb', 'sqlite', 'cassandra', 'elasticsearch'];
const TESTING_LIST = ['jest', 'mocha', 'pytest', 'cypress', 'selenium', 'junit', 'tdd', 'bdd', 'testing', 'integration test', 'unit test'];

const SAMPLE_PROJECT_BLOCKLIST = ['gitlytics', 'simple paintball', 'jake ryan', 'sourabh bajaj'];

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

  const seen = new Set();
  const deduped = educationEntries.filter(edu => {
    const key = `${(edu.title || '').toLowerCase().trim()}::${(edu.organization || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let section = `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
`;

  deduped.forEach(edu => {
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
 * @param {{hardSkills?: string[], roleKeywords?: string[]}} [keywords]
 */
function buildProjects(projectEntries, rewrittenMap, boldList, keywords) {
  if (!projectEntries || projectEntries.length === 0) {
    return '';
  }

  const jdKeywords = [
    ...((keywords && keywords.hardSkills) || []),
    ...((keywords && keywords.roleKeywords) || []),
  ];

  let section = `%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
`;

  projectEntries.forEach(proj => {
    const titleLower = (proj.title || '').toLowerCase();
    if (SAMPLE_PROJECT_BLOCKLIST.some(t => titleLower.includes(t))) {
      console.warn(`buildProjects: sample template entry detected — title="${proj.title}". Remove from vault.`);
    }
    const title = latexEscape(proj.title);
    const orderedTags = jdKeywords.length > 0
      ? reorderTags(proj.tags || [], jdKeywords).slice(0, 4)
      : (proj.tags || []).slice(0, 4);
    const tags = orderedTags.map(t => latexEscape(t)).join(', ');
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

function matchesList(skill, list) {
  const s = skill.toLowerCase().trim();
  return list.some(item => {
    if (s === item) return true;
    // Only do substring matching for items longer than 2 chars to avoid false positives (e.g. 'c' matching 'react')
    if (item.length > 2 && s.includes(item)) return true;
    if (item.length > 2 && s.length > 2 && item.includes(s)) return true;
    return false;
  });
}

/**
 * Build technical skills section — always emits exactly 3 \textbf lines.
 * @param {Array} skillEntries
 * @param {{hardSkills?: string[], roleKeywords?: string[]}} [keywords]
 */
function buildSkills(skillEntries, keywords) {
  if (!skillEntries || skillEntries.length === 0) {
    return '';
  }

  const jdKeywords = [
    ...((keywords && keywords.hardSkills) || []),
    ...((keywords && keywords.roleKeywords) || []),
  ];

  // Collect every individual skill token from all entries
  const allSkills = [];
  skillEntries.forEach(entry => {
    (entry.bullets || []).forEach(bullet => {
      const text = bullet.text || '';
      const colonIndex = text.indexOf(':');
      const valuesStr = colonIndex > 0 ? text.substring(colonIndex + 1) : text;
      valuesStr.split(',').map(s => s.trim()).filter(Boolean).forEach(s => allSkills.push(s));
    });
    (entry.tags || []).forEach(t => {
      if (t && t.trim()) allSkills.push(t.trim());
    });
  });

  // Deduplicate (case-insensitive, keep first casing)
  const seen = new Set();
  const uniqueSkills = allSkills.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueSkills.length === 0) return '';

  // Bucket assignment: DB/testing/tools take priority over lang to avoid false positives (e.g. PostgreSQL contains "sql")
  const isDb = s => matchesList(s, DB_LIST);
  const isTesting = s => matchesList(s, TESTING_LIST);
  const isFramework = s => matchesList(s, FRAMEWORK_LIST);
  const isLang = s => !isDb(s) && !isTesting(s) && !isFramework(s) && matchesList(s, LANG_LIST);

  const langs = uniqueSkills.filter(s => isLang(s));
  const frameworks = uniqueSkills.filter(s => !isLang(s) && isFramework(s) && !isDb(s) && !isTesting(s));
  const remainder = uniqueSkills.filter(s => !isLang(s) && !isFramework(s));

  // Determine third bucket label and content
  const jdLower = jdKeywords.map(k => k.toLowerCase());
  let thirdLabel;
  let thirdSkills;

  if (DB_LIST.some(db => jdLower.some(k => k.includes(db)))) {
    thirdLabel = 'Databases';
    thirdSkills = remainder.filter(s => matchesList(s, DB_LIST));
    if (thirdSkills.length === 0) thirdSkills = remainder.filter(s => matchesList(s, DB_LIST.concat(['database', 'db'])));
    if (thirdSkills.length === 0) thirdSkills = remainder;
  } else if (TESTING_LIST.some(t => jdLower.some(k => k.includes(t)))) {
    thirdLabel = 'Testing';
    thirdSkills = remainder.filter(s => matchesList(s, TESTING_LIST));
    if (thirdSkills.length === 0) thirdSkills = remainder;
  } else {
    thirdLabel = 'Developer Tools';
    thirdSkills = remainder;
  }

  const renderLine = (label, skills) => {
    if (skills.length === 0) return null;
    const ordered = jdKeywords.length > 0 ? reorderTags(skills, jdKeywords) : skills;
    return `      \\textbf{${latexEscape(label)}}{: ${ordered.map(s => latexEscape(s)).join(', ')}} \\\\`;
  };

  const skillLines = [
    renderLine('Programming Languages', langs),
    renderLine('Frameworks / Technologies', frameworks),
    renderLine(thirdLabel, thirdSkills),
  ].filter(Boolean);

  if (skillLines.length === 0) return '';

  let section = `%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
`;

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
  latex += buildSkills(skills, keywords);
  latex += buildExperience(work, rewrittenMap, boldList);
  latex += buildProjects(projects, rewrittenMap, boldList, keywords);

  latex += TEMPLATE_END;

  return latex;
}

export default { build };
