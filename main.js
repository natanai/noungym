const pronounPresets = [
  {
    key: "theyThem",
    label: "They/Them • plural verbs",
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
    label: "They/Them • singular verbs",
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
    label: "She/Her • singular verbs",
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
    label: "He/Him • singular verbs",
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
    label: "Ze/Zir • singular verbs",
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
    label: "Xe/Xem • singular verbs",
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
  dualTimers: { number: null, pronoun: null, block: null }
};

const summaryStorageKey = "noun-gym-last-summary";

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
const pronounPresetSelect = document.getElementById("pronounPreset");
const extinctionPresetSelect = document.getElementById("extinctionPreset");
const extinctionCustomFields = document.getElementById("extinction-custom-fields");
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

const languageTokenRegex = /\{([^}]+)\}/g;

function applyLanguageRules(template, overrides = {}) {
  const { targetName, deadname, verbGrammar } = appState.setup;
  const pronouns = overrides.pronouns || overrides.pronounSet || appState.setup.pronouns;
  const grammar = overrides.grammar || verbGrammar || inferGrammarFromPronoun(pronouns.subject);

  const context = {
    targetName,
    deadname: deadname || "their old name",
    pronouns,
    grammar
  };

  const grammarTokens = grammarLexicon[grammar] || grammarLexicon.plural;

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

function generateMappingTrials() {
  const { pronouns } = appState.setup;
  const templates = [
    { type: "subject", text: "___ {be} running a little late." },
    { type: "subject", text: "___ {have} a really cool style." },
    { type: "subject", text: "___ always work{s} hard." },
    { type: "subject", text: "I think ___ {be} next in line." },
    { type: "object", text: "I saw ___ at the store." },
    { type: "object", text: "Please give this to ___." },
    { type: "object", text: "We invited ___ to the party." },
    { type: "possAdj", text: "That is ___ coat." },
    { type: "possAdj", text: "___ dog is very cute." },
    { type: "possAdj", text: "We should go to ___ house." },
    { type: "reflexive", text: "{name} bought it for ___ as a treat." },
    { type: "reflexive", text: "{name} {be:name} proud of ___ after the ceremony." }
  ];

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

function generateExtinctionTrials() {
  const { pronouns } = appState.setup;

  const baseTemplates = [
    "{name} said {subject} {have} already sent {possAdj} notes.",
    "I handed the keys to {object} because it was not {possAdj} turn.",
    "After the meeting, {subject} thanked {object} and reminded {reflexive} to rest.",
    "The backpack on the chair is {possPron}, so please give it to {object}.",
    "Someone used {deadname}, but {subject} corrected {object} and shared {possAdj} right name—focus on whether the pronouns are correct."
  ];

  const trapSet = buildTrapPronounSet();
  const correctGrammar = inferGrammarFromPronoun(pronouns.subject) || appState.setup.verbGrammar;
  const trapGrammar = inferGrammarFromPronoun(trapSet.subject) || correctGrammar;

  return baseTemplates.map((tpl, idx) => {
    const useCorrect = idx % 2 === 0;
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
  return [
    {
      type: "dual",
      duration: sessionSeconds,
      startTime: null
    }
  ];
}

function generateEditingTrials() {
  const { pronouns, extinctionPronounSets } = appState.setup;
  const wrongPools = {
    subject: ["he", "she", "they", "ze", "xe"],
    object: ["him", "her", "them", "zir", "xem"],
    possAdj: ["his", "her", "their", "zir", "xyr"],
    possPron: ["his", "hers", "theirs", "zirs", "xyrs"],
    reflexive: ["himself", "herself", "themselves", "zirself", "xemself"]
  };

  const templates = [
    {
      text: "{subject} left {possAdj} backpack at the cafe, so I handed it back to {object} later.",
      wrongType: "possAdj"
    },
    {
      text: "{name} reminded the crew that {subject} {be} accountable for {possAdj} choices.",
      wrongType: "subject"
    },
    {
      text: "The director introduced {reflexive} and asked us to support {object} on {possAdj} first day.",
      wrongType: "reflexive"
    },
    {
      text: "When the bell rang, I checked whether the notebook was truly {possPron} before returning it to {object}.",
      wrongType: "possPron"
    }
  ];

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
    const options = shuffle([correctPronoun, wrong, ...distractors].filter(Boolean));

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

function buildTrials(selectedModes, sessionLength) {
  const trials = [];
  if (selectedModes.mapping) trials.push(...generateMappingTrials());
  if (selectedModes.extinction) trials.push(...generateExtinctionTrials());
  if (selectedModes.dual) trials.push(...generateDualTrials(sessionLength));
  if (selectedModes.editing) trials.push(...generateEditingTrials());
  appState.trials = shuffle(trials);
  appState.currentTrialIndex = 0;
}

function setScreen(screen) {
  setupScreen.classList.toggle("hidden", screen !== "setup");
  testScreen.classList.toggle("hidden", screen !== "test");
  summaryScreen.classList.toggle("hidden", screen !== "summary");
}

function flashFeedback(isCorrect) {
  trialContainer.classList.remove("feedback-correct", "feedback-incorrect");
  void trialContainer.offsetWidth;
  trialContainer.classList.add(isCorrect ? "feedback-correct" : "feedback-incorrect");
  setTimeout(() => {
    trialContainer.classList.remove("feedback-correct", "feedback-incorrect");
  }, 600);
}

function recordResult(type, correct, startTime, meta = {}) {
  const elapsed = Date.now() - startTime;
  if (!appState.results[type]) appState.results[type] = [];
  appState.results[type].push({ correct, rt: elapsed, ...meta });
}

function handleAnswer(correct, onAdvance, type, startTime, meta = {}) {
  flashFeedback(correct);
  if (correct) {
    recordResult(type, true, startTime, meta);
    onAdvance();
    return;
  }
  recordResult(type, false, startTime, meta);
  const overlay = document.createElement("div");
  overlay.className = "label";
  overlay.textContent = "Incorrect — pause & review";
  trialContainer.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
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
  numberArea.textContent = "Preparing...";
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

  const pronounControls = document.createElement("div");
  pronounControls.className = "grid-two mobile-controls";
  const correctBtn = document.createElement("button");
  correctBtn.className = "option";
  correctBtn.textContent = "CORRECT";
  const wrongBtn = document.createElement("button");
  wrongBtn.className = "option";
  wrongBtn.textContent = "WRONG";
  pronounControls.append(correctBtn, wrongBtn);
  pronounArea.appendChild(pronounControls);

  grid.appendChild(numberArea);
  grid.appendChild(pronounArea);
  trialContainer.appendChild(grid);

  let numberStart = Date.now();
  let pronounStart = Date.now();
  const handleNumber = (value) => {
    numberStart = Date.now();
    numberArea.textContent = value;
  };

  const pronounTemplates = [
    "{subject} {have} finished {possAdj} report.",
    "I reminded {object} that the seat was {possPron}.",
    "{name} coached {object} to pace {reflexive}.",
    "Please send {possAdj} file so {subject} can review.",
    "{name} said {subject} {were} proud of {reflexive}."
  ];

  const { pronouns } = appState.setup;
  const trapSet = buildTrapPronounSet();
  const fillSentence = () => {
    const tpl = pronounTemplates[Math.floor(Math.random() * pronounTemplates.length)];
    const useCorrect = Math.random() > 0.4;
    const set = useCorrect ? pronouns : trapSet;
    const grammar = inferGrammarFromPronoun(set.subject) || appState.setup.verbGrammar;
    const text = applyLanguageRules(tpl, { pronouns: set, grammar });
    sentence.textContent = text;
    sentence.dataset.correct = useCorrect ? "true" : "false";
    pronounStart = Date.now();
  };

  const numberInterval = setInterval(() => {
    const value = Math.floor(Math.random() * 90) + 10;
    handleNumber(value);
  }, 2000);

  const pronounInterval = setInterval(fillSentence, 4000);
  handleNumber(Math.floor(Math.random() * 90) + 10);
  fillSentence();

  const cleanup = () => {
    clearInterval(numberInterval);
    clearInterval(pronounInterval);
    clearTimeout(appState.dualTimers.block);
    window.removeEventListener("keydown", keyHandler);
  };

  const handleNumberAnswer = (choice) => {
    const value = Number(numberArea.textContent) || 0;
    const isEven = value % 2 === 0;
    const correct = (choice === "even" && isEven) || (choice === "odd" && !isEven);
    flashFeedback(correct);
    recordResult("dual", correct, numberStart, { task: "number" });
  };

  const handlePronounAnswer = (claimedCorrect) => {
    const correct = sentence.dataset.correct === "true";
    const overall = claimedCorrect === correct;
    handleAnswer(overall, () => {}, "dual", pronounStart, { task: "pronoun" });
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
    "Click the wrong word and choose the right pronoun, then press Continue.";
  trialContainer.appendChild(instructions);

  const tokens = trial.text.split(" ");
  const tokenWrap = document.createElement("div");
  tokenWrap.className = "token-list";

  const continueBtn = document.createElement("button");
  continueBtn.className = "primary";
  continueBtn.textContent = "Continue";
  continueBtn.disabled = true;
  continueBtn.style.marginTop = "12px";

  let selectedValue = null;

  tokens.forEach((tok) => {
    const span = document.createElement("span");
    const cleaned = tok.replace(/[.,!?]/g, "");
    const isWrong = cleaned.toLowerCase() === trial.wrongWord.toLowerCase();
    span.className = "token";
    span.textContent = cleaned;
    span.addEventListener("click", () => {
      if (!isWrong) return;
      const select = document.createElement("select");
      select.className = "dropdown";
      trial.options.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o;
        select.appendChild(opt);
      });
      select.addEventListener("change", () => {
        selectedValue = select.value;
        continueBtn.disabled = false;
        select.classList.toggle("incorrect", select.value !== trial.correct);
        select.classList.toggle("correct", select.value === trial.correct);
      });
      span.replaceWith(select);
      select.focus();
    });
    tokenWrap.appendChild(span);
  });

  trialContainer.appendChild(tokenWrap);
  trialContainer.appendChild(continueBtn);

  continueBtn.addEventListener("click", () => {
    if (!selectedValue) return;
    const isCorrect = selectedValue === trial.correct;
    handleAnswer(isCorrect, nextTrial, "editing", start);
  });
}

function renderTrial() {
  const trial = appState.trials[appState.currentTrialIndex];
  trialCounter.textContent = `${appState.currentTrialIndex + 1} / ${appState.trials.length}`;
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
  appState.trials = [];
  appState.currentTrialIndex = 0;
  appState.results = { mapping: [], extinction: [], dual: [], editing: [] };
  setScreen("setup");
}

function startSession(selectedModes, sessionLength) {
  buildTrials(selectedModes, sessionLength);
  if (!appState.trials.length) return;
  practiceName.textContent = appState.setup.targetName;
  setScreen("test");
  renderTrial();
}

populateSelect(pronounPresetSelect, pronounPresets, "theyThem");
populateSelect(extinctionPresetSelect, extinctionPresets, "none");
applyPronounPreset("theyThem");
applyExtinctionPreset(["none"]);

const selectedExtinctionValues = () => getSelectedValues(extinctionPresetSelect);

pronounPresetSelect.addEventListener("change", (e) => applyPronounPreset(e.target.value));
extinctionPresetSelect.addEventListener("change", () => applyExtinctionPreset(selectedExtinctionValues()));

document.getElementById("setup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  parseSetup(data);
  const selectedModes = {
    mapping: data.get("testStyleMapping") !== null,
    extinction: data.get("testStyleExtinction") !== null,
    dual: data.get("testStyleDual") !== null,
    editing: data.get("testStyleEditing") !== null
  };
  const sessionLength = Number(data.get("sessionLength")) || 30;
  startSession(selectedModes, sessionLength);
});

document.getElementById("restart-btn").addEventListener("click", resetApp);
if (clearSummaryBtn) {
  clearSummaryBtn.addEventListener("click", clearSavedSummary);
}

