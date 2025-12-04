const pronounPresets = [
   {
    key: "theyThem",
    label: "They/Them",
    pronouns: {
      subject: "they",
      object: "them",
      possAdj: "their",
      possPron: "theirs",
      reflexive: "themself"
    },
    verbGrammar: "singular"
  },
  {
    key: "sheHer",
    label: "She/Her",
    pronouns: {
      subject: "she",
      object: "her",
      possAdj: "her",
      possPron: "hers",
      reflexive: "herself"
    },
    verbGrammar: "singular"
  },
  {
    key: "heHim",
    label: "He/Him",
    pronouns: {
      subject: "he",
      object: "him",
      possAdj: "his",
      possPron: "his",
      reflexive: "himself"
    },
    verbGrammar: "singular"
  },
  {
    key: "zeZir",
    label: "Ze/Zir",
    pronouns: {
      subject: "ze",
      object: "zir",
      possAdj: "zir",
      possPron: "zirs",
      reflexive: "zirself"
    },
    verbGrammar: "singular"
  },
  {
    key: "xeXem",
    label: "Xe/Xem",
    pronouns: {
      subject: "xe",
      object: "xem",
      possAdj: "xyr",
      possPron: "xyrs",
      reflexive: "xemself"
    },
    verbGrammar: "singular"
  },
  { key: "custom", label: "Custom (type any values)", custom: true }
];

const extinctionPresets = [
  { key: "none", label: "None", terms: [] },
  {
    key: "heHim",
    label: "he / him / his / himself",
    terms: ["he", "him", "his", "himself"],
    pronouns: {
      subject: "he",
      object: "him",
      possAdj: "his",
      possPron: "his",
      reflexive: "himself"
    }
  },
  {
    key: "sheHer",
    label: "she / her / hers / herself",
    terms: ["she", "her", "hers", "herself"],
    pronouns: {
      subject: "she",
      object: "her",
      possAdj: "her",
      possPron: "hers",
      reflexive: "herself"
    }
  },
  {
    key: "theyThem",
    label: "they / them / theirs / themselves",
    terms: ["they", "them", "theirs", "themselves"],
    pronouns: {
      subject: "they",
      object: "them",
      possAdj: "their",
      possPron: "theirs",
      reflexive: "themselves"
    }
  },
  {
    key: "zeZir",
    label: "ze / zir / zirs / zirself",
    terms: ["ze", "zir", "zirs", "zirself"],
    pronouns: {
      subject: "ze",
      object: "zir",
      possAdj: "zir",
      possPron: "zirs",
      reflexive: "zirself"
    }
  },
  {
    key: "xeXem",
    label: "xe / xem / xyrs / xemself",
    terms: ["xe", "xem", "xyrs", "xemself"],
    pronouns: {
      subject: "xe",
      object: "xem",
      possAdj: "xyr",
      possPron: "xyrs",
      reflexive: "xemself"
    }
  },
  { key: "custom", label: "Custom (type exact terms)", custom: true }
];

let sentencePatternsSource =
  typeof BASE_SENTENCE_PATTERNS !== "undefined" ? BASE_SENTENCE_PATTERNS : null;
let sentenceBuilder =
  typeof buildSentenceFromPattern === "function" ? buildSentenceFromPattern : null;

if (typeof module !== "undefined" && module.exports && (!sentencePatternsSource || !sentenceBuilder)) {
  try {
    const engine = require("./sentences.js");
    sentencePatternsSource = sentencePatternsSource || engine.BASE_SENTENCE_PATTERNS;
    sentenceBuilder = sentenceBuilder || engine.buildSentenceFromPattern;
  } catch (e) {
    // ignore missing engine in non-node contexts
  }
}

const appState = {
  setup: {
    targetName: "",
    deadname: "",
    pronouns: {
      subject: "",
      object: "",
      possAdj: "",
      possPron: "",
      reflexive: ""
    },
    verbGrammar: "plural",
    extinctionPronouns: {
      subject: "",
      object: "",
      possAdj: "",
      possPron: "",
      reflexive: ""
    },
    extinctionPronounSets: []
  },
  trials: [],
  currentTrialIndex: 0,
  results: { mapping: [], extinction: [], dual: [], editing: [] },
  dualTimers: { number: null, pronoun: null, block: null, progress: null },
  activeDualCleanup: null
};

const defaultSessionMinutes = 5;
const pacingSecondsPerTrial = { mapping: 6, extinction: 6, editing: 7 };

const summaryStorageKey = "noun-gym-last-summary";

const doc = typeof document !== "undefined" ? document : null;
const setupForm = doc ? doc.getElementById("setup-form") : null;

const setupScreen = doc ? doc.getElementById("setup-screen") : null;
const testScreen = doc ? doc.getElementById("test-screen") : null;
const summaryScreen = doc ? doc.getElementById("summary-screen") : null;
const trialContainer = doc ? doc.getElementById("trial-container") : null;
const trialCounter = doc ? doc.getElementById("trial-counter") : { textContent: "" };
const practiceName = doc ? doc.getElementById("practice-name") : { textContent: "" };
const summaryStats = doc ? doc.getElementById("summary-stats") : null;
const savedSummarySection = doc ? doc.getElementById("saved-summary") : null;
const savedSummaryGrid = doc ? doc.getElementById("saved-summary-grid") : null;
const savedSummaryMeta = doc ? doc.getElementById("saved-summary-meta") : null;
const clearSummaryBtn = doc ? doc.getElementById("clear-summary-btn") : null;
const endSessionBtn = doc ? doc.getElementById("end-session-btn") : null;
const cacheClearFooter = doc ? doc.getElementById("cache-clear-footer") : null;
const clearStorageLink = doc ? doc.getElementById("clear-storage-link") : null;
const shareSetupBtn = doc ? doc.getElementById("share-setup-btn") : null;
const targetNameInput = doc ? doc.getElementById("targetName") : null;
const pronounPresetSelect = doc ? doc.getElementById("pronounPreset") : null;
const extinctionPresetSelect = doc ? doc.getElementById("extinctionPreset") : null;
const extinctionCustomFields = doc ? doc.getElementById("extinction-custom-fields") : { classList: { toggle: () => {} } };
const extinctionChips = doc ? doc.getElementById("extinction-chips") : null;
const pronounInputs = {
  subject: doc ? doc.querySelector('input[name="subject"]') : null,
  object: doc ? doc.querySelector('input[name="object"]') : null,
  possAdj: doc ? doc.querySelector('input[name="possAdj"]') : null,
  possPron: doc ? doc.querySelector('input[name="possPron"]') : null,
  reflexive: doc ? doc.querySelector('input[name="reflexive"]') : null
};
const extinctionInputs = {
  subject: doc ? doc.querySelector('input[name="extinctionSubject"]') : null,
  object: doc ? doc.querySelector('input[name="extinctionObject"]') : null,
  possAdj: doc ? doc.querySelector('input[name="extinctionPossAdj"]') : null,
  possPron: doc ? doc.querySelector('input[name="extinctionPossPron"]') : null,
  reflexive: doc ? doc.querySelector('input[name="extinctionReflexive"]') : null
};
const grammarRadios = doc ? doc.querySelectorAll('input[name="verbGrammar"]') : [];
const sessionLengthSelect = doc ? doc.getElementById("sessionLength") : null;
const deadnameInput = doc ? doc.getElementById("deadname") : null;

const isTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints && navigator.maxTouchPoints > 0;

