// src/data/mealPlanData.js
// Food Craft 7-Day Authentic Regional Meal Plan Database (South Indian & North Indian)

export const SOUTH_INDIAN_RECIPES = {
  // ── Breakfast Items ──
  "dosa-chutney": {
    id: "south-dosa-chutney",
    title: "Dosa with Chutney",
    subtitle: "Crispy Golden Fermented Rice-Lentil Crepe with Fresh Coconut Chutney",
    image: "/images/meal_planner_images/dosa.jpg",
    mealType: "Breakfast",
    cuisine: "South Indian",
    dietType: "veg",
    time: 20,
    calories: 320,
    protein: "7g",
    carbs: "48g",
    fat: "11g",
    datasetStatus: "In Hugging Face Dataset (Lace Dosai & Chutney)",
    ingredients: [
      { name: "Dosa Batter (Fermented Rice & Urad Dal)", amount: "2 cups" },
      { name: "Fresh Grated Coconut", amount: "1 cup" },
      { name: "Roasted Chana Dal (Dalia)", amount: "2 tbsp" },
      { name: "Green Chilies", amount: "2, slit" },
      { name: "Ginger", amount: "1/2 inch piece" },
      { name: "Mustard Seeds & Curry Leaves", amount: "1 tsp each for tempering" },
      { name: "Ghee / Sesame Oil", amount: "2 tsp" },
      { name: "Salt", amount: "To taste" }
    ],
    instructions: [
      "Blend grated coconut, roasted chana dal, green chilies, ginger, salt, and 1/4 cup water into a smooth chutney.",
      "Heat 1 tsp oil in a tadka pan, crackle mustard seeds, urad dal, dried red chili, and fresh curry leaves; pour over the chutney.",
      "Heat a cast-iron tawa/griddle on medium-high heat. Lightly grease with oil and wipe with a sliced onion.",
      "Pour a ladle of fermented dosa batter in the center and spread in concentric circular motions from center to edges until thin.",
      "Drizzle 1/2 tsp ghee around the perimeter. Cook until golden brown and crispy.",
      "Fold in half and serve piping hot with prepared coconut chutney and sambar."
    ]
  },
  "upma": {
    id: "south-upma",
    title: "Upma",
    subtitle: "Savory Roasted Semolina with Spiced Mustard Tempering & Cashews",
    image: "/images/meal_planner_images/upma.jpg",
    mealType: "Breakfast",
    cuisine: "South Indian",
    dietType: "veg",
    time: 15,
    calories: 260,
    protein: "6g",
    carbs: "42g",
    fat: "8g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Roasted Sooji (Rava / Semolina)", amount: "1 cup" },
      { name: "Water", amount: "2.5 cups" },
      { name: "Finely Chopped Onion", amount: "1 medium" },
      { name: "Green Chilies & Minced Ginger", amount: "2 chilies, 1 tsp ginger" },
      { name: "Mustard Seeds, Cumin & Urad Dal", amount: "1/2 tsp each" },
      { name: "Curry Leaves & Cashews", amount: "1 sprig, 8 cashews" },
      { name: "Ghee / Oil", amount: "1.5 tbsp" },
      { name: "Lemon Juice & Fresh Coriander", amount: "1 tsp lemon, 2 tbsp coriander" }
    ],
    instructions: [
      "Dry roast the semolina in a pan on medium flame until fragrant (about 3-4 minutes) and set aside.",
      "Heat ghee in a pan; fry cashews until golden and remove.",
      "Add mustard seeds, urad dal, cumin seeds, green chilies, ginger, and curry leaves to the hot oil.",
      "Sauté chopped onions until translucent. Pour in 2.5 cups of water and salt; bring to a rolling boil.",
      "Gradually add the roasted rava in a steady stream with one hand while continuously stirring with the other to avoid lumps.",
      "Cover and cook on low heat for 3 minutes until all water is absorbed.",
      "Garnish with fried cashews, lemon juice, and coriander. Serve hot."
    ]
  },
  "pongal-vada-chutney": {
    id: "south-pongal-vada",
    title: "Pongal, Vada, Chutney",
    subtitle: "Ghee Ven Pongal with Crispy Medu Vada & Coconut Chutney",
    image: "/images/meal_planner_images/pongal_vada.jpg",
    mealType: "Breakfast",
    cuisine: "South Indian",
    dietType: "veg",
    time: 30,
    calories: 460,
    protein: "14g",
    carbs: "56g",
    fat: "20g",
    datasetStatus: "Vada in RecipeNLG (Vadai); Pongal Missing",
    ingredients: [
      { name: "Raw Rice & Moong Dal", amount: "1/2 cup rice, 1/2 cup moong dal" },
      { name: "Ghee", amount: "3 tbsp" },
      { name: "Black Peppercorns & Cumin Seeds", amount: "1 tsp each" },
      { name: "Cashews & Ginger", amount: "10 cashews, 1 inch minced ginger" },
      { name: "Urad Dal (for Vada)", amount: "1 cup soaked 3 hours" },
      { name: "Coconut Chutney", amount: "1/2 cup" }
    ],
    instructions: [
      "Dry roast moong dal until aromatic. Combine with washed rice and 4 cups water; pressure cook for 4 whistles until soft and mushy.",
      "Grind soaked urad dal with minimal water into a fluffy batter. Add chopped ginger, green chilies, curry leaves, and salt.",
      "Shape batter into donut-shaped vadas and deep-fry in hot oil until golden and crisp.",
      "Heat ghee in a pan, crackle cumin seeds, crushed black pepper, cashews, ginger, and curry leaves.",
      "Pour hot ghee tempering over the cooked rice-dal pongal and mix well.",
      "Serve warm Ven Pongal accompanied by crispy Medu Vada and coconut chutney."
    ]
  },
  "idli-vada": {
    id: "south-idli-vada",
    title: "Idli, Vada",
    subtitle: "Steamed Soft Rice-Lentil Cakes with Crunchy Medu Vada & Sambar",
    image: "/images/meal_planner_images/idli_vada.jpg",
    mealType: "Breakfast",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 380,
    protein: "12g",
    carbs: "52g",
    fat: "14g",
    datasetStatus: "Vada in RecipeNLG; Traditional Idli Missing",
    ingredients: [
      { name: "Fermented Idli Batter", amount: "2 cups" },
      { name: "Urad Dal (for Vada)", amount: "1 cup, soaked and ground" },
      { name: "Crushed Black Pepper & Cumin", amount: "1/2 tsp each" },
      { name: "Curry Leaves & Green Chilies", amount: "Chopped finely" },
      { name: "Vegetable Sambar & Chutney", amount: "For serving" }
    ],
    instructions: [
      "Grease idli plates lightly with sesame oil or ghee.",
      "Pour fermented idli batter into each mold and steam in an idli cooker for 10-12 minutes.",
      "Aerate the ground urad dal batter by whisking vigorously until light and airy. Mix in pepper, cumin, chilies, and salt.",
      "Shape with wet hands into donut rings and deep-fry until crunchy golden brown.",
      "Unmold steamed idlis using a wet spoon.",
      "Serve hot idlis and vadas submerged in aromatic lentil sambar and coconut chutney."
    ]
  },
  "poori-chutney": {
    id: "south-poori-chutney",
    title: "Poori, Chutney",
    subtitle: "Golden Puffed Whole Wheat Flatbreads with Spiced Potato Sagu & Chutney",
    image: "/images/meal_planner_images/poori.jpg",
    mealType: "Breakfast",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 420,
    protein: "8g",
    carbs: "50g",
    fat: "22g",
    datasetStatus: "Chutney in RecipeNLG; Poori Missing",
    ingredients: [
      { name: "Whole Wheat Flour (Atta)", amount: "1.5 cups" },
      { name: "Sooji (Semolina, for crispiness)", amount: "1 tbsp" },
      { name: "Water & Salt", amount: "As needed to knead firm dough" },
      { name: "Oil for Deep Frying", amount: "2 cups" },
      { name: "Boiled Potatoes (Masala)", amount: "2 large, diced" },
      { name: "Coconut Chutney", amount: "1/2 cup" }
    ],
    instructions: [
      "Mix whole wheat flour, sooji, salt, and 1 tsp oil. Add water gradually and knead into a tight, firm dough.",
      "Divide into small lime-sized balls and roll out into uniform round discs (not too thin).",
      "Heat oil in a deep kadai until hot. Gently slide the rolled poori into the oil.",
      "Press lightly with a slotted spoon until it puffs up like a balloon, flip and fry for 15 seconds until golden.",
      "Drain on paper towel and serve hot with South Indian potato masala and coconut chutney."
    ]
  },
  "uggani-bajji": {
    id: "south-uggani-bajji",
    title: "Uggani, Bajji",
    subtitle: "Rayalaseema Spiced Puffed Rice Upma with Crispy Mirchi Bajji",
    image: "/images/meal_planner_images/uggani_bajji.jpg",
    mealType: "Breakfast",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 480,
    protein: "11g",
    carbs: "64g",
    fat: "21g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Murmura (Puffed Rice / Borugulu)", amount: "4 cups" },
      { name: "Roasted Gram Dal Powder (Putnala Podi)", amount: "3 tbsp" },
      { name: "Large Bhavnagri Green Chilies (for Bajji)", amount: "4 chilies" },
      { name: "Besan (Gram Flour)", amount: "1 cup" },
      { name: "Ajwain (Carom Seeds)", amount: "1/2 tsp" },
      { name: "Onion, Turmeric, Mustard Seeds", amount: "1 onion, 1/2 tsp each" },
      { name: "Lemon Juice", amount: "1.5 tbsp" }
    ],
    instructions: [
      "Soak puffed rice in water for 2 minutes, squeeze out excess water completely by hand, and place in a bowl.",
      "Heat 1 tbsp oil in a pan, add mustard seeds, chana dal, green chilies, onions, curry leaves, and turmeric; sauté until soft.",
      "Add squeezed puffed rice, putnala podi, salt, and lemon juice. Toss well on low heat for 2-3 minutes.",
      "For Bajji: Whisk besan, rice flour, ajwain, baking soda, salt, and water into a thick, smooth dipping batter.",
      "Slit green chilies, stuff with pinch of ajwain-salt, dip in batter, and deep-fry in hot oil until crisp.",
      "Serve the warm Uggani paired with freshly fried Mirchi Bajji and lemon wedges."
    ]
  },
  "pesarattu-chutney": {
    id: "south-pesarattu-chutney",
    title: "Pesarattu, Chutney",
    subtitle: "Nutrient-Dense Whole Green Gram Dosa with Spicy Ginger Allam Chutney",
    image: "/images/meal_planner_images/pesarattu.jpg",
    mealType: "Breakfast",
    cuisine: "South Indian",
    dietType: "veg",
    time: 20,
    calories: 340,
    protein: "16g",
    carbs: "46g",
    fat: "10g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Whole Green Moong Dal (soaked overnight)", amount: "1 cup" },
      { name: "Raw Rice", amount: "2 tbsp (soaked with dal)" },
      { name: "Fresh Ginger & Green Chilies", amount: "1.5 inch ginger, 3 chilies" },
      { name: "Cumin Seeds", amount: "1 tsp" },
      { name: "Finely Chopped Onions & Green Chilies (topping)", amount: "1/2 cup" },
      { name: "Allam (Ginger) Chutney", amount: "For serving" }
    ],
    instructions: [
      "Grind soaked green gram, rice, ginger, green chilies, cumin seeds, and salt into a smooth pourable batter.",
      "Heat a tawa on medium-high heat. Pour a ladleful of batter and spread into a thin, round crepe.",
      "Immediately sprinkle finely chopped onions, minced ginger, and cumin seeds on top; press gently.",
      "Drizzle ghee or oil around the edges and cook on medium flame until golden brown and crisp.",
      "Flip briefly for 30 seconds or fold in half.",
      "Serve hot with spicy Andhra Allam Pachadi (Ginger Chutney) and coconut chutney."
    ]
  },

  // ── Lunch Items ──
  "full-meals": {
    id: "south-full-meals",
    title: "Full Meals (South Indian Thali)",
    subtitle: "Steamed Sona Masoori Rice, Dal (Pappu), Curd, Tangy Rasam & Papadam",
    image: "/images/meal_planner_images/full_meals.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "veg",
    time: 35,
    calories: 620,
    protein: "19g",
    carbs: "98g",
    fat: "16g",
    datasetStatus: "Dal/Rasam/Papad Missing in RecipeNLG",
    ingredients: [
      { name: "Cooked Sona Masoori Rice", amount: "1.5 cups" },
      { name: "Toor Dal (Pappu) with Ghee", amount: "1 bowl" },
      { name: "Tomato Pepper Rasam", amount: "1 bowl" },
      { name: "Fresh Curd (Dahi)", amount: "1 bowl" },
      { name: "Fried Papadam (Appalam)", amount: "2 pieces" },
      { name: "Vegetable Sambar / Curry", amount: "1 bowl" }
    ],
    instructions: [
      "Pressure cook toor dal with turmeric, tomatoes, and water until soft. Temper with ghee, mustard, cumin, and garlic.",
      "Prepare rasam by boiling tamarind water with crushed black pepper, cumin, garlic, and fresh curry leaves.",
      "Fry papad in hot oil until crisp and bubbly.",
      "Serve hot steamed rice topped with a spoonful of melted ghee and thick toor dal.",
      "Follow with spiced rasam, vegetable curry, crispy papadam, and finish with soothing fresh curd."
    ]
  },
  "chicken-biryani": {
    id: "south-chicken-biryani",
    title: "Chicken Biryani",
    subtitle: "Fragrant Hyderabadi Basmati Dum Biryani with Spiced Chicken & Saffron",
    image: "/images/meal_planner_images/chicken_biryani.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "non-veg",
    time: 50,
    calories: 680,
    protein: "38g",
    carbs: "72g",
    fat: "24g",
    datasetStatus: "Biryani in RecipeNLG (Kheema Biryani variant)",
    ingredients: [
      { name: "Basmati Rice (70% cooked with whole spices)", amount: "2 cups" },
      { name: "Chicken Pieces", amount: "400g" },
      { name: "Yogurt (Dahi)", amount: "1/2 cup" },
      { name: "Biryani Masala, Red Chili, Turmeric", amount: "1 tbsp each" },
      { name: "Fried Onions (Birista)", amount: "1 cup" },
      { name: "Mint & Coriander Leaves", amount: "1/2 cup chopped" },
      { name: "Saffron Milk & Ghee", amount: "3 tbsp each" }
    ],
    instructions: [
      "Marinate chicken with yogurt, ginger-garlic paste, biryani masala, chili powder, half the fried onions, mint, and oil for 1 hour.",
      "Parboil aged basmati rice in salted water with cloves, cardamom, cinnamon, and bay leaf until 70% cooked; drain.",
      "In a heavy-bottom pot, lay the marinated chicken at the base.",
      "Spread the parboiled rice over the chicken. Top with fried onions, chopped mint, coriander, saffron milk, and ghee.",
      "Seal the pot tightly with dough or foil and lid. Cook on high flame for 5 minutes, then on low flame (dum) for 25 minutes.",
      "Rest 10 minutes, gently fluff layers from the bottom, and serve with onion raita and mirchi ka salan."
    ]
  },
  "bagara-rice-chicken-curry": {
    id: "south-bagara-chicken",
    title: "Chicken Curry with Bagara Rice",
    subtitle: "Aromatic Telangana Spiced Rice with Rich Country-Style Chicken Curry",
    image: "/images/meal_planner_images/chicken_curry.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "non-veg",
    time: 40,
    calories: 640,
    protein: "38g",
    carbs: "72g",
    fat: "22g",
    datasetStatus: "Chicken Curry in RecipeNLG (57 recipes); Bagara Rice Missing",
    ingredients: [
      { name: "Basmati / Jeera Rice", amount: "1.5 cups" },
      { name: "Whole Garam Masala (Shahjeera, Cloves, Cardamom)", amount: "1 tbsp" },
      { name: "Sliced Onions, Mint & Coriander", amount: "1 cup" },
      { name: "Chicken Pieces", amount: "350g" },
      { name: "Onion-Tomato-Ginger Gravy", amount: "1.5 cups" },
      { name: "Coriander & Cumin Powder", amount: "1 tsp each" },
      { name: "Ghee / Oil", amount: "2 tbsp" }
    ],
    instructions: [
      "For Bagara Rice: Heat ghee, temper shahjeera, cloves, cinnamon, cardamom, and bay leaf. Sauté sliced onions until golden.",
      "Add mint, coriander, washed rice, and 3 cups of boiling water. Cover and simmer on low for 15 minutes until fluffy.",
      "For Chicken Curry: Heat oil, sauté onions and ginger-garlic paste. Add chicken and sear until color changes.",
      "Add turmeric, chili powder, coriander powder, tomato puree, and salt. Cook until oil separates.",
      "Add 1 cup warm water, cover and simmer for 18 minutes until chicken is fork-tender. Garnish with garam masala.",
      "Serve warm Bagara Rice ladled with spicy, fragrant chicken curry."
    ]
  },
  "mutton-biryani": {
    id: "south-mutton-biryani",
    title: "Mutton Biryani",
    subtitle: "Slow-Cooked Tender Goat Meat layered with Fragrant Basmati Rice & Mint",
    image: "/images/meal_planner_images/mutton_biryani.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "non-veg",
    time: 60,
    calories: 740,
    protein: "42g",
    carbs: "70g",
    fat: "28g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Tender Mutton (Goat meat)", amount: "400g" },
      { name: "Basmati Rice", amount: "2 cups" },
      { name: "Yogurt, Raw Papaya Paste (Tenderizer)", amount: "1/2 cup, 1 tsp" },
      { name: "Fried Onions, Saffron, Ghee", amount: "1 cup, 2 tbsp" }
    ],
    instructions: [
      "Marinate mutton with yogurt, ginger-garlic paste, papaya paste, biryani spices, and mint for at least 3 hours.",
      "Cook mutton until 80% tender. Layer with 70% boiled basmati rice, saffron milk, ghee, and fried onions.",
      "Dum cook on low flame over a tawa for 25 minutes. Rest before opening.",
      "Serve hot with cucumber raita."
    ]
  },
  "sambar-rice": {
    id: "south-sambar-rice",
    title: "Sambar Rice, Full Meals",
    subtitle: "Traditional Sambar Sadam Cooked with Lentils, Drumsticks & Ghee, with Full Meals",
    image: "/images/meal_planner_images/sambar_rice.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "veg",
    time: 30,
    calories: 520,
    protein: "16g",
    carbs: "84g",
    fat: "12g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Rice & Toor Dal", amount: "1 cup rice, 1/2 cup toor dal" },
      { name: "Mixed Vegetables (Drumstick, Carrot, Shallots)", amount: "1.5 cups" },
      { name: "Tamarind Pulp & Sambar Powder", amount: "2 tbsp pulp, 2 tbsp powder" },
      { name: "Ghee, Mustard, Curry Leaves, Hing", amount: "For tempering" }
    ],
    instructions: [
      "Cook rice and toor dal together until very soft and slightly mashed.",
      "In a separate pot, cook vegetables in tamarind water, turmeric, salt, and sambar powder until tender.",
      "Combine cooked rice-dal with vegetable sambar mixture; adjust consistency with warm water.",
      "Heat ghee, temper mustard seeds, dry red chilies, hing, and curry leaves; pour over hot sambar rice.",
      "Serve hot with fried papadam and a dollop of pure ghee."
    ]
  },
  "tomato-rice-lady-finger": {
    id: "south-tomato-rice",
    title: "Tomato Rice, Full Meals, Lady Finger",
    subtitle: "Spiced South Indian Thakkali Sadam with Crisp Bendakaya (Okra) Fry",
    image: "/images/meal_planner_images/tomato_rice.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "veg",
    time: 30,
    calories: 510,
    protein: "14g",
    carbs: "82g",
    fat: "14g",
    datasetStatus: "Tomato Rice in RecipeNLG; Lady Finger Fry Missing",
    ingredients: [
      { name: "Cooked Basmati / Ponni Rice", amount: "2 cups" },
      { name: "Ripe Red Tomatoes", amount: "4 large, pureed & chopped" },
      { name: "Lady Finger (Okra / Bhindi)", amount: "200g, round sliced" },
      { name: "Onions, Ginger-Garlic Paste, Spices", amount: "1 onion, 1 tsp paste" },
      { name: "Peanuts, Mustard Seeds, Curry Leaves", amount: "For crunch" }
    ],
    instructions: [
      "For Tomato Rice: Temper mustard, chana dal, peanuts, and curry leaves in oil. Sauté onions and tomatoes with chili powder and garam masala until oil leaves sides.",
      "Fold in cooked fluffy rice gently and simmer on low for 3 minutes.",
      "For Lady Finger Fry: Sauté dry sliced okra in 1 tbsp oil on high flame with salt, turmeric, and sambar powder until crisp and non-slimy.",
      "Serve tangy Tomato Rice with crunchy Lady Finger fry and curd."
    ]
  },
  "lemon-rice-brinjal": {
    id: "south-lemon-rice",
    title: "Full Meals, Lemon Rice, Brinjal Curry",
    subtitle: "Citrusy Turmeric Chitranna with Spicy Gutti Vankaya (Stuffed Eggplant)",
    image: "/images/meal_planner_images/lemon_rice.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "veg",
    time: 30,
    calories: 540,
    protein: "13g",
    carbs: "85g",
    fat: "16g",
    datasetStatus: "Lemon Rice in RecipeNLG; Brinjal Curry Missing",
    ingredients: [
      { name: "Cooked Rice", amount: "2 cups" },
      { name: "Fresh Lemon Juice", amount: "3 tbsp" },
      { name: "Roasted Peanuts, Mustard Seeds, Turmeric", amount: "2 tbsp peanuts, 1/2 tsp each" },
      { name: "Small Purple Brinjals (Eggplants)", amount: "6 pieces" },
      { name: "Peanut-Sesame-Coconut Masala Paste", amount: "4 tbsp" }
    ],
    instructions: [
      "For Lemon Rice: Temper mustard, urad dal, peanuts, green chilies, and curry leaves in oil. Stir in turmeric and lemon juice. Mix into cooled rice.",
      "For Brinjal Curry: Slit brinjals into four quarters keeping stem intact. Stuff with ground peanut-sesame masala.",
      "Shallow fry stuffed brinjals in oil, add remaining gravy, cover, and simmer for 15 minutes until tender.",
      "Serve bright Lemon Rice alongside rich Gutti Vankaya curry."
    ]
  },
  "bagara-rice-paneer": {
    id: "south-bagara-paneer",
    title: "Full Meals, Bagara Rice, Paneer Curry",
    subtitle: "Aromatic Spiced Ghee Rice with Creamy South Indian Paneer Masala",
    image: "/images/meal_planner_images/paneer_curry.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "veg",
    time: 35,
    calories: 610,
    protein: "22g",
    carbs: "78g",
    fat: "22g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Basmati Rice with Whole Spices (Bagara)", amount: "2 cups" },
      { name: "Fresh Paneer Cubes", amount: "200g" },
      { name: "Cashew-Tomato Gravy", amount: "1 cup" },
      { name: "Garam Masala & Kasuri Methi", amount: "1 tsp each" },
      { name: "Ghee & Butter", amount: "2 tbsp" }
    ],
    instructions: [
      "Cook Bagara rice with caramelized onions, whole garam masala, and mint until fluffy.",
      "Lightly pan-sear paneer cubes in ghee.",
      "Simmer the onion-tomato gravy with cashew paste, chili powder, and garam masala.",
      "Add paneer cubes, crushed kasuri methi, and butter; simmer for 4 minutes.",
      "Serve fragrant Bagara Rice paired with decadent Paneer Curry."
    ]
  },
  "full-meals-carrot": {
    id: "south-meals-carrot",
    title: "Full Meals, Carrot",
    subtitle: "Traditional South Indian Thali with Steamed Rice, Sambar, Curd & Carrot Poriyal",
    image: "/images/meal_planner_images/full_meals.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "veg",
    time: 30,
    calories: 580,
    protein: "16g",
    carbs: "94g",
    fat: "14g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Steamed Rice & Sambar", amount: "1.5 cups rice, 1 cup sambar" },
      { name: "Diced Carrots", amount: "2 cups" },
      { name: "Fresh Grated Coconut", amount: "3 tbsp" },
      { name: "Mustard, Urad Dal, Curry Leaves", amount: "For tempering" },
      { name: "Curd & Papadam", amount: "1 serving each" }
    ],
    instructions: [
      "Steam diced carrots with a pinch of turmeric and salt until tender-crisp.",
      "Heat coconut oil in a pan, crackle mustard seeds, urad dal, green chilies, and curry leaves.",
      "Toss steamed carrots in the tempering, remove from heat, and stir in fresh grated coconut.",
      "Serve alongside hot rice, dal/sambar, cooling curd, and papadam."
    ]
  },
  "full-meals-pulav": {
    id: "south-meals-pulav",
    title: "Full Meals, Pulav",
    subtitle: "Complete Thali Accompanied by Aromatic South Indian Vegetable Pulav",
    image: "/images/meal_planner_images/pulav.jpg",
    mealType: "Lunch",
    cuisine: "South Indian",
    dietType: "veg",
    time: 35,
    calories: 630,
    protein: "17g",
    carbs: "102g",
    fat: "16g",
    datasetStatus: "Pulao in RecipeNLG (Rice Pulao)",
    ingredients: [
      { name: "Basmati Rice", amount: "1.5 cups" },
      { name: "Mixed Veggies (Carrots, Beans, Peas)", amount: "1.5 cups" },
      { name: "Coconut Milk & Water", amount: "1/2 cup milk, 2 cups water" },
      { name: "Whole Spices & Mint Leaves", amount: "1 bay leaf, 4 cloves, 1/4 cup mint" }
    ],
    instructions: [
      "Sauté whole spices, green chilies, onions, and mint in ghee until fragrant.",
      "Add mixed vegetables, coconut milk, washed rice, and water.",
      "Cover and cook on low heat for 18 minutes until rice grains are fluffy and distinct.",
      "Serve hot with vegetable kurma, raita, and full meals accompaniment."
    ]
  },

  // ── Dinner Items ──
  "chapati-veg-curry": {
    id: "south-chapati-veg",
    title: "Chapati with Vegetable Curry",
    subtitle: "Soft Whole Wheat Chapatis with Mixed Vegetable Kurma",
    image: "/images/meal_planner_images/chapati.jpg",
    mealType: "Dinner",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 390,
    protein: "11g",
    carbs: "62g",
    fat: "11g",
    datasetStatus: "Chapati in RecipeNLG (2 recipes); Vegetable Curry in RecipeNLG",
    ingredients: [
      { name: "Whole Wheat Atta (for Chapatis)", amount: "1.5 cups" },
      { name: "Mixed Vegetables (Carrot, Potato, Beans, Peas)", amount: "1.5 cups" },
      { name: "Coconut-Fennel-Poppy Seed Paste", amount: "3 tbsp" },
      { name: "Onion, Tomato, Spices", amount: "1 each, 1 tsp chili powder" },
      { name: "Ghee", amount: "1 tsp" }
    ],
    instructions: [
      "Knead whole wheat flour with water and a pinch of salt into a soft, supple dough. Rest for 15 minutes.",
      "Roll dough into thin discs and cook on a hot tawa, pressing with a cloth or flipping until puffed and spotted golden.",
      "For Kurma: Sauté onions and tomatoes, add vegetables, ground coconut-fennel paste, water, and simmer for 12 minutes.",
      "Serve warm soft chapatis with rich vegetable kurma."
    ]
  },
  "rice-dal-carrot": {
    id: "south-rice-dal-carrot",
    title: "Rice, Dal, Carrot",
    subtitle: "Steamed Rice with Comforting Moong Dal & Spiced Carrot Poriyal",
    image: "/images/meal_planner_images/full_meals.jpg",
    mealType: "Dinner",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 430,
    protein: "14g",
    carbs: "78g",
    fat: "8g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Cooked Steamed Rice", amount: "1.5 cups" },
      { name: "Yellow Moong Dal with Cumin & Ghee", amount: "1 cup" },
      { name: "Carrot Poriyal with Grated Coconut", amount: "1 cup" },
      { name: "Clarified Butter (Ghee)", amount: "1 tsp" }
    ],
    instructions: [
      "Cook moong dal with turmeric and salt until creamy; temper with cumin, garlic, and ghee.",
      "Sauté diced carrots with mustard, curry leaves, and finish with grated coconut.",
      "Serve steamed rice with warm dal, carrot poriyal, and a drizzle of ghee."
    ]
  },
  "rice-dal-cluster-beans": {
    id: "south-rice-cluster-beans",
    title: "Rice, Dal, Cluster Beans",
    subtitle: "Steamed Rice, Toor Dal & Tempered Goruchikkudu (Cluster Beans) Fry",
    image: "/images/meal_planner_images/full_meals.jpg",
    mealType: "Dinner",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 440,
    protein: "15g",
    carbs: "79g",
    fat: "9g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Steamed Rice", amount: "1.5 cups" },
      { name: "Thick Toor Dal", amount: "1 cup" },
      { name: "Cluster Beans (Goruchikkudu)", amount: "200g, trimmed & cut" },
      { name: "Mustard, Garlic, Red Chili Flakes", amount: "For tempering" }
    ],
    instructions: [
      "Boil cluster beans in salted water with turmeric until tender; drain.",
      "Heat oil, crackle mustard seeds, sauté crushed garlic and curry leaves, and toss cluster beans.",
      "Sprinkle roasted peanut powder or grated coconut.",
      "Serve with hot rice and seasoned dal."
    ]
  },
  "roti-aloo-curry": {
    id: "south-roti-aloo",
    title: "Roti, Aloo Curry",
    subtitle: "Phulka Rotis with Spiced South Indian Potato Masala Curry",
    image: "/images/meal_planner_images/aloo_curry.jpg",
    mealType: "Dinner",
    cuisine: "South Indian",
    dietType: "veg",
    time: 20,
    calories: 410,
    protein: "11g",
    carbs: "71g",
    fat: "9g",
    datasetStatus: "Aloo Curry / Roti Missing in RecipeNLG",
    ingredients: [
      { name: "Fresh Phulka Rotis", amount: "3 rotis" },
      { name: "Boiled Potatoes, cubed", amount: "3 medium" },
      { name: "Onions, Tomatoes, Green Chilies", amount: "1 each" },
      { name: "Mustard Seeds, Turmeric, Cumin", amount: "1/2 tsp each" },
      { name: "Fresh Coriander", amount: "2 tbsp" }
    ],
    instructions: [
      "Heat oil in a pan, temper mustard seeds and cumin. Sauté sliced onions and green chilies.",
      "Add chopped tomatoes, turmeric, and chili powder; cook until soft.",
      "Add boiled potato cubes, 1/2 cup water, and simmer for 5 minutes.",
      "Mash a few potato pieces to thicken gravy; garnish with coriander.",
      "Serve warm with freshly puffed rotis."
    ]
  },
  "rice-dal-beetroot": {
    id: "south-rice-beetroot",
    title: "Rice, Dal, Beetroot",
    subtitle: "Steamed Rice with Toor Dal & Vibrant Beetroot Poriyal",
    image: "/images/meal_planner_images/full_meals.jpg",
    mealType: "Dinner",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 420,
    protein: "13g",
    carbs: "76g",
    fat: "8g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Steamed Rice", amount: "1.5 cups" },
      { name: "Yellow Lentil Dal", amount: "1 cup" },
      { name: "Grated Beetroot", amount: "2 cups" },
      { name: "Urad Dal, Mustard, Grated Coconut", amount: "For tempering" }
    ],
    instructions: [
      "Steam or sauté grated beetroot with mustard seeds, green chilies, and curry leaves in 1 tsp oil.",
      "Cover and cook on low for 6 minutes until sweet and tender; fold in fresh grated coconut.",
      "Serve with steaming rice, comforting toor dal, and ghee."
    ]
  },
  "rice-dal-aloo-fry": {
    id: "south-rice-aloo-fry",
    title: "Rice, Dal, Aloo Fry",
    subtitle: "Steamed Rice, Ghee Dal with Crispy Golden Andhra Potato Fry",
    image: "/images/meal_planner_images/aloo_curry.jpg",
    mealType: "Dinner",
    cuisine: "South Indian",
    dietType: "veg",
    time: 25,
    calories: 470,
    protein: "14g",
    carbs: "78g",
    fat: "14g",
    datasetStatus: "Regional Specialty (Missing in RecipeNLG)",
    ingredients: [
      { name: "Steamed Rice & Toor Dal", amount: "1.5 cups rice, 1 cup dal" },
      { name: "Potatoes, small cubes", amount: "2 large" },
      { name: "Red Chili Powder, Turmeric, Cumin", amount: "1 tsp each" },
      { name: "Garlic pods (crushed)", amount: "5 cloves" }
    ],
    instructions: [
      "Heat oil in an iron skillet, add cumin seeds and crushed garlic with skin.",
      "Add potato cubes, turmeric, and salt; shallow fry on medium flame until crisp on the outside.",
      "Sprinkle red chili powder and toss for 2 minutes on low flame.",
      "Serve with piping hot rice and creamy dal."
    ]
  },
  "chapati-tomato-curry": {
    id: "south-chapati-tomato",
    title: "Chapati, Tomato Curry",
    subtitle: "Warm Whole Wheat Chapatis with Sweet & Tangy South Indian Tomato Masala",
    image: "/images/meal_planner_images/chapati.jpg",
    mealType: "Dinner",
    cuisine: "South Indian",
    dietType: "veg",
    time: 20,
    calories: 370,
    protein: "10g",
    carbs: "62g",
    fat: "9g",
    datasetStatus: "Chapati in RecipeNLG; Tomato Curry in RecipeNLG",
    ingredients: [
      { name: "Whole Wheat Chapatis", amount: "3 chapatis" },
      { name: "Fresh Juicy Tomatoes", amount: "4, chopped" },
      { name: "Onions, Green Chilies, Ginger", amount: "1 onion, 2 chilies" },
      { name: "Mustard, Fennel Seeds, Sambar Powder", amount: "1 tsp each" }
    ],
    instructions: [
      "Heat oil, temper mustard and fennel seeds. Sauté onions and curry leaves.",
      "Add tomatoes, turmeric, sambar powder, and salt. Cook until tomatoes breakdown into a rich gravy.",
      "Simmer for 5 minutes and garnish with fresh coriander.",
      "Serve warm with freshly roasted chapatis."
    ]
  }
};

