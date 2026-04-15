import { build } from '../services/latexBuilder.js';

// Helper to create mock experience entries
function makeExperience(overrides) {
  return {
    _id: { toString: () => overrides.id || 'exp_1' },
    type: 'work',
    title: 'Software Engineer',
    organization: 'Acme Corp',
    location: 'San Francisco, CA',
    startDate: 'Jan 2022',
    endDate: 'Present',
    bullets: [{ text: 'Built APIs' }, { text: 'Led team of 5' }],
    tags: ['Node.js', 'React'],
    priority: 0,
    visible: true,
    ...overrides,
  };
}

function makeUser(overrides = {}) {
  return {
    email: 'test@example.com',
    name: 'John Doe',
    phone: '555-0123',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: 'https://github.com/johndoe',
    ...overrides,
  };
}

describe('latexBuilder.build', () => {
  test('produces a complete LaTeX document', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'education', title: 'BS Computer Science', organization: 'MIT', location: 'Cambridge, MA', bullets: [] }),
      makeExperience({ id: '2', type: 'work' }),
      makeExperience({ id: '3', type: 'project', title: 'Portfolio Site', organization: '', bullets: [{ text: 'Built with React' }] }),
      makeExperience({ id: '4', type: 'skill', title: 'Languages', bullets: [{ text: 'Languages: Python, Java, C++' }], tags: [] }),
    ];

    const rewrittenMap = {
      '2': ['Engineered scalable APIs serving 10K+ requests/day', 'Led cross-functional team of 5 engineers'],
    };

    const user = makeUser();
    const keywords = { hardSkills: ['Python', 'React'], roleKeywords: ['API design'] };

    const latex = build(experiences, rewrittenMap, { jobTitle: 'SWE', company: 'Google' }, user, keywords);

    // Should be a complete document
    expect(latex).toContain('\\documentclass');
    expect(latex).toContain('\\begin{document}');
    expect(latex).toContain('\\end{document}');

    // Should have all sections
    expect(latex).toContain('\\section{Education}');
    expect(latex).toContain('\\section{Experience}');
    expect(latex).toContain('\\section{Projects}');
    expect(latex).toContain('\\section{Technical Skills}');

    // Should contain user info
    expect(latex).toContain('John Doe');
    expect(latex).toContain('test@example.com');

    // Should use rewritten bullets
    expect(latex).toContain('Engineered scalable APIs');

    // Should contain skills
    expect(latex).toContain('Languages');
  });

  test('escapes special characters in user content', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'work', title: 'C++ & C# Developer', organization: 'Tech$Corp' }),
    ];

    const user = makeUser({ name: 'Jane & John' });
    const latex = build(experiences, {}, {}, user);

    // Special chars should be escaped (+ is not a LaTeX special char)
    expect(latex).toContain('Jane \\& John');
    expect(latex).toContain('C++ \\& C\\# Developer');
    expect(latex).toContain('Tech\\$Corp');
  });

  test('handles user with minimal fields', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'work' }),
    ];

    const user = makeUser({ name: null, phone: null, linkedinUrl: null, githubUrl: null });
    const latex = build(experiences, {}, {}, user);

    // Should fall back to email prefix for name
    expect(latex).toContain('test');
    expect(latex).toContain('\\begin{document}');
    expect(latex).toContain('\\end{document}');
  });

  test('throws when user is null', () => {
    expect(() => build([], {}, {}, null)).toThrow('User object is required');
  });

  test('omits sections with no entries', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'work' }),
    ];

    const user = makeUser();
    const latex = build(experiences, {}, {}, user);

    // Only Experience section should exist
    expect(latex).toContain('\\section{Experience}');
    expect(latex).not.toContain('\\section{Education}');
    expect(latex).not.toContain('\\section{Projects}');
    expect(latex).not.toContain('\\section{Technical Skills}');
  });

  test('uses original bullets when rewrittenMap has no entry', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'work', bullets: [{ text: 'Original bullet text' }] }),
    ];

    const user = makeUser();
    const latex = build(experiences, {}, {}, user);

    expect(latex).toContain('Original bullet text');
  });

  test('uses tailoredSkillEntries when provided', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'work' }),
      makeExperience({ id: '2', type: 'skill', title: 'Languages', bullets: [{ text: 'Languages: Java, Python' }] }),
    ];

    const tailoredSkills = [
      { ...experiences[1], bullets: [{ text: 'Languages: Python, Java' }] },
    ];

    const user = makeUser();
    const latex = build(experiences, {}, {}, user, null, tailoredSkills);

    // Should use the tailored order (Python first)
    expect(latex).toContain('Python, Java');
  });

  test('formats date ranges correctly', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'work', startDate: 'Jan 2020', endDate: 'Dec 2023' }),
    ];

    const user = makeUser();
    const latex = build(experiences, {}, {}, user);

    expect(latex).toContain('Jan 2020 -- Dec 2023');
  });

  test('handles project entries with tags', () => {
    const experiences = [
      makeExperience({
        id: '1',
        type: 'project',
        title: 'AI Chat Bot',
        tags: ['Python', 'LangChain', 'React'],
        bullets: [{ text: 'Built a chatbot' }],
      }),
    ];

    const user = makeUser();
    const latex = build(experiences, {}, {}, user);

    expect(latex).toContain('\\section{Projects}');
    expect(latex).toContain('AI Chat Bot');
    expect(latex).toContain('\\emph{');
  });

  test('buildEducation deduplicates entries sharing title and organization', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'education', title: 'BS Computer Science', organization: 'MIT', bullets: [] }),
      makeExperience({ id: '2', type: 'education', title: 'BS Computer Science', organization: 'MIT', bullets: [] }),
      makeExperience({ id: '3', type: 'education', title: 'MS Computer Science', organization: 'MIT', bullets: [] }),
    ];
    const user = makeUser();
    const latex = build(experiences, {}, {}, user);

    // Count only \resumeSubheading calls in the body (after \begin{document}), not the preamble \newcommand definition
    const body = latex.slice(latex.indexOf('\\begin{document}'));
    const matches = (body.match(/\\resumeSubheading/g) || []).length;
    expect(matches).toBe(2);
  });

  test('buildProjects caps tags at 4 and puts JD matches first', () => {
    const experiences = [
      makeExperience({
        id: '1',
        type: 'project',
        title: 'My Project',
        tags: ['Go', 'Docker', 'Python', 'React', 'Kubernetes', 'Redis'],
        bullets: [{ text: 'Did stuff' }],
      }),
    ];
    const user = makeUser();
    const keywords = { hardSkills: ['Python', 'Redis'], roleKeywords: [] };
    const latex = build(experiences, {}, {}, user, keywords);

    const emMatch = latex.match(/\\emph\{([^}]+)\}/);
    expect(emMatch).not.toBeNull();
    const tags = emMatch[1].split(',').map(s => s.trim());
    expect(tags.length).toBe(4);
    expect(tags[0]).toBe('Python');
    expect(tags[1]).toBe('Redis');
  });

  test('buildSkills emits exactly 3 \\textbf lines and picks Databases when JD hardSkills includes PostgreSQL', () => {
    const experiences = [
      makeExperience({
        id: '1',
        type: 'skill',
        title: 'Skills',
        bullets: [],
        tags: ['Python', 'React', 'PostgreSQL', 'Jest', 'Git'],
      }),
    ];
    const user = makeUser();
    const keywords = { hardSkills: ['PostgreSQL'], roleKeywords: [] };
    const latex = build(experiences, {}, {}, user, keywords);

    const textbfMatches = (latex.match(/\\textbf\{[^}]+\}\{:/g) || []);
    expect(textbfMatches.length).toBe(3);
    expect(latex).toContain('\\textbf{Databases}');
  });

  test('buildSkills picks Testing when JD hardSkills includes Jest', () => {
    const experiences = [
      makeExperience({
        id: '1',
        type: 'skill',
        title: 'Skills',
        bullets: [],
        tags: ['Python', 'React', 'Jest', 'Git'],
      }),
    ];
    const user = makeUser();
    const keywords = { hardSkills: ['Jest'], roleKeywords: [] };
    const latex = build(experiences, {}, {}, user, keywords);

    expect(latex).toContain('\\textbf{Testing}');
  });

  test('buildSkills falls back to Developer Tools when no DB or testing keywords in JD', () => {
    const experiences = [
      makeExperience({
        id: '1',
        type: 'skill',
        title: 'Skills',
        bullets: [],
        tags: ['Python', 'React', 'Git', 'Docker'],
      }),
    ];
    const user = makeUser();
    const keywords = { hardSkills: ['Python'], roleKeywords: [] };
    const latex = build(experiences, {}, {}, user, keywords);

    expect(latex).toContain('\\textbf{Developer Tools}');
  });

  test('build() section order is Education then Technical Skills then Experience then Projects', () => {
    const experiences = [
      makeExperience({ id: '1', type: 'education', title: 'BS CS', organization: 'MIT', bullets: [] }),
      makeExperience({ id: '2', type: 'work' }),
      makeExperience({ id: '3', type: 'project', title: 'My App', bullets: [{ text: 'Did work' }] }),
      makeExperience({ id: '4', type: 'skill', title: 'S', bullets: [], tags: ['Python', 'React', 'Git'] }),
    ];
    const user = makeUser();
    const keywords = { hardSkills: ['Python'], roleKeywords: [] };
    const latex = build(experiences, {}, {}, user, keywords);

    const eduIdx = latex.indexOf('\\section{Education}');
    const skillsIdx = latex.indexOf('\\section{Technical Skills}');
    const expIdx = latex.indexOf('\\section{Experience}');
    const projIdx = latex.indexOf('\\section{Projects}');

    expect(eduIdx).toBeLessThan(skillsIdx);
    expect(skillsIdx).toBeLessThan(expIdx);
    expect(expIdx).toBeLessThan(projIdx);
  });
});