function populateSelect(selectEl, presets, defaultKey) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  presets.forEach((preset) => {
    const opt = doc ? document.createElement("option") : null;
    if (!opt) return;
    opt.value = preset.key;
    opt.textContent = preset.label;
    if (preset.key === defaultKey) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function setGrammar(value) {
  grammarRadios.forEach((radio) => {
    radio.checked = radio.value === value;
  });
}

function getSelectedValues(selectEl) {
  if (!selectEl) return [];
  return Array.from(selectEl.selectedOptions || []).map((opt) => opt.value);
}

function applyPronounPreset(key) {
  const preset = pronounPresets.find((p) => p.key === key);
  if (!preset || preset.custom) return;
  Object.entries(preset.pronouns).forEach(([k, v]) => {
    if (pronounInputs[k]) pronounInputs[k].value = v;
  });
  setGrammar(preset.verbGrammar);
}

function applyExtinctionPreset(keys) {
  const selectedKeys = Array.isArray(keys) ? keys : [keys];
  const preset = extinctionPresets.find((p) => selectedKeys.includes(p.key));
  const hasCustom = selectedKeys.includes("custom");

  toggleExtinctionCustomFields(hasCustom);

  if (hasCustom) {
    Object.values(extinctionInputs).forEach((input) => {
      if (input) input.value = "";
    });
  } else if (preset && preset.pronouns && selectedKeys.length === 1) {
    Object.entries(extinctionInputs).forEach(([k, input]) => {
      if (input) input.value = preset.pronouns[k] || "";
    });
  }

  renderExtinctionChips(selectedKeys);
}

function renderExtinctionChips(selectedKeys = []) {
  if (!extinctionChips) return;
  extinctionChips.innerHTML = "";

  const chips = selectedKeys
    .map((key) => extinctionPresets.find((p) => p.key === key))
    .filter(Boolean);

  if (!chips.length) {
    const placeholder = document.createElement("span");
    placeholder.className = "chip muted";
    placeholder.textContent = "No sets selected";
    extinctionChips.appendChild(placeholder);
    return;
  }

  chips.forEach((preset) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = preset.custom ? "Custom set" : preset.label;
    extinctionChips.appendChild(chip);
  });
}

function toggleExtinctionCustomFields(show) {
  extinctionCustomFields.classList.toggle("hidden", !show);
}

function inferGrammarFromPronoun(pronoun) {
  const p = (pronoun || "").toLowerCase();
  const pluralSubjects = ["they", "we", "you", "y'all", "yall", "ya'll"];
  return pluralSubjects.includes(p) ? "plural" : "singular";
}

const grammarLexicon = {
  plural: {
    be: "are",
    have: "have",
    do: "do",
    go: "go",
    need: "need",
    plan: "plan",
    prefer: "prefer",
    bring: "bring",
    make: "make",
    finish: "finish",
    check: "check",
    share: "share",
    care: "care",
    lead: "lead",
    support: "support",
    s: "",
    were: "were",
    "don't": "don't"
  },
  singular: {
    be: "is",
    have: "has",
    do: "does",
    go: "goes",
    need: "needs",
    plan: "plans",
    prefer: "prefers",
    bring: "brings",
    make: "makes",
    finish: "finishes",
    check: "checks",
    share: "shares",
    care: "cares",
    lead: "leads",
    support: "supports",
    s: "s",
    were: "was",
    "don't": "doesn't"
  }
};
// Always treat they/them as plural, regardless of override
function resolveGrammar(subject, overrideGrammar, hint) {
  const normalized = (subject || "").trim().toLowerCase();
  // If the subject is they/them, always use plural grammar
  if (normalized === "they" || normalized === "them") {
    return "plural";
  }
  // Force singular for names when explicitly hinted
  if (hint === "name") {
    return "singular";
  }
  // Use overrideGrammar only when provided and the subject is not they/them
  if (overrideGrammar) {
    return overrideGrammar;
  }
  // Fall back to grammar inferred from the subject
  return inferGrammarFromPronoun(normalized);
}

const languageTokenRegex = /\{([^}]+)\}/g;

function conjugateVerb(base, grammarSet) {
  if (!base) return base;
  if (grammarSet[base] !== undefined) return grammarSet[base];
  const needsS = grammarSet === grammarLexicon.singular;
  return needsS ? `${base}${grammarSet.s}` : base;
}

function applyLanguageRules(template, overrides = {}) {
  const { verbGrammar } = appState.setup;
  const targetName = overrides.name ?? overrides.targetName ?? appState.setup.targetName;
  const deadname = overrides.deadname ?? overrides.deadName ?? appState.setup.deadname;
  const pronouns = overrides.pronouns || overrides.pronounSet || appState.setup.pronouns;
  const grammar = overrides.grammar || verbGrammar || inferGrammarFromPronoun(pronouns.subject);
  const subject = (pronouns.subject || "").toLowerCase();
  const grammarForPronouns = resolveGrammar(subject, grammar);

  const context = {
    targetName,
    deadname: deadname || "their old name",
    pronouns,
    grammar
  };

  const grammarTokens = grammarLexicon[grammarForPronouns] || grammarLexicon.plural;

  return template.replace(languageTokenRegex, (match, rawToken) => {
    const parts = rawToken.trim().toLowerCase().split(":");
    const token = parts[0];
    const hint = parts[1];

    const pronounTokens = {
      subject: context.pronouns.subject,
      object: context.pronouns.object,
      possadj: context.pronouns.possAdj,
      posspron: context.pronouns.possPron,
      reflexive: context.pronouns.reflexive
    };

    if (token === "name") return context.targetName;
    if (token === "deadname") return context.deadname;
    if (token in pronounTokens) return pronounTokens[token] || "";

    const resolvedGrammar = resolveGrammar(context.pronouns.subject, grammar, hint);
    const grammarSet = grammarLexicon[resolvedGrammar] || grammarTokens;
    if (token === "are" || token === "be") return grammarSet.be;
    if (token === "have") return grammarSet.have;
    if (token === "do") return grammarSet.do;
    if (token === "were") return grammarSet.were;
    if (token === "don't") return grammarSet["don't"];
    if (grammarSet[token] !== undefined) return grammarSet[token];

    if (token.startsWith("verb-")) {
      const base = token.slice(5);
      return conjugateVerb(base, grammarSet);
    }
    if (grammarSet[token] === undefined) {
      return conjugateVerb(token, grammarSet);
    }

    return match;
  });
}

