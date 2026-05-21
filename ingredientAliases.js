/**
 * STAB-003 — Ingredient alias groups for category-level matching.
 * If a user intolerance matches a root key (or any alias), all aliases in that group are checked.
 */
const INGREDIENT_ALIASES = {
  milk: [
    "casein",
    "whey",
    "milk protein",
    "sodium caseinate",
    "lactalbumin",
    "lactose",
    "butterfat",
    "curds",
    "ghee",
    "rennet"
  ],
  dairy: [
    "casein",
    "whey",
    "milk protein",
    "sodium caseinate",
    "lactalbumin",
    "lactose",
    "butterfat"
  ],
  soy: [
    "soya",
    "soybean",
    "soy lecithin",
    "soy protein",
    "edamame",
    "tofu",
    "tempeh",
    "miso"
  ],
  gluten: [
    "wheat",
    "barley",
    "rye",
    "triticale",
    "spelt",
    "semolina",
    "durum",
    "farina",
    "malt",
    "brewer yeast"
  ],
  corn: [
    "maize",
    "corn starch",
    "corn syrup",
    "high fructose corn syrup",
    "hfcs",
    "dextrose from corn",
    "zein"
  ],
  msg: [
    "monosodium glutamate",
    "yeast extract",
    "autolyzed yeast",
    "hydrolyzed protein",
    "hydrolyzed vegetable protein",
    "textured protein"
  ],
  "artificial dyes": [
    "red 40",
    "yellow 5",
    "yellow 6",
    "blue 1",
    "blue 2",
    "fd&c",
    "tartrazine",
    "allura red"
  ],
  "sugar alcohols": [
    "sorbitol",
    "mannitol",
    "xylitol",
    "maltitol",
    "erythritol",
    "isomalt",
    "lactitol"
  ]
};
