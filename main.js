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
    pronouns: {
      subject: "",
      object: "",
      possAdj: "",
      possPron: "",
      reflexive: ""
    },
    verbGrammar: "plural",
    extinctionTerms: [],
    extinctionPronouns: {
      subject: "",
      object: "",
      possAdj: "",
      possPron: "",
      reflexive: ""
    }
  },
  trials: [],
  currentTrialIndex: 0,
  results: { mapping: [], extinction: [], dual: [], editing: [] },
  dualTimers: { number: null, pronoun: null, block: null }
};

const setupScreen = document.getElementById("setup-screen");
const testScreen = document.getElementById("test-screen");
const summaryScreen = document.getElementById("summary-screen");
const trialContainer = document.getElementById("trial-container");
const trialCounter = document.getElementById("trial-counter");
const practiceName = document.getElementById("practice-name");
const summaryStats = document.getElementById("summary-stats");
const pronounPresetSelect = document.getElementById("pronounPreset");
const extinctionPresetSelect = document.getElementById("extinctionPreset");
const pronounInputs = {
  subject: document.querySelector('input[name="subject"]'),
  object: document.querySelector('input[name="object"]'),
  possAdj: document.querySelector('input[name="possAdj"]'),
  possPron: document.querySelector('input[name="possPron"]'),
  reflexive: document.querySelector('input[name="reflexive"]')
};
const grammarRadios = document.querySelectorAll('input[name="verbGrammar"]');
const extinctionTextarea = document.getElementById("extinctionTerms");

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

function applyPronounPreset(key) {
  const preset = pronounPresets.find((p) => p.key === key);
  if (!preset || preset.custom) return;
  Object.entries(preset.pronouns).forEach(([k, v]) => {
    pronounInputs[k].value = v;
  });
  setGrammar(preset.verbGrammar);
}

function applyExtinctionPreset(key) {
  const preset = extinctionPresets.find((p) => p.key === key);
  if (!preset) return;
  if (preset.custom) {
    extinctionTextarea.value = "";
    return;
  }
  const visibleTerms = preset.pronouns
    ? [
        preset.pronouns.subject,
        preset.pronouns.object,
        preset.pronouns.possAdj,
        preset.pronouns.possPron,
        preset.pronouns.reflexive
      ]
    : preset.terms;
  extinctionTextarea.value = visibleTerms.filter(Boolean).join(", ");
}

function processTemplate(templateString) {
  const { targetName, verbGrammar } = appState.setup;
  const replacements = {
    "{name}": targetName,
    "{be}": verbGrammar === "plural" ? "are" : "is",
    "{have}": verbGrammar === "plural" ? "have" : "has",
    "{s}": verbGrammar === "plural" ? "" : "s",
    "{were}": verbGrammar === "plural" ? "were" : "was",
    "{don't}": verbGrammar === "plural" ? "don't" : "doesn't"
  };
  return Object.entries(replacements).reduce(
    (acc, [token, value]) => acc.replaceAll(token, value),
    templateString
  );
}

