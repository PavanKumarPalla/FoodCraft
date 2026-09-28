// src/data/mockData.js
// Food Craft Mock Database — Simulating 2.2M+ RecipeNLG Knowledge Base

export const INITIAL_RECIPES = [
  {
    id: "rcp-1",
    title: "Paneer Tikka Protein Bowl",
    description: "Char-grilled cottage cheese cubes tossed with tri-color bell peppers, quinoa, and spiced mint-yogurt dressing.",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
    cuisine: "North Indian",
    mealType: "Lunch",
    dietType: "veg",
    healthTags: ["High Protein", "Gym Friendly", "Low Sugar"],
    time: 25,
    servings: 2,
    calories: 420,
    protein: "28g",
    carbs: "24g",
    fat: "18g",
    sodium: "320mg",
    sugar: "3g",
    rating: 4.9,
    reviewsCount: 142,
    matchScore: 96,
    difficulty: "Easy",
    ingredients: [
      { name: "Paneer (Cottage Cheese)", amount: "200g, cubed", available: true },
      { name: "Bell Peppers (Red & Yellow)", amount: "1 cup, diced", available: true },
      { name: "Cooked Quinoa", amount: "1 cup", available: true },
      { name: "Greek Yogurt", amount: "3 tbsp", available: true },
      { name: "Garam Masala & Chaat Masala", amount: "1 tsp each", available: true },
      { name: "Lemon Juice", amount: "1 tbsp", available: true },
      { name: "Olive Oil", amount: "1 tsp", available: true }
    ],
    instructions: [
      "Marinate paneer cubes with yogurt, garam masala, chili powder, and lemon juice for 10 minutes.",
      "Sear marinated paneer and bell peppers in a hot skillet for 5-6 minutes until lightly charred.",
      "Base your serving bowl with warm fluffy quinoa.",
      "Top with grilled paneer, peppers, fresh coriander, and a drizzle of mint yogurt dressing."
    ]
  },
  {
    id: "rcp-2",
    title: "Crispy Masala Dosa with Sambar",
    description: "Golden fermented rice-lentil crepe filled with spiced mustard potato mash, accompanied by steaming vegetable lentil stew.",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    cuisine: "South Indian",
    mealType: "Breakfast",
    dietType: "veg",
    healthTags: ["Low Salt", "Fermented Probiotic"],
    time: 20,
    servings: 2,
    calories: 340,
    protein: "9g",
    carbs: "58g",
    fat: "8g",
    sodium: "240mg",
    sugar: "2g",
    rating: 4.8,
    reviewsCount: 230,
    matchScore: 92,
    difficulty: "Medium",
    ingredients: [
      { name: "Dosa Batter (Fermented)", amount: "2 cups", available: true },
      { name: "Boiled Potatoes", amount: "2 large, mashed", available: true },
      { name: "Mustard Seeds & Curry Leaves", amount: "1 tsp", available: true },
      { name: "Green Chilies & Ginger", amount: "1 tbsp minced", available: true },
      { name: "Turmeric Powder", amount: "1/2 tsp", available: true },
      { name: "Coconut Chutney", amount: "1/2 cup for serving", available: false }
    ],
    instructions: [
      "Heat oil in a pan, crackle mustard seeds, curry leaves, and green chilies.",
      "Add onions, turmeric, and mashed potatoes; mix thoroughly and season lightly.",
      "Pour a ladle of batter onto a hot cast-iron tawa and swirl in circular motion from center outwards.",
      "Cook until edges crisp golden, place masala filling in center, fold and serve piping hot."
    ]
  },
  {
    id: "rcp-3",
    title: "Grilled Rosemary Herb Chicken Breast",
    description: "Tender chicken breast seared with garlic, fresh rosemary, steamed broccoli, and roasted baby sweet potatoes.",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    cuisine: "Continental",
    mealType: "Dinner",
    dietType: "non-veg",
    healthTags: ["High Protein", "Gym Friendly", "Low Sugar", "Keto"],
    time: 20,
    servings: 1,
    calories: 390,
    protein: "44g",
    carbs: "12g",
    fat: "9g",
    sodium: "290mg",
    sugar: "1g",
    rating: 4.9,
    reviewsCount: 310,
    matchScore: 98,
    difficulty: "Easy",
    ingredients: [
      { name: "Chicken Breast (Boneless)", amount: "250g", available: true },
      { name: "Garlic Cloves", amount: "3, crushed", available: true },
      { name: "Fresh Rosemary / Thyme", amount: "1 sprig", available: true },
      { name: "Steamed Broccoli", amount: "1 cup florets", available: true },
      { name: "Extra Virgin Olive Oil", amount: "1 tbsp", available: true },
      { name: "Black Pepper & Sea Salt", amount: "To taste", available: true }
    ],
    instructions: [
      "Pound chicken breast evenly to 1/2 inch thickness for uniform cooking.",
      "Rub thoroughly with crushed garlic, herbs, olive oil, and freshly cracked black pepper.",
      "Heat grill pan over medium-high heat. Sear chicken for 6-7 minutes per side until internal temp hits 75°C.",
      "Rest chicken for 4 minutes before slicing. Serve alongside crisp steamed broccoli."
    ]
  },
  {
    id: "rcp-4",
    title: "Mediterranean Egg Shakshuka",
    description: "Free-range eggs gently poached in a rich simmered sauce of sun-ripened tomatoes, bell peppers, cumin, and feta crumble.",
    image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80",
    cuisine: "Mediterranean",
    mealType: "Breakfast",
    dietType: "egg",
    healthTags: ["High Protein", "Low Sugar", "Keto"],
    time: 18,
    servings: 2,
    calories: 285,
    protein: "19g",
    carbs: "14g",
    fat: "16g",
    sodium: "310mg",
    sugar: "4g",
    rating: 4.7,
    reviewsCount: 184,
    matchScore: 94,
    difficulty: "Easy",
    ingredients: [
      { name: "Whole Eggs", amount: "3 large", available: true },
      { name: "Ripe Plum Tomatoes", amount: "4, crushed", available: true },
      { name: "Red Bell Pepper", amount: "1, sliced", available: true },
      { name: "Ground Cumin & Paprika", amount: "1 tsp each", available: true },
      { name: "Garlic", amount: "2 cloves", available: true },
      { name: "Feta or Paneer Crumble", amount: "2 tbsp", available: true }
    ],
    instructions: [
      "Sauté diced onions, garlic, and bell peppers in olive oil until soft.",
      "Stir in tomatoes, cumin, paprika, and simmer for 8 minutes until sauce thickens.",
      "Make three small wells in the bubbling sauce and crack an egg into each well.",
      "Cover skillet and cook for 5 minutes until egg whites set but yolks remain runny."
    ]
  },
  {
    id: "rcp-5",
    title: "Crunchy Spiced Chickpea Chaat",
    description: "Zesty evening snack with boiled kabuli chana, red onions, cucumbers, pomegranate seeds, and tangy amchur tamarind drizzle.",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    cuisine: "North Indian",
    mealType: "Snacks",
    dietType: "veg",
    healthTags: ["High Fiber", "Low Salt", "Low Sugar", "Vegan"],
    time: 10,
    servings: 2,
    calories: 220,
    protein: "11g",
    carbs: "34g",
    fat: "4g",
    sodium: "180mg",
    sugar: "3g",
    rating: 4.8,
    reviewsCount: 95,
    matchScore: 91,
    difficulty: "Easy",
    ingredients: [
      { name: "Boiled Chickpeas (Chana)", amount: "1.5 cups", available: true },
      { name: "Cucumber & Onion", amount: "1/2 cup finely chopped", available: true },
      { name: "Pomegranate Arils", amount: "1/4 cup", available: true },
      { name: "Chaat Masala & Roasted Cumin", amount: "1 tsp", available: true },
      { name: "Lemon Juice", amount: "1 tbsp", available: true },
      { name: "Fresh Mint Leaves", amount: "Handful", available: true }
    ],
    instructions: [
      "Combine drained chickpeas with chopped cucumber, onions, and fresh herbs in a mixing bowl.",
      "Sprinkle roasted cumin powder, rock salt, and chaat masala.",
      "Squeeze fresh lemon juice and toss thoroughly.",
      "Garnish with ruby pomegranate seeds and serve immediately."
    ]
  },
  {
    id: "rcp-6",
    title: "Asian Garlic Edamame & Tofu Stir-Fry",
    description: "Crispy sesame tofu wok-tossed with green edamame, bok choy, garlic shoots, and ginger aminos.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    cuisine: "Asian",
    mealType: "Dinner",
    dietType: "veg",
    healthTags: ["Gym Friendly", "High Protein", "Low Sugar", "Vegan"],
    time: 15,
    servings: 2,
    calories: 320,
    protein: "24g",
    carbs: "16g",
    fat: "14g",
    sodium: "280mg",
    sugar: "2g",
    rating: 4.7,
    reviewsCount: 112,
    matchScore: 89,
    difficulty: "Easy",
    ingredients: [
      { name: "Extra Firm Tofu", amount: "200g, pressed and cubed", available: true },
      { name: "Edamame Beans (Shelled)", amount: "1/2 cup", available: true },
      { name: "Garlic & Fresh Ginger", amount: "1 tbsp each, minced", available: true },
      { name: "Soy Sauce / Coconut Aminos", amount: "1.5 tbsp", available: true },
      { name: "Sesame Seeds & Oil", amount: "1 tsp each", available: true },
      { name: "Spring Onions", amount: "2 stalks", available: true }
    ],
    instructions: [
      "Pan-fry cubed tofu in sesame oil over high heat until all sides turn crisp and golden.",
      "Push tofu to one side, toss in garlic, ginger, and edamame; stir-fry for 2 minutes.",
      "Drizzle soy sauce or aminos, tossing quickly to glaze the ingredients.",
      "Finish with chopped scallions and toasted white sesame seeds."
    ]
  },
  {
    id: "rcp-7",
    title: "Hyderabadi Spiced Chicken Biryani",
    description: "Slow-cooked basmati rice layered with aromatic saffron, marinated chicken, fried caramelized onions, and mint.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    cuisine: "South Indian",
    mealType: "Dinner",
    dietType: "non-veg",
    healthTags: ["High Protein"],
    time: 45,
    servings: 4,
    calories: 560,
    protein: "38g",
    carbs: "62g",
    fat: "16g",
    sodium: "410mg",
    sugar: "2g",
    rating: 5.0,
    reviewsCount: 520,
    matchScore: 97,
    difficulty: "Pro",
    ingredients: [
      { name: "Basmati Rice (Long Grain)", amount: "2 cups, soaked", available: true },
      { name: "Chicken (Curry Cut)", amount: "500g", available: true },
      { name: "Fresh Ginger & Garlic Paste", amount: "2 tbsp", available: true },
      { name: "Biryani Spices (Star Anise, Cardamom)", amount: "Whole spices", available: true },
      { name: "Thick Curd (Yogurt)", amount: "1/2 cup", available: true },
      { name: "Saffron strands soaked in milk", amount: "2 tbsp", available: false },
      { name: "Birista (Fried Onions)", amount: "1 cup", available: true }
    ],
    instructions: [
      "Marinate chicken with yogurt, ginger-garlic paste, mint, coriander, and biryani spices for 45 mins.",
      "Parboil soaked basmati rice with whole spices until 70% cooked.",
      "Layer marinated chicken at the bottom of a heavy pot, top with fragrant rice.",
      "Scatter fried onions, saffron milk, seal lid with dough or foil, and slow-cook (Dum) for 25 minutes."
    ]
  },
  {
    id: "rcp-8",
    title: "Avocado & Tomato Sourdough Toast",
    description: "Toasted artisan sourdough rubbed with garlic, smashed hass avocado, cherry tomatoes, and microgreens.",
    image: "",
    cuisine: "Continental",
    mealType: "Breakfast",
    dietType: "veg",
    healthTags: ["Heart Healthy", "Low Sugar", "Low Salt", "Vegan"],
    time: 8,
    servings: 1,
    calories: 290,
    protein: "8g",
    carbs: "30g",
    fat: "14g",
    sodium: "190mg",
    sugar: "1g",
    rating: 4.6,
    reviewsCount: 88,
    matchScore: 88,
    difficulty: "Easy",
    ingredients: [
      { name: "Artisan Sourdough Slice", amount: "1 thick slice", available: true },
      { name: "Ripe Hass Avocado", amount: "1/2 avocado", available: true },
      { name: "Cherry Tomatoes", amount: "4, halved", available: true },
      { name: "Chili Flakes & Sesame", amount: "A pinch", available: true },
      { name: "Cold-Pressed Olive Oil", amount: "1 tsp", available: true }
    ],
    instructions: [
      "Toast sourdough until deep golden and crunchy.",
      "Coarsely mash avocado with a pinch of black pepper and lemon juice.",
      "Spread thickly over toast and arrange sweet cherry tomato halves.",
      "Finish with chili flakes, microgreens, and a light mist of olive oil."
    ]
  },
  {
    id: "rcp-9",
    title: "Homestyle Kadai Chicken Curry",
    description: "Rich, aromatic chicken curry slow-cooked with fresh ginger juliennes, garlic, crushed tomatoes, and roasted kadai spices.",
    image: "",
    cuisine: "North Indian",
    mealType: "Dinner",
    dietType: "non-veg",
    healthTags: ["High Protein", "Gym Friendly", "Keto"],
    time: 30,
    servings: 3,
    calories: 410,
    protein: "36g",
    carbs: "14g",
    fat: "22g",
    sodium: "340mg",
    sugar: "3g",
    rating: 4.9,
    reviewsCount: 260,
    matchScore: 98,
    difficulty: "Medium",
    ingredients: [
      { name: "Chicken (Curry Cut)", amount: "500g", available: true },
      { name: "Fresh Ginger", amount: "2 tbsp, julienned", available: true },
      { name: "Garlic Cloves", amount: "6 cloves, minced", available: true },
      { name: "Onions", amount: "2 medium, finely chopped", available: true },
      { name: "Ripe Tomatoes", amount: "3, pureed", available: true },
      { name: "Green Bell Pepper (Capsicum)", amount: "1, cubed", available: true },
      { name: "Turmeric Powder", amount: "1/2 tsp", available: true },
      { name: "Garam Masala Powder", amount: "1 tsp", available: true },
      { name: "Kashmiri Red Chili Powder", amount: "1 tsp", available: true },
      { name: "Mustard Oil / Ghee", amount: "2 tbsp", available: true },
      { name: "Fresh Coriander Leaves", amount: "2 tbsp, chopped", available: true }
    ],
    instructions: [
      "Heat mustard oil or ghee in a heavy-bottomed kadai until warm.",
      "Add minced garlic and half of the julienned ginger; sauté for 1 minute until fragrant.",
      "Add chopped onions and fry on medium heat until golden brown.",
      "Stir in turmeric powder, red chili powder, and garam masala.",
      "Add the chicken pieces and sear over high heat for 6-8 minutes until sealed.",
      "Stir in tomato puree and bell peppers; cover and simmer for 15 minutes until chicken is tender.",
      "Garnish with remaining ginger juliennes and fresh coriander. Serve piping hot with rotis or rice."
    ]
  },
  {
    id: "rcp-10",
    title: "Ginger Garlic Chicken Stir-Fry",
    description: "Lean chicken breast stir-fried in a hot wok with pungent ginger, crushed garlic, broccoli florets, and light soy sauce.",
    image: "",
    cuisine: "Asian",
    mealType: "Dinner",
    dietType: "non-veg",
    healthTags: ["High Protein", "Gym Friendly", "Low Sugar"],
    time: 15,
    servings: 2,
    calories: 330,
    protein: "38g",
    carbs: "10g",
    fat: "12g",
    sodium: "310mg",
    sugar: "1g",
    rating: 4.8,
    reviewsCount: 175,
    matchScore: 95,
    difficulty: "Easy",
    ingredients: [
      { name: "Chicken Breast", amount: "300g, thinly sliced", available: true },
      { name: "Fresh Ginger", amount: "2 tbsp, finely minced", available: true },
      { name: "Garlic Cloves", amount: "4 cloves, minced", available: true },
      { name: "Broccoli Florets", amount: "1 cup", available: true },
      { name: "Soy Sauce", amount: "2 tbsp", available: true },
      { name: "Toasted Sesame Oil", amount: "1 tbsp", available: true },
      { name: "Spring Onions", amount: "3 stalks, chopped", available: true },
      { name: "Crushed Black Pepper", amount: "1/2 tsp", available: true }
    ],
    instructions: [
      "Toss sliced chicken breast with half the minced ginger, black pepper, and 1 tbsp soy sauce.",
      "Heat sesame oil in a wok or large skillet over high heat.",
      "Add minced garlic and remaining ginger; toss for 30 seconds until aromatic.",
      "Add chicken and stir-fry briskly for 5-6 minutes until cooked through and golden.",
      "Add broccoli florets and spring onions with remaining soy sauce, tossing for 2 minutes.",
      "Remove from heat and serve hot over rice or noodles."
    ]
  },
  {
    id: "rcp-11",
    title: "Palak Paneer (Spinach Cottage Cheese)",
    description: "Creamy pureed fresh spinach gravy infused with garlic, cumin, and tender lightly tossed paneer cubes.",
    image: "",
    cuisine: "North Indian",
    mealType: "Lunch",
    dietType: "veg",
    healthTags: ["High Protein", "High Iron", "Low Sugar"],
    time: 25,
    servings: 3,
    calories: 320,
    protein: "22g",
    carbs: "12g",
    fat: "18g",
    sodium: "280mg",
    sugar: "2g",
    rating: 4.9,
    reviewsCount: 310,
    matchScore: 94,
    difficulty: "Medium",
    ingredients: [
      { name: "Paneer (Cottage Cheese)", amount: "250g, cubed", available: true },
      { name: "Fresh Spinach (Palak)", amount: "300g, washed", available: true },
      { name: "Garlic Cloves", amount: "5 cloves, finely sliced", available: true },
      { name: "Fresh Ginger", amount: "1 tbsp, grated", available: true },
      { name: "Onions", amount: "1 medium, chopped", available: true },
      { name: "Green Chilies", amount: "2, slit", available: true },
      { name: "Cumin Seeds", amount: "1 tsp", available: true },
      { name: "Garam Masala", amount: "1/2 tsp", available: true },
      { name: "Fresh Cream / Butter", amount: "1 tbsp", available: true }
    ],
    instructions: [
      "Blanch spinach leaves in salted boiling water for 2 minutes, then shock in ice-cold water.",
      "Blend blanched spinach with green chilies into a vibrant green puree.",
      "Heat ghee in a pan, crackle cumin seeds, then sauté garlic, ginger, and onions until soft.",
      "Pour in the spinach puree and garam masala; simmer gently on low heat for 5 minutes.",
      "Gently add paneer cubes and stir in fresh cream. Cook for 2 minutes and serve with warm rotis."
    ]
  },
  {
    id: "rcp-12",
    title: "Homestyle Yellow Dal Tadka",
    description: "Comforting yellow lentils tempered with sizzled garlic, ginger, cumin, green chilies, and ripe tomatoes.",
    image: "",
    cuisine: "North Indian",
    mealType: "Lunch",
    dietType: "veg",
    healthTags: ["High Fiber", "Low Salt", "Vegan Friendly"],
    time: 20,
    servings: 3,
    calories: 240,
    protein: "14g",
    carbs: "36g",
    fat: "6g",
    sodium: "210mg",
    sugar: "2g",
    rating: 4.8,
    reviewsCount: 190,
    matchScore: 92,
    difficulty: "Easy",
    ingredients: [
      { name: "Yellow Toor / Moong Dal", amount: "1 cup, rinsed", available: true },
      { name: "Garlic Cloves", amount: "6 cloves, thinly sliced", available: true },
      { name: "Fresh Ginger", amount: "1 tbsp, chopped", available: true },
      { name: "Ripe Tomatoes", amount: "2, chopped", available: true },
      { name: "Green Chilies", amount: "2, slit", available: true },
      { name: "Cumin Seeds", amount: "1 tsp", available: true },
      { name: "Turmeric Powder", amount: "1/2 tsp", available: true },
      { name: "Ghee", amount: "2 tbsp", available: true },
      { name: "Fresh Coriander", amount: "2 tbsp, chopped", available: true }
    ],
    instructions: [
      "Cook rinsed dal with 3 cups water, turmeric powder, and salt until soft and creamy.",
      "In a tadka pan, heat ghee and add cumin seeds until they splutter.",
      "Add sliced garlic, chopped ginger, and green chilies, frying until garlic turns golden.",
      "Add chopped tomatoes and cook for 3-4 minutes until soft.",
      "Pour sizzling tadka over the dal, mix well, and garnish with fresh coriander."
    ]
  },
  {
    id: "rcp-13",
    title: "Aloo Gobi Matar (Spiced Potato & Cauliflower)",
    description: "Tender potatoes and cauliflower florets gently simmered with green peas, cumin, turmeric, and fresh ginger.",
    image: "",
    cuisine: "North Indian",
    mealType: "Lunch",
    dietType: "veg",
    healthTags: ["High Fiber", "Vegan", "Low Sugar"],
    time: 20,
    servings: 3,
    calories: 260,
    protein: "7g",
    carbs: "38g",
    fat: "8g",
    sodium: "220mg",
    sugar: "4g",
    rating: 4.8,
    reviewsCount: 154,
    matchScore: 95,
    difficulty: "Easy",
    ingredients: [
      { name: "Potatoes (Aloo)", amount: "3 medium, cubed", available: true },
      { name: "Cauliflower Florets (Gobi)", amount: "2 cups", available: true },
      { name: "Green Peas (Matar)", amount: "1/2 cup", available: true },
      { name: "Fresh Ginger", amount: "1 tbsp, minced", available: true },
      { name: "Garlic Cloves", amount: "4 cloves, minced", available: true },
      { name: "Onions", amount: "1 medium, chopped", available: true },
      { name: "Ripe Tomatoes", amount: "2, chopped", available: true },
      { name: "Cumin Seeds & Turmeric Powder", amount: "1 tsp each", available: true },
      { name: "Garam Masala", amount: "1/2 tsp", available: true },
      { name: "Mustard Oil / Cooking Oil", amount: "2 tbsp", available: true },
      { name: "Fresh Coriander", amount: "2 tbsp, chopped", available: true }
    ],
    instructions: [
      "Heat mustard oil in a pan, crackle cumin seeds, then sauté onions, ginger, and garlic until lightly golden.",
      "Add turmeric powder, red chili powder, and chopped tomatoes; cook until tomatoes are soft.",
      "Add diced potatoes, cauliflower florets, and green peas; mix well to coat with the masala.",
      "Cover with lid and cook on low heat for 12-14 minutes, stirring occasionally until potatoes are fork-tender.",
      "Sprinkle garam masala and chopped coriander leaves. Serve hot with rotis or parathas."
    ]
  },
  {
    id: "rcp-14",
    title: "Crispy Herb Roasted Baby Potatoes",
    description: "Golden, crispy-edged baby potatoes tossed with fragrant rosemary, crushed garlic, sea salt, and extra virgin olive oil.",
    image: "",
    cuisine: "Continental",
    mealType: "Snacks",
    dietType: "veg",
    healthTags: ["Gym Friendly", "Gluten Free", "Vegan"],
    time: 25,
    servings: 2,
    calories: 210,
    protein: "5g",
    carbs: "32g",
    fat: "7g",
    sodium: "240mg",
    sugar: "1g",
    rating: 4.9,
    reviewsCount: 180,
    matchScore: 94,
    difficulty: "Easy",
    ingredients: [
      { name: "Baby Potatoes", amount: "400g, halved", available: true },
      { name: "Garlic Cloves", amount: "5 cloves, crushed", available: true },
      { name: "Fresh Rosemary or Thyme", amount: "2 sprigs", available: true },
      { name: "Extra Virgin Olive Oil", amount: "2 tbsp", available: true },
      { name: "Sea Salt & Cracked Black Pepper", amount: "To taste", available: true },
      { name: "Smoked Paprika", amount: "1/2 tsp", available: true }
    ],
    instructions: [
      "Parboil halved baby potatoes in salted water for 5 minutes, then drain thoroughly and let steam dry.",
      "Gently toss potatoes with olive oil, crushed garlic, paprika, sea salt, and fresh rosemary.",
      "Spread potatoes cut-side down in a preheated hot skillet or roasting tray.",
      "Roast over medium-high heat for 15-18 minutes, turning once, until deeply golden and crispy.",
      "Serve immediately as a savory side or evening snack."
    ]
  }
];



