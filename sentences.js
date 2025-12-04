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
  context_family: [
    "At the family dinner, ",
    "During the reunion, ",
    "On the call with relatives, ",
    "When grandparents visited, ",
    "While chatting with siblings, ",
    "Before the holiday gathering, "
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
  },
  {
    id: "family_introduce_relation",
    template:
      "[[context_family]]I introduced {name} as my {relation} and shared that {subject} {be} using these pronouns now.",
    slots: ["context_family"],
    pronounRolesUsed: ["subject"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "family_correct_old_term",
    template:
      "[[context_family]]When someone slipped and said {oldrelation}, I corrected it to {relation} and noted {subject} {have} updated pronouns.",
    slots: ["context_family"],
    pronounRolesUsed: ["subject"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 3
  },
  {
    id: "family_label_pronouns",
    template:
      "[[context_family]]I wrote 'my {relation}' next to {name} so relatives see {possAdj} correct pronouns.",
    slots: ["context_family"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "family_group_text",
    template:
      "[[context_family]]In the family chat, I told everyone our {relation} goes by {name} now and that {subject} {be} using these pronouns.",
    slots: ["context_family"],
    pronounRolesUsed: ["subject"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "family_caption_fix",
    template:
      "[[context_family]]When the album caption said {oldrelation}, I edited it to 'my {relation}' and circled {possAdj} pronouns.",
    slots: ["context_family"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 3
  },
  {
    id: "family_calendar_note",
    template:
      "[[context_family]]I set a reminder to say {relation} instead of {oldrelation} before talking with {name} so I address {object} correctly.",
    slots: ["context_family"],
    pronounRolesUsed: ["object"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "family_form_update",
    template:
      "[[context_family]]While filling out forms, I selected {relation} and double-checked that the staff marked {possAdj} pronouns.",
    slots: ["context_family"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "family_model_phrase",
    template:
      "[[context_family]]I practiced saying 'This is my {relation},' then repeated {subject} after the kids so they heard the right pronouns.",
    slots: ["context_family"],
    pronounRolesUsed: ["subject"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 3
  },
  {
    id: "family_thank_you",
    template:
      "[[context_family]]When thanking the team, I said our {relation} {name} {be} grateful and asked them to address {object} with the right pronouns.",
    slots: ["context_family"],
    pronounRolesUsed: ["subject", "object"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 3
  },
  {
    id: "family_sticky_note",
    template:
      "[[context_family]]I keep a sticky note: \"Say {relation}, not {oldrelation}, and use {possAdj} pronouns for {name}.\"",
    slots: ["context_family"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "family_relation_clarify",
    template:
      "[[context_family]]{name} reminded us that {subject} {be} the {relation}, not the {oldrelation}, and we practiced saying it together.",
    slots: ["context_family"],
    pronounRolesUsed: ["subject"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 3
  },
  {
    id: "family_badge_table",
    template:
      "[[context_family]]At the reunion badge table, I made sure the label read {relationposs} pronouns belong to {name} and match {possAdj} record.",
    slots: ["context_family"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 3
  },
  {
    id: "family_chart_note",
    template:
      "[[context_family]]Before the appointment, I described {name} as my {relation} and noted {possAdj} pronouns on the chart.",
    slots: ["context_family"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
  },
  {
    id: "family_story_share",
    template:
      "[[context_family]]While sharing stories, I called {name} my {relation} and used {possAdj} pronouns so cousins could practice.",
    slots: ["context_family"],
    pronounRolesUsed: ["possAdj"],
    modes: ["mapping", "extinction", "editing", "dual"],
    difficulty: 2
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
  // Normalize spacing so clauses stay tidy
  result = result.replace(/\s+,/g, ", ").replace(/\s{2,}/g, " ").trim();
  return result;
}

// Remove accidental duplicate leading phrases such as
// "Before the meeting started, Before the meeting started, ..."
function collapseDuplicateLead(text) {
  if (!text) return text;
  const deduped = text.replace(/^(.*?,)\s*\1/i, "$1");
  if (deduped !== text) return deduped;

  const leadMatch = deduped.match(/^([^,]+?,)\s*([^,]+?,)(.*)$/);
  if (leadMatch) {
    const [, firstClause, secondClause, rest] = leadMatch;
    const isIntroLead = (clause) => /^(at|before|after|during|while|when|on|in|by)\b/i.test(clause.trim());

    if (isIntroLead(firstClause) && isIntroLead(secondClause)) {
      return `${secondClause.trim()} ${rest.trimStart()}`;
    }
  }

  return deduped;
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
