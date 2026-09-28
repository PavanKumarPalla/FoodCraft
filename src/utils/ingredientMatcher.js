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
    .replace(/[0-9/().,%-]+/g, ' ')
    .replace(/\b(tsp|tbsp|cup|cups|gm|g|kg|ml|oz|lb|pound|pounds|pinch|can|clove|cloves|diced|sliced|chopped|minced|crushed|fresh|dried|powder|shredded|boiled|large|medium|small|warm|hot|cold|boneless|skinless|raw|cooked)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

      // Check significant words (e.g. "chicken", "ginger", "garlic", "paneer", "rice")
      const userTokens = userIng.split(' ').filter(t => t.length >= 3);
      const ingTokens = ingNormalized.split(' ').filter(t => t.length >= 3);

      return userTokens.some(uTok => 
        ingTokens.some(iTok => 
          iTok.includes(uTok) || uTok.includes(iTok) ||
          (uTok.endsWith('s') && iTok === uTok.slice(0, -1)) ||
          (iTok.endsWith('s') && uTok === iTok.slice(0, -1))
        )
      );
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

