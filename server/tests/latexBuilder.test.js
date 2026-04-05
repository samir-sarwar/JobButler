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
});
