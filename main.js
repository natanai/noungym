const appState = {
  setup: {
    targetName: "",
    pronouns: {
      subject: "",
      object: "",
      possAdj: "",
      possPron: "",
      reflexive: "",
    },
    extinctionTerms: [],
    selectedStyles: [],
    totalTrials: 0,
  },
  trials: [],
  currentTrialIndex: 0,
  results: {
    mapping: [],
    extinction: [],
    dual: [],
    editing: [],
  },
  dualTaskTimers: {
    numberStream: null,
    pronounStream: null,
  },
  keyHandlersActive: false,
  activeKeyHandler: null,
  activeTimeout: null,
  shownIntros: {
    mapping: false,
    extinction: false,
    dual: false,
    editing: false,
  },
};

const sessionLengthMap = {
  short: 30,
  medium: 60,
  long: 90,
};

const distractorPronouns = ["he", "she", "they", "ze", "hir", "it", "xe"];

const pronounPresets = {
  they: { subject: "they", object: "them", possAdj: "their", possPron: "theirs", reflexive: "themself" },
  she: { subject: "she", object: "her", possAdj: "her", possPron: "hers", reflexive: "herself" },
  he: { subject: "he", object: "him", possAdj: "his", possPron: "his", reflexive: "himself" },
  ze: { subject: "ze", object: "hir", possAdj: "hir", possPron: "hirs", reflexive: "hirself" },
  xe: { subject: "xe", object: "xem", possAdj: "xyr", possPron: "xyrs", reflexive: "xemself" },
};

