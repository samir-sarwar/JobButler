/**
 * Programmatic skills tailoring — reorders skill categories and individual
 * skills within each category to put JD-relevant items first.
 * No LLM call needed; pure keyword matching.
 */

/**
 * Check if a skill token matches any keyword (case-insensitive substring).
 * @param {string} skill - Individual skill string (e.g. "React")
 * @param {string[]} keywords - Array of target keywords
 * @returns {boolean}
 */
function skillMatchesKeyword(skill, keywords) {
  const lower = skill.toLowerCase().trim();
  return keywords.some(kw => {
    const kwLower = kw.toLowerCase().trim();
    return lower === kwLower || lower.includes(kwLower) || kwLower.includes(lower);
  });
}

/**
 * Reorder comma-separated skills within a "Category: skill1, skill2, ..." line.
 * Matching skills move to the front; relative order preserved within each group.
 *
 * @param {string} bulletText - e.g. "Languages: Java, Python, C++, JavaScript"
 * @param {string[]} hardSkills - Target keywords to prioritize
 * @returns {string} - Reordered bullet text
 */
function reorderSkillLine(bulletText, hardSkills) {
  const colonIndex = bulletText.indexOf(':');

  // Only reorder lines that follow the "Category: values" pattern
  if (colonIndex <= 0 || colonIndex >= 30) return bulletText;

  const category = bulletText.substring(0, colonIndex).trim();
  const valuesStr = bulletText.substring(colonIndex + 1).trim();

  if (!valuesStr) return bulletText;

  const skills = valuesStr.split(',').map(s => s.trim()).filter(Boolean);
  const matched = [];
  const unmatched = [];

  for (const skill of skills) {
    if (skillMatchesKeyword(skill, hardSkills)) {
      matched.push(skill);
    } else {
      unmatched.push(skill);
    }
  }

  // Only reorder if there are matches — otherwise leave as-is
  if (matched.length === 0) return bulletText;

  const reordered = [...matched, ...unmatched];
  return `${category}: ${reordered.join(', ')}`;
}

/**
 * Reorder a tags array to put JD-matching skills first.
 * Preserves relative order within matched and unmatched groups.
 *
 * @param {string[]} tags - Array of skill tags (e.g., ['TYPESCRIPT', 'RUST', 'PYTHON'])
 * @param {string[]} hardSkills - Target keywords to prioritize
 * @returns {string[]} - Reordered tags array
 */
function reorderTags(tags, hardSkills) {
  const matched = [];
  const unmatched = [];

  for (const tag of tags) {
    if (skillMatchesKeyword(tag, hardSkills)) {
      matched.push(tag);
    } else {
      unmatched.push(tag);
    }
  }

  if (matched.length === 0) return tags;
  return [...matched, ...unmatched];
}

/**
 * Score a skill entry by how many of its individual skills match the target keywords.
 *
 * @param {Object} entry - MasterExperience document of type "skill"
 * @param {string[]} hardSkills - Target keywords
 * @returns {number} - Match count (higher = more relevant)
 */
function scoreSkillEntry(entry, hardSkills) {
  let score = 0;
  for (const bullet of (entry.bullets || [])) {
    const text = bullet.text || '';
    const colonIndex = text.indexOf(':');
    const valuesStr = colonIndex > 0 ? text.substring(colonIndex + 1) : text;
    const skills = valuesStr.split(',').map(s => s.trim()).filter(Boolean);
    for (const skill of skills) {
      if (skillMatchesKeyword(skill, hardSkills)) score++;
    }
  }

  // Also score from tags (for entries that store skills as tags instead of bullets)
  for (const tag of (entry.tags || [])) {
    if (skillMatchesKeyword(tag, hardSkills)) score++;
  }

  return score;
}

/**
 * Tailor skill entries for a specific job description.
 * - Reorders skill categories to put most JD-relevant first
 * - Reorders individual skills within each category to put matches first
 * - Never removes any skills
 *
 * @param {Array} skillEntries - MasterExperience documents of type "skill"
 * @param {{hardSkills: string[], roleKeywords: string[]}} keywords - Extracted keywords
 * @returns {Array} - Deep-copied skill entries with reordered bullets
 */
export function tailorSkills(skillEntries, keywords) {
  if (!skillEntries || skillEntries.length === 0) return skillEntries;

  const targetKeywords = [
    ...(keywords.hardSkills || []),
    ...(keywords.roleKeywords || []),
  ];

  if (targetKeywords.length === 0) return skillEntries;

  // Deep copy entries so we don't mutate originals
  const copies = skillEntries.map(entry => {
    const copy = {
      ...entry.toObject ? entry.toObject() : { ...entry },
    };
    // Reorder skills within each bullet line, or reorder tags if bullets are empty
    if (copy.bullets && copy.bullets.length > 0) {
      copy.bullets = copy.bullets.map(bullet => ({
        ...bullet,
        text: reorderSkillLine(bullet.text || '', targetKeywords),
      }));
    } else if (copy.tags && copy.tags.length > 0) {
      copy.tags = reorderTags(copy.tags, targetKeywords);
    }
    copy._relevanceScore = scoreSkillEntry(entry, targetKeywords);
    return copy;
  });

  // Sort categories: highest relevance score first
  copies.sort((a, b) => b._relevanceScore - a._relevanceScore);

  // Clean up the temporary scoring field
  copies.forEach(c => delete c._relevanceScore);

  return copies;
}

export default { tailorSkills };
