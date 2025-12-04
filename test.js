const {
  applyLanguageRules,
  grammarLexicon,
  inferGrammarFromPronoun,
  resolveGrammar,
  generateMappingTrials,
  generateEditingTrials,
  appState
} = require("./main.js");
const { BASE_SENTENCE_PATTERNS, buildSentenceFromPattern } = require("./sentences.js");

global.applyLanguageRules = applyLanguageRules;

function assert(condition, message) {
  if (!condition) {
    console.error(`Assertion failed: ${message}`);
    process.exit(1);
  }
}

const pronounSets = [
  {
    label: "they/them",
    pronouns: {
      subject: "they",
      object: "them",
      possAdj: "their",
      possPron: "theirs",
      reflexive: "themselves"
    },
    grammar: "auto"
  },
  {
    label: "she/her",
    pronouns: {
      subject: "she",
      object: "her",
      possAdj: "her",
      possPron: "hers",
      reflexive: "herself"
    }
  },
  {
    label: "he/him",
    pronouns: {
      subject: "he",
      object: "him",
      possAdj: "his",
      possPron: "his",
      reflexive: "himself"
    }
  },
  {
    label: "name-subject",
    pronouns: {
      subject: "Nat",
      object: "Nat",
      possAdj: "Nat's",
      possPron: "Nat's",
      reflexive: "Nat"
    }
  }
];

function validateAgreement(sentence, pronouns, expectedGrammar) {
  const lower = sentence.toLowerCase();
  const subj = (pronouns.subject || "").toLowerCase();
  const grammar = expectedGrammar || inferGrammarFromPronoun(subj);

  if (subj === "they") {
    const disallowed = grammar === "singular"
      ? [" they are ", " they have ", " they were ", " they do "]
      : [" they is ", " they has ", " they was ", " they does "];

    disallowed.forEach((bad) => {
      assert(!lower.includes(bad), `They/them should follow ${grammar} verbs in: ${sentence}`);
    });
  }
  if (["he", "she", "nat"].includes(subj)) {
    if (grammar !== "plural") {
      [" are ", " have ", " were "].forEach((verb) => {
        const needle = ` ${subj} ${verb}`;
        assert(!lower.includes(needle), `Singular subject should not pair with plural verb in: ${sentence}`);
      });
    }
  }
}

function testGrammarAcrossTemplates() {
  const patterns = BASE_SENTENCE_PATTERNS.filter(Boolean);

  pronounSets.forEach((set) => {
    const selectedGrammar = set.grammar || inferGrammarFromPronoun(set.pronouns.subject);
    appState.setup = {
      ...appState.setup,
      targetName: "Nat",
      deadname: "Old Name",
      relation: "child",
      oldRelation: "old term",
      pronouns: set.pronouns,
      verbGrammar: resolveGrammar(set.pronouns.subject, selectedGrammar),
      extinctionPronounSets: []
    };

    patterns.forEach((pattern) => {
      const sentence = buildSentenceFromPattern(pattern, set.pronouns, {
        name: "Nat",
        deadname: "Old Name",
        grammar: resolveGrammar(set.pronouns.subject, selectedGrammar),
        hint: "name"
      });
      validateAgreement(
        sentence,
        set.pronouns,
        resolveGrammar(set.pronouns.subject, selectedGrammar)
      );
    });
  });
}

function testMappingOptions() {
  appState.setup = {
    ...appState.setup,
    pronouns: pronounSets[0].pronouns,
    verbGrammar: "auto",
    extinctionPronounSets: []
  };
  const trials = generateMappingTrials(25);
  const seen = new Set();
  trials.forEach((trial) => {
    assert(!seen.has(trial.text), "Mapping trials should not repeat sentences in short sessions");
    seen.add(trial.text);
    assert(trial.options.includes(trial.correct), "Correct option missing");
    const uniqueCount = new Set(trial.options.map((o) => o.toLowerCase())).size;
    assert(uniqueCount === trial.options.length, `Duplicate distractor detected in: ${trial.text}`);
  });
}

function testEditingVerbGrammarHint() {
  appState.setup = {
    ...appState.setup,
    pronouns: pronounSets[0].pronouns,
    verbGrammar: "auto",
    extinctionPronounSets: []
  };
  const editingPatternCount = BASE_SENTENCE_PATTERNS.filter((p) =>
    (p.modes || []).includes("editing")
  ).length;
  const trials = generateEditingTrials(editingPatternCount);
  const badgeTrial = trials.find((trial) => trial.text.includes("name was spelled"));
  assert(badgeTrial, "Expected badge spelling trial to be generated");
  assert(badgeTrial.grammar === "singular", "Badge spelling grammar should be singular");
}