function $(selector) {
  return document.querySelector(selector);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function parseExtinctionTerms(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

function applyPronounPreset(key) {
  if (!key || key === "custom") return;
  const preset = pronounPresets[key];
  if (!preset) return;
  $("#pronounSubject").value = preset.subject;
  $("#pronounObject").value = preset.object;
  $("#pronounPossAdj").value = preset.possAdj;
  $("#pronounPossPron").value = preset.possPron;
  $("#pronounReflexive").value = preset.reflexive;
}

function showSection(sectionId) {
  ["setup-screen", "test-screen", "summary-screen"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("hidden", id !== sectionId);
  });
}

function updateTrialStatus() {
  const remaining = appState.trials.length - appState.currentTrialIndex;
  const statusEl = $("#trial-status");
  if (statusEl) {
    statusEl.textContent = `Session in progress – ${remaining} trial${remaining === 1 ? "" : "s"} remaining.`;
  }
}

function conjugateBe(pronoun) {
  const lower = pronoun.trim().toLowerCase();
  if (lower === "i") return "am";
  if (["you", "y'all", "ya'll", "yall", "we", "they"].includes(lower)) return "are";
  return "is";
}

function resetAppState(preserveSetup = false) {
  const previousSetup = { ...appState.setup };
  appState.setup = {
    targetName: "",
    pronouns: { subject: "", object: "", possAdj: "", possPron: "", reflexive: "" },
    extinctionTerms: [],
    selectedStyles: [],
    totalTrials: 0,
  };
  appState.trials = [];
  appState.currentTrialIndex = 0;
  appState.results = { mapping: [], extinction: [], dual: [], editing: [] };
  appState.dualTaskTimers = { numberStream: null, pronounStream: null };
  appState.keyHandlersActive = false;
  appState.activeKeyHandler = null;
  appState.activeTimeout = null;
  appState.shownIntros = { mapping: false, extinction: false, dual: false, editing: false };

  if (preserveSetup) {
    appState.setup = previousSetup;
  }
}

function getSelectedStyles(formData) {
  const styles = [];
  ["mapping", "extinction", "dual", "editing"].forEach((style) => {
    if (formData.get(`testStyle${style.charAt(0).toUpperCase()}${style.slice(1)}`)) {
      styles.push(style);
    }
  });
  return styles;
}

function readSetupForm(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const selectedStyles = getSelectedStyles(formData);
  const styleError = $("#style-error");
  if (!selectedStyles.length) {
    styleError.textContent = "Choose at least one test style to continue.";
    return;
  }
  styleError.textContent = "";

  const targetName = formData.get("targetName").trim();
  const pronouns = {
    subject: formData.get("pronounSubject").trim(),
    object: formData.get("pronounObject").trim(),
    possAdj: formData.get("pronounPossAdj").trim(),
    possPron: formData.get("pronounPossPron").trim(),
    reflexive: formData.get("pronounReflexive").trim(),
  };
  const extinctionTerms = parseExtinctionTerms(formData.get("extinctionTerms"));
  const sessionLength = formData.get("sessionLength") || "medium";

  appState.setup = {
    targetName,
    pronouns,
    extinctionTerms,
    selectedStyles,
    totalTrials: sessionLengthMap[sessionLength] || sessionLengthMap.medium,
  };

  buildTrials();
  startSession();
}

function buildTrials() {
  const { selectedStyles, totalTrials } = appState.setup;
  const trials = [];
  const perStyle = Math.floor(totalTrials / selectedStyles.length);
  let remainder = totalTrials % selectedStyles.length;

  selectedStyles.forEach((style) => {
    let count = perStyle;
    if (remainder > 0) {
      count += 1;
      remainder -= 1;
    }
    let generated = [];
    switch (style) {
      case "mapping":
        generated = generateMappingTrials(count);
        break;
      case "extinction":
        generated = generateExtinctionTrials(count);
        break;
      case "dual":
        generated = generateDualTrials(count);
        break;
      case "editing":
        generated = generateEditingTrials(count);
        break;
      default:
        break;
    }
    trials.push(...generated);
  });

  shuffle(trials);
  const idCounters = { mapping: 1, extinction: 1, dual: 1, editing: 1 };
  trials.forEach((trial) => {
    const padded = String(idCounters[trial.kind]).padStart(3, "0");
    trial.id = `${trial.kind}-${padded}`;
    idCounters[trial.kind] += 1;
  });
  appState.trials = trials;
}

function generateMappingTrials(count) {
  const { pronouns, targetName } = appState.setup;
  const templates = [
    { text: "___ [be] running a little late.", type: "subject", needsBe: true },
    { text: "You saw ___ at the store yesterday.", type: "object" },
    { text: "You liked ___ new haircut.", type: "possAdj" },
    { text: "This jacket is ___.", type: "possPron" },
    { text: `${targetName || "The friend"} calls ___self a perfectionist.`, type: "reflexive" },
  ];

  const trials = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const correctOption = pronouns[template.type] || "";
    const beForm = template.needsBe ? conjugateBe(pronouns.subject || "") : null;
    const sentence = template.text
      .replace("[be]", beForm || "")
      .replace("___.", "_____.");

    const optionSet = new Set([correctOption]);
    while (optionSet.size < 4) {
      const candidate = distractorPronouns[Math.floor(Math.random() * distractorPronouns.length)];
      if (candidate.toLowerCase() !== correctOption.toLowerCase()) {
        optionSet.add(candidate);
      }
    }
    const options = shuffle(Array.from(optionSet));

    trials.push({
      id: "",
      kind: "mapping",
      startTime: null,
      endTime: null,
      data: {
        sentence,
        type: template.type,
        options,
        correctOption,
      },
    });
  }
  return trials;
}

function buildExtinctionSentence(isOldTerm) {
  const actions = [
    "told the group about the plan",
    "said they were proud of the progress",
    "shared a funny story",
    "asked for a quick favor",
    "mentioned the upcoming trip",
  ];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const { pronouns, targetName, extinctionTerms } = appState.setup;
  const correctSubject = pronouns.subject || "they";
  const wrongPronoun = extinctionTerms[0] || "he";
  const nameOrPronoun = isOldTerm && extinctionTerms.length ? extinctionTerms[0] : targetName || correctSubject;
  const subjectWord = isOldTerm ? wrongPronoun : correctSubject;
  const sentenceStart = isOldTerm ? `${nameOrPronoun} said ${subjectWord}` : `${targetName || "They"} said ${correctSubject}`;
  return `${sentenceStart} ${action}.`;
}