function shuffle(arr) {
  return arr
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSentencePatterns() {
  return sentencePatternsSource || [];
}

function getPatternsForModeAndRole(mode, role) {
  return (getSentencePatterns() || []).filter((p) => {
    return (!p.modes || p.modes.includes(mode)) &&
      (!role || (p.pronounRolesUsed || []).includes(role));
  });
}

function buildSentence(pattern, pronounSet, options = {}) {
  if (typeof buildSentenceFromPattern === "function") {
    return buildSentenceFromPattern(pattern, pronounSet, options);
  }
  if (typeof sentenceBuilder === "function") {
    return sentenceBuilder(pattern, pronounSet, options);
  }
  const text = pattern.template || "";
  return applyLanguageRules(text, { pronouns: pronounSet, ...options });
}

function collectSetupPayload(formData) {
  const extinctionPresets = formData.getAll("extinctionPreset").filter(Boolean);

  return {
    targetName: (formData.get("targetName") || "").trim(),
    deadname: (formData.get("deadname") || "").trim(),
    pronounPreset: formData.get("pronounPreset") || "",
    pronouns: {
      subject: (formData.get("subject") || "").trim(),
      object: (formData.get("object") || "").trim(),
      possAdj: (formData.get("possAdj") || "").trim(),
      possPron: (formData.get("possPron") || "").trim(),
      reflexive: (formData.get("reflexive") || "").trim()
    },
    verbGrammar: formData.get("verbGrammar") || "plural",
    extinctionPresets,
    extinctionCustom: {
      subject: (formData.get("extinctionSubject") || "").trim(),
      object: (formData.get("extinctionObject") || "").trim(),
      possAdj: (formData.get("extinctionPossAdj") || "").trim(),
      possPron: (formData.get("extinctionPossPron") || "").trim(),
      reflexive: (formData.get("extinctionReflexive") || "").trim()
    },
    testStyles: {
      mapping: formData.get("testStyleMapping") !== null,
      extinction: formData.get("testStyleExtinction") !== null,
      dual: formData.get("testStyleDual") !== null,
      editing: formData.get("testStyleEditing") !== null
    },
    sessionLength: Number(formData.get("sessionLength")) || defaultSessionMinutes
  };
}

function encodeSetupPayload(payload) {
  const params = new URLSearchParams();

  if (payload.targetName) params.set("name", payload.targetName);
  if (payload.deadname) params.set("dead", payload.deadname);
  if (payload.pronounPreset) params.set("preset", payload.pronounPreset);
  params.set("grammar", payload.verbGrammar || "plural");

  Object.entries(payload.pronouns || {}).forEach(([key, value]) => {
    if (value) params.set(`pro_${key}`, value);
  });

  if (payload.extinctionPresets && payload.extinctionPresets.length) {
    params.set("ext", payload.extinctionPresets.join(","));
  }

  Object.entries(payload.extinctionCustom || {}).forEach(([key, value]) => {
    if (value) params.set(`ext_${key}`, value);
  });

  Object.entries(payload.testStyles || {}).forEach(([key, enabled]) => {
    if (enabled) params.set(`test_${key}`, "1");
  });

  if (payload.sessionLength) params.set("minutes", String(payload.sessionLength));

  return params.toString();
}

function decodeSetupPayload(search) {
  const query = search.startsWith("?") ? search.slice(1) : search.replace(/^#/, "");
  if (!query) return null;

  const params = new URLSearchParams(query);
  const rawMinutes = Number(params.get("minutes"));

  const testStyles = {
    mapping: params.has("test_mapping"),
    extinction: params.has("test_extinction"),
    dual: params.has("test_dual"),
    editing: params.has("test_editing")
  };

  const extinctionPresets = (params.get("ext") || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return {
    targetName: params.get("name") || "",
    deadname: params.get("dead") || "",
    pronounPreset: params.get("preset") || "",
    pronouns: {
      subject: params.get("pro_subject") || "",
      object: params.get("pro_object") || "",
      possAdj: params.get("pro_possAdj") || "",
      possPron: params.get("pro_possPron") || "",
      reflexive: params.get("pro_reflexive") || ""
    },
    verbGrammar: params.get("grammar") || "plural",
    extinctionPresets,
    extinctionCustom: {
      subject: params.get("ext_subject") || "",
      object: params.get("ext_object") || "",
      possAdj: params.get("ext_possAdj") || "",
      possPron: params.get("ext_possPron") || "",
      reflexive: params.get("ext_reflexive") || ""
    },
    testStyles: Object.values(testStyles).some(Boolean) ? testStyles : null,
    sessionLength: Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : null
  };
}

function applySetupPayloadToForm(payload) {
  if (!payload) return;

  if (targetNameInput) targetNameInput.value = payload.targetName || "";
  if (deadnameInput) deadnameInput.value = payload.deadname || "";

  if (pronounPresetSelect && payload.pronounPreset) {
    pronounPresetSelect.value = payload.pronounPreset;
  }

  Object.entries(pronounInputs || {}).forEach(([key, input]) => {
    if (input) input.value = (payload.pronouns && payload.pronouns[key]) || "";
  });

  setGrammar(payload.verbGrammar || "plural");

  const selectedExtinctions =
    payload.extinctionPresets && payload.extinctionPresets.length
      ? payload.extinctionPresets
      : ["none"];

  if (extinctionPresetSelect) {
    Array.from(extinctionPresetSelect.options).forEach((opt) => {
      opt.selected = selectedExtinctions.includes(opt.value);
    });
  }

  Object.entries(extinctionInputs || {}).forEach(([key, input]) => {
    if (input && payload.extinctionCustom) {
      input.value = payload.extinctionCustom[key] || "";
    }
  });

  applyExtinctionPreset(selectedExtinctions);

  if (payload.testStyles) {
    const toggles = {
      testStyleMapping: payload.testStyles.mapping,
      testStyleExtinction: payload.testStyles.extinction,
      testStyleDual: payload.testStyles.dual,
      testStyleEditing: payload.testStyles.editing
    };

    Object.entries(toggles).forEach(([name, isOn]) => {
      const input = setupForm ? setupForm.querySelector(`input[name="${name}"]`) : null;
      if (input) input.checked = Boolean(isOn);
    });
  }

  if (sessionLengthSelect && payload.sessionLength) {
    sessionLengthSelect.value = String(payload.sessionLength);
  }
}

function hydrateSetupFromPayload(payload) {
  if (!payload) return;
  applySetupPayloadToForm(payload);
  if (setupForm) parseSetup(new FormData(setupForm));
}

function hydrateSetupFromUrl() {
  if (!setupForm) return;
  const raw = window.location.search || window.location.hash;
  if (!raw) return;
  const payload = decodeSetupPayload(raw);
  hydrateSetupFromPayload(payload);
}

function parseSetup(formData) {
  appState.setup.targetName = formData.get("targetName").trim();
  appState.setup.deadname = formData.get("deadname").trim();
  appState.setup.pronouns = {
    subject: formData.get("subject").trim(),
    object: formData.get("object").trim(),
    possAdj: formData.get("possAdj").trim(),
    possPron: formData.get("possPron").trim(),
    reflexive: formData.get("reflexive").trim()
  };
  appState.setup.verbGrammar = formData.get("verbGrammar") || "plural";
  const extinctionPresetKeys = formData.getAll("extinctionPreset").filter(Boolean);
  const selectedExtinctions = extinctionPresetKeys.length ? extinctionPresetKeys : ["none"];
  const extinctionSets = selectedExtinctions
    .map((key) => extinctionPresets.find((p) => p.key === key))
    .filter((preset) => preset && preset.pronouns)
    .map((preset) => ({ ...preset.pronouns }));

  if (selectedExtinctions.includes("custom")) {
    const customSet = {
      subject: formData.get("extinctionSubject").trim(),
      object: formData.get("extinctionObject").trim(),
      possAdj: formData.get("extinctionPossAdj").trim(),
      possPron: formData.get("extinctionPossPron").trim(),
      reflexive: formData.get("extinctionReflexive").trim()
    };
    if (Object.values(customSet).some((v) => v)) {
      extinctionSets.push(customSet);
    }
  }

  appState.setup.extinctionPronounSets = extinctionSets;
  appState.setup.extinctionPronouns = extinctionSets[0] || {
    subject: "",
    object: "",
    possAdj: "",
    possPron: "",
    reflexive: ""
  };
}

function buildTrapPronounSet() {
  const extinctionSets = appState.setup.extinctionPronounSets || [];
  const defaultTrap = {
    subject: "he",
    object: "him",
    possAdj: "his",
    possPron: "his",
    reflexive: "himself"
  };

  const fallbackList = ["he", "she", "him", "her", "his", "hers", "himself", "herself"];

  const trapForType = (type, idx) => {
    const fromSets = extinctionSets.map((set) => (set[type] || "").trim()).filter(Boolean);
    if (fromSets.length) return fromSets[idx % fromSets.length];
    if (fallbackList.length) return fallbackList[idx % fallbackList.length];
    return defaultTrap[type];
  };

  return {
    subject: trapForType("subject", 0),
    object: trapForType("object", 1),
    possAdj: trapForType("possAdj", 2),
    possPron: trapForType("possPron", 3),
    reflexive: trapForType("reflexive", 4)
  };
}

function generateMappingTrials(limitCount = 60) {
  const { pronouns, verbGrammar, targetName, deadname } = appState.setup;
  if (!limitCount) return [];

  const roles = ["subject", "object", "possAdj", "reflexive"];
  const patternsByRole = roles.reduce((acc, role) => {
    acc[role] = getPatternsForModeAndRole("mapping", role);
    return acc;
  }, {});

  const distractorPool = {
    subject: ["he", "she", "they", pronouns.object, pronouns.possAdj],
    object: ["him", "her", "them", pronouns.subject, pronouns.reflexive],
    possAdj: ["his", "her", "their", pronouns.possPron, pronouns.subject],
    reflexive: ["himself", "herself", "themselves", pronouns.object]
  };

  const trials = [];
  let safety = 0;
  const patternsAvailable = roles.some((role) => (patternsByRole[role] || []).length);
  if (!patternsAvailable) return trials;

  while (trials.length < limitCount && safety < limitCount * 4) {
    safety += 1;
    const role = roles[Math.floor(Math.random() * roles.length)];
    const patterns = patternsByRole[role] || [];
    if (!patterns.length) continue;

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const correct = pronouns[role];
    if (!correct) continue;

    const sentence = buildSentence(pattern, pronouns, {
      name: targetName,
      deadname,
      grammar: verbGrammar,
      hint: "name"
    });

    const blanked = sentence.replace(new RegExp(`\\b${escapeRegExp(correct)}\\b`), "___");
    const pool = distractorPool[role] || [];
    const distractors = shuffle(
      pool.filter((p) => p && p.toLowerCase() !== (correct || "").toLowerCase())
    ).slice(0, 3);
    const fallbackOptions = ["he", "she", "they", "ze", "xe", "him", "her", "them", "zir", "xem"];
    const optionSet = new Set([correct, ...distractors].filter(Boolean));
    fallbackOptions.forEach((p) => {
      if (optionSet.size < 4 && p.toLowerCase() !== (correct || "").toLowerCase()) optionSet.add(p);
    });
    const options = shuffle([...optionSet]).slice(0, 4);

    trials.push({
      type: "mapping",
      text: blanked,
      correct,
      options,
      blanks: 1,
      role
    });
  }

  return trials;
}

function generateExtinctionTrials(limitCount = 40) {
  const { pronouns, verbGrammar, targetName, deadname, extinctionPronounSets } = appState.setup;

  if (!limitCount) return [];

  const patterns = shuffle(getPatternsForModeAndRole("extinction"));
  if (!patterns.length) return [];

  const fallbackTrap = buildTrapPronounSet();
  const trapSets =
    (extinctionPronounSets || []).filter((set) =>
      Object.values(set || {}).some((v) => v && v.trim())
    ) || [];
  const trapPool = trapSets.length ? trapSets : [fallbackTrap];

  const trials = [];
  let idx = 0;

  while (trials.length < limitCount) {
    const pattern = patterns[idx % patterns.length];
    const trapSet = { ...fallbackTrap, ...trapPool[idx % trapPool.length] };
    const trapGrammar = inferGrammarFromPronoun(trapSet.subject) || verbGrammar;

    const correctSentence = buildSentence(pattern, pronouns, {
      name: targetName,
      deadname,
      grammar: verbGrammar,
      hint: "name"
    });

    const wrongSentence = buildSentence(pattern, trapSet, {
      name: targetName,
      deadname,
      grammar: trapGrammar,
      hint: "name"
    });

    trials.push({
      type: "extinction",
      text: correctSentence,
      isCorrect: true,
      mode: trials.length % 2 === 0 ? "flag" : "gng"
    });

    if (trials.length >= limitCount) break;

    trials.push({
      type: "extinction",
      text: wrongSentence,
      isCorrect: false,
      mode: trials.length % 2 === 0 ? "flag" : "gng"
    });

    idx += 1;
    if (idx > limitCount * 2) break;
  }

  return trials.slice(0, limitCount);
}

function generateDualTrials(sessionSeconds) {
  const duration = Math.max(45, Math.round(sessionSeconds || 60));
  return [
    {
      type: "dual",
      duration,
      startTime: null
    }
  ];
}

function generateEditingTrials(limitCount = 35) {
  const { pronouns, extinctionPronounSets, verbGrammar, targetName, deadname } = appState.setup;
  const baseWrongPools = {
    subject: ["he", "she", "they", "ze", "xe"],
    object: ["him", "her", "them", "zir", "xem"],
    possAdj: ["his", "her", "their", "zir", "xyr"],
    possPron: ["his", "hers", "theirs", "zirs", "xyrs"],
    reflexive: ["himself", "herself", "themselves", "zirself", "xemself"]
  };

  const wrongPools = Object.entries(baseWrongPools).reduce((acc, [key, list]) => {
    const fromExtinction = (extinctionPronounSets || [])
      .map((set) => (set[key] || "").trim())
      .filter(Boolean);
    const extras = [];
    if (key !== "reflexive" && appState.setup.deadname) extras.push(appState.setup.deadname);
    if (key === "possAdj" && appState.setup.deadname)
      extras.push(`${appState.setup.deadname}'s`);

    acc[key] = [...new Set([...list, ...fromExtinction, ...extras])];
    return acc;
  }, {});

  if (!limitCount) return [];

  const patterns = shuffle(getPatternsForModeAndRole("editing"));
  if (!patterns.length) return [];

  const trials = [];
  let idx = 0;

  while (trials.length < limitCount && patterns.length) {
    const pattern = patterns[idx % patterns.length];
    const roles = [...(pattern.pronounRolesUsed || [])];
    if (!roles.length) {
      idx += 1;
      if (idx > patterns.length * 2) break;
      continue;
    }

    const shuffledRoles = shuffle([...roles]);
    const corruptCount = Math.min(
      shuffledRoles.length,
      Math.random() > 0.6 && shuffledRoles.length > 1 ? 2 : 1
    );
    const targetRoles = shuffledRoles.slice(0, corruptCount);

    const wrongEntries = [];
    targetRoles.forEach((role) => {
      const correctPronoun = pronouns[role];
      const pool = wrongPools[role] || [];
      const preferredTrap =
        (extinctionPronounSets || [])
          .map((set) => (set[role] || "").trim())
          .filter(Boolean)[0] || "";
      const normalizedCorrect = (correctPronoun || "").toLowerCase();
      const candidates = pool.filter((p) => !normalizedCorrect || p.toLowerCase() !== normalizedCorrect);
      const wrong =
        (preferredTrap && preferredTrap.toLowerCase() !== normalizedCorrect && preferredTrap) ||
        candidates[Math.floor(Math.random() * candidates.length)] ||
        pool[0] ||
        "";
      if (!wrong || wrong.toLowerCase() === normalizedCorrect) return;
      wrongEntries.push({ type: role, correct: correctPronoun, wrong });
    });

    if (!wrongEntries.length) {
      idx += 1;
      continue;
    }

    const baseSentence = buildSentence(pattern, pronouns, {
      name: targetName,
      deadname,
      grammar: verbGrammar,
      hint: "name"
    });

    let mutated = baseSentence;
    wrongEntries.forEach((entry) => {
      const patternRegex = new RegExp(`\\b${escapeRegExp(entry.correct || "")}\\b`);
      mutated = mutated.replace(patternRegex, entry.wrong);
    });

    const optionSet = new Set();
    wrongEntries.forEach((entry) => {
      optionSet.add(entry.correct);
      optionSet.add(entry.wrong);
      (wrongPools[entry.type] || []).forEach((p) => optionSet.add(p));
    });
    Object.values(pronouns || {}).forEach((p) => optionSet.add(p));

    const options = shuffle([...optionSet].filter(Boolean));
    const primary = wrongEntries[0];

    trials.push({
      type: "editing",
      text: mutated,
      correct: primary?.correct,
      wrong: primary?.wrong,
      wrongType: primary?.type,
      wrongWord: primary?.wrong,
      wrongWords: wrongEntries,
      options,
      correctSubject: pronouns.subject
    });

    idx += 1;
  }

  return trials;
}

function calculateTrialPlan(selectedModes, sessionMinutes) {
  const targetSeconds = Math.max(60, sessionMinutes * 60);
  const activeModes = ["mapping", "extinction", "editing"].filter(
    (mode) => selectedModes[mode]
  );

  const dualSeconds = selectedModes.dual
    ? Math.max(45, Math.min(Math.round(targetSeconds * 0.35), targetSeconds - 30))
    : 0;

  const availableSeconds = Math.max(targetSeconds - dualSeconds, 30);
  const counts = {};

  activeModes.forEach((mode) => {
    const pace = pacingSecondsPerTrial[mode] || pacingSecondsPerTrial.mapping;
    const share = availableSeconds / activeModes.length;
    counts[mode] = Math.max(4, Math.round(share / pace));
  });

  return { counts, dualSeconds };
}

function blendTrialBuckets(buckets) {
  const pool = shuffle(
    buckets
    .filter((bucket) => Array.isArray(bucket) && bucket.length)
    .map((bucket) => shuffle([...bucket]))
  );

  if (!pool.length) return [];

  // Rotate through each bucket so sessions cycle between selected test types.
  let bucketIndex = 0;
  const blended = [];

  while (pool.length) {
    const bucket = pool[bucketIndex];
    if (bucket.length) {
      blended.push(bucket.pop());
      bucketIndex = (bucketIndex + 1) % pool.length;
      continue;
    }

    pool.splice(bucketIndex, 1);
    if (!pool.length) break;
    bucketIndex = bucketIndex % pool.length;
  }

  return blended;
}

function buildTrials(selectedModes, sessionMinutes) {
  const { counts, dualSeconds } = calculateTrialPlan(selectedModes, sessionMinutes);

  const buckets = [];
  if (selectedModes.mapping) buckets.push(generateMappingTrials(counts.mapping));
  if (selectedModes.extinction) buckets.push(generateExtinctionTrials(counts.extinction));
  if (selectedModes.editing) buckets.push(generateEditingTrials(counts.editing));
  if (selectedModes.dual) buckets.push(generateDualTrials(dualSeconds || sessionMinutes * 60));

  appState.trials = blendTrialBuckets(buckets);
  appState.currentTrialIndex = 0;
}

function setScreen(screen) {
  setupScreen.classList.toggle("hidden", screen !== "setup");
  testScreen.classList.toggle("hidden", screen !== "test");
  summaryScreen.classList.toggle("hidden", screen !== "summary");
}

function stopDualProgress() {
  if (appState.dualTimers.progress) {
    clearInterval(appState.dualTimers.progress);
    appState.dualTimers.progress = null;
  }
}

function startDualProgress(durationSeconds = 0, onUpdate) {
  stopDualProgress();
  const startTime = Date.now();

  const format = (secs) => {
    const minutes = String(Math.floor(secs / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const update = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(durationSeconds - elapsed, 0);
    trialCounter.textContent = `Dual task • ${format(remaining)} left`;
    if (typeof onUpdate === "function") onUpdate({ remaining, elapsed, duration: durationSeconds });
    if (remaining <= 0) stopDualProgress();
  };

  update();
  appState.dualTimers.progress = setInterval(update, 1000);
}

function flashFeedback(isCorrect) {
  trialContainer.classList.remove("feedback-correct", "feedback-incorrect");
  void trialContainer.offsetWidth;
  trialContainer.classList.add(isCorrect ? "feedback-correct" : "feedback-incorrect");
  setTimeout(() => {
    trialContainer.classList.remove("feedback-correct", "feedback-incorrect");
  }, 900);
}

function recordResult(type, correct, startTime, meta = {}) {
  const elapsed = Date.now() - startTime;
  if (!appState.results[type]) appState.results[type] = [];
  appState.results[type].push({ correct, rt: elapsed, ...meta });
}

function handleAnswer(correct, onAdvance, type, startTime, meta = {}) {
  const lingering = trialContainer.querySelectorAll(".feedback-overlay, .feedback-banner");
  lingering.forEach((node) => node.remove());
  flashFeedback(correct);
  const banner = document.createElement("div");
  banner.className = `feedback-banner ${correct ? "correct" : "incorrect"}`;
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.innerHTML = `
    <span class="feedback-icon">${correct ? "✓" : "!"}</span>
    <span>${correct ? "Correct — keep going" : "Incorrect — pause & review"}</span>
  `;
  trialContainer.appendChild(banner);
  if (correct) {
    recordResult(type, true, startTime, meta);
    setTimeout(() => {
      banner.remove();
      onAdvance();
    }, 900);
    return;
  }
  recordResult(type, false, startTime, meta);
  setTimeout(() => {
    banner.remove();
    onAdvance();
  }, 1500);
}

function renderMappingTrial(trial) {
  const start = Date.now();
  trialContainer.innerHTML = "";
  const text = document.createElement("div");
  text.className = "trial-text";
  text.textContent = trial.text.replaceAll("___", "_____");
  trialContainer.appendChild(text);

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "options";
  trial.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.addEventListener("click", () =>
      handleAnswer(opt === trial.correct, nextTrial, "mapping", start)
    );
    optionsWrap.appendChild(btn);
  });
  trialContainer.appendChild(optionsWrap);
}

function renderExtinctionTrial(trial) {
  const start = Date.now();
  trialContainer.innerHTML = "";
  const text = document.createElement("div");
  text.className = "trial-text";
  text.textContent = trial.text;
  trialContainer.appendChild(text);

  const modeHint = document.createElement("p");
  modeHint.className = "label";
  modeHint.textContent =
    "If the sentence uses the correct name and pronouns for your person, press Correct. Otherwise press Incorrect.";
  trialContainer.appendChild(modeHint);

  const buttons = document.createElement("div");
  buttons.className = "options";

  const okBtn = document.createElement("button");
  okBtn.className = "option";
  okBtn.textContent = "Correct";
  okBtn.addEventListener("click", () =>
    handleAnswer(trial.isCorrect, nextTrial, "extinction", start)
  );

  const wrongBtn = document.createElement("button");
  wrongBtn.className = "option";
  wrongBtn.textContent = "Incorrect";
  wrongBtn.addEventListener("click", () =>
    handleAnswer(!trial.isCorrect, nextTrial, "extinction", start)
  );

  buttons.appendChild(okBtn);
  buttons.appendChild(wrongBtn);
  trialContainer.appendChild(buttons);
}

function renderDualTrial(trial) {
  if (appState.activeDualCleanup) appState.activeDualCleanup();
  trialContainer.innerHTML = "";
  const instructions = document.createElement("p");
  instructions.className = "label";
  instructions.textContent = isTouch
    ? "Tap ODD or EVEN for the numbers, and tap CORRECT or WRONG for the sentence. No keyboard is needed."
    : "Use the on-screen buttons (or Space/Enter for numbers and J/K for the sentence) to respond with just your mouse or keyboard.";
  trialContainer.appendChild(instructions);

  const progressShell = document.createElement("div");
  progressShell.className = "dual-progress";
  const progressFill = document.createElement("div");
  progressFill.className = "dual-progress-fill";
  const progressText = document.createElement("span");
  progressText.className = "dual-progress-text";
  progressText.textContent = "Starting block...";
  progressShell.append(progressText, progressFill);
  trialContainer.appendChild(progressShell);
  const grid = document.createElement("div");
  grid.className = "dual-grid";

  const numberArea = document.createElement("div");
  numberArea.className = "number-stream";
  const numberValue = document.createElement("div");
  numberValue.className = "number-value";
  numberValue.textContent = "Preparing...";
  numberArea.appendChild(numberValue);
  const numberControls = document.createElement("div");
  numberControls.className = "grid-two mobile-controls";
  const oddBtn = document.createElement("button");
  oddBtn.className = "option";
  oddBtn.textContent = "ODD";
  const evenBtn = document.createElement("button");
  evenBtn.className = "option";
  evenBtn.textContent = "EVEN";
  numberControls.append(oddBtn, evenBtn);
  numberArea.appendChild(numberControls);

  const pronounArea = document.createElement("div");
  pronounArea.className = "pronoun-stream";
  const sentence = document.createElement("div");
  sentence.className = "trial-text";
  pronounArea.appendChild(sentence);

  const cue = document.createElement("div");
  cue.className = "label dual-cue hidden";
  pronounArea.appendChild(cue);

  const timerDisplay = document.createElement("div");
  timerDisplay.className = "dual-timer hidden";
  timerDisplay.textContent = "Select ODD or EVEN to start the timer.";
  pronounArea.appendChild(timerDisplay);

  const pronounControls = document.createElement("div");
  pronounControls.className = "grid-two mobile-controls";
  const correctBtn = document.createElement("button");
  correctBtn.className = "option";
  correctBtn.textContent = "CORRECT";
  correctBtn.disabled = true;
  const wrongBtn = document.createElement("button");
  wrongBtn.className = "option";
  wrongBtn.textContent = "WRONG";
  wrongBtn.disabled = true;
  pronounControls.append(correctBtn, wrongBtn);
  pronounArea.appendChild(pronounControls);

  grid.appendChild(numberArea);
  grid.appendChild(pronounArea);
  trialContainer.appendChild(grid);

  const updateProgress = ({ remaining, duration }) => {
    const elapsed = Math.max(duration - remaining, 0);
    const pct = Math.min(100, Math.round((elapsed / duration) * 100));
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `Dual task • ${Math.max(0, remaining)}s left`;
  };

  startDualProgress(trial.duration, updateProgress);

  let numberStart = Date.now();
  let pronounStart = null;
  let timerStart = null;
  let timerInterval = null;
  let cueTimeout = null;
  let pronounLocked = true;
  let activeSentence = "";
  let numberInterval = null;
  let pronounInterval = null;
  const clearCue = () => {
    if (cueTimeout) clearTimeout(cueTimeout);
    cueTimeout = null;
    cue.textContent = "";
    cue.classList.add("hidden");
  };
  const handleNumber = (value) => {
    numberStart = Date.now();
    numberValue.textContent = value;
  };

  const stopTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerStart = null;
    timerDisplay.textContent = "Select ODD or EVEN to start the timer.";
    timerDisplay.classList.add("hidden");
    clearCue();
  };

  const { pronouns } = appState.setup;
  const trapSet = buildTrapPronounSet();
  const cueSources = (appState.setup.extinctionPronounSets || []).filter((set) =>
    Object.values(set || {}).some((v) => v && v.trim())
  );
  const cuePronouns = cueSources.flatMap((set) => Object.values(set || []));
  if (appState.setup.deadname) cuePronouns.push(appState.setup.deadname);
  if (trapSet) cuePronouns.push(...Object.values(trapSet));

  const scheduleCue = () => {
    clearCue();
    const options = cuePronouns.filter(Boolean).map((v) => v.trim());
    if (!options.length) return;
    const time = Math.max(1200, 2500 + Math.random() * 1800);
    cueTimeout = setTimeout(() => {
      const choice = options[Math.floor(Math.random() * options.length)];
      const promptTemplates = [
        `Replace “${choice}” with {name}.`,
        `Check pronouns: is it “${choice}” or {subject}?`,
        `Say {name} instead of “${choice}.”`
      ];
      const tpl = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
      cue.textContent = applyLanguageRules(tpl, { pronouns, grammar: appState.setup.verbGrammar });
      cue.classList.remove("hidden");
      cueTimeout = setTimeout(() => {
        cue.classList.add("hidden");
        scheduleCue();
      }, 1600);
    }, time);
  };

  const startTimer = () => {
    stopTimer();
    timerStart = Date.now();
    timerDisplay.classList.remove("hidden");
    timerInterval = setInterval(() => {
      const elapsedMs = Date.now() - timerStart;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
      const secs = String(elapsedSeconds % 60).padStart(2, "0");
      const millis = String(elapsedMs % 1000).padStart(3, "0");
      timerDisplay.textContent = `Timer: ${mins}:${secs}.${millis}`;
    }, 50);
    scheduleCue();
  };

  const pronounPatterns = getPatternsForModeAndRole("dual");

  const fillSentence = () => {
    let text = "";
    let attempts = 0;
    do {
      const useCorrect = Math.random() > 0.4;
      const set = useCorrect ? pronouns : trapSet;
      const grammar = inferGrammarFromPronoun(set.subject) || appState.setup.verbGrammar;
      const pattern =
        pronounPatterns && pronounPatterns.length
          ? pronounPatterns[Math.floor(Math.random() * pronounPatterns.length)]
          : null;
      text = pattern
        ? buildSentence(pattern, set, {
            name: appState.setup.targetName,
            deadname: appState.setup.deadname,
            grammar,
            hint: "name"
          })
        : applyLanguageRules("{subject} {have} finished {possAdj} report.", {
            pronouns: set,
            grammar
          });
      sentence.dataset.correct = useCorrect ? "true" : "false";
      attempts += 1;
    } while (text === activeSentence && attempts < 6);
    activeSentence = text;
    sentence.textContent = text;
  };

  const startNumberStream = () => {
    if (numberInterval) clearInterval(numberInterval);
    handleNumber(Math.floor(Math.random() * 90) + 10);
    numberInterval = setInterval(() => {
      const value = Math.floor(Math.random() * 90) + 10;
      handleNumber(value);
    }, 2000);
  };

  const startPronounStream = () => {
    if (pronounInterval) clearInterval(pronounInterval);
    fillSentence();
    pronounInterval = setInterval(fillSentence, 2000);
  };

  const pauseStreams = () => {
    clearInterval(numberInterval);
    clearInterval(pronounInterval);
    numberInterval = null;
    pronounInterval = null;
    clearCue();
  };

  startNumberStream();
  startPronounStream();

  const cleanup = () => {
    clearInterval(numberInterval);
    clearInterval(pronounInterval);
    clearTimeout(appState.dualTimers.block);
    appState.dualTimers.block = null;
    stopDualProgress();
    stopTimer();
    clearCue();
    window.removeEventListener("keydown", keyHandler);
    appState.activeDualCleanup = null;
  };

  appState.activeDualCleanup = cleanup;

  const handleNumberAnswer = (choice) => {
    const value = Number(numberValue.textContent) || 0;
    const isEven = value % 2 === 0;
    const correct = (choice === "even" && isEven) || (choice === "odd" && !isEven);
    flashFeedback(correct);
    recordResult("dual", correct, numberStart, { task: "number" });
    if (!correct) return;
    pauseStreams();
    pronounLocked = false;
    correctBtn.disabled = false;
    wrongBtn.disabled = false;
    pronounStart = Date.now();
    startTimer();
  };

  const handlePronounAnswer = (claimedCorrect) => {
    if (pronounLocked) return;
    const correct = sentence.dataset.correct === "true";
    const overall = claimedCorrect === correct;
    handleAnswer(overall, () => {}, "dual", pronounStart, { task: "pronoun" });
    pronounLocked = true;
    correctBtn.disabled = true;
    wrongBtn.disabled = true;
    stopTimer();
    startNumberStream();
    startPronounStream();
  };

  oddBtn.addEventListener("click", () => handleNumberAnswer("odd"));
  evenBtn.addEventListener("click", () => handleNumberAnswer("even"));
  correctBtn.addEventListener("click", () => handlePronounAnswer(true));
  wrongBtn.addEventListener("click", () => handlePronounAnswer(false));

  const keyHandler = (evt) => {
    if (evt.code === "Space") {
      evt.preventDefault();
      handleNumberAnswer("odd");
    }
    if (evt.code === "Enter") {
      evt.preventDefault();
      handleNumberAnswer("even");
    }
    if (evt.key.toLowerCase() === "j") handlePronounAnswer(true);
    if (evt.key.toLowerCase() === "k") handlePronounAnswer(false);
  };
  window.addEventListener("keydown", keyHandler);

  appState.dualTimers.block = setTimeout(() => {
    cleanup();
    nextTrial();
  }, trial.duration * 1000);
}

function renderEditingTrial(trial) {
  const start = Date.now();
  trialContainer.innerHTML = "";
  const instructions = document.createElement("p");
  instructions.className = "label";
  instructions.textContent =
    "Click the wrong word, choose the right pronoun, and tweak verbs like is/are or has/have so everything agrees.";
  trialContainer.appendChild(instructions);

  const tokens = trial.text.split(" ");
  const tokenWrap = document.createElement("div");
  tokenWrap.className = "token-list";

  const continueBtn = document.createElement("button");
  continueBtn.className = "primary";
  continueBtn.textContent = "Continue";
  continueBtn.disabled = true;
  continueBtn.style.marginTop = "12px";
  const completionBadge = document.createElement("span");
  completionBadge.className = "completion-badge hidden";
  completionBadge.textContent = "✓ All corrections made";
  const editingActions = document.createElement("div");
  editingActions.className = "editing-actions";
  editingActions.append(completionBadge, continueBtn);

  const corrections = new Map();
  const requiredIndices = new Set();
  const verbIndices = new Set();
  const currentTokens = [...tokens];
  const wrongEntries = Array.isArray(trial.wrongWords) && trial.wrongWords.length
    ? trial.wrongWords
    : trial.wrongWord
    ? [{ wrong: trial.wrongWord, correct: trial.correct, type: trial.wrongType }]
    : [];
  let currentSubjectGrammar = inferGrammarFromPronoun(
    trial.correctSubject || appState.setup.pronouns.subject
  );

  const verbOptions = {
    is: ["is", "are"],
    are: ["are", "is"],
    was: ["was", "were"],
    were: ["were", "was"],
    has: ["has", "have"],
    have: ["have", "has"],
    does: ["does", "do"],
    do: ["do", "does"]
  };

  const collectPronounPool = () => {
    const fromSetup = Object.values(appState.setup.pronouns || {});
    const fromExtinction = (appState.setup.extinctionPronounSets || [])
      .flatMap((set) => Object.values(set || {}));
    const fromTrial = [
      trial.correct,
      trial.wrong,
      ...wrongEntries.flatMap((entry) => [entry.correct, entry.wrong]),
      ...(trial.options || [])
    ];

    return new Set(
      [...fromSetup, ...fromExtinction, ...fromTrial]
        .filter(Boolean)
        .map((p) => p.toLowerCase())
    );
  };

  const pronounPool = collectPronounPool();

  const updateReadyState = () => {
    const required = [...requiredIndices];
    const ready =
      required.length > 0 &&
      required.every((idx) => {
        const entry = corrections.get(idx);
        return entry && entry.valid;
      });
    continueBtn.disabled = !ready;
    completionBadge.classList.toggle("hidden", !ready);
    return ready;
  };

  const expectedVerbForGrammar = (verb, grammar) => {
    const normalizedVerb = verb.toLowerCase();
    const pluralTargets = { is: "are", was: "were", has: "have", does: "do" };
    const singularTargets = { are: "is", were: "was", have: "has", do: "does" };
    const lookup = grammar === "plural" ? pluralTargets : singularTargets;
    return lookup[normalizedVerb] || normalizedVerb;
  };

  const refreshVerbRequirements = () => {
    verbIndices.forEach((idx) => {
      const tokenValue = (currentTokens[idx] || "").replace(/[^a-z']/gi, "").toLowerCase();
      const expected = expectedVerbForGrammar(tokenValue, currentSubjectGrammar);
      const needsAdjustment = tokenValue !== expected;
      if (needsAdjustment) requiredIndices.add(idx);
      const entry = corrections.get(idx) || { required: false, valid: !needsAdjustment };
      corrections.set(idx, { ...entry, required: requiredIndices.has(idx), valid: !needsAdjustment });
      const node = tokenWrap.querySelector(`[data-idx="${idx}"]`);
      if (node) node.classList.toggle("attention", needsAdjustment);
    });
    updateReadyState();
  };

  tokens.forEach((tok, idx) => {
    const span = document.createElement("span");
    const punctuationMatch = tok.match(/([.,!?]+)$/);
    const suffix = punctuationMatch ? punctuationMatch[0] : "";
    const baseToken = punctuationMatch ? tok.slice(0, -suffix.length) : tok;
    const normalized = baseToken.toLowerCase();
    const wrongEntry = wrongEntries.find(
      (entry) => normalized === (entry.wrong || "").toLowerCase()
    );
    const isWrong = Boolean(wrongEntry);
    const isVerbSwitchable = Boolean(verbOptions[normalized]);
    if (isVerbSwitchable) verbIndices.add(idx);
    const isPronounToken = pronounPool.has(normalized);
    if (isWrong) requiredIndices.add(idx);
    span.className = "token";
    span.textContent = tok;
    span.dataset.idx = idx;
    span.addEventListener("click", () => {
      if (!isWrong && !isVerbSwitchable && !isPronounToken) return;
      if (span.dataset.replaced === "true") return;
      const select = document.createElement("select");
      select.className = "dropdown";
      select.setAttribute(
        "aria-label",
        isVerbSwitchable ? "Choose replacement verb" : "Choose replacement pronoun"
      );
      const baseOptions = isVerbSwitchable
        ? verbOptions[normalized] || [normalized]
        : [...new Set([...(trial.options || []), wrongEntry?.correct, baseToken])];
      const options = [...new Set(baseOptions.filter(Boolean))];
      options.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o;
        select.appendChild(opt);
      });
      const startingValue = isVerbSwitchable ? normalized : baseToken;
      select.value = options.includes(startingValue) ? startingValue : options[0];

      const markState = (value) => {
        const normalizedValue = value.toLowerCase();
        if (isWrong && wrongEntry?.type === "subject") {
          currentSubjectGrammar = inferGrammarFromPronoun(normalizedValue);
        }
        currentTokens[idx] = `${value}${suffix}`;
        const expectedVerb = isVerbSwitchable
          ? expectedVerbForGrammar(normalizedValue, currentSubjectGrammar)
          : normalizedValue;
        const isCorrect = isWrong
          ? normalizedValue === (wrongEntry?.correct || "").toLowerCase()
          : normalizedValue === expectedVerb;
        corrections.set(idx, { required: requiredIndices.has(idx), valid: isCorrect });
        if (isWrong) {
          select.classList.toggle("incorrect", !isCorrect);
          select.classList.toggle("correct", isCorrect);
        }
        select.classList.toggle("checked", isCorrect);
        select.parentElement?.classList.toggle("checked", isCorrect);
        refreshVerbRequirements();
        if (updateReadyState()) continueBtn.focus();
      };

      markState(select.value);
      select.addEventListener("change", () => markState(select.value));

      const wrapper = document.createElement("span");
      wrapper.className = "token";
      wrapper.dataset.idx = idx;
      wrapper.appendChild(select);
      if (suffix) {
        const punct = document.createElement("span");
        punct.textContent = suffix;
        wrapper.appendChild(punct);
      }
      span.replaceWith(wrapper);
      span.dataset.replaced = "true";
      select.focus();
    });
    tokenWrap.appendChild(span);
  });

  trialContainer.appendChild(tokenWrap);
  trialContainer.appendChild(editingActions);

  continueBtn.addEventListener("click", () => {
    const ready = updateReadyState();
    if (!ready) return;
    handleAnswer(true, nextTrial, "editing", start);
  });

  refreshVerbRequirements();
}

function renderTrial() {
  const trial = appState.trials[appState.currentTrialIndex];
  if (trial.type === "dual") {
    trialCounter.textContent = "Dual task";
  } else {
    stopDualProgress();
    trialCounter.textContent = `${appState.currentTrialIndex + 1} / ${appState.trials.length}`;
  }
  switch (trial.type) {
    case "mapping":
      renderMappingTrial(trial);
      break;
    case "extinction":
      renderExtinctionTrial(trial);
      break;
    case "dual":
      renderDualTrial(trial);
      break;
    case "editing":
      renderEditingTrial(trial);
      break;
    default:
      trialContainer.textContent = "Unknown trial type";
  }
}

function nextTrial() {
  appState.currentTrialIndex += 1;
  if (appState.currentTrialIndex >= appState.trials.length) {
    showSummary();
    return;
  }
  renderTrial();
}

function calculateStats(entries) {
  if (!entries.length) return { accuracy: "N/A", median: "N/A" };
  const accuracy = Math.round(
    (entries.filter((e) => e.correct).length / entries.length) * 100
  );
  const rts = entries.map((e) => e.rt).sort((a, b) => a - b);
  const mid = Math.floor(rts.length / 2);
  const median = rts.length % 2 ? rts[mid] : Math.round((rts[mid - 1] + rts[mid]) / 2);
  return { accuracy: `${accuracy}%`, median: `${median} ms` };
}

function loadSavedSummary() {
  try {
    const raw = localStorage.getItem(summaryStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function storeSavedSummary(data) {
  try {
    localStorage.setItem(summaryStorageKey, JSON.stringify(data));
  } catch (e) {
    // ignore storage failures
  }
}

function clearSavedSummary() {
  try {
    localStorage.removeItem(summaryStorageKey);
  } catch (e) {
    // ignore storage failures
  }
  renderSavedSummary(null);
}

function detectPrivateMode() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    const finish = (isPrivate) => resolve(Boolean(isPrivate));

    if (window.webkitRequestFileSystem) {
      window.webkitRequestFileSystem(
        window.TEMPORARY,
        1,
        () => finish(false),
        () => finish(true)
      );
      return;
    }

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage
        .estimate()
        .then(({ quota }) => {
          const isPrivate = typeof quota === "number" && quota > 0 && quota < 120000000;
          finish(isPrivate);
        })
        .catch(() => finish(false));
      return;
    }

    if (window.indexedDB && navigator.userAgent.includes("Firefox")) {
      let resolved = false;
      try {
        const db = indexedDB.open("private-mode-check");
        db.onerror = () => {
          if (!resolved) finish(true);
          resolved = true;
        };
        db.onsuccess = () => {
          if (resolved) return;
          resolved = true;
          db.result.close();
          indexedDB.deleteDatabase("private-mode-check");
          finish(false);
        };
        return;
      } catch (e) {
        finish(true);
        return;
      }
    }

    finish(false);
  });
}

async function clearCachesAndStorage() {
  let cacheCleared = true;
  let storageCleared = true;

  try {
    localStorage.clear();
  } catch (e) {
    storageCleared = false;
  }

  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (e) {
      cacheCleared = false;
    }
  }

  const message =
    cacheCleared && storageCleared
      ? "All local data cleared. Please reload to see the latest updates."
      : "We couldn't clear everything automatically. Try reloading or clearing your browser data manually.";
  alert(message);
}

