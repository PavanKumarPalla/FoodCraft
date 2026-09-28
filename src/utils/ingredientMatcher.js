/**
 * Utility for matching user's pantry/entered ingredients against recipe ingredients.
 * Determines:
 * - have: ingredients the user already has
 * - missing: remaining ingredients required by the recipe that the user needs to get
 * - matchRatio: percentage of ingredients the user has
 */

export function normalizeIngredient(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    // Split compound prefixes like coolmilk -> cool milk, hotwater -> hot water, coldmilk -> cold milk
    .replace(/\b(cool|cold|hot|warm|fresh|chilled|frozen|sweet|skim)([a-z]+)\b/g, '$1 $2')
    .replace(/[0-9/().,%-]+/g, ' ')
    .replace(/\b(tsp|tbsp|cup|cups|gm|g|kg|ml|oz|lb|pound|pounds|pinch|can|clove|cloves|diced|sliced|chopped|minced|crushed|fresh|dried|powder|shredded|boiled|large|medium|small|warm|hot|cold|cool|chilled|frozen|sweet|skim|boneless|skinless|raw|cooked)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const SYNONYMS = {
  aloo: 'potato',
  potatoes: 'potato',
  batata: 'potato',
  pyaz: 'onion',
  onions: 'onion',
  kanda: 'onion',
  tamatar: 'tomato',
  tomatoes: 'tomato',
  mirchi: 'chili',
  chillies: 'chili',
  chilies: 'chili',
  dhania: 'coriander',
  dhaniya: 'coriander',
  cilantro: 'coriander',
  jeera: 'cumin',
  haldi: 'turmeric',
  paneer: 'cottage cheese',
  dahi: 'curd',
  curd: 'yogurt',
  yoghurt: 'yogurt',
  coolmilk: 'milk',
  coldmilk: 'milk',
  hotmilk: 'milk',
  doodh: 'milk'
};

export function matchRecipeIngredients(recipeIngredients, userIngredients = []) {
  if (!recipeIngredients || !Array.isArray(recipeIngredients)) {
    return { have: [], missing: [], matchRatio: 0, total: 0 };
  }

  const normalizedUserList = (userIngredients || [])
    .map(item => normalizeIngredient(typeof item === 'string' ? item : item.name || ''))
    .filter(Boolean);

  const have = [];
  const missing = [];

  recipeIngredients.forEach(ing => {
    const rawName = typeof ing === 'string' ? ing : ing.name || '';
    const ingNormalized = normalizeIngredient(rawName);
    const amount = typeof ing === 'object' ? ing.amount || '' : '';

    if (normalizedUserList.length === 0) {
      // If user hasn't entered anything, all items are listed as missing
      missing.push({ name: rawName, amount });
      return;
    }

    // Check if any user ingredient matches this recipe ingredient
    const isMatched = normalizedUserList.some(userIng => {
      if (!userIng) return false;

      // Exact or direct substring match
      if (ingNormalized.includes(userIng) || userIng.includes(ingNormalized)) {
        return true;
      }

      // Root word match (potatoes -> potato, tomatoes -> tomato)
      const cleanU = userIng.replace(/es$/, '').replace(/s$/, '');
      const cleanI = ingNormalized.replace(/es$/, '').replace(/s$/, '');
      if (cleanI && cleanU && (cleanI.includes(cleanU) || cleanU.includes(cleanI))) {
        return true;
      }

      // Synonym mapping
      const uSyn = SYNONYMS[userIng] || SYNONYMS[cleanU] || cleanU;
      const iSyn = SYNONYMS[ingNormalized] || SYNONYMS[cleanI] || cleanI;
      if (uSyn && iSyn && (uSyn === iSyn || ingNormalized.includes(uSyn) || uSyn.includes(cleanI))) {
        return true;
      }

      // Check significant words (e.g. "chicken", "ginger", "garlic", "paneer", "rice")
      const userTokens = userIng.split(' ').filter(t => t.length >= 3);
      const ingTokens = ingNormalized.split(' ').filter(t => t.length >= 3);

      return userTokens.some(uTok => {
        const uRoot = uTok.replace(/es$/, '').replace(/s$/, '');
        return ingTokens.some(iTok => {
          const iRoot = iTok.replace(/es$/, '').replace(/s$/, '');
          return iTok.includes(uTok) || uTok.includes(iTok) ||
                 iRoot.includes(uRoot) || uRoot.includes(iRoot) ||
                 (SYNONYMS[uTok] && SYNONYMS[uTok] === iTok) ||
                 (SYNONYMS[iTok] && SYNONYMS[iTok] === uTok) ||
                 (SYNONYMS[uRoot] && SYNONYMS[uRoot] === iRoot);
        });
      });
    });

    const itemObj = {
      name: rawName,
      amount: amount
    };

    if (isMatched) {
      have.push(itemObj);
    } else {
      missing.push(itemObj);
    }
  });

  const total = recipeIngredients.length;
  const matchRatio = total > 0 ? Math.round((have.length / total) * 100) : 0;

  return {
    have,
    missing,
    matchRatio,
    total,
    isFullyAvailable: missing.length === 0 && total > 0,
    hasMatches: have.length > 0
  };
}