function generateExtinctionTrials(count) {
  const trials = [];
  for (let i = 0; i < count; i += 1) {
    const mode = i % 2 === 0 ? "flag" : "goNoGo";
    const hasOldTerm = Math.random() > 0.5;
    const sentence = buildExtinctionSentence(hasOldTerm);
    const isCorrectPronoun = !hasOldTerm;
    trials.push({
      id: "",
      kind: "extinction",
      startTime: null,
      endTime: null,
      data: {
        mode,
        sentence,
        hasOldTerm,
        isCorrectPronoun,
      },
    });
  }
  return trials;
}

function generateDualTrials(count) {
  const trials = [];
  for (let i = 0; i < count; i += 1) {
    trials.push({
      id: "",
      kind: "dual",
      startTime: null,
      endTime: null,
      data: {
        durationMs: 30000,
      },
    });
  }
  return trials;
}

function buildEditingTemplates() {
  const { targetName, pronouns } = appState.setup;
  const name = targetName || "[Name]";
  return [
    `${name} said she would text you later if she had time.`,
    `You told your friend that he really loves that new game.`,
    `${name} forgot her keys at your place again.`,
    `${name} thinks he can finish the project by Friday.`,
    `You noticed that she brought cookies for the group.`,
  ].map((t) =>
    t.replace(/\bshe\b/gi, pronouns.subject || "they")
      .replace(/\bhe\b/gi, pronouns.subject || "they")
  );
}

function tokenizeForEditing(sentence) {
  const tokens = sentence.split(/(\s+)/).filter(Boolean);
  const { targetName, pronouns, extinctionTerms } = appState.setup;
  const allClickable = [
    pronouns.subject,
    pronouns.object,
    pronouns.possAdj,
    pronouns.possPron,
    pronouns.reflexive,
    ...(extinctionTerms || []),
    targetName,
  ]
    .filter(Boolean)
    .map((t) => t.toLowerCase());

  return tokens.map((token) => {
    const clean = token.replace(/[.,!?]/g, "");
    const lower = clean.toLowerCase();
    const isPronounLike = ["he", "she", "they", "them", "his", "her", "hers", "theirs", "ze", "hir", pronouns.subject?.toLowerCase()].includes(lower);
    const isExtinction = extinctionTerms.includes(lower);
    const isName = targetName && lower === targetName.toLowerCase();

    const clickable = isPronounLike || isExtinction || isName;
    let correct = token;
    if (isPronounLike) {
      const correctionMap = {
        he: pronouns.subject || "they",
        she: pronouns.subject || "they",
        him: pronouns.object || "them",
        her: pronouns.object || "them",
        hers: pronouns.possPron || pronouns.possAdj || "theirs",
        his: pronouns.possAdj || "their",
        they: pronouns.subject || "they",
        them: pronouns.object || "them",
        their: pronouns.possAdj || "their",
        theirs: pronouns.possPron || "theirs",
        ze: pronouns.subject || "they",
        hir: pronouns.object || "them",
      };
      correct = correctionMap[lower] || token;
    }
    if (isExtinction) {
      correct = targetName || pronouns.subject || token;
    }

    return {
      text: token,
      type: isName ? "name" : "word",
      clickable,
      correct,
    };
  });
}

function generateEditingTrials(count) {
  const templates = buildEditingTemplates();
  const trials = [];
  for (let i = 0; i < count; i += 1) {
    const sentence = templates[i % templates.length];
    trials.push({
      id: "",
      kind: "editing",
      startTime: null,
      endTime: null,
      data: {
        rawSentence: sentence,
        tokens: tokenizeForEditing(sentence),
      },
    });
  }
  return trials;
}

function startSession() {
  appState.currentTrialIndex = 0;
  appState.shownIntros = { mapping: false, extinction: false, dual: false, editing: false };
  $("#practice-name").textContent = appState.setup.targetName || "Your person";
  showSection("test-screen");
  updateTrialStatus();
  renderNextTrial();
}

function renderNextTrial() {
  if (appState.currentTrialIndex >= appState.trials.length) {
    endSession();
    return;
  }
  const trial = appState.trials[appState.currentTrialIndex];
  renderTrial(trial);
}