function renderSavedSummary(saved) {
  if (!saved || !saved.stats || !savedSummarySection) {
    if (savedSummarySection) {
      savedSummarySection.classList.add("hidden");
      savedSummaryGrid.innerHTML = "";
      savedSummaryMeta.textContent = "";
    }
    return;
  }

  savedSummarySection.classList.remove("hidden");
  savedSummaryGrid.innerHTML = "";
  const savedDate = saved.timestamp ? new Date(saved.timestamp).toLocaleString() : "Saved locally";
  savedSummaryMeta.textContent = `Saved on this device: ${savedDate}`;

  Object.entries(saved.stats).forEach(([key, stats]) => {
    const card = document.createElement("div");
    card.className = "summary-card";
    card.innerHTML = `<p class="label">${key}</p><p>Accuracy: ${stats.accuracy}</p><p>Median RT: ${stats.median}</p>`;
    savedSummaryGrid.appendChild(card);
  });
}

function showSummary() {
  if (appState.activeDualCleanup) appState.activeDualCleanup();
  stopDualProgress();
  setScreen("summary");
  summaryStats.innerHTML = "";
  const previousSummary = loadSavedSummary();
  renderSavedSummary(previousSummary);
  const modes = [
    { key: "mapping", label: "Quick Mapping" },
    { key: "extinction", label: "Extinction" },
    { key: "dual", label: "Dual Task" },
    { key: "editing", label: "Sentence Editing" }
  ];
  const savedStats = {};
  modes.forEach((mode) => {
    const stats = calculateStats(appState.results[mode.key] || []);
    const card = document.createElement("div");
    card.className = "summary-card";
    card.innerHTML = `<p class="label">${mode.label}</p><p>Accuracy: ${stats.accuracy}</p><p>Median RT: ${stats.median}</p>`;
    summaryStats.appendChild(card);
    savedStats[mode.label] = stats;
  });

  storeSavedSummary({ timestamp: Date.now(), stats: savedStats });
}

