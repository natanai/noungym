// Shared lexical banks for slots used in base patterns
const SLOT_BANKS = {
  context_intro: [
    "During introductions, ",
    "As we went around the circle, ",
    "At the start of the call, ",
    "When the session began, "
  ],
  context_meeting: [
    "Before the meeting started, ",
    "After the meeting ended, ",
    "Halfway through the discussion, ",
    "By the time we reached a decision, "
  ],
  context_casual: [
    "Later that afternoon, ",
    "Earlier today, ",
    "On the weekend, ",
    "During the break, "
  ],
  context_admin: [
    "While updating the roster, ",
    "Before printing the badges, ",
    "When the sign-in sheet went around, ",
    "While editing the spreadsheet, "
  ],
  activity_support: [
    "sharing pronouns",
    "checking the roster for names",
    "helping someone practice a new name",
    "making space for corrections",
    "answering questions about pronouns"
  ],
  location_generic: [
    "in the studio",
    "in the group chat",
    "on the video call",
    "in the classroom",
    "in the conference room"
  ],
  item_admin: [
    "sign-in sheet",
    "badge",
    "feedback form",
    "schedule",
    "registration list"
  ],
  event_generic: [
    "the next session began",
    "everyone introduced themselves",
    "the call started",
    "the doors opened",
    "the deadline hit"
  ]
};

// Base sentence patterns shared across all modes
const BASE_SENTENCE_PATTERNS = [
  {
    id: "intro_advocate",
    template:
      "[[context_intro]]{name} shared that {subject} {be} learning to advocate for {reflexive}.",
    slots: ["context_intro"],
    pronounRolesUsed: ["subject", "reflexive"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "handoff_item",
    template:
      "[[context_admin]]I handed the [[item_admin]] to {object} so it stayed with {possAdj} records.",
    slots: ["context_admin", "item_admin"],
    pronounRolesUsed: ["object", "possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 1
  },
  {
    id: "roster_deadname_correction",
    template:
      "[[context_admin]]When the organizer read out {deadname}, {name} gently repeated {possAdj} current name.",
    slots: ["context_admin"],
    pronounRolesUsed: ["possAdj"],
    modes: ["extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "ownership_check",
    template:
      "[[context_meeting]]I checked whether the notebook was really {possPron} before returning it to {object}.",
    slots: ["context_meeting"],
    pronounRolesUsed: ["possPron", "object"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "intro_feelings",
    template:
      "[[context_intro]]The facilitator asked {object} how {subject} {be} feeling about sharing {possAdj} pronouns today.",
    slots: ["context_intro"],
    pronounRolesUsed: ["object", "subject", "possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 3
  },
  {
    id: "chat_answered",
    template:
      "[[context_meeting]]In the group chat, the moderator tagged {name} so everyone knew {subject} {have} already answered.",
    slots: ["context_meeting"],
    pronounRolesUsed: ["subject"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "quiet_corner",
    template:
      "[[context_casual]]{subject} reminded the team that the quiet corner was for {reflexive} whenever things felt loud.",
    slots: ["context_casual"],
    pronounRolesUsed: ["subject", "reflexive"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "photo_caption",
    template:
      "[[context_casual]]Before posting the group photo, I asked {object} whether the caption matched {possAdj} current name.",
    slots: ["context_casual"],
    pronounRolesUsed: ["object", "possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "badge_spelling",
    template: "[[context_admin]]We double-checked that {possAdj} name was spelled correctly on the badge.",
    slots: ["context_admin"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 1,
    grammarHint: "singular"
  },
  {
    id: "self_promise_rest",
    template: "[[context_casual]]{name} promised {reflexive} to slow down and rest after the long shift.",
    slots: ["context_casual"],
    pronounRolesUsed: ["reflexive"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 1
  }
];

// Utility: resolve a [[slotKey]] using SLOT_BANKS
function fillSlots(template, slotKeys) {
  let result = template;
  (slotKeys || []).forEach((key) => {
    const bank = SLOT_BANKS[key] || [];
    if (!bank.length) return;
    const choice = bank[Math.floor(Math.random() * bank.length)];
    const pattern = new RegExp(`\\[\\[${key}\\]\\]`, "g");
    result = result.replace(pattern, choice);
  });
  // Remove any unmatched [[...]] just in case
  result = result.replace(/\\[\\[[^\\]]+\\]\\]/g, "");
  return result;
}

// Remove accidental duplicate leading phrases such as
// "Before the meeting started, Before the meeting started, ..."
function collapseDuplicateLead(text) {
  if (!text) return text;
  return text.replace(/^(.*?,)\s*\1/i, "$1");
}

// Build a sentence instance for a given base pattern and pronoun set
function buildSentenceFromPattern(pattern, pronounSet, options = {}) {
  const { name, deadname, grammar, hint } = options;
  let text = fillSlots(pattern.template, pattern.slots);
  text = collapseDuplicateLead(text);

  const basePronouns = pronounSet || {};
  const tokens = {
    name: name || "Nat",
    deadname: deadname || "Nathanael",
    subject: basePronouns.subject,
    object: basePronouns.object,
    possAdj: basePronouns.possAdj,
    possPron: basePronouns.possPron,
    reflexive: basePronouns.reflexive,
    pronouns: basePronouns,
    grammar,
    hint
  };

  if (typeof applyLanguageRules === "function") {
    text = applyLanguageRules(text, tokens);
  } else {
    Object.entries(tokens).forEach(([key, value]) => {
      if (!value) return;
      text = text.replace(new RegExp("{" + key + "}", "g"), value);
    });
  }

  return text;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SLOT_BANKS, BASE_SENTENCE_PATTERNS, buildSentenceFromPattern };
}
