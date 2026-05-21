/**
 * STAB-003 — Extended matching tests (browser console).
 * Run: IngredientMatching.runIngredientMatchingTests()
 * Debug: window.MY_DNA_DIET_MATCH_DEBUG = true (reload), then scan/test.
 */
(function () {
  "use strict";

  function runExtendedIngredientMatchingTests() {
    if (typeof IngredientMatching === "undefined") {
      console.error("Load ingredientAliases.js and ingredient-matching.js first.");
      return { passed: 0, failed: 1, total: 1 };
    }

    const base = IngredientMatching.runIngredientMatchingTests();
    const extra = [];
    function assert(name, cond) {
      extra.push({ name, pass: !!cond });
      if (!cond) console.error("[MyDNA Extended FAIL]", name);
    }

    const punct = IngredientMatching.parseIngredientHierarchy("milk powder, whey.");
    assert("punctuation variance tokens", punct.tokens.some((t) => t.normalized === "milk powder"));

    const may = IngredientMatching.parseIngredientHierarchy("may contain: peanuts, soy");
    assert("may contain split", may.tokens.some((t) => t.normalized.includes("peanut") || t.normalized === "soy"));

    const msgHit = IngredientMatching.evaluateIngredientToken(
      { raw: "yeast extract", normalized: "yeast extract" },
      IngredientMatching.buildIntoleranceMatchIndex(["msg"])
    );
    assert("msg alias yeast extract", msgHit.tier === "definite");

    const lecithin = IngredientMatching.ingredientSimilarity("lecithm", "lecithin");
    assert("fuzzy lecithm", lecithin.distance <= 2 && lecithin.score > 0);

    const all = [...(base.results || []), ...extra];
    const passed = all.filter((r) => r.pass).length;
    console.log(`[MyDNA Extended] ${passed}/${all.length} total assertions passed`);
    return { passed, failed: all.length - passed, total: all.length, results: all };
  }

  if (typeof window !== "undefined") {
    window.runExtendedIngredientMatchingTests = runExtendedIngredientMatchingTests;
  }
})();