function resetApp() {
  if (appState.activeDualCleanup) appState.activeDualCleanup();
  stopDualProgress();
  clearTimeout(appState.dualTimers.block);
  appState.dualTimers.block = null;
  appState.trials = [];
  appState.currentTrialIndex = 0;
  appState.results = { mapping: [], extinction: [], dual: [], editing: [] };
  trialContainer.innerHTML = "";
  trialCounter.textContent = "";
  setScreen("setup");
}

function startSession(selectedModes, sessionMinutes) {
  buildTrials(selectedModes, sessionMinutes);
  if (!appState.trials.length) return;
  practiceName.textContent = appState.setup.targetName;
  setScreen("test");
  renderTrial();
}

populateSelect(pronounPresetSelect, pronounPresets, "theyThem");
populateSelect(extinctionPresetSelect, extinctionPresets, "none");
applyPronounPreset("theyThem");
applyExtinctionPreset(["none"]);
hydrateSetupFromUrl();

const selectedExtinctionValues = () => getSelectedValues(extinctionPresetSelect);

if (pronounPresetSelect)
  pronounPresetSelect.addEventListener("change", (e) => applyPronounPreset(e.target.value));
if (extinctionPresetSelect)
  extinctionPresetSelect.addEventListener("change", () => applyExtinctionPreset(selectedExtinctionValues()));