export const CATEGORIES = [
  {
    id: "cat-south-indian",
    title: "South Indian",
    subtitle: "Dosas, Idlis, Sambar & Curries",
    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80",
    count: "450+ Recipes",
    badge: "Regional",
    filterKey: "cuisine",
    filterValue: "South Indian"
  },
  {
    id: "cat-north-indian",
    title: "North Indian",
    subtitle: "Paneer, Tikkas, Rotis & Dals",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80",
    count: "680+ Recipes",
    badge: "Regional",
    filterKey: "cuisine",
    filterValue: "North Indian"
  },
  {
    id: "cat-gym",
    title: "Gym & High Protein",
    subtitle: "30g+ Protein, Lean & Macro Balanced",
    image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80",
    count: "320+ Recipes",
    badge: "Fitness",
    filterKey: "healthTags",
    filterValue: "High Protein"
  },
  {
    id: "cat-veg",
    title: "Pure Vegetarian",
    subtitle: "Plant-Powered, Nutrient Rich",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    count: "1,200+ Recipes",
    badge: "Diet",
    filterKey: "dietType",
    filterValue: "veg"
  },
  {
    id: "cat-nonveg",
    title: "Non-Veg Feast",
    subtitle: "Chicken, Mutton, Fish & Seafood",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    count: "890+ Recipes",
    badge: "Diet",
    filterKey: "dietType",
    filterValue: "non-veg"
  },
  {
    id: "cat-lowsugar",
    title: "Low Sugar / Diabetic",
    subtitle: "Under 3g Glycemic Index Control",
    image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80",
    count: "260+ Recipes",
    badge: "Health",
    filterKey: "healthTags",
    filterValue: "Low Sugar"
  },
  {
    id: "cat-lowsalt",
    title: "Low Salt / DASH",
    subtitle: "Cardio Healthy, Under 300mg Sodium",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80",
    count: "190+ Recipes",
    badge: "Health",
    filterKey: "healthTags",
    filterValue: "Low Salt"
  },
  {
    id: "cat-snacks",
    title: "Quick Evening Snacks",
    subtitle: "Ready in 15 mins for Chai / Coffee",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
    count: "340+ Recipes",
    badge: "Quick",
    filterKey: "mealType",
    filterValue: "Snacks"
  }
];