function escapeRegExp(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function shuffle(arr) {
  return arr
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function parseSetup(formData) {
  appState.setup.targetName = formData.get("targetName").trim();
  appState.setup.pronouns = {
    subject: formData.get("subject").trim(),
    object: formData.get("object").trim(),
    possAdj: formData.get("possAdj").trim(),
    possPron: formData.get("possPron").trim(),
    reflexive: formData.get("reflexive").trim()
  };
  appState.setup.verbGrammar = formData.get("verbGrammar") || "plural";
  const extinctionRaw = formData.get("extinctionTerms") || "";
  const extinctionPresetKey = formData.get("extinctionPreset") || "none";
  appState.setup.extinctionTerms = extinctionRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const presetMatch = extinctionPresets.find((p) => p.key === extinctionPresetKey);
  if (presetMatch && presetMatch.pronouns) {
    appState.setup.extinctionPronouns = { ...presetMatch.pronouns };
  } else {
    const [subject, object, possAdj, possPron, reflexive] = extinctionRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    appState.setup.extinctionPronouns = {
      subject: subject || "",
      object: object || "",
      possAdj: possAdj || "",
      possPron: possPron || "",
      reflexive: reflexive || ""
    };
  }
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
    { type: "reflexive", text: "___ bought it for ___self." },
    { type: "reflexive", text: "___ {be} proud of ___self." }
  ];

  const allPronouns = [
    pronouns.subject,
    pronouns.object,
    pronouns.possAdj,
    pronouns.possPron,
    pronouns.reflexive,
    "he",
    "she",
    "they",
    "him",
    "her"
  ];

  return templates.map((tpl) => {
    const correct =
      tpl.type === "subject"
        ? pronouns.subject
        : tpl.type === "object"
        ? pronouns.object
        : tpl.type === "possAdj"
        ? pronouns.possAdj
        : pronouns.reflexive;

    const distractors = shuffle(
      allPronouns.filter((p) => p && p.toLowerCase() !== correct.toLowerCase())
    ).slice(0, 3);
    const options = shuffle([correct, ...distractors]);

    const processed = processTemplate(tpl.text);
    return {
      type: "mapping",
      text: processed,
      correct,
      options,
      blanks: tpl.type === "reflexive" ? 2 : 1
    };
  });
}

function generateExtinctionTrials() {
  const { pronouns, extinctionPronouns, extinctionTerms } = appState.setup;
  const defaultTrap = {
    subject: "he",
    object: "him",
    possAdj: "his",
    possPron: "his",
    reflexive: "himself"
  };

  const baseTemplates = [
    "{name} said {subject} {have} already sent {possAdj} notes.",
    "I handed the keys to {object} because it was not {possPron} turn.",
    "After the meeting, {subject} thanked {object} and reminded {reflexive} to rest.",
    "The backpack on the chair is {possPron}, so please give it to {object}."
  ];

  const fallbackList = extinctionTerms.length
    ? extinctionTerms
    : ["he", "she", "him", "her", "his", "hers", "himself", "herself"];

  const trapForType = (type, idx) => {
    if (extinctionPronouns[type]) return extinctionPronouns[type];
    if (fallbackList.length) return fallbackList[idx % fallbackList.length];
    return defaultTrap[type];
  };

  const fillTemplate = (tpl, set) =>
    tpl
      .replaceAll("{name}", appState.setup.targetName)
      .replaceAll("{subject}", set.subject)
      .replaceAll("{object}", set.object)
      .replaceAll("{possAdj}", set.possAdj)
      .replaceAll("{possPron}", set.possPron)
      .replaceAll("{reflexive}", set.reflexive);

  return baseTemplates.map((tpl, idx) => {
    const useCorrect = idx % 2 === 0;
    const trapSet = {
      subject: trapForType("subject", 0),
      object: trapForType("object", 1),
      possAdj: trapForType("possAdj", 2),
      possPron: trapForType("possPron", 3),
      reflexive: trapForType("reflexive", 4)
    };

    const filled = fillTemplate(tpl, pronouns);
    const wrongVersion = fillTemplate(tpl, trapSet);
    const text = processTemplate(useCorrect ? filled : wrongVersion);

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
  const { pronouns } = appState.setup;
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
      text: "{name} reminded the crew that {subject} {be} accountable for {possPron} choices.",
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
    const wrongCandidates = pool.filter(
      (p) => correctPronoun && p.toLowerCase() !== correctPronoun.toLowerCase()
    );
    const wrong = wrongCandidates[Math.floor(Math.random() * wrongCandidates.length)] || pool[0] || "";
    const sentence = tpl.text
      .replaceAll("{name}", appState.setup.targetName)
      .replace(/{(subject|object|possAdj|possPron|reflexive)}/g, (_, type) =>
        type === tpl.wrongType ? wrong : pronouns[type]
      );

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
      text: processTemplate(sentence),
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
}

function recordResult(type, correct, startTime) {
  const elapsed = Date.now() - startTime;
  if (!appState.results[type]) appState.results[type] = [];
  appState.results[type].push({ correct, rt: elapsed });
}

function handleAnswer(correct, onAdvance, type, startTime) {
  flashFeedback(correct);
  if (correct) {
    recordResult(type, true, startTime);
    onAdvance();
    return;
  }
  recordResult(type, false, startTime);
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
    trial.mode === "gng"
      ? "Go/No-Go style: tap if the sentence is correct for the person."
      : "Does this look OK or incorrect?";
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
  const start = Date.now();
  trialContainer.innerHTML = "";
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

  const handleNumber = (value) => {
    numberArea.textContent = value;
  };

  const pronounTemplates = [
    "{name} said {be} arriving now.",
    "We should ask {name} if ___ needs help.",
    "I saw {name} and waved at ___.",
    "The coat is definitely ___.",
    "{name} reminded everyone to pace ___self."
  ];

  const { pronouns } = appState.setup;
  const fillSentence = () => {
    const tpl = pronounTemplates[Math.floor(Math.random() * pronounTemplates.length)];
    const correct = Math.random() > 0.4;
    const processed = processTemplate(tpl.replace("{name}", appState.setup.targetName));
    const filled = processed
      .replace("___ needs", (correct ? pronouns.subject : "he") + " needs")
      .replace("waved at ___", `waved at ${correct ? pronouns.object : "him"}`)
      .replace("is definitely ___", `is definitely ${correct ? pronouns.possPron : "his"}`)
      .replace("pace ___self", `pace ${correct ? pronouns.reflexive : "himself"}`);
    sentence.textContent = filled;
    sentence.dataset.correct = correct ? "true" : "false";
  };

  const numberInterval = setInterval(() => {
    const value = Math.floor(Math.random() * 90) + 10;
    handleNumber(value);
  }, 2000);

  const pronounInterval = setInterval(fillSentence, 4000);
  fillSentence();

  const cleanup = () => {
    clearInterval(numberInterval);
    clearInterval(pronounInterval);
    clearTimeout(appState.dualTimers.block);
  };

  const handleNumberAnswer = (choice) => {
    const value = Number(numberArea.textContent) || 0;
    const isEven = value % 2 === 0;
    const correct = (choice === "even" && isEven) || (choice === "odd" && !isEven);
    flashFeedback(correct);
  };

  const handlePronounAnswer = (claimedCorrect) => {
    const correct = sentence.dataset.correct === "true";
    const overall = claimedCorrect === correct;
    handleAnswer(overall, () => {}, "dual", start);
  };

  oddBtn.addEventListener("click", () => handleNumberAnswer("odd"));
  evenBtn.addEventListener("click", () => handleNumberAnswer("even"));
  correctBtn.addEventListener("click", () => handlePronounAnswer(true));
  wrongBtn.addEventListener("click", () => handlePronounAnswer(false));

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
  instructions.textContent = "Click the wrong word and choose the right pronoun.";
  trialContainer.appendChild(instructions);

  const tokens = trial.text.split(" ");
  const tokenWrap = document.createElement("div");
  tokenWrap.className = "token-list";

  tokens.forEach((tok) => {
    const span = document.createElement("span");
    const cleaned = tok.replace(/[.,!?]/g, "");
    const isWrong = cleaned.toLowerCase() === trial.wrongWord.toLowerCase();
    span.className = isWrong ? "token token-wrong" : "token token-dim";
    span.textContent = cleaned;
    if (isWrong) {
      span.addEventListener("click", () => {
        const select = document.createElement("select");
        select.className = "dropdown";
        trial.options.forEach((o) => {
          const opt = document.createElement("option");
          opt.value = o;
          opt.textContent = o;
          select.appendChild(opt);
        });
        select.addEventListener("change", () => {
          handleAnswer(select.value === trial.correct, nextTrial, "editing", start);
        });
        span.replaceWith(select);
      });
    }
    tokenWrap.appendChild(span);
  });

  trialContainer.appendChild(tokenWrap);
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

function showSummary() {
  setScreen("summary");
  summaryStats.innerHTML = "";
  const modes = [
    { key: "mapping", label: "Quick Mapping" },
    { key: "extinction", label: "Extinction" },
    { key: "dual", label: "Dual Task" },
    { key: "editing", label: "Sentence Editing" }
  ];
  modes.forEach((mode) => {
    const stats = calculateStats(appState.results[mode.key] || []);
    const card = document.createElement("div");
    card.className = "summary-card";
    card.innerHTML = `<p class="label">${mode.label}</p><p>Accuracy: ${stats.accuracy}</p><p>Median RT: ${stats.median}</p>`;
    summaryStats.appendChild(card);
  });
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
applyExtinctionPreset("none");

pronounPresetSelect.addEventListener("change", (e) => applyPronounPreset(e.target.value));
extinctionPresetSelect.addEventListener("change", (e) => applyExtinctionPreset(e.target.value));

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