// ── 7-Day South Indian Meal Schedule ──
export const SOUTH_INDIAN_7_DAY_PLAN = [
  {
    day: "Sunday",
    meals: {
      breakfast: {
        recipeId: "south-dosa-chutney",
        title: "Dosa, Chutney",
        description: "Crispy fermented rice crepe served with freshly ground coconut chutney.",
        image: "/images/meal_planner_images/dosa.jpg",
        time: 20,
        calories: 320,
        protein: "7g",
        carbs: "48g",
        fat: "11g",
        dietType: "veg"
      },
      lunch: {
        recipeId: "south-chicken-biryani",
        title: "Chicken Biryani (or) Bagara Rice Chicken Curry",
        options: [
          "Chicken Curry with Bagara Rice",
          "Chicken Biryani",
          "Chicken Fry with Bagara Rice",
          "Mutton Biryani",
          "Ragi Rice with Chicken Curry",
          "Fish Curry with Pulagam",
          "Mutton Curry with Ragi Rice",
          "Bagara Rice with Egg Curry",
          "Veg: Bagara Rice with Mushroom Curry",
          "Veg: Veg Biryani",
          "Veg: Brinjal Biryani",
          "Veg: Full Meals with Brinjal Curry"
        ],
        description: "Royal Hyderabadi Basmati Dum Biryani or spiced Bagara Rice with rich Chicken Curry.",
        image: "/images/meal_planner_images/chicken_biryani.jpg",
        time: 45,
        calories: 680,
        protein: "38g",
        carbs: "72g",
        fat: "24g",
        dietType: "non-veg"
      },
      dinner: {
        recipeId: "south-chapati-veg",
        title: "Chapati with Vegetable Curry (or) Bagara Rice Chicken",
        options: [
          "Non-Veg: Chicken Curry with Bagara Rice",
          "Non-Veg: Chicken Fry with Bagara Rice",
          "Non-Veg: Egg Rice",
          "Veg: Chapati with Vegetable Curry",
          "Veg: Chapati with Dal",
          "Veg: Chapati with Sambar"
        ],
        description: "Soft whole wheat Chapatis served with aromatic spiced vegetable curry or chicken curry.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 25,
        calories: 390,
        protein: "11g",
        carbs: "62g",
        fat: "11g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Monday",
    meals: {
      breakfast: {
        recipeId: "south-upma",
        title: "Upma",
        description: "Warm roasted semolina upma tempered with mustard seeds, curry leaves, and cashews.",
        image: "/images/meal_planner_images/upma.jpg",
        time: 15,
        calories: 260,
        protein: "6g",
        carbs: "42g",
        fat: "8g",
        dietType: "veg"
      },
      lunch: {
        recipeId: "south-sambar-rice",
        title: "Sambar Rice, Full Meals",
        description: "Comforting Sambar Sadam cooked with lentils, drumsticks, and ghee, with full meals.",
        image: "/images/meal_planner_images/sambar_rice.jpg",
        time: 30,
        calories: 520,
        protein: "16g",
        carbs: "84g",
        fat: "12g",
        dietType: "veg"
      },
      dinner: {
        recipeId: "south-rice-dal-carrot",
        title: "Upma (or) Rice, Dal, Carrot",
        options: [
          "Upma",
          "Rice, Dal, Carrot Poriyal"
        ],
        description: "Light evening dinner of warm Upma or steamed Rice, yellow Dal, and fresh Carrot Poriyal.",
        image: "/images/meal_planner_images/full_meals.jpg",
        time: 25,
        calories: 430,
        protein: "14g",
        carbs: "78g",
        fat: "8g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Tuesday",
    meals: {
      breakfast: {
        recipeId: "south-pongal-vada",
        title: "Pongal, Vada, Chutney",
        description: "Ghee Ven Pongal with black pepper and cashews, accompanied by crispy Medu Vada and Chutney.",
        image: "/images/meal_planner_images/pongal_vada.jpg",
        time: 30,
        calories: 460,
        protein: "14g",
        carbs: "56g",
        fat: "20g",
        dietType: "veg"
      },
      lunch: {
        recipeId: "south-tomato-rice",
        title: "Tomato Rice, Full Meals, Lady Finger",
        description: "Tangy spiced Tomato Rice, Full Meals with Rice, Dal, Curd, and crisp Lady Finger (Okra) fry.",
        image: "/images/meal_planner_images/tomato_rice.jpg",
        time: 30,
        calories: 510,
        protein: "14g",
        carbs: "82g",
        fat: "14g",
        dietType: "veg"
      },
      dinner: {
        recipeId: "south-rice-cluster-beans",
        title: "Dosa (or) Rice, Dal, Cluster Beans",
        options: [
          "Crispy Dosa with Chutney",
          "Rice, Dal, Cluster Beans (Goruchikkudu)"
        ],
        description: "Golden Dosa with Chutney or healthy Steamed Rice, Dal, and tempered Cluster Beans.",
        image: "/images/meal_planner_images/dosa.jpg",
        time: 20,
        calories: 410,
        protein: "13g",
        carbs: "72g",
        fat: "9g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Wednesday",
    meals: {
      breakfast: {
        recipeId: "south-idli-vada",
        title: "Idli, Vada",
        description: "Soft steamed fermented rice cakes with crispy Medu Vada, fresh Coconut Chutney, and Sambar.",
        image: "/images/meal_planner_images/idli_vada.jpg",
        time: 25,
        calories: 380,
        protein: "12g",
        carbs: "52g",
        fat: "14g",
        dietType: "veg"
      },
      lunch: {
        recipeId: "south-lemon-rice",
        title: "Full Meals, Lemon Rice, Brinjal Curry",
        description: "Zesty Lemon Rice, traditional Full Meals with Gutti Vankaya (Andhra stuffed Brinjal curry).",
        image: "/images/meal_planner_images/lemon_rice.jpg",
        time: 30,
        calories: 540,
        protein: "13g",
        carbs: "85g",
        fat: "16g",
        dietType: "veg"
      },
      dinner: {
        recipeId: "south-roti-aloo",
        title: "Roti, Aloo Curry",
        description: "Tender whole wheat Phulka Rotis served with home-style South Indian spiced Potato curry.",
        image: "/images/meal_planner_images/aloo_curry.jpg",
        time: 20,
        calories: 410,
        protein: "11g",
        carbs: "71g",
        fat: "9g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Thursday",
    meals: {
      breakfast: {
        recipeId: "south-poori-chutney",
        title: "Poori, Chutney",
        description: "Fluffy puffed golden Pooris served with coconut chutney and mild potato sagu.",
        image: "/images/meal_planner_images/poori.jpg",
        time: 25,
        calories: 420,
        protein: "8g",
        carbs: "50g",
        fat: "22g",
        dietType: "veg"
      },
      lunch: {
        recipeId: "south-bagara-paneer",
        title: "Full Meals, Bagara Rice, Paneer Curry",
        description: "Fragrant Hyderabadi Bagara Rice, Full Meals, and creamy rich South Indian Paneer curry.",
        image: "/images/meal_planner_images/paneer_curry.jpg",
        time: 35,
        calories: 610,
        protein: "22g",
        carbs: "78g",
        fat: "22g",
        dietType: "veg"
      },
      dinner: {
        recipeId: "south-rice-beetroot",
        title: "Rice, Dal, Beetroot (or) Chapati with Egg Roast",
        options: [
          "Rice, Dal, Beetroot Poriyal",
          "Chapati with Egg Roast",
          "Chapati with Sundal Curry"
        ],
        description: "Comforting Rice and Dal with vibrant Beetroot or soft Chapati with South Indian Egg Roast.",
        image: "/images/meal_planner_images/full_meals.jpg",
        time: 25,
        calories: 440,
        protein: "16g",
        carbs: "72g",
        fat: "11g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Friday",
    meals: {
      breakfast: {
        recipeId: "south-uggani-bajji",
        title: "Uggani, Bajji",
        description: "Classic Rayalaseema seasoned puffed rice upma served with hot crispy Mirchi Bajji.",
        image: "/images/meal_planner_images/uggani_bajji.jpg",
        time: 25,
        calories: 480,
        protein: "11g",
        carbs: "64g",
        fat: "21g",
        dietType: "veg"
      },
      lunch: {
        recipeId: "south-meals-carrot",
        title: "Full Meals, Carrot",
        description: "Traditional South Indian Thali with Rice, Dal, Curd, Rasam, Papad, and fresh Carrot Poriyal.",
        image: "/images/meal_planner_images/full_meals.jpg",
        time: 30,
        calories: 580,
        protein: "16g",
        carbs: "94g",
        fat: "14g",
        dietType: "veg"
      },
      dinner: {
        recipeId: "south-rice-aloo-fry",
        title: "Rice, Dal, Aloo Fry",
        description: "Steamed hot rice, seasoned yellow dal with ghee, and crispy spiced Andhra potato fry.",
        image: "/images/meal_planner_images/aloo_curry.jpg",
        time: 25,
        calories: 470,
        protein: "14g",
        carbs: "78g",
        fat: "14g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Saturday",
    meals: {
      breakfast: {
        recipeId: "south-pesarattu-chutney",
        title: "Pesarattu, Chutney",
        description: "Protein-packed whole green moong dal dosa topped with onions and ginger, with spicy Allam Chutney.",
        image: "/images/meal_planner_images/pesarattu.jpg",
        time: 20,
        calories: 340,
        protein: "16g",
        carbs: "46g",
        fat: "10g",
        dietType: "veg"
      },
      lunch: {
        recipeId: "south-meals-pulav",
        title: "Full Meals, Pulav",
        description: "Aromatic South Indian vegetable pulav with coconut milk, served alongside Full Meals.",
        image: "/images/meal_planner_images/pulav.jpg",
        time: 35,
        calories: 630,
        protein: "17g",
        carbs: "102g",
        fat: "16g",
        dietType: "veg"
      },
      dinner: {
        recipeId: "south-chapati-tomato",
        title: "Chapati with Tomato Curry (or) Cabbage Curry",
        options: [
          "Chapati with Tomato Curry",
          "Chapati with Cabbage Curry",
          "Chapati with Cauliflower Curry"
        ],
        description: "Soft whole wheat Chapatis served with choice of tangy Tomato Curry, Cabbage, or Cauliflower curry.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 20,
        calories: 370,
        protein: "10g",
        carbs: "60g",
        fat: "9g",
        dietType: "veg"
      }
    }
  }
];

// ── 7-Day North Indian Meal Schedule ──
export const NORTH_INDIAN_7_DAY_PLAN = [
  {
    day: "Sunday",
    meals: {
      breakfast: {
        title: "Aloo Paratha with Curd & Pickle",
        description: "Crispy whole wheat flatbread stuffed with spiced mashed potatoes, served with churned curd.",
        image: "/images/meal_planner_images/paratha.jpg",
        time: 25,
        calories: 380,
        protein: "10g",
        carbs: "54g",
        fat: "14g",
        dietType: "veg"
      },
      lunch: {
        title: "Chole Bhature with Pickled Onions",
        description: "Puffed deep-fried leavened sourdough bread with slow-simmered Punjabi chickpea curry.",
        image: "/images/meal_planner_images/chole_bhature.jpg",
        time: 40,
        calories: 620,
        protein: "18g",
        carbs: "84g",
        fat: "24g",
        dietType: "veg"
      },
      dinner: {
        title: "Roti with Dal Tadka & Jeera Rice",
        description: "Phulka rotis with yellow lentil tempering, cumin rice, and seasonal cucumber salad.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 25,
        calories: 440,
        protein: "15g",
        carbs: "72g",
        fat: "11g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Monday",
    meals: {
      breakfast: {
        title: "Kanda Poha with Roasted Peanuts",
        description: "Flattened rice sautéed with onions, green chilies, mustard seeds, and crunchy roasted peanuts.",
        image: "/images/meal_planner_images/poha.jpg",
        time: 15,
        calories: 270,
        protein: "6g",
        carbs: "44g",
        fat: "8g",
        dietType: "veg"
      },
      lunch: {
        title: "Rajma Chawal with Mint Chutney",
        description: "Rich Punjabi red kidney bean curry slow-simmered with aromatic spices, over steamed basmati rice.",
        image: "/images/meal_planner_images/rajma_chawal.jpg",
        time: 35,
        calories: 560,
        protein: "21g",
        carbs: "88g",
        fat: "14g",
        dietType: "veg"
      },
      dinner: {
        title: "Phulka with Bhindi Masala",
        description: "Tender spiced okra pan-fried with onions and dry mango powder, served with hot rotis.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 20,
        calories: 360,
        protein: "10g",
        carbs: "58g",
        fat: "10g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Tuesday",
    meals: {
      breakfast: {
        title: "Methi Thepla with Plain Yogurt",
        description: "Spiced Gujarati whole wheat flatbread infused with fresh fenugreek leaves.",
        image: "/images/meal_planner_images/paratha.jpg",
        time: 20,
        calories: 310,
        protein: "9g",
        carbs: "46g",
        fat: "10g",
        dietType: "veg"
      },
      lunch: {
        title: "Kadhi Pakora with Steamed Rice",
        description: "Crispy onion gram flour fritters dunked in tangy turmeric yogurt curry with basmati rice.",
        image: "/images/meal_planner_images/full_meals.jpg",
        time: 30,
        calories: 520,
        protein: "15g",
        carbs: "80g",
        fat: "15g",
        dietType: "veg"
      },
      dinner: {
        title: "Chapati with Aloo Gobi Matar",
        description: "Classic North Indian stir-fry of potatoes, cauliflower, and green peas with warm chapatis.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 25,
        calories: 390,
        protein: "11g",
        carbs: "64g",
        fat: "10g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Wednesday",
    meals: {
      breakfast: {
        title: "Paneer Stuffed Paratha with Butter",
        description: "Crisp griddled whole wheat flatbread loaded with spiced grated cottage cheese.",
        image: "/images/meal_planner_images/paratha.jpg",
        time: 20,
        calories: 420,
        protein: "16g",
        carbs: "48g",
        fat: "18g",
        dietType: "veg"
      },
      lunch: {
        title: "Dal Makhani with Jeera Rice & Naan",
        description: "Velvety slow-cooked black lentils simmered with butter and cream, served with cumin rice.",
        image: "/images/meal_planner_images/dal_makhani.jpg",
        time: 40,
        calories: 610,
        protein: "19g",
        carbs: "82g",
        fat: "22g",
        dietType: "veg"
      },
      dinner: {
        title: "Roti with Baingan Bharta",
        description: "Char-roasted smoky eggplant mashed with onions, tomatoes, green chilies, and garlic.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 25,
        calories: 370,
        protein: "10g",
        carbs: "59g",
        fat: "11g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Thursday",
    meals: {
      breakfast: {
        title: "Suji Upma with Cashews & Peas",
        description: "Light roasted semolina breakfast with green peas, ginger, and ghee-roasted cashews.",
        image: "/images/meal_planner_images/upma.jpg",
        time: 15,
        calories: 270,
        protein: "6g",
        carbs: "43g",
        fat: "8g",
        dietType: "veg"
      },
      lunch: {
        title: "Paneer Butter Masala with Butter Roti",
        description: "Succulent paneer cubes simmered in creamy makhani cashew-tomato gravy.",
        image: "/images/meal_planner_images/paneer_curry.jpg",
        time: 35,
        calories: 630,
        protein: "23g",
        carbs: "68g",
        fat: "28g",
        dietType: "veg"
      },
      dinner: {
        title: "Moong Dal Khichdi with Papad & Ghee",
        description: "Wholesome, soothing one-pot rice and yellow moong dal tempered with cumin and hing.",
        image: "/images/meal_planner_images/full_meals.jpg",
        time: 20,
        calories: 380,
        protein: "14g",
        carbs: "66g",
        fat: "8g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Friday",
    meals: {
      breakfast: {
        title: "Gobi Paratha with Fresh Curd",
        description: "Golden spiced cauliflower stuffed flatbread griddled with butter.",
        image: "/images/meal_planner_images/paratha.jpg",
        time: 20,
        calories: 370,
        protein: "10g",
        carbs: "52g",
        fat: "13g",
        dietType: "veg"
      },
      lunch: {
        title: "Shahi Paneer with Matar Pulav",
        description: "Aromatic green pea basmati pulav with royal Mughlai white almond-cashew paneer gravy.",
        image: "/images/meal_planner_images/pulav.jpg",
        time: 35,
        calories: 640,
        protein: "22g",
        carbs: "84g",
        fat: "24g",
        dietType: "veg"
      },
      dinner: {
        title: "Phulka with Lauki Chana Dal",
        description: "Bottle gourd and bengal gram dal cooked with ginger, cumin, and mild spices with rotis.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 25,
        calories: 370,
        protein: "13g",
        carbs: "62g",
        fat: "8g",
        dietType: "veg"
      }
    }
  },
  {
    day: "Saturday",
    meals: {
      breakfast: {
        title: "Bedmi Poori with Aloo Sabzi",
        description: "Crisp urad dal spiced pooris served with tangy Agra-style potato curry.",
        image: "/images/meal_planner_images/poori.jpg",
        time: 30,
        calories: 450,
        protein: "11g",
        carbs: "58g",
        fat: "20g",
        dietType: "veg"
      },
      lunch: {
        title: "Dum Aloo Kashmiri with Jeera Rice",
        description: "Baby potatoes deep-fried and simmered in aromatic Kashmiri yogurt and fennel gravy.",
        image: "/images/meal_planner_images/aloo_curry.jpg",
        time: 35,
        calories: 580,
        protein: "14g",
        carbs: "86g",
        fat: "19g",
        dietType: "veg"
      },
      dinner: {
        title: "Chapati with Dal Fry & Mix Veg",
        description: "Homestyle yellow dal fry tempered with garlic and onions, fresh mix veg, and soft chapatis.",
        image: "/images/meal_planner_images/chapati.jpg",
        time: 20,
        calories: 390,
        protein: "14g",
        carbs: "64g",
        fat: "9g",
        dietType: "veg"
      }
    }
  }
];

// Helper to calculate dynamic current week days & dates
export function getDynamicWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return dayNames.map((dayName, idx) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + idx);
    const dateFormatted = `${months[d.getMonth()]} ${d.getDate()}`;
    const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isToday = d.toDateString() === today.toDateString();

    return {
      day: dayName,
      date: dateFormatted,
      fullDate,
      isToday
    };
  });
}