function testEditingMixIncludesCorrectSentences() {
  appState.setup = {
    ...appState.setup,
    pronouns: pronounSets[0].pronouns,
    verbGrammar: "auto",
    extinctionPronounSets: []
  };

  const trials = generateEditingTrials(20);
  const hasCorrections = trials.some((trial) => trial.needsCorrection !== false);
  const hasAlreadyCorrect = trials.some((trial) => trial.needsCorrection === false);

  assert(hasAlreadyCorrect, "Editing trials should sometimes be ready to approve.");
  assert(hasCorrections, "Editing trials should still include sentences that need fixes.");
}

function testTheyOverridesStayPlural() {
  const theyPronouns = pronounSets[0].pronouns;
  const resolved = resolveGrammar(theyPronouns.subject, "singular");
  assert(resolved === "plural", "They/them should resist singular verb overrides");

  const resolvedWithNameHint = resolveGrammar(theyPronouns.subject, "singular", "name");
  assert(resolvedWithNameHint === "plural", "Name hints should not flip they/them to singular");

  const pattern = BASE_SENTENCE_PATTERNS.find((p) => p.id === "intro_feelings");
  const sentence = buildSentenceFromPattern(pattern, theyPronouns, {
    name: "Alex",
    grammar: "singular",
    hint: "name"
  });

  assert(!sentence.toLowerCase().includes("they is"), "They/them should not pair with 'is'");
  assert(sentence.toLowerCase().includes("they are"), "They/them should keep plural be-verb");
}

function testConservativeModeReducesTheyDensity() {
  const pattern = BASE_SENTENCE_PATTERNS.find((p) => p.id === "intro_feelings");
  const sentence = buildSentenceFromPattern(pattern, pronounSets[0].pronouns, {
    name: "Taylor",
    grammar: "conservative"
  });

  const lower = sentence.toLowerCase();
  const theyCount = (lower.match(/\bthey\b/g) || []).length;
  const nameCount = (sentence.match(/Taylor/g) || []).length;
  assert(theyCount <= 2, `Conservative mode should reduce they density: ${sentence}`);
  assert(nameCount >= 1, `Conservative mode should repeat the name: ${sentence}`);
  assert(lower.includes("they are"), "Conservative mode should still use plural be-verb");
}

function testSingularHintForNonPronounSubjects() {
  const pattern = BASE_SENTENCE_PATTERNS.find((p) => p.id === "ownership_check");
  const sentence = buildSentenceFromPattern(pattern, pronounSets[0].pronouns, {
    name: "Alex",
    grammar: "plural"
  });

  assert(
    sentence.includes("notebook was really theirs"),
    `Singular hint should keep non-pronoun subjects in singular past tense: ${sentence}`
  );
}

function testDuplicateLeadCleanup() {
  const pattern = {
    id: "dup_lead",
    template: "Hello, Hello, {subject} was ready.",
    slots: [],
    pronounRolesUsed: ["subject"],
    modes: ["mapping"]
  };

  const sentence = buildSentenceFromPattern(pattern, pronounSets[2].pronouns, {
    name: "Nat",
    grammar: "singular"
  });

  assert(sentence.startsWith("Hello, " ) && !sentence.startsWith("Hello, Hello,"),
    "Duplicate leading phrase should be collapsed");
}

function testDoubleIntroCollapse() {
  const pattern = BASE_SENTENCE_PATTERNS.find((p) => p.id === "family_badge_table");
  assert(pattern, "Expected reunion badge table pattern");

  const originalRandom = Math.random;
  Math.random = () => 0; // always pick the first context lead

  appState.setup = {
    ...appState.setup,
    targetName: "Nat",
    relation: "cousin",
    oldRelation: "old term",
    pronouns: pronounSets[0].pronouns,
    verbGrammar: "auto",
    extinctionPronounSets: []
  };

  const sentence = buildSentenceFromPattern(pattern, pronounSets[0].pronouns, {
    name: "Nat",
    grammar: resolveGrammar(pronounSets[0].pronouns.subject, "auto"),
    relation: "cousin",
    oldRelation: "old term"
  });

  Math.random = originalRandom;

  assert(
    sentence.startsWith("At the reunion badge table,"),
    `Intro contexts should be collapsed to one lead: ${sentence}`
  );
}

function run() {
  testGrammarAcrossTemplates();
  testMappingOptions();
  testEditingVerbGrammarHint();
  testEditingMixIncludesCorrectSentences();
  testTheyOverridesStayPlural();
  testConservativeModeReducesTheyDensity();
  testSingularHintForNonPronounSubjects();
  testDuplicateLeadCleanup();
  testDoubleIntroCollapse();
  console.log("All tests passed.");
}

run();
