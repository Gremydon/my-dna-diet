/**
 * STAB-003 / STAB-003B — Ingredient alias groups for category-level matching.
 * If a user intolerance matches a root key (or any alias), all aliases in that group are checked.
 */
const GLUTEN_GRAIN_ALIASES = [
  "wheat",
  "barley",
  "rye",
  "malt",
  "malt extract",
  "malt flavoring",
  "malt vinegar",
  "brewer's yeast",
  "brewers yeast",
  "brewer s yeast",
  "semolina",
  "durum",
  "spelt",
  "farro",
  "einkorn",
  "triticale",
  "bulgur",
  "couscous",
  "wheat flour",
  "enriched flour",
  "graham flour",
  "wheat starch",
  "hydrolyzed wheat protein",
  "farina"
];

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
  gluten: GLUTEN_GRAIN_ALIASES,
  wheat: GLUTEN_GRAIN_ALIASES,
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

/** Roots that share the gluten grain alias set (STAB-003B). */
const GLUTEN_LINKED_ROOTS = ["gluten", "wheat"];