function renderTrial(trial) {
  const container = $("#trial-container");
  container.innerHTML = "";
  if (!appState.shownIntros[trial.kind]) {
    renderIntroCard(trial.kind, container, trial);
    updateTrialStatus();
    return;
  }
  switch (trial.kind) {
    case "mapping":
      renderMappingTrial(trial, container);
      break;
    case "extinction":
      renderExtinctionTrial(trial, container);
      break;
    case "dual":
      renderDualTrial(trial, container);
      break;
    case "editing":
      renderEditingTrial(trial, container);
      break;
    default:
      break;
  }
  trial.startTime = performance.now();
  updateTrialStatus();
}

function finishTrial(trial, resultData) {
  if (!trial.endTime) {
    trial.endTime = performance.now();
  }
  const kind = trial.kind;
  appState.results[kind].push({
    trialId: trial.id,
    kind,
    startTime: trial.startTime,
    endTime: trial.endTime,
    rt: trial.endTime - trial.startTime,
    data: resultData,
  });
  appState.currentTrialIndex += 1;
  renderNextTrial();
}

function renderIntroCard(kind, container, trial) {
  const introCopy = {
    mapping: {
      title: "Quick mapping",
      summary: "Fill in the blank with the correct pronoun form.",
      tips: ["Click the option that completes the sentence.", "Move quickly; each item is one blank."],
    },
    extinction: {
      title: "Extinction",
      summary: "Spot and stop old pronouns or names.",
      tips: [
        "Flag old terms when asked 'Looks OK or Wrong?'.",
        "In go/no-go rounds, press Space only when everything is correct—stay still if you see an old term.",
      ],
    },
    dual: {
      title: "Dual-task",
      summary: "Numbers + pronouns at once.",
      tips: ["F = odd, J = even numbers.", "Space = correct pronouns, K = old pronoun/name."],
    },
    editing: {
      title: "Sentence editing",
      summary: "Swap highlighted words to the correct forms before finishing.",
      tips: ["Tap highlighted tokens to choose the right word.", "Finish when everything that needs a change is corrected."],
    },
  };

  const info = introCopy[kind];
  const card = document.createElement("div");
  card.className = "card intro-card";
  card.innerHTML = `
    <div class="badge">New test style</div>
    <h3>${info.title}</h3>
    <p>${info.summary}</p>
  `;

  const list = document.createElement("ul");
  list.className = "tip-list";
  info.tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    list.appendChild(li);
  });
  card.appendChild(list);

  const action = document.createElement("div");
  action.className = "actions align-start";
  const button = document.createElement("button");
  button.className = "primary";
  button.textContent = "Start this style";
  button.addEventListener("click", () => {
    appState.shownIntros[kind] = true;
    renderTrial(trial);
  });
  action.appendChild(button);
  card.appendChild(action);
  container.appendChild(card);
}

function renderMappingTrial(trial, container) {
  const card = document.createElement("div");
  card.className = "card";
  const sentence = document.createElement("p");
  sentence.className = "sentence";
  sentence.textContent = trial.data.sentence.replace("___", "_____");
  card.appendChild(sentence);

  const prompt = document.createElement("p");
  prompt.className = "small-text";
  prompt.textContent = "Choose the correct word for the blank.";
  card.appendChild(prompt);

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "option-buttons";
  trial.data.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "secondary";
    btn.addEventListener("click", () => {
      trial.endTime = performance.now();
      const isCorrect = option.toLowerCase() === trial.data.correctOption.toLowerCase();
      finishTrial(trial, {
        chosen: option,
        correct: trial.data.correctOption,
        isCorrect,
        rt: trial.endTime - trial.startTime,
      });
    });
    optionsWrap.appendChild(btn);
  });
  card.appendChild(optionsWrap);
  container.appendChild(card);
}

