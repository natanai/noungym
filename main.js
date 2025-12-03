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
    extinctionTerms: []
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

const isTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;

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
  appState.setup.extinctionTerms = extinctionRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
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
  const { pronouns, extinctionTerms } = appState.setup;
  const fallback = ["he", "she", "him", "her", "his"];
  const traps = extinctionTerms.length ? extinctionTerms : fallback;
  const baseTemplates = [
    "{name} said {they} would arrive soon.",
    "I handed the keys to {name} because {they} forgot {their} copy.",
    "Everyone loved {their} presentation.",
    "The gift was definitely {theirs}."
  ];

  return baseTemplates.map((tpl, idx) => {
    const useCorrect = idx % 2 === 0;
    const correctText = tpl
      .replace("{they}", pronouns.subject)
      .replace("{their}", pronouns.possAdj)
      .replace("{theirs}", pronouns.possPron)
      .replace("{name}", appState.setup.targetName);

    const trapWord = traps[idx % traps.length];
    const wrongText = correctText.replace(pronouns.subject, trapWord);
    const text = processTemplate(useCorrect ? correctText : wrongText);

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
  const wrongPronouns = ["he", "she", "him", "her", "they"];
  const templates = [
    "{name} forgot {have} umbrella, so {pronoun} borrowed mine.",
    "I asked {pronoun} if the notebook was {pronounPoss}.",
    "{name} reminded the team that {pronoun} {be} ready."
  ];
  return templates.map((tpl) => {
    const wrong = wrongPronouns[Math.floor(Math.random() * wrongPronouns.length)];
    const wrongPoss = wrong === "he" ? "his" : wrong === "she" ? "hers" : "theirs";
    const sentence = tpl
      .replace("{name}", appState.setup.targetName)
      .replace("{pronoun}", wrong)
      .replace("{pronounPoss}", wrongPoss);
    return {
      type: "editing",
      text: processTemplate(sentence),
      correct: pronouns.subject,
      wrong
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
  modeHint.textContent = trial.mode === "gng" ? "Go/No-Go: press SPACE if correct" : "Looks OK or Incorrect?";
  trialContainer.appendChild(modeHint);

  const buttons = document.createElement("div");
  buttons.className = "options";

  const okBtn = document.createElement("button");
  okBtn.className = "option";
  okBtn.textContent = trial.mode === "gng" ? "SPACE = Correct" : "Looks OK";
  okBtn.addEventListener("click", () =>
    handleAnswer(trial.isCorrect, nextTrial, "extinction", start)
  );

  const wrongBtn = document.createElement("button");
  wrongBtn.className = "option";
  wrongBtn.textContent = trial.mode === "gng" ? "Do Nothing / Wrong" : "Incorrect";
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
    document.removeEventListener("keydown", keyHandler);
  };

  const keyHandler = (e) => {
    if (e.key.toLowerCase() === "f") handleNumberAnswer("odd");
    if (e.key.toLowerCase() === "j") handleNumberAnswer("even");
    if (e.code === "Space") handlePronounAnswer(true);
    if (e.key.toLowerCase() === "k") handlePronounAnswer(false);
  };

  document.addEventListener("keydown", keyHandler);

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
    span.className = "token";
    span.textContent = tok.replace(/\./g, "");
    span.addEventListener("click", () => {
      const select = document.createElement("select");
      select.className = "dropdown";
      const opts = [trial.correct, trial.wrong, appState.setup.pronouns.object];
      opts.forEach((o) => {
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

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !setupScreen.classList.contains("hidden")) return;
  if (e.key === "Escape") {
    showSummary();
  }
});

document.getElementById("restart-btn").addEventListener("click", resetApp);

