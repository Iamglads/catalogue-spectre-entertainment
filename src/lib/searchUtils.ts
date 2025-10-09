/**
 * Normalise une chaîne pour la recherche en ignorant les accents et la casse
 * @param str - La chaîne à normaliser
 * @returns La chaîne normalisée sans accents en minuscules
 */
export function normalizeForSearch(str: string): string {
  return str
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les marques diacritiques
    .toLowerCase()
    .trim();
}

/**
 * Crée un pattern de recherche flexible qui ignore les accents
 * @param query - La requête de recherche
 * @returns Un pattern regex qui match avec ou sans accents
 */
export function createAccentInsensitivePattern(query: string): string {
  const normalized = normalizeForSearch(query);
  
  // Map des caractères avec leurs variantes accentuées
  const accentMap: Record<string, string> = {
    'a': '[aàáâãäåāăą]',
    'e': '[eèéêëēĕėęě]',
    'i': '[iìíîïĩīĭį]',
    'o': '[oòóôõöōŏő]',
    'u': '[uùúûüũūŭů]',
    'c': '[cç ćĉ]',
    'n': '[nñńņň]',
    'y': '[yýÿŷ]',
  };
  
  // Remplace chaque caractère par son pattern de variantes
  let pattern = '';
  for (const char of normalized) {
    if (accentMap[char]) {
      pattern += accentMap[char];
    } else {
      // Échappe les caractères spéciaux regex
      pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  
  return pattern;
}

/**
 * Vérifie si une chaîne contient une sous-chaîne en ignorant les accents
 * @param haystack - La chaîne dans laquelle chercher
 * @param needle - La sous-chaîne à chercher
 * @returns true si la sous-chaîne est trouvée
 */
export function searchIncludes(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizeForSearch(haystack);
  const normalizedNeedle = normalizeForSearch(needle);
  return normalizedHaystack.includes(normalizedNeedle);
}