function renderExtinctionTrial(trial, container) {
  const card = document.createElement("div");
  card.className = "card";
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = trial.data.mode === "flag" ? "Flag old terms" : "Go / No-Go";
  card.appendChild(badge);

  const sentence = document.createElement("p");
  sentence.className = "sentence";
  sentence.textContent = trial.data.sentence;
  card.appendChild(sentence);

  if (trial.data.mode === "flag") {
    const buttons = document.createElement("div");
    buttons.className = "option-buttons";
    const okBtn = document.createElement("button");
    okBtn.className = "secondary";
    okBtn.textContent = "Looks OK";
    okBtn.addEventListener("click", () => {
      trial.endTime = performance.now();
      const isCorrect = !trial.data.hasOldTerm;
      finishTrial(trial, {
        response: "ok",
        expectedSafe: !trial.data.hasOldTerm,
        isCorrect,
        hasOldTerm: trial.data.hasOldTerm,
        isCorrectPronoun: trial.data.isCorrectPronoun,
      });
    });
    const flagBtn = document.createElement("button");
    flagBtn.className = "secondary";
    flagBtn.textContent = "Wrong pronoun / name here";
    flagBtn.addEventListener("click", () => {
      trial.endTime = performance.now();
      const isCorrect = trial.data.hasOldTerm;
      finishTrial(trial, {
        response: "flag",
        expectedFlag: trial.data.hasOldTerm,
        isCorrect,
        hasOldTerm: trial.data.hasOldTerm,
        isCorrectPronoun: trial.data.isCorrectPronoun,
      });
    });
    buttons.append(okBtn, flagBtn);
    card.appendChild(buttons);
  } else {
    const instructions = document.createElement("p");
    instructions.className = "small-text";
    instructions.textContent = "Press space ONLY if this uses the correct pronouns; otherwise do nothing.";
    card.appendChild(instructions);

    const handler = (event) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      trial.endTime = performance.now();
      const responded = true;
      const isCorrect = trial.data.isCorrectPronoun;
      window.removeEventListener("keydown", handler);
      clearTimeout(timeoutId);
      appState.activeKeyHandler = null;
      appState.activeTimeout = null;
      finishTrial(trial, {
        responded,
        isCorrect,
        hasOldTerm: trial.data.hasOldTerm,
        isCorrectPronoun: trial.data.isCorrectPronoun,
      });
    };

    const timeoutId = setTimeout(() => {
      window.removeEventListener("keydown", handler);
      trial.endTime = performance.now();
      finishTrial(trial, {
        responded: false,
        isCorrect: !trial.data.isCorrectPronoun,
        hasOldTerm: trial.data.hasOldTerm,
        isCorrectPronoun: trial.data.isCorrectPronoun,
      });
      appState.activeKeyHandler = null;
      appState.activeTimeout = null;
    }, 1500 + Math.random() * 600);

    window.addEventListener("keydown", handler);
    appState.keyHandlersActive = true;
    appState.activeKeyHandler = handler;
    appState.activeTimeout = timeoutId;
  }

  container.appendChild(card);
}