export const MOCK_DETECTED_INGREDIENTS = [
  { name: "Tomatoes", confidence: "97.4%", box: { x: 12, y: 25, w: 22, h: 28 }, color: "#ef4444" },
  { name: "Eggs", confidence: "98.1%", box: { x: 40, y: 15, w: 25, h: 20 }, color: "#f59e0b" },
  { name: "Paneer / Tofu", confidence: "93.8%", box: { x: 70, y: 30, w: 22, h: 26 }, color: "#10b981" },
  { name: "Bell Peppers", confidence: "95.2%", box: { x: 20, y: 60, w: 26, h: 30 }, color: "#8b5cf6" },
  { name: "Fresh Spinach", confidence: "91.0%", box: { x: 55, y: 55, w: 32, h: 32 }, color: "#10b981" }
];

export const WEEKLY_MEAL_PLAN = [
  {
    day: "Monday",
    date: "Sep 16",
    meals: {
      breakfast: INITIAL_RECIPES[3], // Shakshuka
      lunch: INITIAL_RECIPES[0],     // Paneer Tikka Bowl
      snacks: INITIAL_RECIPES[4],    // Chickpea Chaat
      dinner: INITIAL_RECIPES[2]     // Rosemary Chicken
    }
  },
  {
    day: "Tuesday",
    date: "Sep 17",
    meals: {
      breakfast: INITIAL_RECIPES[1], // Masala Dosa
      lunch: INITIAL_RECIPES[5],     // Tofu Stir Fry
      snacks: INITIAL_RECIPES[7],    // Avocado Toast
      dinner: INITIAL_RECIPES[0]     // Paneer Bowl
    }
  },
  {
    day: "Wednesday",
    date: "Sep 18",
    meals: {
      breakfast: INITIAL_RECIPES[7], // Avocado Toast
      lunch: INITIAL_RECIPES[2],     // Rosemary Chicken
      snacks: INITIAL_RECIPES[4],    // Chickpea Chaat
      dinner: INITIAL_RECIPES[5]     // Tofu Stir Fry
    }
  },
  {
    day: "Thursday",
    date: "Sep 19",
    meals: {
      breakfast: INITIAL_RECIPES[3], // Shakshuka
      lunch: INITIAL_RECIPES[0],     // Paneer Bowl
      snacks: INITIAL_RECIPES[4],    // Chickpea Chaat
      dinner: INITIAL_RECIPES[2]     // Rosemary Chicken
    }
  },
  {
    day: "Friday",
    date: "Sep 20",
    meals: {
      breakfast: INITIAL_RECIPES[1], // Masala Dosa
      lunch: INITIAL_RECIPES[5],     // Tofu Stir Fry
      snacks: INITIAL_RECIPES[7],    // Avocado Toast
      dinner: INITIAL_RECIPES[6]     // Biryani
    }
  },
  {
    day: "Saturday",
    date: "Sep 21",
    meals: {
      breakfast: INITIAL_RECIPES[7], // Avocado Toast
      lunch: INITIAL_RECIPES[6],     // Biryani
      snacks: INITIAL_RECIPES[4],    // Chickpea Chaat
      dinner: INITIAL_RECIPES[3]     // Shakshuka
    }
  },
  {
    day: "Sunday",
    date: "Sep 22",
    meals: {
      breakfast: INITIAL_RECIPES[1], // Masala Dosa
      lunch: INITIAL_RECIPES[0],     // Paneer Bowl
      snacks: INITIAL_RECIPES[4],    // Chickpea Chaat
      dinner: INITIAL_RECIPES[6]     // Biryani
    }
  }
];

export const INITIAL_USER_PROFILE = {
  name: "",
  email: "",
  avatar: "",
  dietaryPreference: "Flexible (Veg + Egg + Lean Meat)",
  cuisinePreferences: ["North Indian", "South Indian", "Mediterranean"],
  dailyCalorieTarget: 2100,
  dailyProteinTarget: "120g",
  allergens: ["Peanuts (Mild)", "Shellfish"],
  healthGoals: ["High Protein / Gym Muscle Gain", "Low Refined Sugar", "Cardio Friendly Sodium"]
};