if (setupForm) {
  setupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    parseSetup(data);
    const selectedModes = {
      mapping: data.get("testStyleMapping") !== null,
      extinction: data.get("testStyleExtinction") !== null,
      dual: data.get("testStyleDual") !== null,
      editing: data.get("testStyleEditing") !== null
    };
    const sessionLength = Number(data.get("sessionLength")) || defaultSessionMinutes;
    startSession(selectedModes, sessionLength);
  });
}

if (shareSetupBtn && setupForm) {
  shareSetupBtn.addEventListener("click", async () => {
    if (!setupForm.reportValidity()) return;
    const data = new FormData(setupForm);
    parseSetup(data);
    const payload = collectSetupPayload(data);
    const encoded = encodeSetupPayload(payload);
    const url = `${window.location.origin}${window.location.pathname}?${encoded}`;

    try {
      await navigator.clipboard.writeText(url);
      alert("Setup link copied to your clipboard.");
    } catch (err) {
      prompt("Copy your setup link:", url);
    }
  });
}

if (endSessionBtn) {
  endSessionBtn.addEventListener("click", () => {
    const confirmReset = confirm("End this session and return to setup? Progress will be lost.");
    if (confirmReset) resetApp();
  });
}

const restartBtn = doc ? doc.getElementById("restart-btn") : null;
if (restartBtn) restartBtn.addEventListener("click", resetApp);
if (clearSummaryBtn) {
  clearSummaryBtn.addEventListener("click", clearSavedSummary);
}

async function setupCacheClearLink() {
  if (!cacheClearFooter || !clearStorageLink || typeof window === "undefined") return;

  try {
    const isPrivate = await detectPrivateMode();
    if (isPrivate) return;

    cacheClearFooter.classList.remove("hidden");
    clearStorageLink.addEventListener("click", async () => {
      clearStorageLink.disabled = true;
      clearStorageLink.textContent = "Clearing...";
      await clearCachesAndStorage();
      clearStorageLink.disabled = false;
      clearStorageLink.textContent = "Clear all cache and localStorage";
    });
  } catch (e) {
    // ignore detection errors
  }
}

setupCacheClearLink();

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    applyLanguageRules,
    grammarLexicon,
    inferGrammarFromPronoun,
    resolveGrammar,
    generateMappingTrials,
    generateExtinctionTrials,
    generateEditingTrials,
    appState
  };
}