function renderDualTrial(trial, container) {
  const intro = document.createElement("div");
  intro.className = "card flex-column";
  intro.innerHTML = `
    <div class="badge">Dual-task block</div>
    <p class="small-text">Numbers: press F for odd, J for even. Pronouns: Space if correct, K if you spot an old pronoun/name.</p>
  `;
  container.appendChild(intro);

  const layout = document.createElement("div");
  layout.className = "flex-row";
  const numberArea = document.createElement("div");
  numberArea.className = "card flex-column";
  numberArea.innerHTML = `<div class="label">Number stream</div><div id="number-stream" class="number-stream">-</div>`;
  const pronounArea = document.createElement("div");
  pronounArea.className = "card flex-column";
  pronounArea.innerHTML = `<div class="label">Pronoun prompts</div><div id="pronoun-stream" class="sentence">Get ready...</div>`;
  layout.append(numberArea, pronounArea);
  container.appendChild(layout);

  const blockStart = performance.now();
  const numberEvents = [];
  const pronounEvents = [];
  let activeDigit = null;
  let activeDigitTime = null;
  let activePronoun = null;
  let activePronounTime = null;

  const numberStream = setInterval(() => {
    activeDigit = Math.floor(Math.random() * 9) + 1;
    activeDigitTime = performance.now();
    $("#number-stream").textContent = activeDigit;
  }, 2000);
  appState.dualTaskTimers.numberStream = numberStream;

  const pronounSentences = [
    { text: "They finished the report on time.", isOld: false },
    { text: "She said she would join later.", isOld: true },
    { text: "He forgot the meeting link.", isOld: true },
    { text: "The team thanked them for the help.", isOld: false },
  ];

  function schedulePronounPrompt() {
    const delay = 3000 + Math.random() * 4000;
    const timeout = setTimeout(() => {
      const prompt = pronounSentences[Math.floor(Math.random() * pronounSentences.length)];
      activePronoun = prompt;
      activePronounTime = performance.now();
      $("#pronoun-stream").textContent = prompt.text;
      schedulePronounPrompt();
    }, delay);
    appState.dualTaskTimers.pronounStream = timeout;
  }

  schedulePronounPrompt();

  const handler = (event) => {
    if (["KeyF", "KeyJ", "Space", "KeyK"].includes(event.code)) {
      event.preventDefault();
    }
    const now = performance.now();
    if ((event.code === "KeyF" || event.code === "KeyJ") && activeDigit !== null) {
      const expectEven = activeDigit % 2 === 0;
      const isEvenKey = event.code === "KeyJ";
      numberEvents.push({
        digit: activeDigit,
        response: event.code === "KeyJ" ? "even" : "odd",
        rt: now - activeDigitTime,
        isCorrect: expectEven === isEvenKey,
      });
    }
    if ((event.code === "Space" || event.code === "KeyK") && activePronoun) {
      const wantsOld = event.code === "KeyK";
      pronounEvents.push({
        sentence: activePronoun.text,
        rt: now - activePronounTime,
        flaggedOld: wantsOld,
        isCorrect: wantsOld === activePronoun.isOld,
      });
      activePronoun = null;
      $("#pronoun-stream").textContent = "...";
    }
  };

  window.addEventListener("keydown", handler);
  appState.keyHandlersActive = true;
  appState.activeKeyHandler = handler;

  setTimeout(() => {
    clearInterval(numberStream);
    clearTimeout(appState.dualTaskTimers.pronounStream);
    window.removeEventListener("keydown", handler);
    appState.keyHandlersActive = false;
    appState.activeKeyHandler = null;
    trial.endTime = performance.now();
    finishTrial(trial, { numberEvents, pronounEvents, blockDuration: trial.endTime - blockStart });
  }, trial.data.durationMs);
}

function renderEditingTrial(trial, container) {
  const card = document.createElement("div");
  card.className = "card";
  const sentence = document.createElement("div");
  sentence.className = "token-stream";

  trial.data.tokens.forEach((token, index) => {
    const btn = document.createElement("button");
    btn.textContent = token.text;
    btn.className = `token-button ${token.clickable ? "clickable" : ""}`;
    btn.dataset.index = index;
    if (token.clickable) {
      btn.addEventListener("click", () => openTokenEditor(btn, trial, token, index));
    }
    sentence.appendChild(btn);
  });

  const done = document.createElement("button");
  done.textContent = "Done";
  done.className = "primary";
  done.addEventListener("click", () => finishEditingTrial(trial));

  const helper = document.createElement("p");
  helper.className = "small-text";
  helper.textContent = "Click highlighted words to correct names or pronouns.";

  card.append(sentence, helper, done);
  container.appendChild(card);
}

function openTokenEditor(button, trial, token, index) {
  const options = new Set([
    token.correct,
    appState.setup.pronouns.subject,
    appState.setup.pronouns.object,
    appState.setup.pronouns.possAdj,
    appState.setup.pronouns.possPron,
    appState.setup.pronouns.reflexive,
  ].filter(Boolean));

  const select = document.createElement("select");
  select.className = "inline-select";
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
  select.addEventListener("change", () => {
    const chosen = select.value;
    trial.data.tokens[index].text = chosen;
    button.textContent = chosen;
    select.remove();
  });
  button.insertAdjacentElement("afterend", select);
}

function finishEditingTrial(trial) {
  trial.endTime = performance.now();
  const tokensInitiallyIncorrect = trial.data.tokens.filter((t) => t.clickable && t.text !== t.correct).length;
  let corrected = 0;
  let stillIncorrect = 0;
  trial.data.tokens.forEach((t) => {
    if (t.clickable) {
      if (t.text.toLowerCase() === t.correct.toLowerCase()) corrected += 1;
      else stillIncorrect += 1;
    }
  });
  finishTrial(trial, {
    tokensInitiallyIncorrect,
    tokensCorrected: corrected,
    tokensStillIncorrect: stillIncorrect,
    rt: trial.endTime - trial.startTime,
  });
}

