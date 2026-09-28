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
  // Potato
  aloo: 'potato',
  potatoes: 'potato',
  batata: 'potato',

  // Onion & Garlic & Ginger
  pyaz: 'onion',
  onions: 'onion',
  kanda: 'onion',
  lahsun: 'garlic',
  garlic: 'garlic',
  adrak: 'ginger',
  ginger: 'ginger',

  // Tomato
  tamatar: 'tomato',
  tomatoes: 'tomato',

  // Spices & Herbs
  mirchi: 'chili',
  chillies: 'chili',
  chilies: 'chili',
  chilli: 'chili',
  chili: 'chili',
  dhania: 'coriander',
  dhaniya: 'coriander',
  cilantro: 'coriander',
  jeera: 'cumin',
  haldi: 'turmeric',

  // Dairy
  paneer: 'cottage cheese',
  dahi: 'curd',
  curd: 'yogurt',
  yoghurt: 'yogurt',
  coolmilk: 'milk',
  coldmilk: 'milk',
  hotmilk: 'milk',
  doodh: 'milk',
  milk: 'milk',

  // Meat, Mutton, Lamb & Keema
  mutton: 'mutton',
  gosht: 'mutton',
  goat: 'mutton',
  lamb: 'mutton',
  beef: 'beef',
  pork: 'pork',
  keema: 'keema',
  mince: 'keema',
  chicken: 'chicken',
  murgh: 'chicken',

  // Seafood
  fish: 'fish',
  machli: 'fish',
  prawn: 'prawn',
  prawns: 'prawn',
  shrimp: 'prawn',
  shrimps: 'prawn',

  // Eggs & Mushrooms
  egg: 'egg',
  eggs: 'egg',
  anda: 'egg',
  mushroom: 'mushroom',
  mushrooms: 'mushroom',
  khumb: 'mushroom'
};

const BROAD_MEAT_ITEMS = ['mutton', 'lamb', 'goat', 'gosht', 'beef', 'pork', 'meat', 'keema', 'mince'];

function checkTokenMatch(uTok, iTok) {
  if (!uTok || !iTok) return false;
  if (uTok === iTok) return true;
  if (uTok.length >= 3 && (iTok.includes(uTok) || uTok.includes(iTok))) return true;

  const uRoot = uTok.replace(/es$/, '').replace(/s$/, '');
  const iRoot = iTok.replace(/es$/, '').replace(/s$/, '');
  if (uRoot.length >= 3 && (iRoot.includes(uRoot) || uRoot.includes(iRoot))) return true;

  const uSyn = SYNONYMS[uTok] || SYNONYMS[uRoot];
  const iSyn = SYNONYMS[iTok] || SYNONYMS[iRoot];
  if (uSyn && iSyn && uSyn === iSyn) return true;
  if (uSyn && (iTok.includes(uSyn) || iRoot.includes(uSyn))) return true;
  if (iSyn && (uTok.includes(iSyn) || uRoot.includes(iSyn))) return true;

  return false;
}

export function matchRecipeIngredients(recipeOrIngredients, userIngredients = [], explicitNerTags = []) {
  let recipeIngredients = [];
  let nerTags = [];

  if (Array.isArray(recipeOrIngredients)) {
    recipeIngredients = recipeOrIngredients;
    nerTags = explicitNerTags || [];
  } else if (recipeOrIngredients && typeof recipeOrIngredients === 'object') {
    recipeIngredients = recipeOrIngredients.ingredients || [];
    nerTags = recipeOrIngredients.ner_tags || recipeOrIngredients.NER || explicitNerTags || [];
  }

  if (!recipeIngredients || !Array.isArray(recipeIngredients)) {
    return { have: [], missing: [], matchRatio: 0, total: 0 };
  }

  const normalizedUserList = (userIngredients || [])
    .map(item => normalizeIngredient(typeof item === 'string' ? item : item.name || ''))
    .filter(Boolean);

  const normalizedNerList = (nerTags || [])
    .map(tag => normalizeIngredient(typeof tag === 'string' ? tag : ''))
    .filter(Boolean);

  const have = [];
  const missing = [];

  recipeIngredients.forEach(ing => {
    const rawName = typeof ing === 'string' ? ing : ing.name || '';
    const ingNormalized = normalizeIngredient(rawName);
    const amount = typeof ing === 'object' ? ing.amount || '' : '';

    if (normalizedUserList.length === 0) {
      missing.push({ name: rawName, amount });
      return;
    }

    // 1. Direct ingredient text check
    let isMatched = normalizedUserList.some(userIng => {
      if (!userIng) return false;

      // Exact or direct substring match
      if (ingNormalized.includes(userIng) || userIng.includes(ingNormalized)) {
        return true;
      }

      // Root word match
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

      // Broad meat match: If user asks for "meat", any meat item (mutton, lamb, beef, keema, meatballs) matches!
      if (userIng === 'meat' && BROAD_MEAT_ITEMS.some(m => ingNormalized.includes(m))) {
        return true;
      }

      // Word tokens match
      const userTokens = userIng.split(' ').filter(t => t.length >= 3);
      const ingTokens = ingNormalized.split(' ').filter(t => t.length >= 3);

      return userTokens.some(uTok => 
        ingTokens.some(iTok => checkTokenMatch(uTok, iTok))
      );
    });

    // 2. NER column check: If not matched by raw ingredient string, check the NER tags column!
    if (!isMatched && normalizedNerList.length > 0) {
      isMatched = normalizedUserList.some(userIng => {
        return normalizedNerList.some(nerTag => {
          // If this NER tag matches the recipe ingredient AND matches the user's input
          const nerMatchesIng = ingNormalized.includes(nerTag) || nerTag.includes(ingNormalized);
          if (nerMatchesIng) {
            if (nerTag.includes(userIng) || userIng.includes(nerTag)) return true;
            const uSyn = SYNONYMS[userIng];
            const nSyn = SYNONYMS[nerTag];
            if (uSyn && nSyn && uSyn === nSyn) return true;
            if (uSyn && nerTag.includes(uSyn)) return true;
          }
          return false;
        });
      });
    }

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

  // Also check if any user ingredient matched a tag in the NER column that marks a core ingredient
  if (have.length === 0 && normalizedNerList.length > 0 && normalizedUserList.length > 0) {
    const hasNerMatch = normalizedUserList.some(userIng => {
      const uSyn = SYNONYMS[userIng] || userIng;
      return normalizedNerList.some(nerTag => {
        const nSyn = SYNONYMS[nerTag] || nerTag;
        return nerTag.includes(userIng) || userIng.includes(nerTag) ||
               (uSyn && nSyn && uSyn === nSyn) ||
               (uSyn && nerTag.includes(uSyn));
      });
    });

    if (hasNerMatch && recipeIngredients.length > 0) {
      // Find the ingredient that most closely corresponds
      const matchedIdx = recipeIngredients.findIndex(ing => {
        const raw = typeof ing === 'string' ? ing : ing.name || '';
        const norm = normalizeIngredient(raw);
        return normalizedNerList.some(t => norm.includes(t) || t.includes(norm));
      });
      if (matchedIdx !== -1) {
        const promoted = missing.splice(matchedIdx, 1)[0];
        if (promoted) have.push(promoted);
      }
    }
  }

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

