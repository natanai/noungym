const pronounPresets = [
  {
    key: "theyThem",
    label: "They/Them (plural verbs)",
    pronouns: {
      subject: "they",
      object: "them",
      possAdj: "their",
      possPron: "theirs",
      reflexive: "themselves"
    },
    verbGrammar: "plural"
  },
  {
    key: "theyThemSingular",
    label: "They/Them (singular verbs)",
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
    label: "She/Her (singular verbs)",
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
    label: "He/Him (singular verbs)",
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
    label: "Ze/Zir (singular verbs)",
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
    label: "Xe/Xem (singular verbs)",
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

const setupForm = document.getElementById("setup-form");

const setupScreen = document.getElementById("setup-screen");
const testScreen = document.getElementById("test-screen");
const summaryScreen = document.getElementById("summary-screen");
const trialContainer = document.getElementById("trial-container");
const trialCounter = document.getElementById("trial-counter");
const practiceName = document.getElementById("practice-name");
const summaryStats = document.getElementById("summary-stats");
const savedSummarySection = document.getElementById("saved-summary");
const savedSummaryGrid = document.getElementById("saved-summary-grid");
const savedSummaryMeta = document.getElementById("saved-summary-meta");
const clearSummaryBtn = document.getElementById("clear-summary-btn");
const endSessionBtn = document.getElementById("end-session-btn");
const shareSetupBtn = document.getElementById("share-setup-btn");
const targetNameInput = document.getElementById("targetName");
const pronounPresetSelect = document.getElementById("pronounPreset");
const extinctionPresetSelect = document.getElementById("extinctionPreset");
const extinctionCustomFields = document.getElementById("extinction-custom-fields");
const extinctionChips = document.getElementById("extinction-chips");
const pronounInputs = {
  subject: document.querySelector('input[name="subject"]'),
  object: document.querySelector('input[name="object"]'),
  possAdj: document.querySelector('input[name="possAdj"]'),
  possPron: document.querySelector('input[name="possPron"]'),
  reflexive: document.querySelector('input[name="reflexive"]')
};
const extinctionInputs = {
  subject: document.querySelector('input[name="extinctionSubject"]'),
  object: document.querySelector('input[name="extinctionObject"]'),
  possAdj: document.querySelector('input[name="extinctionPossAdj"]'),
  possPron: document.querySelector('input[name="extinctionPossPron"]'),
  reflexive: document.querySelector('input[name="extinctionReflexive"]')
};
const grammarRadios = document.querySelectorAll('input[name="verbGrammar"]');
const sessionLengthSelect = document.getElementById("sessionLength");
const deadnameInput = document.getElementById("deadname");

const isTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;

function populateSelect(selectEl, presets, defaultKey) {
  selectEl.innerHTML = "";
  presets.forEach((preset) => {
    const opt = document.createElement("option");
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
  return Array.from(selectEl.selectedOptions || []).map((opt) => opt.value);
}

function applyPronounPreset(key) {
  const preset = pronounPresets.find((p) => p.key === key);
  if (!preset || preset.custom) return;
  Object.entries(preset.pronouns).forEach(([k, v]) => {
    pronounInputs[k].value = v;
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
      input.value = "";
    });
  } else if (preset && preset.pronouns && selectedKeys.length === 1) {
    Object.entries(extinctionInputs).forEach(([k, input]) => {
      input.value = preset.pronouns[k] || "";
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
    s: "",
    were: "were",
    "don't": "don't"
  },
  singular: {
    be: "is",
    have: "has",
    s: "s",
    were: "was",
    "don't": "doesn't"
  }
};

function fillSlots(template, slots = {}) {
  return Object.entries(slots).reduce((text, [key, value]) => {
    const pattern = new RegExp(`\\[\\[${key}\\]\\]`, "g");
    return text.replace(pattern, value);
  }, template);
}

function expandRecipes(recipes, fallbackLimit = 60) {
  const allTemplates = [];

  recipes.forEach((recipe) => {
    const slotKeys = Object.keys(recipe.slots || {});
    let combinations = [{}];

    slotKeys.forEach((key) => {
      const values = recipe.slots[key] || [""];
      const next = [];
      combinations.forEach((combo) => {
        values.forEach((value) => {
          next.push({ ...combo, [key]: value });
        });
      });
      combinations = next;
    });

    const limitedCombos = shuffle(combinations).slice(
      0,
      recipe.limit || fallbackLimit || combinations.length
    );

    limitedCombos.forEach((combo) => {
      allTemplates.push({
        ...recipe,
        text: fillSlots(recipe.template, combo)
      });
    });
  });

  return allTemplates;
}

const languageTokenRegex = /\{([^}]+)\}/g;

function applyLanguageRules(template, overrides = {}) {
  const { targetName, deadname, verbGrammar } = appState.setup;
  const pronouns = overrides.pronouns || overrides.pronounSet || appState.setup.pronouns;
  const grammar = overrides.grammar || verbGrammar || inferGrammarFromPronoun(pronouns.subject);
  const subject = (pronouns.subject || "").toLowerCase();
  const grammarForPronouns =
    grammar === "singular" && subject === "they" ? "plural" : grammar;

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

    const grammarSet = hint === "name" ? grammarLexicon.singular : grammarTokens;
    if (token === "are") return grammarSet.be;
    if (grammarSet[token] !== undefined) return grammarSet[token];

    return match;
  });
}

function shuffle(arr) {
  return arr
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
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

const mappingRecipes = [
  {
    type: "subject",
    template: "[[leadIn]]___ {be} [[activity]] [[location]][[closing]]",
    slots: {
      leadIn: [
        "",
        "During practice, ",
        "At the start of the week, ",
        "Between appointments, ",
        "Right before class, ",
        "Earlier today, ",
        "On the weekend, "
      ],
      activity: [
        "leading the warmup",
        "tracking the project milestones",
        "handling the client emails",
        "coordinating the carpool",
        "organizing the shared files",
        "reviewing the safety plan",
        "checking the lighting cues",
        "closing out the inventory",
        "drafting the announcement"
      ],
      location: [
        "in the studio",
        "at the library",
        "at rehearsal",
        "at the clinic",
        "for the volunteers",
        "at the community center",
        "at the makerspace",
        "for the overnight shift"
      ],
      closing: [".", " today.", " before lunch.", " once the doors opened."]
    },
    limit: 90
  },
  {
    type: "subject",
    template: "[[timeframe]], ___ {have} [[task]] ready for review.",
    slots: {
      timeframe: [
        "Later this afternoon",
        "After the briefing",
        "Once the meeting ends",
        "Before the deadline",
        "When the bell rings",
        "At sunrise tomorrow",
        "After the check-in call",
        "Right before the shift change"
      ],
      task: [
        "the onboarding packets",
        "a full budget draft",
        "notes from the interview",
        "the choreography cues",
        "the itinerary for the trip",
        "a revised staffing plan"
      ]
    },
    limit: 60
  },
  {
    type: "object",
    template: "The coordinator saved a seat for ___ [[locationPhrase]].",
    slots: {
      locationPhrase: [
        "near the front row",
        "by the sunny window",
        "next to the sign-in table",
        "close to the exit",
        "in the quiet corner",
        "across from the projector",
        "beside the whiteboard"
      ]
    },
    limit: 40
  },
  {
    type: "object",
    template: "I handed the signed forms to ___ [[timing]].",
    slots: {
      timing: [
        "right after class",
        "during lunch",
        "before boarding",
        "as the session ended",
        "when the call started"
      ]
    },
    limit: 40
  },
  {
    type: "possAdj",
    template: "We reviewed ___ [[item]] together [[setting]].",
    slots: {
      item: [
        "lab report",
        "design mockups",
        "grant proposal",
        "presentation slides",
        "training outline"
      ],
      setting: [
        "in the conference room",
        "at the coffee shop",
        "after practice",
        "before the webinar",
        "during office hours"
      ]
    },
    limit: 50
  },
  {
    type: "possAdj",
    template: "___ schedule includes [[commitment]] this month.",
    slots: {
      commitment: [
        "weekly tutoring",
        "a double shift",
        "community outreach",
        "the weekend retreat",
        "an extra rehearsal",
        "office hours with the team",
        "a late-night study group"
      ]
    },
    limit: 40
  },
  {
    type: "reflexive",
    template: "{name} reminded ___ to take breaks [[context]].",
    slots: {
      context: [
        "during finals",
        "while traveling",
        "between appointments",
        "after long rehearsals",
        "during the hackathon",
        "through the night shift",
        "while hosting guests"
      ]
    },
    limit: 40
  },
  {
    type: "reflexive",
    template: "While cooking, {name} kept ___ safe from the hot pan.",
    limit: 30
  }
];

const extinctionRecipes = [
  {
    template: "[[leadIn]]{name} said {subject} {have} already sent {possAdj} notes.",
    slots: {
      leadIn: ["", "Earlier, ", "Before the review, ", "During onboarding, "]
    },
    limit: 50
  },
  {
    template: "[[leadIn]]I handed the keys to {object} because it was not {possAdj} turn.",
    slots: {
      leadIn: ["", "After the briefing, ", "While we cleaned up, "]
    },
    limit: 45
  },
  {
    template: "After the meeting, {subject} thanked everyone and reminded {reflexive} to rest.",
    limit: 45
  },
  {
    template: "[[leadIn]]The backpack on the chair is {possPron}, so please give it to {object}.",
    slots: {
      leadIn: ["", "By the sign-in table, ", "Near the lockers, "]
    },
    limit: 45
  },
  {
    template: "When someone mentioned {deadname}, {subject} calmly reminded them about {possAdj} correct name.",
    limit: 50
  },
  {
    template:
      "[[leadIn]]{name} explained that {subject} {be} covering the desk while the badge office reprinted {possAdj} badge.",
    slots: {
      leadIn: [
        "",
        "During the shift change, ",
        "Before the concert, ",
        "As the meeting wrapped up, "
      ]
    },
    limit: 40
  },
  {
    template: "[[leadIn]]{name} explained that {subject} {be} updating {possAdj} records this week.",
    slots: {
      leadIn: ["", "After the planning session, ", "During the orientation, "]
    },
    limit: 50
  },
  {
    template: "After hearing {deadname}, {subject} corrected the form and asked everyone to share {possPron} pronouns again before thanking {object}.",
    limit: 45
  },
  {
    template: "We reserved a badge for {object} because {subject} confirmed {possAdj} attendance.",
    limit: 45
  },
  {
    template:
      "[[leadIn]]{name} reminded the host that {subject} {were} bringing {possAdj} laptop so {object} could queue the slides {reflexive}.",
    slots: {
      leadIn: ["", "At the registration desk, ", "Later that afternoon, "]
    },
    limit: 45
  },
  {
    template: "Even though the form listed {deadname}, everyone used {possAdj} correct details afterward.",
    limit: 50
  },
  {
    template: "During roll call, the instructor waited for {object} to state {possAdj} name.",
    limit: 45
  },
  {
    template: "{name} reminded the group that {subject} {were} focused on {possAdj} presentation timing.",
    limit: 45
  }
];

const editingRecipes = [
  {
    template: "{name} reminded the crew that {subject} {be} accountable for {possAdj} choices.",
    wrongType: "subject",
    limit: 40
  },
  {
    template: "The director, {name}, introduced {reflexive} and asked us to support {object} on {possAdj} first day.",
    wrongType: "reflexive",
    limit: 40
  },
  {
    template: "When the bell rang, I checked whether the notebook was truly {possPron} before returning it to {object}.",
    wrongType: "possPron",
    limit: 40
  },
  {
    template: "During the fundraiser {name} organized, the team thanked {object} for sharing {possAdj} story about the project.",
    wrongType: "object",
    limit: 40
  },
  {
    template: "{name} promised {reflexive} to slow down and rest after the long shift.",
    wrongType: "reflexive",
    limit: 40
  },
  {
    template: "{subject} left {possAdj} backpack at the cafe, so I handed it back to {object} later.",
    wrongType: "possAdj",
    limit: 40
  },
  {
    template: "During rehearsal, the choreographer praised {name} because {subject} {have} improved {possAdj} timing.",
    wrongType: "subject",
    limit: 40
  }
];

function generateMappingTrials(limitCount = 60) {
  const { pronouns } = appState.setup;
  if (!limitCount) return [];

  const templates = shuffle(expandRecipes(mappingRecipes, 80)).slice(0, limitCount);

  const grammar = appState.setup.verbGrammar || inferGrammarFromPronoun(pronouns.subject);
  const distractorPool = {
    subject: ["he", "she", "they", pronouns.object, pronouns.possAdj],
    object: ["him", "her", "them", pronouns.subject, pronouns.reflexive],
    possAdj: ["his", "her", "their", pronouns.possPron, pronouns.subject],
    reflexive: ["himself", "herself", "themselves", pronouns.object]
  };

  return templates.map((tpl) => {
    const correct =
      tpl.type === "subject"
        ? pronouns.subject
        : tpl.type === "object"
        ? pronouns.object
        : tpl.type === "possAdj"
        ? pronouns.possAdj
        : pronouns.reflexive;

    const pool = distractorPool[tpl.type] || [];
    const distractors = shuffle(
      pool.filter((p) => p && p.toLowerCase() !== (correct || "").toLowerCase())
    ).slice(0, 3);
    const options = shuffle([...new Set([correct, ...distractors])]);

    const processed = applyLanguageRules(tpl.text, { pronouns, grammar });
    return {
      type: "mapping",
      text: processed,
      correct,
      options,
      blanks: 1
    };
  });
}

function generateExtinctionTrials(limitCount = 40) {
  const { pronouns } = appState.setup;

  if (!limitCount) return [];

  const baseTemplates = shuffle(expandRecipes(extinctionRecipes, 80))
    .slice(0, limitCount)
    .map((tpl) => tpl.text);

  const fallbackTrap = buildTrapPronounSet();
  const trapSets =
    (appState.setup.extinctionPronounSets || []).filter((set) =>
      Object.values(set || {}).some((v) => v && v.trim())
    ) || [];
  const trapPool = trapSets.length ? trapSets : [fallbackTrap];
  const correctGrammar = inferGrammarFromPronoun(pronouns.subject) || appState.setup.verbGrammar;

  return baseTemplates.map((tpl, idx) => {
    const useCorrect = idx % 2 === 0;
    const trapSet = { ...fallbackTrap, ...trapPool[idx % trapPool.length] };
    const trapGrammar = inferGrammarFromPronoun(trapSet.subject) || correctGrammar;
    const filled = applyLanguageRules(tpl, { pronouns, grammar: correctGrammar });
    const wrongVersion = applyLanguageRules(tpl, { pronouns: trapSet, grammar: trapGrammar });
    const text = useCorrect ? filled : wrongVersion;

    return {
      type: "extinction",
      text,
      isCorrect: useCorrect,
      mode: idx % 2 === 0 ? "flag" : "gng"
    };
  });
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
  const { pronouns, extinctionPronounSets } = appState.setup;
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

  const templates = shuffle(expandRecipes(editingRecipes, 80)).slice(0, limitCount);

  return templates.map((tpl) => {
    const correctPronoun = pronouns[tpl.wrongType];
    const pool = wrongPools[tpl.wrongType] || [];
    const preferredTrap =
      (extinctionPronounSets || [])
        .map((set) => (set[tpl.wrongType] || "").trim())
        .filter(Boolean)[0] || "";
    const normalizedCorrect = (correctPronoun || "").toLowerCase();

    const poolCandidates = pool.filter(
      (p) => !normalizedCorrect || p.toLowerCase() !== normalizedCorrect
    );

    const wrong =
      (preferredTrap && preferredTrap.toLowerCase() !== normalizedCorrect && preferredTrap) ||
      poolCandidates[Math.floor(Math.random() * poolCandidates.length)] ||
      pool[0] ||
      "";
    const pronounSetWithWrong = { ...pronouns, [tpl.wrongType]: wrong };
    const subjectInSentence = tpl.wrongType === "subject" ? wrong : pronouns.subject;
    const grammar = inferGrammarFromPronoun(subjectInSentence) || appState.setup.verbGrammar;
    const sentence = applyLanguageRules(tpl.text, {
      pronouns: pronounSetWithWrong,
      grammar
    });

    const distractors = shuffle(
      (pool || []).filter(
        (p) =>
          p &&
          p.toLowerCase() !== wrong.toLowerCase() &&
          (!correctPronoun || p.toLowerCase() !== correctPronoun.toLowerCase())
      )
    ).slice(0, 2);
    const options = shuffle([
      ...new Set([correctPronoun, wrong, ...distractors].filter(Boolean))
    ]);

    return {
      type: "editing",
      text: sentence,
      correct: correctPronoun,
      wrong,
      wrongType: tpl.wrongType,
      wrongWord: wrong,
      options
    };
  });
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

function startDualProgress(durationSeconds = 0) {
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

  const pronounTemplates = [
    "{subject} {have} finished {possAdj} report.",
    "I reminded {object} that the seat was {possPron}.",
    "{subject} coached {reflexive} to pace carefully.",
    "Please send {possAdj} file so {subject} can review.",
    "{name} said {subject} {were} proud of {reflexive}."
  ];

  const fillSentence = () => {
    let text = "";
    let attempts = 0;
    do {
      const tpl = pronounTemplates[Math.floor(Math.random() * pronounTemplates.length)];
      const useCorrect = Math.random() > 0.4;
      const set = useCorrect ? pronouns : trapSet;
      const grammar = inferGrammarFromPronoun(set.subject) || appState.setup.verbGrammar;
      text = applyLanguageRules(tpl, { pronouns: set, grammar });
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
    "Click the wrong word and choose the right pronoun, adjust is/are if needed, then press Continue.";
  trialContainer.appendChild(instructions);

  const tokens = trial.text.split(" ");
  const tokenWrap = document.createElement("div");
  tokenWrap.className = "token-list";

  const continueBtn = document.createElement("button");
  continueBtn.className = "primary";
  continueBtn.textContent = "Continue";
  continueBtn.disabled = true;
  continueBtn.style.marginTop = "12px";

  const corrections = new Map();
  let totalWrong = 0;

  const updateReadyState = () => {
    const ready = totalWrong > 0 && corrections.size === totalWrong && [...corrections.values()].every(Boolean);
    continueBtn.disabled = !ready;
    return ready;
  };

  tokens.forEach((tok, idx) => {
    const span = document.createElement("span");
    const cleaned = tok.replace(/[.,!?]/g, "");
    const normalized = cleaned.toLowerCase();
    const isWrong = normalized === trial.wrongWord.toLowerCase();
    const isVerbSwitchable = normalized === "is" || normalized === "are";
    if (isWrong) totalWrong += 1;
    span.className = "token";
    span.textContent = cleaned;
    span.addEventListener("click", () => {
      if (!isWrong && !isVerbSwitchable) return;
      if (span.dataset.replaced === "true") return;
      const select = document.createElement("select");
      select.className = "dropdown";
      select.setAttribute(
        "aria-label",
        isVerbSwitchable ? "Choose replacement verb" : "Choose replacement pronoun"
      );
      const options = isVerbSwitchable ? ["is", "are"] : trial.options;
      options.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o;
        select.appendChild(opt);
      });
      select.value = isVerbSwitchable ? normalized : trial.wrongWord;
      if (isWrong) {
        select.addEventListener("change", () => {
          const isCorrect = select.value === trial.correct;
          corrections.set(idx, isCorrect);
          select.classList.toggle("incorrect", !isCorrect);
          select.classList.toggle("correct", isCorrect);
          if (updateReadyState()) continueBtn.focus();
        });
        corrections.set(idx, false);
      }
      span.replaceWith(select);
      span.dataset.replaced = "true";
      select.focus();
    });
    tokenWrap.appendChild(span);
  });

  trialContainer.appendChild(tokenWrap);
  trialContainer.appendChild(continueBtn);

  continueBtn.addEventListener("click", () => {
    const ready = updateReadyState();
    if (!ready) return;
    handleAnswer(true, nextTrial, "editing", start);
  });
}

function renderTrial() {
  const trial = appState.trials[appState.currentTrialIndex];
  if (trial.type === "dual") {
    startDualProgress(trial.duration);
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

pronounPresetSelect.addEventListener("change", (e) => applyPronounPreset(e.target.value));
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

document.getElementById("restart-btn").addEventListener("click", resetApp);
if (clearSummaryBtn) {
  clearSummaryBtn.addEventListener("click", clearSavedSummary);
}