function computeAccuracy(results) {
  if (!results.length) return 0;
  const correct = results.filter((r) => r.data.isCorrect || r.data.isCorrect === true).length;
  return Math.round((correct / results.length) * 100);
}

function summarizeSession() {
  const summary = $("#summary-content");
  summary.innerHTML = "";

  const mapping = appState.results.mapping;
  const mappingCard = document.createElement("div");
  mappingCard.className = "summary-card";
  const mappingRTs = mapping.map((m) => m.rt);
  mappingCard.innerHTML = `
    <h3>Mapping</h3>
    <p>${mapping.length} trials · Accuracy ${computeAccuracy(mapping)}% · Median RT ${Math.round(median(mappingRTs))} ms</p>
  `;
  summary.appendChild(mappingCard);

  const extinction = appState.results.extinction;
  const extinctionCard = document.createElement("div");
  extinctionCard.className = "summary-card";
  const flaggedOld = extinction.filter((e) => e.data.hasOldTerm);
  const correctFlags = extinction.filter((e) => e.data.isCorrect);
  const oldTermCorrect = extinction.filter((e) => e.data.hasOldTerm && e.data.isCorrect);
  extinctionCard.innerHTML = `
    <h3>Extinction</h3>
    <p>${extinction.length} trials · Correct responses ${correctFlags.length}/${extinction.length}</p>
    <p>Old term trials: ${flaggedOld.length} · Correct handling: ${oldTermCorrect.length}</p>
  `;
  summary.appendChild(extinctionCard);

  const dual = appState.results.dual;
  const dualCard = document.createElement("div");
  dualCard.className = "summary-card";
  const numberAccuracies = dual.map((d) => {
    const correct = d.data.numberEvents.filter((e) => e.isCorrect).length;
    const total = d.data.numberEvents.length || 1;
    return (correct / total) * 100;
  });
  const pronounAccuracies = dual.map((d) => {
    const correct = d.data.pronounEvents.filter((e) => e.isCorrect).length;
    const total = d.data.pronounEvents.length || 1;
    return (correct / total) * 100;
  });
  dualCard.innerHTML = `
    <h3>Dual-task</h3>
    <p>${dual.length} blocks · Avg number accuracy ${Math.round(median(numberAccuracies))}% · Avg pronoun accuracy ${Math.round(median(pronounAccuracies))}%</p>
  `;
  summary.appendChild(dualCard);

  const editing = appState.results.editing;
  const editingCard = document.createElement("div");
  editingCard.className = "summary-card";
  const incorrectTokens = editing.map((e) => e.data.tokensInitiallyIncorrect || 0);
  const correctedTokens = editing.map((e) => e.data.tokensCorrected || 0);
  editingCard.innerHTML = `
    <h3>Editing</h3>
    <p>${editing.length} trials · Avg incorrect to start: ${Math.round(median(incorrectTokens))} · Avg corrected: ${Math.round(median(correctedTokens))} · Median RT ${Math.round(median(editing.map((e) => e.rt)))} ms</p>
  `;
  summary.appendChild(editingCard);
}

function endSession() {
  showSection("summary-screen");
  summarizeSession();
}

function cancelSession() {
  if (appState.dualTaskTimers.numberStream) {
    clearInterval(appState.dualTaskTimers.numberStream);
  }
  if (appState.dualTaskTimers.pronounStream) {
    clearTimeout(appState.dualTaskTimers.pronounStream);
  }
  if (appState.activeTimeout) {
    clearTimeout(appState.activeTimeout);
  }
  if (appState.activeKeyHandler) {
    window.removeEventListener("keydown", appState.activeKeyHandler);
  }
  resetAppState(true);
  showSection("setup-screen");
}

function attachGlobalListeners() {
  const form = $("#setup-form");
  form.addEventListener("submit", readSetupForm);
  const restart = $("#restart-session");
  restart.addEventListener("click", () => {
    resetAppState(false);
    showSection("setup-screen");
  });

  const presetSelect = $("#pronounPreset");
  presetSelect.addEventListener("change", (event) => {
    applyPronounPreset(event.target.value);
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape") {
      cancelSession();
    }
  });
}

document.addEventListener("DOMContentLoaded", attachGlobalListeners);
