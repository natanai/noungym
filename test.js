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
    grammar: "plural"
  },
  {
    label: "they/them (singular)",
    pronouns: {
      subject: "they",
      object: "them",
      possAdj: "their",
      possPron: "theirs",
      reflexive: "themselves"
    },
    grammar: "singular"
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
  if (["he", "she", "ze", "xe", "nat"].includes(subj)) {
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
    verbGrammar: "plural",
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
    verbGrammar: "plural",
    extinctionPronounSets: []
  };
  const trials = generateEditingTrials(12);
  const badgeTrial = trials.find((trial) => trial.text.includes("name was spelled"));
  assert(badgeTrial, "Expected badge spelling trial to be generated");
  assert(badgeTrial.grammar === "singular", "Badge spelling grammar should be singular");
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

function run() {
  testGrammarAcrossTemplates();
  testMappingOptions();
  testEditingVerbGrammarHint();
  testDuplicateLeadCleanup();
  console.log("All tests passed.");
}

run();
