const {
  applyLanguageRules,
  grammarLexicon,
  inferGrammarFromPronoun,
  resolveGrammar,
  expandRecipes,
  mappingRecipes,
  extinctionRecipes,
  editingRecipes,
  generateMappingTrials,
  appState
} = require("./main.js");

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
    }
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

function validateAgreement(sentence, pronouns) {
  const lower = sentence.toLowerCase();
  const subj = (pronouns.subject || "").toLowerCase();
  if (subj === "they") {
    [" they is ", " they has ", " they was ", " they does "]
      .forEach((bad) => assert(!lower.includes(bad), `Plural they should not use singular verb in: ${sentence}`));
  }
  if (["he", "she", "ze", "xe", "nat"].includes(subj)) {
    [" are ", " have ", " were "].forEach((verb) => {
      const needle = ` ${subj} ${verb}`;
      assert(!lower.includes(needle), `Singular subject should not pair with plural verb in: ${sentence}`);
    });
  }
}

function testGrammarAcrossTemplates() {
  const recipeBatches = [
    ...expandRecipes(mappingRecipes, 20),
    ...expandRecipes(extinctionRecipes, 20),
    ...expandRecipes(editingRecipes, 20)
  ];

  pronounSets.forEach((set) => {
    appState.setup = {
      ...appState.setup,
      targetName: "Nat",
      deadname: "Old Name",
      pronouns: set.pronouns,
      verbGrammar: resolveGrammar(set.pronouns.subject, inferGrammarFromPronoun(set.pronouns.subject)),
      extinctionPronounSets: []
    };

    recipeBatches.forEach((tpl) => {
      const templateText = tpl.text || tpl.template || "";
      const sentence = applyLanguageRules(templateText, {
        pronouns: set.pronouns,
        grammar: inferGrammarFromPronoun(set.pronouns.subject)
      });
      validateAgreement(sentence, set.pronouns);
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
  trials.forEach((trial) => {
    assert(trial.options.includes(trial.correct), "Correct option missing");
    const uniqueCount = new Set(trial.options.map((o) => o.toLowerCase())).size;
    assert(uniqueCount === trial.options.length, `Duplicate distractor detected in: ${trial.text}`);
  });
}

function run() {
  testGrammarAcrossTemplates();
  testMappingOptions();
  console.log("All tests passed.");
}

run();
