import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Archive, BookOpen, Star, Plus, Check, X, Clock, Trash2, AlertTriangle, Search, Pencil, RotateCcw, Package, Info, ChevronRight, ChevronDown, Link2 } from "lucide-react";

const STORAGE_KEY = "grocery-app-data-v6";

/* ============================================================
   CATEGORIES & LOCATIONS
   ============================================================ */
const CATEGORIES = [
  { id: "produce", label: "Produce", shelfLife: 5, color: "bg-green-100 text-green-800 border-green-300" },
  { id: "dairy", label: "Dairy", shelfLife: 10, color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "meat", label: "Meat/Fish", shelfLife: 3, color: "bg-red-100 text-red-800 border-red-300" },
  { id: "bakery", label: "Bakery", shelfLife: 5, color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "pantry", label: "Pantry", shelfLife: 90, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { id: "frozen", label: "Frozen", shelfLife: 180, color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  { id: "condiments", label: "Condiments", shelfLife: 90, color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "beverages", label: "Beverages", shelfLife: 30, color: "bg-pink-100 text-pink-800 border-pink-300" },
  { id: "spices", label: "Spices", shelfLife: 730, color: "bg-orange-100 text-orange-800 border-orange-300" },
  { id: "snacks", label: "Snacks", shelfLife: 60, color: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "baking", label: "Baking", shelfLife: 365, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "other", label: "Other", shelfLife: 14, color: "bg-gray-100 text-gray-800 border-gray-300" },
];

const LOCATIONS = [
  { id: "fridge", label: "Fridge" },
  { id: "freezer", label: "Freezer" },
  { id: "pasta_cabinet", label: "Pasta Cabinet" },
  { id: "dry_goods", label: "Dry Goods" },
  { id: "spices", label: "Spices & Seasonings" },
  { id: "other", label: "Other" },
];

const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
const locById = (id) => LOCATIONS.find((l) => l.id === id) || LOCATIONS[LOCATIONS.length - 1];
const catIndex = (id) => {
  const i = CATEGORIES.findIndex((c) => c.id === id);
  return i === -1 ? 999 : i;
};

const capitalize = (s) => {
  const t = (s || "").trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/* ============================================================
   GENERIC → SPECIFIC HIERARCHY
   Used to suggest aliases when adding generic staples like "pasta"
   ============================================================ */
const GENERIC_HIERARCHY = {
  pasta: ["rotini", "farfalline", "penne", "spaghetti", "linguine", "fettuccine", "rigatoni",
          "macaroni", "mac & cheese", "orzo", "ramen", "egg noodles", "bowtie", "farfalle",
          "shells", "ziti", "angel hair", "lasagna", "pappardelle", "gnocchi", "udon", "soba",
          "rice noodle", "garofalo"],
  cheese: ["parmesan", "cheddar", "mozzarella", "feta", "goat cheese", "brie", "gouda",
           "swiss", "shredded cheese", "cream cheese", "cottage cheese", "ricotta", "blue cheese",
           "provolone", "manchego", "pecorino", "asiago", "havarti", "queso fresco"],
  bread: ["sourdough", "baguette", "rye", "whole wheat", "white bread", "brioche", "ciabatta",
          "pita", "naan", "tortilla", "bagel", "english muffin", "focaccia", "challah"],
  oil: ["olive oil", "vegetable oil", "canola oil", "sesame oil", "coconut oil", "avocado oil",
        "grapeseed oil", "peanut oil", "sunflower oil"],
  vinegar: ["red wine vinegar", "white vinegar", "apple cider vinegar", "rice vinegar",
            "balsamic", "champagne vinegar", "sherry vinegar"],
  nuts: ["almond", "walnut", "cashew", "peanut", "pistachio", "pecan", "hazelnut",
         "macadamia", "brazil nut", "pine nut"],
  milk: ["whole milk", "skim milk", "2% milk", "oat milk", "almond milk", "soy milk",
         "coconut milk", "cashew milk", "rice milk"],
  berries: ["strawberr", "blueberr", "raspberr", "blackberr", "cranberr", "goji berr"],
  greens: ["spinach", "kale", "arugula", "lettuce", "romaine", "mixed greens", "mesclun", "chard"],
  onion: ["red onion", "yellow onion", "white onion", "shallot", "scallion", "green onion", "leek"],
  pepper: ["bell pepper", "red pepper", "green pepper", "yellow pepper", "jalapeño",
           "serrano", "poblano", "habanero"],
  chicken: ["chicken breast", "chicken thigh", "whole chicken", "ground chicken", "chicken wing", "chicken drumstick"],
  beef: ["ground beef", "steak", "ribeye", "sirloin", "chuck roast", "brisket", "filet"],
  pork: ["pork chop", "pork loin", "pork belly", "ground pork", "bacon", "prosciutto"],
  fish: ["salmon", "tuna", "cod", "tilapia", "halibut", "trout", "mackerel", "sardine"],
  yogurt: ["greek yogurt", "regular yogurt", "icelandic yogurt", "skyr"],
  rice: ["white rice", "brown rice", "jasmine rice", "basmati", "arborio", "wild rice", "sushi rice"],
  beans: ["black beans", "kidney beans", "pinto beans", "garbanzo", "chickpea", "cannellini",
          "navy beans", "lima beans"],
  tomato: ["cherry tomato", "roma tomato", "beefsteak", "heirloom tomato", "canned tomato",
           "tomato paste", "tomato sauce", "crushed tomato"],
  sauce: ["hot sauce", "soy sauce", "fish sauce", "oyster sauce", "worcestershire",
          "sriracha", "sweet & sour sauce", "chocolate sauce"],
  mustard: ["dijon mustard", "yellow mustard", "spicy mustard", "honey mustard", "whole grain mustard"],
  herbs: ["basil", "cilantro", "parsley", "mint", "rosemary", "thyme", "oregano", "sage", "dill", "chive"],
  citrus: ["lemon", "lime", "orange", "grapefruit", "tangerine", "clementine"],
  tea: ["chai", "matcha", "chamomile", "thai iced tea", "green tea", "black tea", "herbal tea"],
};

/* ============================================================
   ITEM DATABASE (same as v4)
   ============================================================ */
const ITEM_DB_RAW = [
  ["apple", "produce", 21], ["avocado", "produce", 5], ["banana", "produce", 5],
  ["bell pepper", "produce", 10], ["pepper", "produce", 10],
  ["strawberr", "produce", 5], ["raspberr", "produce", 4], ["blueberr", "produce", 10],
  ["blackberr", "produce", 5], ["berr", "produce", 5],
  ["broccoli", "produce", 7], ["cabbage", "produce", 30], ["carrot", "produce", 30],
  ["cauliflower", "produce", 7], ["celery", "produce", 14], ["cherr", "produce", 5],
  ["cilantro", "produce", 7], ["corn", "produce", 3], ["cucumber", "produce", 7],
  ["eggplant", "produce", 7], ["garlic", "produce", 60], ["ginger", "produce", 21],
  ["grape", "produce", 7], ["green bean", "produce", 7], ["kale", "produce", 7],
  ["lemon", "produce", 21], ["lime", "produce", 21], ["lettuce", "produce", 10],
  ["mushroom", "produce", 5], ["onion", "produce", 60], ["orange", "produce", 21],
  ["parsley", "produce", 7], ["peach", "produce", 5], ["pear", "produce", 7],
  ["potato", "produce", 30], ["sweet potato", "produce", 30], ["spinach", "produce", 5],
  ["arugula", "produce", 5], ["tomato", "produce", 7], ["zucchini", "produce", 7],
  ["asparagus", "produce", 5], ["brussels sprout", "produce", 10],
  ["green onion", "produce", 7], ["scallion", "produce", 7], ["leek", "produce", 14],
  ["radish", "produce", 14], ["beet", "produce", 21], ["squash", "produce", 14],
  ["pineapple", "produce", 5], ["mango", "produce", 5], ["kiwi", "produce", 7],
  ["watermelon", "produce", 7], ["melon", "produce", 5], ["fig", "produce", 4],

  ["milk", "dairy", 7], ["oat milk", "dairy", 10], ["almond milk", "dairy", 10],
  ["soy milk", "dairy", 10], ["heavy cream", "dairy", 10], ["half and half", "dairy", 7],
  ["butter", "dairy", 30], ["greek yogurt", "dairy", 14], ["yogurt", "dairy", 14],
  ["cream cheese", "dairy", 14], ["sour cream", "dairy", 14], ["cottage cheese", "dairy", 10],
  ["cheddar", "dairy", 30], ["parmesan", "dairy", 60], ["mozzarella", "dairy", 14],
  ["feta", "dairy", 14], ["goat cheese", "dairy", 14], ["brie", "dairy", 14],
  ["shredded cheese", "dairy", 10], ["cheese", "dairy", 21], ["egg", "dairy", 30],

  ["ground beef", "meat", 2], ["steak", "meat", 4],
  ["chicken breast", "meat", 2], ["chicken thigh", "meat", 2], ["whole chicken", "meat", 2],
  ["ground turkey", "meat", 2], ["chicken", "meat", 2],
  ["bacon", "meat", 7], ["deli meat", "meat", 5], ["salami", "meat", 21],
  ["turkey", "meat", 3], ["ham", "meat", 5], ["hot dog", "meat", 7],
  ["sausage", "meat", 3], ["pork chop", "meat", 4], ["pork", "meat", 3],
  ["salmon", "meat", 2], ["tuna", "meat", 2], ["shrimp", "meat", 2],
  ["tilapia", "meat", 2], ["cod", "meat", 2],

  ["sourdough", "bakery", 4], ["baguette", "bakery", 2], ["tortilla", "bakery", 21],
  ["bread", "bakery", 7], ["bagel", "bakery", 5], ["pita", "bakery", 7],
  ["english muffin", "bakery", 14], ["croissant", "bakery", 3],
  ["muffin", "bakery", 4], ["naan", "bakery", 7],

  ["rice", "pantry", 365], ["pasta", "pantry", 365], ["coconut milk", "pantry", 730],
  ["chicken stock", "pantry", 730], ["vegetable stock", "pantry", 730],
  ["broth", "pantry", 730], ["stock", "pantry", 730],
  ["canned bean", "pantry", 730], ["canned tomato", "pantry", 730], ["canned", "pantry", 730],
  ["quinoa", "pantry", 365], ["couscous", "pantry", 365], ["lentil", "pantry", 365],
  ["oat", "pantry", 365], ["dry beans", "pantry", 365], ["ramen", "pantry", 365],

  ["frozen vegetable", "frozen", 240], ["frozen fruit", "frozen", 240],
  ["frozen berr", "frozen", 240], ["ice cream", "frozen", 60],
  ["sherbet", "frozen", 60], ["frozen pizza", "frozen", 180],
  ["frozen meat", "frozen", 180], ["frozen fish", "frozen", 180],
  ["gyoza", "frozen", 180], ["burrito", "frozen", 180], ["frozen", "frozen", 180],

  ["ketchup", "condiments", 180], ["dijon", "condiments", 365], ["mustard", "condiments", 365],
  ["mayonnaise", "condiments", 60], ["mayo", "condiments", 60],
  ["sriracha", "condiments", 365], ["hot sauce", "condiments", 365],
  ["soy sauce", "condiments", 365], ["fish sauce", "condiments", 365],
  ["oyster sauce", "condiments", 365], ["worcestershire", "condiments", 730],
  ["salad dressing", "condiments", 60], ["pickle", "condiments", 90],
  ["salsa", "condiments", 14], ["hummus", "condiments", 7], ["tofu", "condiments", 5],
  ["guacamole", "condiments", 3], ["pesto", "condiments", 7], ["miso", "condiments", 365],
  ["tallow", "condiments", 365], ["lemongrass paste", "condiments", 180],
  ["jelly", "condiments", 180], ["jam", "condiments", 180], ["preserves", "condiments", 180],
  ["peanut butter", "condiments", 180], ["almond butter", "condiments", 180],
  ["chocolate sauce", "condiments", 365], ["cocktail mix", "condiments", 365],
  ["sweet & sour", "condiments", 365], ["sweet and sour", "condiments", 365],

  ["orange juice", "beverages", 10], ["juice", "beverages", 14],
  ["soda", "beverages", 180], ["kombucha", "beverages", 30],
  ["wine", "beverages", 30], ["beer", "beverages", 120],
  ["margarita", "beverages", 365], ["midori", "beverages", 1825],
  ["maraschino", "beverages", 365], ["liqueur", "beverages", 1825],
  ["emergen-c", "beverages", 730],

  ["coffee bean", "pantry", 60], ["coffee", "pantry", 30], ["tea", "pantry", 365],
  ["matcha", "beverages", 365], ["chai", "beverages", 365], ["chamomile", "beverages", 365],

  ["chip", "snacks", 30], ["cracker", "snacks", 60], ["chocolate", "snacks", 365],
  ["granola", "snacks", 90], ["cereal", "snacks", 180],
  ["nut", "snacks", 90], ["almond", "snacks", 90], ["walnut", "snacks", 90],
  ["cashew", "snacks", 90], ["peanut", "snacks", 90], ["pistachio", "snacks", 90],
  ["raisin", "snacks", 365], ["dried", "snacks", 365],
  ["rice krispy", "snacks", 60], ["froot loops", "snacks", 180],
  ["chia seed", "snacks", 365], ["marshmallow", "snacks", 180],

  ["flour", "baking", 180], ["sugar", "baking", 730], ["brown sugar", "baking", 730],
  ["cocoa", "baking", 730], ["cornmeal", "baking", 365], ["corn starch", "baking", 730],
  ["mochi mix", "baking", 365], ["cake mix", "baking", 365], ["brownie mix", "baking", 365],
  ["baking soda", "baking", 730], ["baking powder", "baking", 365],
  ["yeast", "baking", 365], ["vanilla", "baking", 1825], ["almond extract", "baking", 1825],
  ["icing", "baking", 365], ["sprinkles", "baking", 730], ["breadcrumb", "baking", 180],
  ["nutella", "baking", 365], ["cookie butter", "baking", 365], ["agave", "baking", 1825],
  ["honey", "baking", 1825], ["maple syrup", "baking", 365],

  ["salt", "spices", 1825], ["pepper", "spices", 730],
  ["bay leaf", "spices", 730], ["thyme", "spices", 730], ["oregano", "spices", 730],
  ["sage", "spices", 730], ["rosemary", "spices", 730], ["basil", "spices", 730],
  ["parsley", "spices", 730], ["garlic powder", "spices", 730],
  ["granulated garlic", "spices", 730], ["onion powder", "spices", 730],
  ["chopped onion", "spices", 730], ["chili powder", "spices", 730],
  ["red pepper flakes", "spices", 730], ["cumin", "spices", 730],
  ["cinnamon", "spices", 730], ["ginger powder", "spices", 730],
  ["nutmeg", "spices", 730], ["turmeric", "spices", 730], ["paprika", "spices", 730],
  ["saffron", "spices", 730], ["sumac", "spices", 730], ["peppercorn", "spices", 730],
  ["hondashi", "spices", 365], ["furikake", "spices", 365],

  ["olive oil", "condiments", 365], ["vegetable oil", "condiments", 365],
  ["sesame oil", "condiments", 365], ["coconut oil", "condiments", 730],
  ["vinegar", "condiments", 730], ["red wine vinegar", "condiments", 730],
  ["rice vinegar", "condiments", 730], ["mirin", "condiments", 730],

  ["alfredo", "pantry", 365], ["mac & cheese", "pantry", 365], ["mac and cheese", "pantry", 365],
  ["cup-a-soup", "pantry", 365], ["bouillon", "pantry", 730], ["pot pie", "frozen", 180],
];

const ITEM_DB = [...ITEM_DB_RAW].sort((a, b) => b[0].length - a[0].length);

function lookupItem(rawName, learnedMappings) {
  const name = (rawName || "").trim().toLowerCase();
  if (!name) return null;
  if (learnedMappings[name]) return { source: "learned", ...learnedMappings[name] };
  for (const [key, val] of Object.entries(learnedMappings)) {
    if (name.includes(key) || key.includes(name)) return { source: "learned", ...val };
  }
  for (const [keyword, category, shelfLife] of ITEM_DB) {
    if (name.includes(keyword)) return { source: "db", category, shelfLife, matchedOn: keyword };
  }
  return null;
}

/* ============================================================
   STAPLE SATISFACTION LOGIC
   A staple is "satisfied" if:
   - any of its aliases (explicit user-confirmed links) appears in list/pantry, OR
   - the staple name itself (or a learned-synonym substring) matches
   ============================================================ */
function nameIncludes(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function isStapleSatisfied(staple, list, pantry) {
  const allItems = [...list, ...pantry];
  const itemNames = allItems.map((i) => i.name.toLowerCase());

  // 1. Direct name match (substring either way)
  for (const n of itemNames) {
    if (n.includes(staple.name.toLowerCase()) || staple.name.toLowerCase().includes(n)) {
      return true;
    }
  }

  // 2. Any alias match
  if (staple.aliases && staple.aliases.length > 0) {
    for (const alias of staple.aliases) {
      const aliasLower = alias.toLowerCase();
      for (const n of itemNames) {
        if (n.includes(aliasLower) || aliasLower.includes(n)) {
          return true;
        }
      }
    }
  }

  return false;
}

/* ============================================================
   PRELOADED INVENTORY
   ============================================================ */
const PRELOAD_INVENTORY = [
  { name: "Greek yogurt", category: "dairy", location: "fridge" },
  { name: "Eggs", category: "dairy", location: "fridge" },
  { name: "Parmesan", category: "dairy", location: "fridge" },
  { name: "Cream cheese", category: "dairy", location: "fridge" },
  { name: "Milk", category: "dairy", location: "fridge" },
  { name: "Shredded cheese", category: "dairy", location: "fridge" },
  { name: "Salami", category: "meat", location: "fridge" },
  { name: "Celery", category: "produce", location: "fridge" },
  { name: "Carrots", category: "produce", location: "fridge" },
  { name: "Tortillas", category: "bakery", location: "fridge" },
  { name: "Tallow", category: "condiments", location: "fridge" },
  { name: "Dijon mustard (squeeze)", category: "condiments", location: "fridge" },
  { name: "Dijon mustard (jar)", category: "condiments", location: "fridge" },
  { name: "Yellow mustard", category: "condiments", location: "fridge" },
  { name: "Pepper jelly", category: "condiments", location: "fridge" },
  { name: "Lemongrass paste", category: "condiments", location: "fridge" },
  { name: "Apricot preserves", category: "condiments", location: "fridge" },
  { name: "Peanut butter", category: "condiments", location: "fridge" },
  { name: "Mayo", category: "condiments", location: "fridge" },
  { name: "Ketchup", category: "condiments", location: "fridge" },
  { name: "Soy sauce", category: "condiments", location: "fridge" },
  { name: "Oyster sauce", category: "condiments", location: "fridge" },
  { name: "Worcestershire", category: "condiments", location: "fridge" },
  { name: "Sweet & sour sauce", category: "condiments", location: "fridge" },
  { name: "Chocolate sauce", category: "condiments", location: "fridge" },
  { name: "Cocktail mix", category: "condiments", location: "fridge" },
  { name: "Orange juice", category: "beverages", location: "fridge" },
  { name: "Pre-made margarita", category: "beverages", location: "fridge" },
  { name: "Midori", category: "beverages", location: "fridge" },
  { name: "Maraschino cherries", category: "beverages", location: "fridge" },
  { name: "Prebiotic soda", category: "beverages", location: "fridge" },
  { name: "Bread", category: "bakery", location: "freezer" },
  { name: "Frozen burritos", category: "frozen", location: "freezer" },
  { name: "Breakfast burritos", category: "frozen", location: "freezer" },
  { name: "Gyoza", category: "frozen", location: "freezer" },
  { name: "Frozen tropical fruit", category: "frozen", location: "freezer" },
  { name: "Frozen corn", category: "frozen", location: "freezer" },
  { name: "Frozen peas", category: "frozen", location: "freezer" },
  { name: "Frozen mirepoix", category: "frozen", location: "freezer" },
  { name: "Sherbet", category: "frozen", location: "freezer" },
  { name: "Egg noodles", category: "pantry", location: "pasta_cabinet" },
  { name: "Farfalline", category: "pantry", location: "pasta_cabinet" },
  { name: "Pasta (Garofalo)", category: "pantry", location: "pasta_cabinet" },
  { name: "Rotini", category: "pantry", location: "pasta_cabinet" },
  { name: "Ramen", category: "pantry", location: "pasta_cabinet" },
  { name: "Mac & cheese", category: "pantry", location: "pasta_cabinet" },
  { name: "Lentils", category: "pantry", location: "pasta_cabinet" },
  { name: "Pot pies", category: "frozen", location: "pasta_cabinet" },
  { name: "Coconut milk", category: "pantry", location: "pasta_cabinet" },
  { name: "Cup-a-soup", category: "pantry", location: "pasta_cabinet" },
  { name: "Alfredo sauce", category: "pantry", location: "pasta_cabinet" },
  { name: "Breadcrumbs", category: "baking", location: "pasta_cabinet" },
  { name: "Chicken bouillon", category: "pantry", location: "pasta_cabinet" },
  { name: "Rice krispy treats", category: "snacks", location: "dry_goods" },
  { name: "Chocolate rice krispies", category: "snacks", location: "dry_goods" },
  { name: "Froot Loops", category: "snacks", location: "dry_goods" },
  { name: "Granola", category: "snacks", location: "dry_goods" },
  { name: "Peanuts", category: "snacks", location: "dry_goods" },
  { name: "Pistachios", category: "snacks", location: "dry_goods" },
  { name: "Raisins", category: "snacks", location: "dry_goods" },
  { name: "Dried mango", category: "snacks", location: "dry_goods" },
  { name: "Dried peaches", category: "snacks", location: "dry_goods" },
  { name: "Chia seeds", category: "snacks", location: "dry_goods" },
  { name: "Emergen-C", category: "beverages", location: "dry_goods" },
  { name: "Quinoa", category: "pantry", location: "pasta_cabinet" },
  { name: "Nutella", category: "baking", location: "dry_goods" },
  { name: "Cookie butter", category: "baking", location: "dry_goods" },
  { name: "Marshmallows", category: "snacks", location: "dry_goods" },
  { name: "Flour", category: "baking", location: "dry_goods" },
  { name: "White sugar", category: "baking", location: "dry_goods" },
  { name: "Brown sugar", category: "baking", location: "dry_goods" },
  { name: "Cocoa powder", category: "baking", location: "dry_goods" },
  { name: "Cornmeal", category: "baking", location: "dry_goods" },
  { name: "Ube mochi mix", category: "baking", location: "dry_goods" },
  { name: "Cake mix", category: "baking", location: "dry_goods" },
  { name: "Brownie mix", category: "baking", location: "dry_goods" },
  { name: "Corn starch", category: "baking", location: "dry_goods" },
  { name: "Baking powder (x2)", category: "baking", location: "dry_goods" },
  { name: "Yeast (jar)", category: "baking", location: "dry_goods" },
  { name: "Yeast (packets)", category: "baking", location: "dry_goods" },
  { name: "Vanilla", category: "baking", location: "dry_goods" },
  { name: "Almond extract", category: "baking", location: "dry_goods" },
  { name: "Decorating icing", category: "baking", location: "dry_goods" },
  { name: "Sprinkles", category: "baking", location: "dry_goods" },
  { name: "Thai iced tea (x2)", category: "beverages", location: "dry_goods" },
  { name: "Chai", category: "beverages", location: "dry_goods" },
  { name: "Matcha", category: "beverages", location: "dry_goods" },
  { name: "Chamomile", category: "beverages", location: "dry_goods" },
  { name: "Tea (unknown)", category: "beverages", location: "dry_goods" },
  { name: "Agave", category: "baking", location: "dry_goods" },
  { name: "Bay leaves (x2)", category: "spices", location: "spices" },
  { name: "Thyme", category: "spices", location: "spices" },
  { name: "Oregano", category: "spices", location: "spices" },
  { name: "Sage", category: "spices", location: "spices" },
  { name: "Parsley", category: "spices", location: "spices" },
  { name: "Rosemary", category: "spices", location: "spices" },
  { name: "Basil", category: "spices", location: "spices" },
  { name: "Granulated garlic", category: "spices", location: "spices" },
  { name: "Chopped onion", category: "spices", location: "spices" },
  { name: "Chili powder", category: "spices", location: "spices" },
  { name: "Red pepper flakes", category: "spices", location: "spices" },
  { name: "Cumin", category: "spices", location: "spices" },
  { name: "Cinnamon sticks", category: "spices", location: "spices" },
  { name: "Ground cinnamon", category: "spices", location: "spices" },
  { name: "Ginger", category: "spices", location: "spices" },
  { name: "Nutmeg", category: "spices", location: "spices" },
  { name: "Turmeric", category: "spices", location: "spices" },
  { name: "Smoked paprika", category: "spices", location: "spices" },
  { name: "Saffron", category: "spices", location: "spices" },
  { name: "Sumac", category: "spices", location: "spices" },
  { name: "Peppercorns", category: "spices", location: "spices" },
  { name: "Iodized salt", category: "spices", location: "spices" },
  { name: "Sea salt", category: "spices", location: "spices" },
  { name: "Rimming salt", category: "spices", location: "spices" },
  { name: "Hondashi", category: "spices", location: "spices" },
  { name: "Furikake", category: "spices", location: "spices" },
  { name: "Red wine vinegar", category: "condiments", location: "spices" },
  { name: "Rice vinegar", category: "condiments", location: "spices" },
  { name: "Fish sauce", category: "condiments", location: "spices" },
  { name: "Mirin", category: "condiments", location: "spices" },
  { name: "Sesame oil", category: "condiments", location: "spices" },
  { name: "Coconut oil", category: "condiments", location: "spices" },
  { name: "Olive oil", category: "condiments", location: "spices" },
  { name: "Hot sauce", category: "condiments", location: "spices" },
  { name: "Honey", category: "baking", location: "spices" },
];

/* ============================================================
   APP
   ============================================================ */
const emptyState = { list: [], pantry: [], recipes: [], staples: [], learnedMappings: {}, collapsed: {} };
const daysBetween = (a, b) => Math.floor((b - a) / (1000 * 60 * 60 * 24));

export default function GroceryApp() {
  const [tab, setTab] = useState("list");
  const [data, setData] = useState(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) {
          setData({ ...emptyState, ...JSON.parse(res.value) });
        } else {
          const pantry = PRELOAD_INVENTORY.map((item) => ({
            id: crypto.randomUUID(),
            ...item,
            acquiredAt: null,
            shelfLife: null,
          }));
          setData({ ...emptyState, pantry });
        }
      } catch (e) {
        const pantry = PRELOAD_INVENTORY.map((item) => ({
          id: crypto.randomUUID(),
          ...item,
          acquiredAt: null,
          shelfLife: null,
        }));
        setData({ ...emptyState, pantry });
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); }
      catch (e) { console.error("Save failed:", e); }
    })();
  }, [data, loaded]);

  const toggleCollapsed = (key) =>
    setData((d) => ({ ...d, collapsed: { ...d.collapsed, [key]: !d.collapsed[key] } }));

  const learnMapping = (name, category, shelfLife, location) => {
    const key = name.trim().toLowerCase();
    if (!key) return;
    setData((d) => ({
      ...d,
      learnedMappings: { ...d.learnedMappings, [key]: { category, shelfLife, location } },
    }));
  };

  const addListItem = (name, category, shelfLifeOverride) => {
    const trimmed = capitalize(name);
    if (!trimmed) return;
    setData((d) => ({
      ...d,
      list: [...d.list, {
        id: crypto.randomUUID(), name: trimmed, category,
        addedAt: Date.now(), shelfLifeOverride, checked: false,
      }],
    }));
  };
  const updateListItem = (id, updates) =>
    setData((d) => ({ ...d, list: d.list.map((i) => (i.id === id ? { ...i, ...updates } : i)) }));
  const removeListItem = (id) =>
    setData((d) => ({ ...d, list: d.list.filter((i) => i.id !== id) }));
  const toggleChecked = (id) =>
    setData((d) => ({ ...d, list: d.list.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) }));
  const uncheckAll = () =>
    setData((d) => ({ ...d, list: d.list.map((i) => ({ ...i, checked: false })) }));

  const commitCheckedToPantry = (locationAssignments) => {
    const checkedItems = data.list.filter((i) => i.checked);
    if (checkedItems.length === 0) return;
    const newPantryItems = checkedItems.map((item) => {
      const shelfLife = item.shelfLifeOverride ?? catById(item.category).shelfLife;
      return {
        id: crypto.randomUUID(),
        name: item.name,
        category: item.category,
        location: locationAssignments[item.id] || "other",
        acquiredAt: Date.now(),
        shelfLife,
      };
    });
    checkedItems.forEach((item) => {
      const loc = locationAssignments[item.id];
      if (loc) learnMapping(item.name, item.category, item.shelfLifeOverride, loc);
    });
    setData((d) => ({
      ...d,
      list: d.list.filter((i) => !i.checked),
      pantry: [...d.pantry, ...newPantryItems],
    }));
    setTab("pantry");
  };

  const updatePantryItem = (id, updates) =>
    setData((d) => ({ ...d, pantry: d.pantry.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
  const removePantryItem = (id) =>
    setData((d) => ({ ...d, pantry: d.pantry.filter((p) => p.id !== id) }));

  const addRecipe = (recipe) =>
    setData((d) => ({ ...d, recipes: [...d.recipes, { id: crypto.randomUUID(), ...recipe }] }));
  const removeRecipe = (id) =>
    setData((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id) }));
  const addMissingFromRecipe = (recipe) => {
    const have = new Set([...data.list, ...data.pantry].map((i) => i.name.trim().toLowerCase()));
    const missing = recipe.ingredients.filter((ing) => !have.has(ing.name.trim().toLowerCase()));
    if (missing.length === 0) { alert("You already have everything for this recipe."); return; }
    setData((d) => ({
      ...d,
      list: [...d.list, ...missing.map((ing) => ({
        id: crypto.randomUUID(), name: ing.name, category: ing.category,
        addedAt: Date.now(), fromRecipe: recipe.name, checked: false,
      }))],
    }));
    setTab("list");
  };

  const addStaple = (staple) =>
    setData((d) => ({ ...d, staples: [...d.staples, { id: crypto.randomUUID(), ...staple }] }));
  const updateStaple = (id, updates) =>
    setData((d) => ({ ...d, staples: d.staples.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
  const removeStaple = (id) =>
    setData((d) => ({ ...d, staples: d.staples.filter((s) => s.id !== id) }));
  const addStaplesToList = () => {
    const toAdd = data.staples.filter((s) => !isStapleSatisfied(s, data.list, data.pantry));
    if (toAdd.length === 0) { alert("All staples are already in your list or pantry."); return; }
    setData((d) => ({
      ...d,
      list: [...d.list, ...toAdd.map((s) => ({
        id: crypto.randomUUID(), name: s.name, category: s.category,
        addedAt: Date.now(), checked: false,
      }))],
    }));
    setTab("list");
  };

  if (!loaded) return <div className="p-8 text-center text-stone-500">Loading…</div>;

  const checkedCount = data.list.filter((i) => i.checked).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-2xl mx-auto">
        <header className="px-4 pt-6 pb-3">
          <h1 className="text-2xl font-bold tracking-tight">Kitchen</h1>
          <p className="text-sm text-stone-500">
            {data.list.length} to buy ({checkedCount} in cart) · {data.pantry.length} in pantry · {data.staples.length} staples · {data.recipes.length} recipes
          </p>
        </header>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across everything…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        <nav className="flex border-b border-stone-200 sticky top-0 bg-stone-50 z-10">
          <TabButton active={tab === "list"} onClick={() => setTab("list")} icon={ShoppingCart} label="List" />
          <TabButton active={tab === "pantry"} onClick={() => setTab("pantry")} icon={Archive} label="Pantry" />
          <TabButton active={tab === "staples"} onClick={() => setTab("staples")} icon={Star} label="Staples" />
          <TabButton active={tab === "recipes"} onClick={() => setTab("recipes")} icon={BookOpen} label="Recipes" />
        </nav>

        <main className="px-4 py-4 pb-24">
          {tab === "list" && (
            <ListView
              items={data.list} search={search} learnedMappings={data.learnedMappings}
              collapsed={data.collapsed} onToggleCollapsed={toggleCollapsed}
              onAdd={addListItem} onUpdate={updateListItem}
              onToggle={toggleChecked} onRemove={removeListItem}
              onUncheckAll={uncheckAll} onCommit={commitCheckedToPantry}
              onLearn={learnMapping}
            />
          )}
          {tab === "pantry" && (
            <PantryView
              items={data.pantry} search={search}
              collapsed={data.collapsed} onToggleCollapsed={toggleCollapsed}
              onUpdate={updatePantryItem} onRemove={removePantryItem}
            />
          )}
          {tab === "staples" && (
            <StaplesView
              staples={data.staples} list={data.list} pantry={data.pantry}
              search={search} learnedMappings={data.learnedMappings}
              collapsed={data.collapsed} onToggleCollapsed={toggleCollapsed}
              onAdd={addStaple} onUpdate={updateStaple} onRemove={removeStaple}
              onAddAllToList={addStaplesToList} onAddSingleToList={addListItem} onLearn={learnMapping}
            />
          )}
          {tab === "recipes" && (
            <RecipesView
              recipes={data.recipes} pantry={data.pantry} list={data.list}
              search={search} learnedMappings={data.learnedMappings}
              onAdd={addRecipe} onRemove={removeRecipe} onAddMissing={addMissingFromRecipe}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
        active ? "text-stone-900 border-b-2 border-stone-900" : "text-stone-500 hover:text-stone-700"
      }`}>
      <Icon size={15} /> {label}
    </button>
  );
}

/* ============================================================
   EXPLAINER CARD
   ============================================================ */
function ExplainerCard({ storageKey, title, children }) {
  const [dismissed, setDismissed] = useState(false);
  const fullKey = `explainer-dismissed-${storageKey}`;

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(fullKey);
        if (res?.value === "true") setDismissed(true);
      } catch (e) {}
    })();
  }, [fullKey]);

  const dismiss = async () => {
    setDismissed(true);
    try { await window.storage.set(fullKey, "true"); } catch (e) {}
  };

  if (dismissed) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg relative">
      <button onClick={dismiss}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-700">
        <X size={14} />
      </button>
      <div className="flex items-start gap-2 pr-6">
        <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">{title}</h3>
          <div className="text-xs text-blue-800 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COLLAPSIBLE GROUP HEADER
   ============================================================ */
function GroupHeader({ isCollapsed, onToggle, children, level = 1 }) {
  const Chevron = isCollapsed ? ChevronRight : ChevronDown;
  return (
    <button onClick={onToggle}
      className={`w-full flex items-center gap-1.5 mb-2 hover:opacity-70 transition-opacity text-left ${
        level === 1 ? "pb-1 border-b border-stone-200" : ""
      }`}>
      <Chevron size={level === 1 ? 14 : 12} className="text-stone-500 flex-shrink-0" />
      {children}
    </button>
  );
}

/* ============================================================
   SMART ADD INPUT
   ============================================================ */
function SmartAddInput({ learnedMappings, onSubmit, placeholder = "Add item…", showShelfLife = true }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("produce");
  const [shelfLife, setShelfLife] = useState("");
  const [manualCategory, setManualCategory] = useState(false);
  const [manualShelfLife, setManualShelfLife] = useState(false);

  const match = useMemo(() => lookupItem(name, learnedMappings), [name, learnedMappings]);

  useEffect(() => {
    if (match && !manualCategory) setCategory(match.category);
    if (match && !manualShelfLife) setShelfLife(String(match.shelfLife));
  }, [match, manualCategory, manualShelfLife]);

  const submit = () => {
    if (!name.trim()) return;
    const finalShelfLife = showShelfLife && shelfLife ? parseInt(shelfLife, 10) : undefined;
    onSubmit(name, category, finalShelfLife);
    setName(""); setManualCategory(false); setManualShelfLife(false); setShelfLife("");
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400" />
        <button onClick={submit}
          className="px-3 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors">
          <Plus size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <select value={category}
          onChange={(e) => { setCategory(e.target.value); setManualCategory(true); }}
          className="px-2 py-1 rounded border border-stone-300 bg-white text-xs">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {showShelfLife && (
          <>
            <label className="text-stone-500">shelf-life:</label>
            <input type="number" value={shelfLife}
              onChange={(e) => { setShelfLife(e.target.value); setManualShelfLife(true); }}
              placeholder="auto" className="w-14 px-1.5 py-1 rounded border border-stone-200 text-xs" />
            <span className="text-stone-400">days</span>
          </>
        )}
        {name.trim() && (
          <span className="text-stone-400 ml-auto">
            {match ? (
              match.source === "learned" ? "remembered" : `matched "${match.matchedOn}"`
            ) : "new item"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SORTING HELPERS
   ============================================================ */
function sortByCategoryThenAlpha(items) {
  return [...items].sort((a, b) => {
    const ci = catIndex(a.category) - catIndex(b.category);
    if (ci !== 0) return ci;
    return a.name.localeCompare(b.name);
  });
}

function groupByCategory(items) {
  return CATEGORIES
    .map((cat) => ({ cat, items: items.filter((i) => i.category === cat.id).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.items.length > 0);
}

/* ============================================================
   LIST VIEW
   ============================================================ */
function ListView({ items, search, learnedMappings, collapsed, onToggleCollapsed, onAdd, onUpdate, onToggle, onRemove, onUncheckAll, onCommit, onLearn }) {
  const [confirmingCommit, setConfirmingCommit] = useState(false);

  const handleAdd = (name, category, shelfLifeOverride) => {
    onAdd(name, category, shelfLifeOverride);
    onLearn(name, category, shelfLifeOverride);
  };

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const unchecked = filtered.filter((i) => !i.checked);
  const checked = filtered.filter((i) => i.checked);
  const groupedUnchecked = groupByCategory(unchecked);

  if (confirmingCommit) {
    return (
      <CommitToPantry
        items={items.filter((i) => i.checked)}
        learnedMappings={learnedMappings}
        onCancel={() => setConfirmingCommit(false)}
        onConfirm={(assignments) => { onCommit(assignments); setConfirmingCommit(false); }}
      />
    );
  }

  return (
    <div>
      <ExplainerCard storageKey="list" title="Shopping list">
        Add items to buy. While shopping, tap the circle to check things off — they slide to an
        "in cart" tray at the bottom where you can un-check mistakes. When done, tap "put away"
        to move everything into the pantry with the locations set.
      </ExplainerCard>

      <SmartAddInput learnedMappings={learnedMappings} onSubmit={handleAdd} />

      {unchecked.length === 0 && checked.length === 0 && (
        <div className="text-center text-stone-400 py-12 text-sm">
          {search ? "No matches." : "Nothing on the list. Add something above."}
        </div>
      )}
      {unchecked.length === 0 && checked.length > 0 && (
        <div className="text-center text-stone-400 py-6 text-sm">
          Everything's in the cart — scroll down to put away.
        </div>
      )}

      {groupedUnchecked.map(({ cat, items }) => {
        const key = `list-${cat.id}`;
        const isCollapsed = collapsed[key];
        return (
          <div key={cat.id} className="mb-5">
            <GroupHeader isCollapsed={isCollapsed} onToggle={() => onToggleCollapsed(key)}>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${cat.color}`}>{cat.label}</span>
              <span className="text-xs text-stone-400">{items.length}</span>
            </GroupHeader>
            {!isCollapsed && (
              <ul className="space-y-1">
                {items.map((item) => (
                  <ListItemRow key={item.id} item={item}
                    onUpdate={(updates) => onUpdate(item.id, updates)}
                    onToggle={() => onToggle(item.id)}
                    onRemove={() => onRemove(item.id)}
                    onLearn={onLearn} />
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {checked.length > 0 && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingCart size={14} className="text-green-700" />
              <span className="text-sm font-medium text-green-900">
                In cart ({checked.length})
              </span>
            </div>
            <button onClick={onUncheckAll}
              className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1">
              <RotateCcw size={12} /> Uncheck all
            </button>
          </div>
          <ul className="space-y-1 mb-3">
            {sortByCategoryThenAlpha(checked).map((item) => (
              <li key={item.id}
                className="flex items-center gap-2 bg-white/60 rounded px-2 py-1.5 group">
                <button onClick={() => onToggle(item.id)}
                  className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 hover:bg-green-600"
                  title="Un-check">
                  <Check size={12} className="text-white" />
                </button>
                <span className="flex-1 line-through text-stone-500 text-sm">{item.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${catById(item.category).color}`}>
                  {catById(item.category).label}
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => setConfirmingCommit(true)}
            className="w-full py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <Package size={14} /> Done shopping → put away
          </button>
        </div>
      )}
    </div>
  );
}

function ListItemRow({ item, onUpdate, onToggle, onRemove, onLearn }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editShelfLife, setEditShelfLife] = useState(item.shelfLifeOverride ? String(item.shelfLifeOverride) : "");

  const save = () => {
    const trimmed = capitalize(editName);
    if (!trimmed) return;
    const overrideNum = editShelfLife ? parseInt(editShelfLife, 10) : undefined;
    onUpdate({ name: trimmed, category: editCategory, shelfLifeOverride: overrideNum });
    onLearn(trimmed, editCategory, overrideNum);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="bg-white border border-stone-300 rounded-lg p-2">
        <input value={editName} onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-full px-2 py-1 mb-2 rounded border border-stone-300 text-sm" autoFocus />
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
            className="px-2 py-1 rounded border border-stone-300 text-xs">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <label className="text-stone-500">shelf-life:</label>
          <input type="number" value={editShelfLife} onChange={(e) => setEditShelfLife(e.target.value)}
            placeholder="default" className="w-16 px-1.5 py-0.5 rounded border border-stone-200 text-xs" />
          <span className="text-stone-400">d</span>
          <div className="ml-auto flex gap-1">
            <button onClick={save} className="px-2 py-1 rounded bg-stone-900 text-white text-xs hover:bg-stone-700">Save</button>
            <button onClick={() => setEditing(false)} className="px-2 py-1 rounded border border-stone-300 text-xs hover:bg-stone-100">Cancel</button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 group">
      <button onClick={onToggle}
        className="w-5 h-5 rounded-full border-2 border-stone-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-colors flex-shrink-0"
        title="Check off">
        <Check size={12} className="text-green-600 opacity-0 group-hover:opacity-100" />
      </button>
      <span className="flex-1">{item.name}</span>
      {item.shelfLifeOverride && <span className="text-xs text-stone-400">{item.shelfLifeOverride}d</span>}
      {item.fromRecipe && (
        <span className="text-xs text-stone-400 italic truncate max-w-[30%]">{item.fromRecipe}</span>
      )}
      <button onClick={() => setEditing(true)}
        className="text-stone-300 hover:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil size={14} />
      </button>
      <button onClick={onRemove}
        className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </li>
  );
}

/* ============================================================
   COMMIT TO PANTRY
   ============================================================ */
function CommitToPantry({ items, learnedMappings, onCancel, onConfirm }) {
  const defaultLocation = (item) => {
    const learned = learnedMappings[item.name.toLowerCase()];
    if (learned?.location) return learned.location;
    if (item.category === "produce" || item.category === "dairy" || item.category === "meat" || item.category === "beverages") return "fridge";
    if (item.category === "frozen") return "freezer";
    if (item.category === "spices") return "spices";
    if (item.category === "baking" || item.category === "snacks") return "dry_goods";
    if (item.category === "pantry") return "pasta_cabinet";
    return "other";
  };

  const [assignments, setAssignments] = useState(() =>
    Object.fromEntries(items.map((i) => [i.id, defaultLocation(i)]))
  );

  const setLocationForItem = (itemId, locationId) => {
    setAssignments((a) => ({ ...a, [itemId]: locationId }));
  };

  const byLocation = LOCATIONS.map((loc) => ({
    loc,
    items: sortByCategoryThenAlpha(items.filter((i) => assignments[i.id] === loc.id)),
  })).filter((g) => g.items.length > 0);

  const sorted = sortByCategoryThenAlpha(items);

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-1">Where does each item go?</h3>
        <p className="text-xs text-blue-800">
          Review locations, adjust any that are wrong, then confirm. Shelf-life countdown starts now.
        </p>
      </div>

      <ul className="space-y-1 mb-4">
        {sorted.map((item) => (
          <li key={item.id} className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
            <span className={`text-xs px-1.5 py-0.5 rounded border ${catById(item.category).color} flex-shrink-0`}>
              {catById(item.category).label}
            </span>
            <span className="flex-1 text-sm">{item.name}</span>
            <select value={assignments[item.id]}
              onChange={(e) => setLocationForItem(item.id, e.target.value)}
              className="text-xs px-2 py-1 rounded border border-stone-300 bg-white">
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.label}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <div className="mb-4 p-3 bg-stone-100 rounded-lg">
        <div className="text-xs font-medium text-stone-700 mb-2">Preview:</div>
        {byLocation.map(({ loc, items }) => (
          <div key={loc.id} className="mb-1.5 text-xs text-stone-600">
            <strong className="text-stone-800">{loc.label}:</strong> {items.map((i) => i.name).join(", ")}
          </div>
        ))}
      </div>

      <div className="flex gap-2 sticky bottom-0 bg-stone-50 pb-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-sm font-medium">
          Back
        </button>
        <button onClick={() => onConfirm(assignments)}
          className="flex-1 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 text-sm font-medium">
          Confirm & add to pantry
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PANTRY VIEW — nested collapsible
   ============================================================ */
function PantryView({ items, search, collapsed, onToggleCollapsed, onUpdate, onRemove }) {
  const now = Date.now();
  const [groupBy, setGroupBy] = useState("location");

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const withStatus = filtered.map((item) => {
    if (item.acquiredAt && item.shelfLife) {
      return { ...item, daysLeft: item.shelfLife - daysBetween(item.acquiredAt, now), tracked: true };
    }
    return { ...item, tracked: false };
  });

  const urgent = withStatus.filter((i) => i.tracked && i.daysLeft <= 2 && i.daysLeft >= 0);
  const expired = withStatus.filter((i) => i.tracked && i.daysLeft < 0);

  if (items.length === 0) {
    return <div className="text-center text-stone-400 py-12 text-sm">
      Pantry is empty. Check off items on your list to add them here.
    </div>;
  }

  const sortWithinSubgroup = (arr) => {
    const tracked = arr.filter((i) => i.tracked).sort((a, b) => a.daysLeft - b.daysLeft);
    const untracked = arr.filter((i) => !i.tracked).sort((a, b) => a.name.localeCompare(b.name));
    return [...tracked, ...untracked];
  };

  let groups;
  if (groupBy === "location") {
    groups = LOCATIONS
      .map((loc) => {
        const locItems = withStatus.filter((i) => (i.location || "other") === loc.id);
        const subGroups = CATEGORIES
          .map((cat) => ({ cat, items: sortWithinSubgroup(locItems.filter((i) => i.category === cat.id)) }))
          .filter((g) => g.items.length > 0);
        return { key: loc.id, label: loc.label, subGroups, totalCount: locItems.length };
      })
      .filter((g) => g.subGroups.length > 0);
  } else {
    groups = CATEGORIES
      .map((cat) => {
        const catItems = withStatus.filter((i) => i.category === cat.id);
        const subGroups = LOCATIONS
          .map((loc) => ({ loc, items: sortWithinSubgroup(catItems.filter((i) => (i.location || "other") === loc.id)) }))
          .filter((g) => g.items.length > 0);
        return { key: cat.id, label: cat.label, subGroups, cat, totalCount: catItems.length };
      })
      .filter((g) => g.subGroups.length > 0);
  }

  return (
    <div>
      <ExplainerCard storageKey="pantry" title="Pantry">
        Everything you currently have, grouped by where it lives in your kitchen. Expand/collapse
        any section by tapping its header. Things expiring soon sort to the top of each sub-group.
      </ExplainerCard>

      {(urgent.length > 0 || expired.length > 0) && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            {expired.length > 0 && <div><strong>{expired.length}</strong> expired · check & toss</div>}
            {urgent.length > 0 && <div><strong>{urgent.length}</strong> expiring in ≤2 days — use up</div>}
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="text-stone-500">Group by:</span>
        <button onClick={() => setGroupBy("location")}
          className={`px-2 py-1 rounded border ${groupBy === "location" ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-300 hover:bg-stone-100"}`}>
          Location
        </button>
        <button onClick={() => setGroupBy("category")}
          className={`px-2 py-1 rounded border ${groupBy === "category" ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-300 hover:bg-stone-100"}`}>
          Category
        </button>
      </div>

      {groups.map((g) => {
        const topKey = `pantry-${groupBy}-${g.key}`;
        const topCollapsed = collapsed[topKey];
        return (
          <div key={g.key} className="mb-6">
            <GroupHeader isCollapsed={topCollapsed} onToggle={() => onToggleCollapsed(topKey)} level={1}>
              <span className="text-sm font-semibold text-stone-800">{g.label}</span>
              <span className="text-xs font-normal text-stone-400 ml-1">{g.totalCount}</span>
            </GroupHeader>
            {!topCollapsed && g.subGroups.map((sg) => {
              const subKey = groupBy === "location" ? sg.cat.id : sg.loc.id;
              const subLabel = groupBy === "location" ? sg.cat.label : sg.loc.label;
              const subColor = groupBy === "location" ? sg.cat.color : "bg-stone-100 text-stone-700 border-stone-300";
              const fullSubKey = `pantry-${groupBy}-${g.key}-${subKey}`;
              const subCollapsed = collapsed[fullSubKey];
              return (
                <div key={subKey} className="mb-3 ml-4">
                  <GroupHeader isCollapsed={subCollapsed} onToggle={() => onToggleCollapsed(fullSubKey)} level={2}>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${subColor}`}>
                      {subLabel}
                    </span>
                    <span className="text-xs text-stone-400">{sg.items.length}</span>
                  </GroupHeader>
                  {!subCollapsed && (
                    <ul className="space-y-1">
                      {sg.items.map((item) => (
                        <PantryItemRow key={item.id} item={item} groupBy={groupBy}
                          onUpdate={(updates) => onUpdate(item.id, updates)}
                          onRemove={() => onRemove(item.id)} />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function PantryItemRow({ item, groupBy, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editLocation, setEditLocation] = useState(item.location || "other");
  const [editShelfLife, setEditShelfLife] = useState(item.shelfLife ? String(item.shelfLife) : "");
  const [trackExpiration, setTrackExpiration] = useState(!!item.acquiredAt);

  const expired = item.tracked && item.daysLeft < 0;
  const warn = item.tracked && item.daysLeft <= 2 && !expired;

  const save = () => {
    const trimmed = capitalize(editName);
    if (!trimmed) return;
    const shelfLifeNum = editShelfLife ? parseInt(editShelfLife, 10) : null;
    onUpdate({
      name: trimmed,
      category: editCategory,
      location: editLocation,
      shelfLife: trackExpiration ? shelfLifeNum : null,
      acquiredAt: trackExpiration ? (item.acquiredAt || Date.now()) : null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="bg-white border border-stone-300 rounded-lg p-2">
        <input value={editName} onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-full px-2 py-1 mb-2 rounded border border-stone-300 text-sm" autoFocus />
        <div className="flex gap-2 mb-2">
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
            className="flex-1 px-2 py-1 rounded border border-stone-300 text-sm">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
            className="flex-1 px-2 py-1 rounded border border-stone-300 text-sm">
            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs mb-2 flex-wrap">
          <label className="flex items-center gap-1 text-stone-600">
            <input type="checkbox" checked={trackExpiration}
              onChange={(e) => setTrackExpiration(e.target.checked)} />
            Track expiration
          </label>
          {trackExpiration && (
            <>
              <input type="number" value={editShelfLife}
                onChange={(e) => setEditShelfLife(e.target.value)}
                placeholder="days" className="w-16 px-1.5 py-0.5 rounded border border-stone-200 text-xs" />
              <span className="text-stone-400">days from now</span>
            </>
          )}
        </div>
        <div className="flex gap-1 justify-end">
          <button onClick={save} className="px-2 py-1 rounded bg-stone-900 text-white text-xs hover:bg-stone-700">Save</button>
          <button onClick={() => setEditing(false)} className="px-2 py-1 rounded border border-stone-300 text-xs hover:bg-stone-100">Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2 group ${
      expired ? "border-red-300" : warn ? "border-amber-300" : "border-stone-200"
    }`}>
      <span className="flex-1 text-sm">{item.name}</span>
      {item.tracked ? (
        <span className={`text-xs flex items-center gap-1 flex-shrink-0 ${
          expired ? "text-red-600 font-semibold" : warn ? "text-amber-600" : "text-stone-400"
        }`}>
          <Clock size={11} />
          {expired ? `${Math.abs(item.daysLeft)}d past` : `${item.daysLeft}d`}
        </span>
      ) : (
        <span className="text-xs text-stone-300 flex-shrink-0">—</span>
      )}
      <button onClick={() => setEditing(true)}
        className="text-stone-300 hover:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil size={12} />
      </button>
      <button onClick={onRemove} title="Used / threw out"
        className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 size={13} />
      </button>
    </li>
  );
}

/* ============================================================
   STAPLES VIEW — with alias intake & editing
   ============================================================ */
function StaplesView({ staples, list, pantry, search, learnedMappings, collapsed, onToggleCollapsed, onAdd, onUpdate, onRemove, onAddAllToList, onAddSingleToList, onLearn }) {
  const [intakeStaple, setIntakeStaple] = useState(null); // { name, category, suggestions }
  const [editingStaple, setEditingStaple] = useState(null);

  const handleAddAttempt = (name, category) => {
    const trimmed = capitalize(name);
    if (!trimmed) return;
    const lowerName = trimmed.toLowerCase();

    // Build suggestions from: (a) hierarchy, (b) existing pantry/list items
    const hierarchyMatches = GENERIC_HIERARCHY[lowerName] || [];
    const existingItems = [...pantry, ...list].map((i) => i.name);

    // Candidate aliases: hierarchy children + existing items that seem related
    const candidates = new Set();
    hierarchyMatches.forEach((m) => candidates.add(m));
    existingItems.forEach((itemName) => {
      const itemLower = itemName.toLowerCase();
      // Hierarchy-aware match: does the item match any child of this generic?
      for (const child of hierarchyMatches) {
        if (itemLower.includes(child.toLowerCase()) || child.toLowerCase().includes(itemLower)) {
          candidates.add(itemName);
          break;
        }
      }
      // Direct substring match
      if (itemLower.includes(lowerName) && itemLower !== lowerName) {
        candidates.add(itemName);
      }
    });

    // Also: which existing items are actual pantry/list hits (pre-check these)
    const preChecked = new Set();
    existingItems.forEach((itemName) => {
      const itemLower = itemName.toLowerCase();
      if (candidates.has(itemName) || [...candidates].some((c) => c.toLowerCase() === itemLower)) {
        preChecked.add(itemName);
      }
    });

    if (candidates.size > 0) {
      setIntakeStaple({
        name: trimmed,
        category,
        candidates: Array.from(candidates).sort(),
        preChecked,
      });
    } else {
      // No candidates — just add it directly
      onAdd({ name: trimmed, category, aliases: [] });
      onLearn(trimmed, category);
    }
  };

  const confirmIntake = (aliases) => {
    onAdd({ name: intakeStaple.name, category: intakeStaple.category, aliases });
    onLearn(intakeStaple.name, intakeStaple.category);
    setIntakeStaple(null);
  };

  const filtered = search
    ? staples.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
        || (s.aliases || []).some((a) => a.toLowerCase().includes(search.toLowerCase()))
      )
    : staples;
  const grouped = groupByCategory(filtered);

  const missingStaples = staples.filter((s) => !isStapleSatisfied(s, list, pantry));
  const missingCount = missingStaples.length;

  if (intakeStaple) {
    return (
      <StapleAliasIntake
        staple={intakeStaple}
        onConfirm={confirmIntake}
        onCancel={() => setIntakeStaple(null)}
      />
    );
  }

  if (editingStaple) {
    return (
      <StapleAliasIntake
        staple={{
          name: editingStaple.name,
          category: editingStaple.category,
          candidates: (() => {
            const lowerName = editingStaple.name.toLowerCase();
            const hier = GENERIC_HIERARCHY[lowerName] || [];
            const existing = [...pantry, ...list].map((i) => i.name);
            const candidates = new Set([...hier, ...(editingStaple.aliases || [])]);
            existing.forEach((itemName) => {
              const itemLower = itemName.toLowerCase();
              for (const child of hier) {
                if (itemLower.includes(child.toLowerCase()) || child.toLowerCase().includes(itemLower)) {
                  candidates.add(itemName);
                  break;
                }
              }
              if (itemLower.includes(lowerName) && itemLower !== lowerName) {
                candidates.add(itemName);
              }
            });
            return Array.from(candidates).sort();
          })(),
          preChecked: new Set(editingStaple.aliases || []),
        }}
        isEditing
        onConfirm={(aliases) => {
          onUpdate(editingStaple.id, { aliases });
          setEditingStaple(null);
        }}
        onCancel={() => setEditingStaple(null)}
      />
    );
  }

  return (
    <div>
      <ExplainerCard storageKey="staples" title="What are staples?">
        <p className="mb-1.5">
          Staples are things your kitchen should <em>always</em> have — the ingredients you
          reach for weekly without thinking.
        </p>
        <p className="mb-1.5">
          <strong>Generic staples work too.</strong> Add "pasta" and the app will ask which
          specific pastas count (rotini, penne, etc). The staple is satisfied as long as you
          have any of them. Same for "cheese", "bread", "oil", etc.
        </p>
        <p>
          Tap <strong>"Add missing staples to list"</strong> to add only what's genuinely missing.
          Tap the link icon on any staple to edit its "counts as" list.
        </p>
      </ExplainerCard>

      <SmartAddInput learnedMappings={learnedMappings}
        onSubmit={(name, category) => handleAddAttempt(name, category)}
        placeholder="Add staple (e.g. pasta, cheese, milk)…" showShelfLife={false} />

      {staples.length > 0 && (
        <button onClick={onAddAllToList}
          className="w-full mb-4 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors text-sm font-medium disabled:bg-stone-300 disabled:cursor-not-allowed"
          disabled={missingCount === 0}>
          {missingCount === 0
            ? "All staples already in list or pantry"
            : `Add ${missingCount} missing staple${missingCount === 1 ? "" : "s"} to list`}
        </button>
      )}

      {filtered.length === 0 && (
        <div className="text-center text-stone-400 py-8 text-sm">
          {search ? "No matches." : "No staples yet."}
        </div>
      )}

      {grouped.map(({ cat, items }) => {
        const key = `staples-${cat.id}`;
        const isCollapsed = collapsed[key];
        return (
          <div key={cat.id} className="mb-4">
            <GroupHeader isCollapsed={isCollapsed} onToggle={() => onToggleCollapsed(key)}>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${cat.color}`}>{cat.label}</span>
              <span className="text-xs text-stone-400">{items.length}</span>
            </GroupHeader>
            {!isCollapsed && (
              <ul className="space-y-1">
                {items.map((s) => {
                  const satisfied = isStapleSatisfied(s, list, pantry);
                  const aliasCount = (s.aliases || []).length;
                  return (
                    <li key={s.id}
                      className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2 group ${
                        !satisfied ? "border-amber-200" : "border-stone-200"
                      }`}>
                      <button
                        onClick={() => {
                          if (!satisfied) {
                            onAddSingleToList(s.name, s.category);
                          }
                        }}
                        title={satisfied ? "Already in list or pantry" : "Add to shopping list"}
                        className={`flex-shrink-0 transition-colors ${
                          satisfied
                            ? "text-stone-300 cursor-default"
                            : "text-amber-400 hover:text-amber-600 cursor-pointer"
                        }`}>
                        <Star size={14} />
                      </button>
                      <span className="flex-1">{s.name}</span>
                      {aliasCount > 0 && (
                        <span className="text-xs text-stone-400" title={(s.aliases || []).join(", ")}>
                          {aliasCount} alias{aliasCount === 1 ? "" : "es"}
                        </span>
                      )}
                      <span className={`text-xs ${satisfied ? "text-green-700" : "text-amber-700"}`}>
                        {satisfied ? "have" : "need"}
                      </span>
                      <button onClick={() => setEditingStaple(s)}
                        title="Edit aliases"
                        className="text-stone-300 hover:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link2 size={13} />
                      </button>
                      <button onClick={() => onRemove(s.id)}
                        className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StapleAliasIntake({ staple, onConfirm, onCancel, isEditing = false }) {
  const [checked, setChecked] = useState(new Set(staple.preChecked || []));
  const [customAlias, setCustomAlias] = useState("");

  const toggle = (c) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const addCustom = () => {
    const t = customAlias.trim();
    if (!t) return;
    setChecked((prev) => new Set(prev).add(t));
    setCustomAlias("");
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-1">
          What counts as "{staple.name}"?
        </h3>
        <p className="text-xs text-blue-800">
          Check everything that should satisfy this staple. If you have any of these, the staple
          is considered "had". Items already checked are ones you currently own.
        </p>
      </div>

      {staple.candidates.length > 0 && (
        <ul className="space-y-1 mb-4">
          {staple.candidates.map((c) => (
            <li key={c}>
              <label className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-stone-50">
                <input type="checkbox" checked={checked.has(c)}
                  onChange={() => toggle(c)} />
                <span className="flex-1 text-sm">{c}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-4 p-2 bg-stone-100 rounded-lg">
        <div className="text-xs font-medium text-stone-700 mb-1.5">Add a custom "counts as":</div>
        <div className="flex gap-1">
          <input value={customAlias} onChange={(e) => setCustomAlias(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="e.g. orzo"
            className="flex-1 px-2 py-1 rounded border border-stone-300 text-xs" />
          <button onClick={addCustom}
            className="px-2 py-1 rounded bg-stone-700 text-white text-xs hover:bg-stone-900">Add</button>
        </div>
        {[...checked].filter((c) => !staple.candidates.includes(c)).length > 0 && (
          <div className="mt-2 text-xs text-stone-600">
            Custom: {[...checked].filter((c) => !staple.candidates.includes(c)).join(", ")}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-sm font-medium">
          Cancel
        </button>
        <button onClick={() => onConfirm(Array.from(checked))}
          className="flex-1 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 text-sm font-medium">
          {isEditing ? "Save aliases" : "Add staple"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   RECIPES VIEW
   ============================================================ */
function RecipesView({ recipes, pantry, list, search, learnedMappings, onAdd, onRemove, onAddMissing }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");

  const submit = () => {
    if (!name.trim() || !ingredientsText.trim()) return;
    const ingredients = ingredientsText
      .split("\n").map((line) => line.trim()).filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        const rawName = capitalize(parts[0]);
        let category;
        if (parts[1]) {
          const catMatch = CATEGORIES.find(
            (c) => c.label.toLowerCase() === parts[1].toLowerCase() || c.id === parts[1].toLowerCase()
          );
          category = catMatch ? catMatch.id : null;
        }
        if (!category) {
          const match = lookupItem(rawName, learnedMappings);
          category = match ? match.category : "other";
        }
        return { name: rawName, category };
      });
    onAdd({ name: capitalize(name), ingredients });
    setName(""); setIngredientsText(""); setAdding(false);
  };

  const filtered = search
    ? recipes.filter(
        (r) => r.name.toLowerCase().includes(search.toLowerCase())
          || r.ingredients.some((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      )
    : recipes;

  const have = new Set([...list, ...pantry].map((i) => i.name.trim().toLowerCase()));

  return (
    <div>
      <ExplainerCard storageKey="recipes" title="How recipes work">
        <p className="mb-1.5">
          Save a recipe as a list of ingredients. One per line; categories are auto-detected.
        </p>
        <p className="mb-1.5">
          Tap <strong>"Add missing ingredients to list"</strong> — it checks your current list
          <em> and </em> pantry, then adds only the ones you don't have.
        </p>
        <p>
          Each recipe shows "Missing X of Y" so you can see at a glance what the recipe actually
          costs you.
        </p>
      </ExplainerCard>

      {!adding && (
        <button onClick={() => setAdding(true)}
          className="w-full mb-4 py-3 rounded-lg border-2 border-dashed border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors flex items-center justify-center gap-2 text-sm">
          <Plus size={16} /> Add recipe
        </button>
      )}

      {adding && (
        <div className="mb-4 p-3 bg-white border border-stone-200 rounded-lg">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Recipe name"
            className="w-full px-3 py-2 mb-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400" />
          <textarea value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)}
            placeholder={"One ingredient per line. Category auto-detected.\nOptional override: name, category\n\ngarlic\nolive oil\nchicken thighs\ncilantro"}
            rows={8}
            className="w-full px-3 py-2 mb-2 rounded-lg border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-400" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-700 text-sm">Save</button>
            <button onClick={() => { setAdding(false); setName(""); setIngredientsText(""); }}
              className="px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !adding && (
        <div className="text-center text-stone-400 py-8 text-sm">
          {search ? "No matches." : "No recipes yet."}
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((r) => {
          const missing = r.ingredients.filter((ing) => !have.has(ing.name.trim().toLowerCase()));
          return (
            <li key={r.id} className="bg-white border border-stone-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{r.name}</h3>
                  <p className="text-xs text-stone-500">
                    {missing.length === 0
                      ? "You have everything"
                      : `Missing ${missing.length} of ${r.ingredients.length}`}
                  </p>
                </div>
                <button onClick={() => onRemove(r.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {sortByCategoryThenAlpha(r.ingredients).map((ing, i) => {
                  const isMissing = !have.has(ing.name.trim().toLowerCase());
                  return (
                    <span key={i}
                      className={`text-xs px-2 py-0.5 rounded border ${catById(ing.category).color} ${
                        !isMissing ? "opacity-50 line-through" : ""
                      }`}>
                      {ing.name}
                    </span>
                  );
                })}
              </div>
              <button onClick={() => onAddMissing(r)}
                disabled={missing.length === 0}
                className="w-full py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {missing.length === 0 ? "Nothing missing" : `Add ${missing.length} missing to list`}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
