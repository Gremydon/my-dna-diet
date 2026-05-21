/**
 * STAB-003 — Accuracy hardening: normalization, hierarchy parse, fuzzy + alias matching.
 * Matching-only utilities; display uses raw tokens from parseIngredientHierarchy.
 */
(function (root) {
  "use strict";

  const MATCH_DEBUG =
    typeof root.MY_DNA_DIET_MATCH_DEBUG !== "undefined" && !!root.MY_DNA_DIET_MATCH_DEBUG;

  const STOPWORDS = new Set([
    "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
    "a", "an", "as", "is", "are", "was", "were", "be", "been", "being",
    "contains", "contain", "including", "less", "than", "may", "percent", "pct"
  ]);

  const PUNCT_RE = /[.,;:!?()[\]{}/\\"'`]+/g;

  function logMatchDebug(payload) {
    if (!MATCH_DEBUG) return;
    console.log("[MyDNA Match]", payload);
  }

  /** Phase 1 — normalization (matching only). */
  function normalizeIngredientText(text) {
    if (text == null) return "";
    let s = String(text).toLowerCase().trim();
    if (!s) return "";

    s = s.replace(PUNCT_RE, " ");
    s = s.replace(/-/g, " ");
    s = s.replace(/\s+/g, " ").trim();

    s = fixOcrConfusions(s);

    const words = s.split(" ").map((w) => singularizeWord(w)).filter(Boolean);
    s = words.join(" ");
    return s.replace(/\s+/g, " ").trim();
  }

  const OCR_WORD_FIXES = {
    miik: "milk",
    mlk: "milk",
    iecithin: "lecithin",
    lecithm: "lecithin",
    maitodextrin: "maltodextrin"
  };

  function fixOcrConfusions(s) {
    return s
      .split(" ")
      .map((word) => {
        if (!word) return word;
        let w = word.replace(/0/g, "o").replace(/1/g, "i");
        if (OCR_WORD_FIXES[w]) w = OCR_WORD_FIXES[w];
        return w;
      })
      .join(" ");
  }

  function singularizeWord(word) {
    if (!word || word.length <= 4) return word;
    if (word.endsWith("ies") && word.length > 5) return word.slice(0, -3) + "y";
    if (word.endsWith("es") && word.length > 6) return word.slice(0, -2);
    if (word.endsWith("s") && !word.endsWith("ss") && word.length > 4) return word.slice(0, -1);
    return word;
  }

  /** Phase 2 — Levenshtein + similarity. */
  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = new Array(n + 1);
    let curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      const swap = prev;
      prev = curr;
      curr = swap;
    }
    return prev[n];
  }

  function maxEditDistance(len) {
    if (len < 5) return -1;
    if (len <= 7) return 1;
    return 2;
  }

  function ingredientSimilarity(a, b) {
    const na = normalizeIngredientText(a);
    const nb = normalizeIngredientText(b);
    if (!na || !nb) return { score: 0, exact: false, distance: Infinity, normalizedA: na, normalizedB: nb };
    if (na === nb) return { score: 1, exact: true, distance: 0, normalizedA: na, normalizedB: nb };

    const minLen = Math.min(na.length, nb.length);
    const maxLen = Math.max(na.length, nb.length);
    if (minLen < 5) {
      return { score: 0, exact: false, distance: Infinity, normalizedA: na, normalizedB: nb, reason: "short_string" };
    }

    const dist = levenshtein(na, nb);
    const allowed = maxEditDistance(maxLen);
    if (dist > allowed) {
      return { score: 0, exact: false, distance: dist, normalizedA: na, normalizedB: nb, reason: "over_threshold" };
    }

    const score = 1 - dist / maxLen;
    return { score, exact: false, distance: dist, normalizedA: na, normalizedB: nb, allowed };
  }

  /** Phase 3 — nested ingredient hierarchy. */
  function findMatchingCloseParen(s, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < s.length; i++) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  function parseIngredientHierarchy(text) {
    if (!text || typeof text !== "string") return { tokens: [], rawText: text || "" };

    const rawText = text;
    let s = text.toLowerCase().replace(/\r\n/g, "\n");
    s = s.replace(/contains\s+less\s+than\s+[\d.]+\s*%/gi, " ");
    s = s.replace(/\b(?:contains|may\s+contain)\s*:/gi, ", ");

    const tokens = [];
    const seenNorm = new Set();

    function addToken(raw) {
      let r = raw.replace(/\s+/g, " ").trim();
      r = r.replace(/^[.\s]+|[.\s]+$/g, "");
      if (r.length < 3) return;
      const parts = r.split(/\s+/);
      if (parts.every((w) => STOPWORDS.has(w))) return;
      if (!/[a-z]/.test(r)) return;

      const normalized = normalizeIngredientText(r);
      if (!normalized || normalized.length < 3) return;
      if (seenNorm.has(normalized)) return;
      seenNorm.add(normalized);
      tokens.push({ raw: r, normalized });
    }

    function splitList(str) {
      return str.split(/[,;•·\n|]+/).map((x) => x.trim()).filter(Boolean);
    }

    function walk(segment) {
      segment = segment.trim();
      if (!segment) return;

      while (segment.length) {
        const open = segment.indexOf("(");
        if (open === -1) {
          splitList(segment).forEach(addToken);
          return;
        }

        const before = segment.slice(0, open).trim();
        const fromOpen = segment.slice(open);
        const closeRel = findMatchingCloseParen(fromOpen, 0);
        if (closeRel === -1) {
          splitList(segment.replace(/[()]/g, " ")).forEach(addToken);
          return;
        }

        const inner = fromOpen.slice(1, closeRel).trim();
        const after = fromOpen.slice(closeRel + 1).trim();

        if (before) addToken(before);
        walk(inner);
        segment = after;
      }
    }

    walk(s);
    return { tokens, rawText };
  }

  /** Display-safe ingredient list (raw OCR tokens, not normalized). */
  function parseIngredientsFromText(rawText) {
    return parseIngredientHierarchy(rawText).tokens.map((t) => t.raw);
  }

  /** Alias index built once per scan/test pass. */
  function getAliasGroups() {
    return typeof INGREDIENT_ALIASES !== "undefined" ? INGREDIENT_ALIASES : {};
  }

  function resolveAliasRootsForNormalized(n) {
    const groups = getAliasGroups();
    const roots = new Set();
    if (groups[n]) roots.add(n);
    for (const [root, aliases] of Object.entries(groups)) {
      if (normalizeIngredientText(root) === n) roots.add(root);
      for (const alias of aliases) {
        if (normalizeIngredientText(alias) === n) roots.add(root);
      }
    }
    return [...roots];
  }

  function buildIntoleranceMatchIndex(lowerIntolerances) {
    const normalizedExact = new Set();
    const substringKeys = [];
    const fuzzyCandidates = [];
    const aliasNormSet = new Set();
    const groups = getAliasGroups();

    const addIntol = (raw, kind) => {
      const n = normalizeIngredientText(raw);
      if (!n) return;
      normalizedExact.add(n);
      if (n.length >= 4) substringKeys.push({ n, label: raw, kind });
      if (n.length >= 5) fuzzyCandidates.push({ n, label: raw, kind });

      for (const root of resolveAliasRootsForNormalized(n)) {
        const aliases = groups[root] || [];
        for (const alias of aliases) {
          const na = normalizeIngredientText(alias);
          if (!na) continue;
          aliasNormSet.add(na);
          normalizedExact.add(na);
          if (na.length >= 4) substringKeys.push({ n: na, label: alias, kind: "alias", root });
          if (na.length >= 5) fuzzyCandidates.push({ n: na, label: alias, kind: "alias", root });
        }
      }
    };

    for (const raw of lowerIntolerances || []) {
      addIntol(raw, "intolerance");
    }

    return { normalizedExact, substringKeys, fuzzyCandidates, aliasNormSet };
  }

  function tokenWords(normalized) {
    return normalized.split(/\s+/).filter(Boolean);
  }

  function normalizedSubstringMatch(n, intol) {
    if (!n || !intol) return false;
    if (n === intol) return true;
    const words = tokenWords(n);
    if (intol.length < 4) return words.some((w) => w === intol);
    if (n.length < 4) return words.some((w) => w === intol);
    if (n.includes(intol) || intol.includes(n)) return true;
    return words.some((w) => w.length >= 4 && (w.includes(intol) || intol.includes(w)));
  }

  function evaluateIngredientToken(tokenObj, index) {
    const raw = tokenObj.raw || "";
    const n = tokenObj.normalized || normalizeIngredientText(raw);
    const result = {
      raw,
      normalized: n,
      tier: "none",
      matchType: null,
      matchedTarget: null,
      confidence: 0
    };

    if (!n || !index) return result;

    if (index.normalizedExact.has(n)) {
      result.tier = "definite";
      result.matchType = "exact";
      result.matchedTarget = n;
      result.confidence = 1;
      logMatchDebug({ raw, normalized: n, matchType: "exact", tier: "definite" });
      return result;
    }

    for (const { n: intol, label, kind } of index.substringKeys) {
      if (normalizedSubstringMatch(n, intol)) {
        result.tier = "definite";
        result.matchType = kind === "alias" ? "alias" : "substring";
        result.matchedTarget = label;
        result.confidence = 0.95;
        logMatchDebug({ raw, normalized: n, matchType: result.matchType, matchedTarget: label, tier: "definite" });
        return result;
      }
    }

    if (index.aliasNormSet.has(n)) {
      result.tier = "definite";
      result.matchType = "alias";
      result.matchedTarget = n;
      result.confidence = 0.92;
      logMatchDebug({ raw, normalized: n, matchType: "alias", tier: "definite" });
      return result;
    }

    let bestFuzzy = null;
    for (const cand of index.fuzzyCandidates) {
      const sim = ingredientSimilarity(n, cand.n);
      if (sim.exact || sim.score <= 0) continue;
      if (!bestFuzzy || sim.score > bestFuzzy.sim.score) {
        bestFuzzy = { sim, cand };
      }
      if (sim.distance === 0 || (sim.distance === 1 && sim.score >= 0.88)) break;
    }

    if (bestFuzzy) {
      result.tier = "possible";
      result.matchType = "fuzzy";
      result.matchedTarget = bestFuzzy.cand.label;
      result.confidence = bestFuzzy.sim.score;
      result.fuzzyNote = `"${raw}" may match "${bestFuzzy.cand.label}" (OCR similarity)`;
      logMatchDebug({
        raw,
        normalized: n,
        matchType: "fuzzy",
        matchedTarget: bestFuzzy.cand.label,
        confidence: bestFuzzy.sim.score,
        distance: bestFuzzy.sim.distance,
        tier: "possible"
      });
      return result;
    }

    return result;
  }

  function evaluateAllTokens(tokens, lowerIntolerances) {
    const index = buildIntoleranceMatchIndex(lowerIntolerances);
    return tokens.map((t) => evaluateIngredientToken(t, index));
  }

  function definiteMatch(ingredientToken, lowerIntolerances) {
    const token = {
      raw: ingredientToken,
      normalized: normalizeIngredientText(ingredientToken)
    };
    const index = buildIntoleranceMatchIndex(lowerIntolerances);
    const ev = evaluateIngredientToken(token, index);
    return ev.tier === "definite";
  }

  function anyMatch(ingredientToken, lowerIntolerances) {
    const token = {
      raw: ingredientToken,
      normalized: normalizeIngredientText(ingredientToken)
    };
    const index = buildIntoleranceMatchIndex(lowerIntolerances);
    const ev = evaluateIngredientToken(token, index);
    return ev.tier === "definite" || ev.tier === "possible";
  }

  function runIngredientMatchingTests() {
    const results = [];
    function assert(name, cond) {
      results.push({ name, pass: !!cond });
      if (!cond) console.error("[MyDNA Test FAIL]", name);
    }

    assert("normalize milk-powder variants", [
      "milk-powder",
      "Milk Powder",
      "MILK POWDER",
      "milk powder."
    ].every((v) => normalizeIngredientText(v) === "milk powder"));

    assert("singularize almonds", normalizeIngredientText("almonds") === "almond");
    assert("short words not singularized oddly", normalizeIngredientText("pea") === "pea");

    assert("fuzzy maltodextrin", ingredientSimilarity("maitodextrin", "maltodextrin").distance <= 2);
    assert("no fuzzy pea pear", ingredientSimilarity("pea", "pear").score === 0);

    const nested = parseIngredientHierarchy("seasoning (milk powder, whey, soy lecithin)");
    const norms = nested.tokens.map((t) => t.normalized);
    assert("nested milk powder", norms.includes("milk powder"));
    assert("nested whey", norms.includes("whey"));
    assert("nested soy lecithin", norms.includes("soy lecithin"));
    assert("parent seasoning kept", norms.includes("seasoning"));

    const aliasIndex = buildIntoleranceMatchIndex(["milk"]);
    const caseinHit = evaluateIngredientToken(
      { raw: "casein", normalized: "casein" },
      aliasIndex
    );
    assert(
      "alias casein for milk intolerance",
      caseinHit.tier === "definite" && (caseinHit.matchType === "alias" || caseinHit.matchType === "exact")
    );

    assert("false positive soy toy blocked", ingredientSimilarity("soy", "toy").score === 0);

    const longList = parseIngredientHierarchy(
      Array.from({ length: 40 }, (_, i) => `ingredient${i}, filler${i}`).join(", ")
    );
    assert("long list parses", longList.tokens.length >= 40);

    const passed = results.filter((r) => r.pass).length;
    const failed = results.length - passed;
    console.log(`[MyDNA Tests] ${passed}/${results.length} passed`);
    return { passed, failed, total: results.length, results };
  }

  root.IngredientMatching = {
    MATCH_DEBUG,
    normalizeIngredientText,
    ingredientSimilarity,
    levenshtein,
    parseIngredientHierarchy,
    parseIngredientsFromText,
    buildIntoleranceMatchIndex,
    evaluateIngredientToken,
    evaluateAllTokens,
    definiteMatch,
    anyMatch,
    runIngredientMatchingTests
  };
})(typeof window !== "undefined" ? window : globalThis);
