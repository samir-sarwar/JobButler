import { tailorSkills } from '../utils/skillsTailoring.js';

// Helper to create mock skill entries (mimics Mongoose docs without .toObject())
function makeSkillEntry(title, bullets, tags = []) {
  return {
    _id: `skill_${title.toLowerCase().replace(/\s/g, '_')}`,
    type: 'skill',
    title,
    bullets: bullets.map(text => ({ text })),
    tags,
  };
}

describe('tailorSkills', () => {
  const keywords = {
    hardSkills: ['Python', 'React', 'Kubernetes', 'PostgreSQL'],
    roleKeywords: ['distributed systems', 'API design'],
  };

  test('reorders categories by relevance score', () => {
    const entries = [
      makeSkillEntry('Soft Skills', ['Communication: teamwork, leadership']),
      makeSkillEntry('Languages', ['Languages: Java, Python, C++, JavaScript']),
      makeSkillEntry('Frameworks', ['Frameworks: React, Angular, Vue.js']),
    ];

    const result = tailorSkills(entries, keywords);

    // Languages has Python (match), Frameworks has React (match), Soft Skills has none
    // Languages and Frameworks should come before Soft Skills
    const titles = result.map(e => e.title);
    expect(titles.indexOf('Soft Skills')).toBeGreaterThan(titles.indexOf('Languages'));
    expect(titles.indexOf('Soft Skills')).toBeGreaterThan(titles.indexOf('Frameworks'));
  });

  test('reorders skills within a bullet line to put matches first', () => {
    const entries = [
      makeSkillEntry('Languages', ['Languages: Java, C++, Python, Ruby']),
    ];

    const result = tailorSkills(entries, keywords);
    const bulletText = result[0].bullets[0].text;

    // Python should come before Java and C++ since it matches
    const pythonIdx = bulletText.indexOf('Python');
    const javaIdx = bulletText.indexOf('Java');
    expect(pythonIdx).toBeLessThan(javaIdx);
  });

  test('reorders tags when bullets are empty', () => {
    const entries = [
      makeSkillEntry('DevOps', [], ['Docker', 'Kubernetes', 'Terraform', 'Ansible']),
    ];

    const result = tailorSkills(entries, keywords);
    // Kubernetes should be first since it matches
    expect(result[0].tags[0]).toBe('Kubernetes');
  });

  test('returns original entries when no keywords', () => {
    const entries = [
      makeSkillEntry('Languages', ['Languages: Java, Python']),
    ];

    const result = tailorSkills(entries, { hardSkills: [], roleKeywords: [] });
    expect(result).toBe(entries); // Should return the same reference
  });

  test('returns empty/null input unchanged', () => {
    expect(tailorSkills([], keywords)).toEqual([]);
    expect(tailorSkills(null, keywords)).toBe(null);
    expect(tailorSkills(undefined, keywords)).toBe(undefined);
  });

  test('does not mutate original entries', () => {
    const entries = [
      makeSkillEntry('Languages', ['Languages: Java, Python, C++']),
    ];
    const originalText = entries[0].bullets[0].text;

    tailorSkills(entries, keywords);

    // Original should be unchanged
    expect(entries[0].bullets[0].text).toBe(originalText);
  });

  test('handles entries with no matching skills', () => {
    const entries = [
      makeSkillEntry('Other', ['Other: Cooking, Painting']),
    ];

    const result = tailorSkills(entries, keywords);
    // Should still return entries, just not reordered internally
    expect(result[0].bullets[0].text).toBe('Other: Cooking, Painting');
  });

  test('handles substring matching (e.g. "React" matches "React Native")', () => {
    const entries = [
      makeSkillEntry('Frameworks', ['Frameworks: React Native, Angular, Vue.js']),
    ];

    const result = tailorSkills(entries, keywords);
    const bulletText = result[0].bullets[0].text;
    // React Native should match "React" keyword
    expect(bulletText.startsWith('Frameworks: React Native')).toBe(true);
  });
});
