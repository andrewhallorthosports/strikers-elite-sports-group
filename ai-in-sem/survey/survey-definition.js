/* Symposion Althing: AI in SEM stakeholder survey, instrument v3.2.
 *
 * THIS FILE IS THE SOURCE OF TRUTH. Edit it directly.
 *
 * Its first version was generated on 2026-09-07 by a script, build_v3.js,
 * from a v1.1 bespoke item registry and a v2.0 verbatim item bank. That
 * script and its registry input were never kept, so the generation cannot be
 * repeated and there is nothing upstream of this file to edit. An earlier
 * header here said "edit the builder, not this file", which would send you
 * looking for something that does not exist. Corrected 2026-09-09.
 *
 * The instrument's history is therefore carried by git from this point, and
 * by _superseded_2026-09-09/survey-definition.v1.js, which is the 16-page v1
 * instrument this replaced. No data were collected under v1 or v3.1.
 *
 * Bump INSTRUMENT_VERSION on any wording change. Responses record the version
 * that produced them, and without that a rewording silently pools two
 * different questions into one column at analysis. */
const INSTRUMENT_VERSION = "ai-sem-stakeholder-3.2";
const DOMAINS = [
  {
    "key": "R",
    "name": "Injury Management & Rehabilitation",
    "blurb": "Tools that guide a person through a rehabilitation programme between appointments, progressing exercises, giving feedback on movement, or prompting adherence. For example, an application that advances a knee rehabilitation programme automatically based on reported symptoms."
  },
  {
    "key": "P",
    "name": "Injury & Illness Prevention",
    "blurb": "Tools that help people improve health before or instead of an intervention, including preparation while waiting for surgery. For example, a system that delivers a conditioning and weight-management programme to people on an arthroplasty waiting list."
  },
  {
    "key": "D",
    "name": "Clinical Decision Support",
    "blurb": "Tools that offer a clinician a diagnosis, a prognosis, a risk estimate or a treatment recommendation. For example, a model estimating the likelihood of return to sport after ligament reconstruction."
  },
  {
    "key": "S",
    "name": "Health Data Science",
    "blurb": "Using data generated in ordinary care to audit services, learn what works, or build and improve tools. For example, analysing all knee operations in a region to compare outcomes between approaches."
  },
  {
    "key": "G",
    "name": "Implementation, Regulation & Governance",
    "blurb": "The arrangements by which these tools are approved, monitored and held to account, including who checks that a tool still works after it has been adopted."
  }
];
/* Role-conditional stems for E*.2. One construct, six wordings.
 * These are analysed descriptively and qualitatively and are NEVER pooled
 * into a cross-group latent comparison. See instrument spec section 3.   */
const ESCALATION_STEMS = {
  clinical:    "Which situations should trigger a tool in this domain to stop and involve a named clinician?",
  developer:   "Which situations should a tool in this domain be built to escalate?",
  procurement: "Which situations should a tool in this domain demonstrate it will escalate, before you would accept it into service?",
  investor:    "Which situations must a tool in this domain escalate, as a risk gate, before you would back it?",
  regulator:   "Which situations should a tool in this domain be required to escalate as a condition of authorisation?",
  user:        "When should a tool like this stop and tell you to speak to a person?"
};

/* Two domains take a fixed stem instead of the role-conditional one above,
   because escalation there means a deployed system being pulled back for
   review rather than a clinician being called to a patient. */
const DOMAIN_STEMS = {
  S: "Which situations should trigger an analysis in this domain to be stopped and reviewed by a person?",
  G: "Which situations should trigger a tool already in use to be escalated for review, restriction or withdrawal?"
};

const ANCHOR_HIGH = 5;
const ANCHOR_LOW  = 3;

const ANCHOR_RULES = [
  {
    /* The worked example from the AUTONOMY instrument, carried over intact.
       Placed first because it is the only rule keyed on lived experience of
       a tool rather than on attitude towards tools in general. */
    key: "curve_vs_satisfaction",
    test: (m) => m.CURVE >= 4 && m.SATISFACTION >= 4,
    text:
      "You rated the learning curve as high and your overall satisfaction as " +
      "high. Describe the specific moment or feature at which the benefit " +
      "outgrew the frustration."
  },
  {
    key: "benefit_vs_autonomy",
    test: (m) => m.PE >= ANCHOR_HIGH && m.CAP >= ANCHOR_HIGH,
    text:
      "You rated the benefits of these tools highly, and you also expect them " +
      "to erode your independent judgement. Describe one situation in which " +
      "you would accept that trade, and one in which you would not."
  },
  {
    key: "hard_but_willing",
    test: (m) => m.EE <= ANCHOR_LOW && m.BI >= ANCHOR_HIGH,
    text:
      "You expect these tools to be difficult to learn, and you intend to use " +
      "them anyway. Describe what makes that worth it."
  },
  {
    key: "diminish_and_strengthen",
    test: (m) => m.REC >= ANCHOR_HIGH && m.ENH >= ANCHOR_HIGH,
    text:
      "You expect these tools both to diminish how your profession is seen and " +
      "to strengthen it. Describe what decides which of those actually happens."
  },
  {
    key: "beneficial_but_resist",
    test: (m) => m.PE >= ANCHOR_HIGH && m.RES >= ANCHOR_HIGH,
    text:
      "You rated these tools as beneficial and you would still resist their " +
      "introduction. Describe what is driving that."
  },
  {
    key: "unconcerned_uninterested",
    test: (m) => m.CONCERN <= 2.5 && m.BI <= ANCHOR_LOW,
    text:
      "You have few concerns about these tools and no immediate intention to " +
      "use them. Describe what is holding you back."
  }
];

const ANCHOR_DEFAULT = {
  key: "default",
  text:
    "Describe the moment, real or imagined, at which you would decide one of " +
    "these tools had earned a place in your practice."
};

function meanOf(matrixAnswer) {
  if (!matrixAnswer) return null;
  const vals = Object.values(matrixAnswer)
    .map(Number)
    .filter((v) => Number.isFinite(v) && v > 0);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Compute the construct means that drive the anchor.
 * Missing constructs come back as null and any rule referencing them fails
 * closed, falling through to the default anchor.
 */
function constructMeans(data) {
  const m = {
    PE:      meanOf(data.C_PE),
    EE:      meanOf(data.C_EE),
    SI:      meanOf(data.C_SI),
    BI:      meanOf(data.C_BI),
    REC:     meanOf(data.D_REC),
    CAP:     meanOf(data.D_CAP),
    ENH:     meanOf(data.D_ENH),
    RES:     meanOf(data.D_RES),
    CONCERN: meanOf(data.H1),
    /* Single items, not scales, so they are read directly rather than
       averaged. Absent values become NaN and fail every threshold test. */
    CURVE:        Number.isFinite(Number(data.B7)) ? Number(data.B7) : NaN,
    SATISFACTION: Number.isFinite(Number(data.B8)) ? Number(data.B8) : NaN
  };
  // Null-safe comparison: a null never satisfies a threshold test.
  return new Proxy(m, {
    get: (t, k) => (t[k] === null || t[k] === undefined ? Number.NaN : t[k])
  });
}

function chooseAnchor(data) {
  const m = constructMeans(data);
  for (const rule of ANCHOR_RULES) {
    let hit = false;
    try { hit = rule.test(m); } catch { hit = false; }
    if (hit) return { key: rule.key, text: rule.text, inputs: { ...m } };
  }
  return { key: ANCHOR_DEFAULT.key, text: ANCHOR_DEFAULT.text, inputs: { ...m } };
}

/**
 * Apply role-conditional wording to the five escalation items.
 * One construct, six wordings. See instrument spec section 3 for why these
 * are never pooled into a cross-group latent comparison.
 */
function setRoleStems(survey, roleCode) {
  const band =
    roleCode >= 1 && roleCode <= 7 ? "clinical" :
    roleCode === 8  ? "developer"   :
    roleCode === 9  ? "procurement" :
    roleCode === 10 ? "investor"    :
    roleCode === 11 ? "regulator"   :
    roleCode === 12 ? "user"        : "clinical";

  const stem = ESCALATION_STEMS[band];
  for (const d of DOMAINS) {
    const q = survey.getQuestionByName(`E${d.key}_2`);
    if (!q) continue;
    /* Health Data Science and Implementation, Regulation & Governance have no
       patient in front of the tool, so the role-conditional clinical stem does
       not apply to them and their triggers are domain-specific rather than
       role-specific. Their wording is therefore fixed. These two items are
       analysed within domain and are not pooled with the other three. */
    q.title = DOMAIN_STEMS[d.key] || stem;
  }
  return band;
}



/* ------------------------------------------------------------------ *
 * Exposed as a global for the classic-script build. The page loads this
 * file with a plain <script> tag, so there is no module scope.
 * ------------------------------------------------------------------ */

const MODULES = {"page_GATE":"GATE","page_WHO":"WHO","page_ATT":"ATT","page_INT":"INT","page_DOM_R":"DOM","page_DOM_P":"DOM","page_DOM_D":"DOM","page_DOM_S":"DOM","page_DOM_G":"DOM","page_DOM_first":"DOM","page_ACC1":"ACC","page_ACC2":"ACC","page_ID1":"ID","page_ID2":"ID","page_ID_nonclin":"ID","page_O":"ACC","page_CON":"CON","page_GOV":"GOV","page_SJT":"SJT","page_VOICE":"VOICE","page_CHAR":"CHAR","page_BONUS_GATE":"BONUS_GATE","page_IDX":"IDX","page_DOMX_P":"DOMX","page_DOMX_S":"DOMX","page_DOMX_G":"DOMX","page_GOVX":"GOVX","page_USE":"USE","page_OWN":"OWN"};
const CORE_MODULES = ["ATT","INT","DOM","ACC","ID","CON","GOV","SJT"];
const surveyJson = {
 "showTitle": false,
 "showProgressBar": "belowHeader",
 "progressBarType": "pages",
 "showQuestionNumbers": "off",
 "widthMode": "responsive",
 "completeText": "Finish",
 "pageNextText": "Continue",
 "pagePrevText": "Back",
 "checkErrorsMode": "onValueChanged",
 "pages": [
  {
   "name": "page_GATE",
   "title": "Before you begin",
   "elements": [
    {
     "type": "html",
     "name": "info",
     "html": "\n      <div class=\"ath-info\">\n        <p>This survey asks what people across Sport, Exercise &amp; Musculoskeletal Medicine think about artificial intelligence in their field. The core takes <strong>nine to twelve minutes</strong>; optional extra sections follow, and you can stop at any point. Each completed section is kept.</p>\n        <p>We collect <strong>no identifiable data</strong> with your answers. At the end, once the core is complete, you may register separately to receive the findings and to be considered for the consensus panel; that registration is stored in a separate table with no link to your answers.</p>\n        <p>The study is conducted by STRIKERS Elite Sports Group and the University of St Andrews. Closing date: <strong>{closingDate}</strong>. Questions: {contact}.</p>\n      </div>"
    },
    {
     "type": "radiogroup",
     "name": "arm",
     "title": "I am answering as",
     "isRequired": true,
     "choices": [
      {
       "value": "professional",
       "text": "A professional, or a student or trainee in one of these fields: clinician, researcher, manager, developer, investor, regulator or related role"
      },
      {
       "value": "service_user",
       "text": "A patient, athlete or patient representative"
      }
     ]
    },
    {
     "type": "checkbox",
     "name": "consent",
     "titleLocation": "hidden",
     "isRequired": true,
     "requiredErrorText": "Please confirm before continuing.",
     "choices": [
      {
       "value": "yes",
       "text": "I have read the above and consent to take part."
      }
     ]
    }
   ]
  },
  {
   "name": "page_WHO",
   "title": "About you",
   "elements": [
    {
     "type": "checkbox",
     "name": "A1",
     "title": "Which of these describe your role in relation to sport, exercise and musculoskeletal health? Choose all that apply.",
     "isRequired": true,
     "choices": [
      {
       "value": 1,
       "text": "Sport & Exercise Medicine"
      },
      {
       "value": 2,
       "text": "Orthopaedic Surgery"
      },
      {
       "value": 3,
       "text": "Primary Care"
      },
      {
       "value": 4,
       "text": "Physiotherapy"
      },
      {
       "value": 5,
       "text": "Sports Science"
      },
      {
       "value": 6,
       "text": "Allied Healthcare"
      },
      {
       "value": 7,
       "text": "Coaching"
      },
      {
       "value": 8,
       "text": "Product Development"
      },
      {
       "value": 9,
       "text": "Procurement & Implementation"
      },
      {
       "value": 10,
       "text": "Corporate & Investment"
      },
      {
       "value": 11,
       "text": "Regulation"
      },
      {
       "value": 12,
       "text": "Patients"
      }
     ],
     "showOtherItem": true,
     "otherText": "Other, namely"
    },
    {
     "type": "radiogroup",
     "name": "A1_main",
     "title": "Which is your main role?",
     "isRequired": true,
     "visibleIf": "{A1.length} > 1",
     "choicesVisibleIf": "{A1} contains {item}",
     "choices": [
      {
       "value": 1,
       "text": "Sport & Exercise Medicine"
      },
      {
       "value": 2,
       "text": "Orthopaedic Surgery"
      },
      {
       "value": 3,
       "text": "Primary Care"
      },
      {
       "value": 4,
       "text": "Physiotherapy"
      },
      {
       "value": 5,
       "text": "Sports Science"
      },
      {
       "value": 6,
       "text": "Allied Healthcare"
      },
      {
       "value": 7,
       "text": "Coaching"
      },
      {
       "value": 8,
       "text": "Product Development"
      },
      {
       "value": 9,
       "text": "Procurement & Implementation"
      },
      {
       "value": 10,
       "text": "Corporate & Investment"
      },
      {
       "value": 11,
       "text": "Regulation"
      },
      {
       "value": 12,
       "text": "Patients"
      }
     ]
    },
    {
     "type": "dropdown",
     "name": "A2",
     "title": "Country of principal practice or residence",
     "isRequired": true,
     "choicesByUrl": null,
     "choices": [
      "Ireland",
      "United Kingdom",
      "Australia",
      "Canada",
      "New Zealand",
      "United States",
      "France",
      "Germany",
      "Italy",
      "Netherlands",
      "Spain",
      "Sweden",
      "Norway",
      "Denmark",
      "Switzerland",
      "South Africa",
      "Other"
     ]
    },
    {
     "visibleIf": "{A1} anyof [1,2,3,4,5,6,7,8,9,10,11]",
     "type": "radiogroup",
     "name": "A4",
     "title": "Career stage",
     "choices": [
      "Student or in training",
      "Early career, within five years of qualification or equivalent",
      "Established",
      "Senior or leadership",
      "Retired"
     ]
    }
   ]
  },
  {
   "name": "page_ATT",
   "title": "Artificial intelligence in general",
   "description": "The next four statements are about artificial intelligence in general, not only in healthcare.",
   "elements": [
    {
     "type": "matrix",
     "name": "C0",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "1 Not at all"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "5"
      },
      {
       "value": 6,
       "text": "6"
      },
      {
       "value": 7,
       "text": "7"
      },
      {
       "value": 8,
       "text": "8"
      },
      {
       "value": 9,
       "text": "9"
      },
      {
       "value": 10,
       "text": "10 Completely agree"
      }
     ],
     "rows": [
      {
       "value": "C0-1",
       "text": "I believe that AI will improve my life."
      },
      {
       "value": "C0-2",
       "text": "I believe that AI will improve my work."
      },
      {
       "value": "C0-3",
       "text": "I think I will use AI technology in the future."
      },
      {
       "value": "C0-4",
       "text": "I think AI technology is positive for humanity."
      }
     ]
    }
   ]
  },
  {
   "name": "page_INT",
   "title": "Your use and intention",
   "elements": [
    {
     "type": "rating",
     "name": "B1",
     "title": "Before today, how would you describe your understanding of artificial intelligence as it applies to health?",
     "isRequired": true,
     "rateValues": [
      {
       "value": 1,
       "text": "None"
      },
      {
       "value": 2,
       "text": "Limited"
      },
      {
       "value": 3,
       "text": "Moderate"
      },
      {
       "value": 4,
       "text": "Good"
      },
      {
       "value": 5,
       "text": "Expert"
      }
     ]
    },
    {
     "type": "checkbox",
     "name": "B2",
     "title": "Which of these have you personally used, for any purpose, in the last twelve months?",
     "choices": [
      {
       "value": "chatbot",
       "text": "A general-purpose chatbot such as ChatGPT, Claude or Gemini"
      },
      {
       "value": "scribe",
       "text": "An ambient scribe or automatic transcription tool in clinic"
      },
      {
       "value": "imaging",
       "text": "An imaging tool with automated interpretation or measurement"
      },
      {
       "value": "rehab",
       "text": "A rehabilitation or exercise app with automated progression or feedback"
      },
      {
       "value": "wearable",
       "text": "A wearable or app giving automated readiness, load or injury-risk output"
      },
      {
       "value": "cds",
       "text": "A Clinical Decision Support tool with an automated recommendation"
      },
      {
       "value": "lit",
       "text": "A literature search or evidence synthesis tool"
      }
     ],
     "showNoneItem": true,
     "noneText": "None of these"
    },
    {
     "type": "radiogroup",
     "name": "B2a",
     "isRequired": true,
     "title": "In the last twelve months, have you used a general-purpose chatbot such as ChatGPT, Claude or Gemini to ask about your own health, injury or performance?",
     "description": "We mean your own health here, not your work. There is no right answer and the question is asked of everyone.",
     "choices": [
      {
       "value": "regular",
       "text": "Yes, regularly"
      },
      {
       "value": "occas",
       "text": "Yes, occasionally"
      },
      {
       "value": "once",
       "text": "Once or twice"
      },
      {
       "value": "never",
       "text": "Never"
      },
      {
       "value": "pnts",
       "text": "Prefer not to say"
      }
     ]
    },
    {
     "type": "radiogroup",
     "name": "B3",
     "title": "Have you used a general-purpose chatbot to answer a clinical or health question arising in your work, or about someone you care for?",
     "isRequired": false,
     "choices": [
      {
       "value": "regular",
       "text": "Yes, regularly"
      },
      {
       "value": "occas",
       "text": "Yes, occasionally"
      },
      {
       "value": "once",
       "text": "Once or twice"
      },
      {
       "value": "never",
       "text": "Never"
      }
     ],
     "visibleIf": "{A1} anyof [1,2,3,4,5,6,7,8,9,10,11]"
    },
    {
     "visibleIf": "{B2a} anyof ['regular','occas','once'] or {B3} anyof ['regular','occas','once']",
     "type": "radiogroup",
     "name": "B4",
     "title": "Did you tell anyone, a colleague, a clinician or a patient, that you had done so?",
     "choices": [
      {
       "value": "routine",
       "text": "Yes, routinely"
      },
      {
       "value": "some",
       "text": "Sometimes"
      },
      {
       "value": "no",
       "text": "No"
      },
      {
       "value": "na",
       "text": "Not applicable"
      }
     ]
    },
    {
     "visibleIf": "{B2} notempty and {B2} <> ['none']",
     "type": "rating",
     "name": "B7",
     "title": "Thinking of the tools you have actually used, how difficult was the learning curve?",
     "rateValues": [
      {
       "value": 1,
       "text": "Very easy"
      },
      {
       "value": 2,
       "text": "Easy"
      },
      {
       "value": 3,
       "text": "Moderate"
      },
      {
       "value": 4,
       "text": "Difficult"
      },
      {
       "value": 5,
       "text": "Very difficult"
      }
     ]
    },
    {
     "visibleIf": "{B2} notempty and {B2} <> ['none']",
     "type": "rating",
     "name": "B8",
     "title": "Overall, how satisfied have you been with those tools?",
     "rateValues": [
      {
       "value": 1,
       "text": "Very dissatisfied"
      },
      {
       "value": 2,
       "text": "Dissatisfied"
      },
      {
       "value": 3,
       "text": "Neither"
      },
      {
       "value": 4,
       "text": "Satisfied"
      },
      {
       "value": 5,
       "text": "Very satisfied"
      }
     ]
    },
    {
     "type": "matrix",
     "name": "C_BI",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Quite disagree"
      },
      {
       "value": 3,
       "text": "Slightly disagree"
      },
      {
       "value": 4,
       "text": "Neither agree or disagree"
      },
      {
       "value": 5,
       "text": "Slightly agree"
      },
      {
       "value": 6,
       "text": "Quite agree"
      },
      {
       "value": 7,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "C-BI1",
       "text": "I intend to use these tools in the next 12 months."
      },
      {
       "value": "C-BI2",
       "text": "I will use these tools in the next 12 months."
      },
      {
       "value": "C-BI3",
       "text": "I plan to use these tools in the next 12 months."
      }
     ],
     "visibleIf": "{A1} anyof [1,2,3,4,5,6,7,8,9,10,11]"
    }
   ]
  },
  {
   "name": "page_DOM_R",
   "title": "Injury Management & Rehabilitation",
   "description": "Tools that guide a person through a rehabilitation programme between appointments, progressing exercises, giving feedback on movement, or prompting adherence. For example, an application that advances a knee rehabilitation programme automatically based on reported symptoms.",
   "elements": [
    {
     "type": "radiogroup",
     "name": "ER_1",
     "title": "What is the greatest degree of independence you would consider acceptable for an AI tool in this domain?",
     "isRequired": true,
     "choices": [
      {
       "value": 1,
       "text": "No role at all"
      },
      {
       "value": 2,
       "text": "Provides information to a professional only"
      },
      {
       "value": 3,
       "text": "Recommends, with a professional deciding every case"
      },
      {
       "value": 4,
       "text": "Acts, with a professional reviewing every output before it reaches the person"
      },
      {
       "value": 5,
       "text": "Acts, with a professional reviewing a sample, or reviewing on exception"
      },
      {
       "value": 6,
       "text": "Acts independently, with no routine professional review"
      }
     ]
    },
    {
     "type": "checkbox",
     "name": "ER_2",
     "title": "escalation",
     "isRequired": true,
     "choices": [
      {
       "value": "serious",
       "text": "Any suspicion of serious pathology"
      },
      {
       "value": "scope",
       "text": "Symptoms outside the tool's stated scope"
      },
      {
       "value": "worse",
       "text": "The person is deteriorating"
      },
      {
       "value": "disagree",
       "text": "The person disagrees with the tool"
      },
      {
       "value": "lowconf",
       "text": "The tool's own confidence is low"
      },
      {
       "value": "distress",
       "text": "The person is distressed"
      },
      {
       "value": "safeguard",
       "text": "A safeguarding concern"
      },
      {
       "value": "updated",
       "text": "The tool has been updated mid-programme"
      }
     ],
     "showOtherItem": true,
     "otherText": "Something else, namely"
    }
   ]
  },
  {
   "name": "page_DOM_P",
   "title": "Injury & Illness Prevention",
   "description": "Tools that help people improve health before or instead of an intervention, including preparation while waiting for surgery. For example, a system that delivers a conditioning and weight-management programme to people on an arthroplasty waiting list.",
   "elements": [
    {
     "type": "radiogroup",
     "name": "EP_1",
     "title": "What is the greatest degree of independence you would consider acceptable for an AI tool in this domain?",
     "isRequired": true,
     "choices": [
      {
       "value": 1,
       "text": "No role at all"
      },
      {
       "value": 2,
       "text": "Provides information to a professional only"
      },
      {
       "value": 3,
       "text": "Recommends, with a professional deciding every case"
      },
      {
       "value": 4,
       "text": "Acts, with a professional reviewing every output before it reaches the person"
      },
      {
       "value": 5,
       "text": "Acts, with a professional reviewing a sample, or reviewing on exception"
      },
      {
       "value": 6,
       "text": "Acts independently, with no routine professional review"
      }
     ]
    }
   ]
  },
  {
   "name": "page_DOM_D",
   "title": "Clinical Decision Support",
   "description": "Tools that offer a clinician a diagnosis, a prognosis, a risk estimate or a treatment recommendation. For example, a model estimating the likelihood of return to sport after ligament reconstruction.",
   "elements": [
    {
     "type": "radiogroup",
     "name": "ED_1",
     "title": "What is the greatest degree of independence you would consider acceptable for an AI tool in this domain?",
     "isRequired": true,
     "choices": [
      {
       "value": 1,
       "text": "No role at all"
      },
      {
       "value": 2,
       "text": "Provides information to a professional only"
      },
      {
       "value": 3,
       "text": "Recommends, with a professional deciding every case"
      },
      {
       "value": 4,
       "text": "Acts, with a professional reviewing every output before it reaches the person"
      },
      {
       "value": 5,
       "text": "Acts, with a professional reviewing a sample, or reviewing on exception"
      },
      {
       "value": 6,
       "text": "Acts independently, with no routine professional review"
      }
     ]
    },
    {
     "type": "checkbox",
     "name": "ED_2",
     "title": "escalation",
     "isRequired": true,
     "choices": [
      {
       "value": "serious",
       "text": "Any suspicion of serious pathology"
      },
      {
       "value": "scope",
       "text": "Symptoms outside the tool's stated scope"
      },
      {
       "value": "worse",
       "text": "The person is deteriorating"
      },
      {
       "value": "disagree",
       "text": "The person disagrees with the tool"
      },
      {
       "value": "lowconf",
       "text": "The tool's own confidence is low"
      },
      {
       "value": "distress",
       "text": "The person is distressed"
      },
      {
       "value": "safeguard",
       "text": "A safeguarding concern"
      },
      {
       "value": "updated",
       "text": "The tool has been updated mid-programme"
      }
     ],
     "showOtherItem": true,
     "otherText": "Something else, namely"
    }
   ]
  },
  {
   "name": "page_DOM_S",
   "title": "Health Data Science",
   "description": "Using data generated in ordinary care to audit services, learn what works, or build and improve tools. For example, analysing all knee operations in a region to compare outcomes between approaches.",
   "elements": [
    {
     "type": "radiogroup",
     "name": "ES_1",
     "title": "What is the greatest degree of independence you would consider acceptable for an AI tool in this domain?",
     "isRequired": true,
     "choices": [
      {
       "value": 1,
       "text": "No role at all"
      },
      {
       "value": 2,
       "text": "Provides information to a professional only"
      },
      {
       "value": 3,
       "text": "Recommends, with a professional deciding every case"
      },
      {
       "value": 4,
       "text": "Acts, with a professional reviewing every output before it reaches the person"
      },
      {
       "value": 5,
       "text": "Acts, with a professional reviewing a sample, or reviewing on exception"
      },
      {
       "value": 6,
       "text": "Acts independently, with no routine professional review"
      }
     ]
    }
   ]
  },
  {
   "name": "page_DOM_G",
   "title": "Implementation, Regulation & Governance",
   "description": "The arrangements by which these tools are approved, monitored and held to account, including who checks that a tool still works after it has been adopted.",
   "elements": [
    {
     "type": "radiogroup",
     "name": "EG_1",
     "isRequired": true,
     "title": "What level of external oversight should apply to AI tools used in this field?",
     "description": "This domain is about how these tools are governed, rather than about a tool doing clinical work.",
     "choices": [
      {
       "value": 1,
       "text": "None beyond ordinary professional judgement"
      },
      {
       "value": 2,
       "text": "The developer declares that the tool meets a standard"
      },
      {
       "value": 3,
       "text": "An independent body certifies the tool before it is used"
      },
      {
       "value": 4,
       "text": "Independent certification, plus monitoring of performance after adoption"
      },
      {
       "value": 5,
       "text": "Statutory approval before use, with mandatory reporting of performance and incidents"
      },
      {
       "value": 6,
       "text": "Statutory approval, mandatory reporting, and periodic re-approval to stay in use"
      }
     ]
    }
   ]
  },
  {
   "name": "page_DOM_first",
   "title": "Across the five domains",
   "elements": [
    {
     "type": "radiogroup",
     "name": "DOM_first",
     "title": "Which domain should the specialty evaluate first?",
     "isRequired": true,
     "choices": [
      {
       "value": "R",
       "text": "Injury Management & Rehabilitation"
      },
      {
       "value": "P",
       "text": "Injury & Illness Prevention"
      },
      {
       "value": "D",
       "text": "Clinical Decision Support"
      },
      {
       "value": "S",
       "text": "Health Data Science"
      },
      {
       "value": "G",
       "text": "Implementation, Regulation & Governance"
      }
     ]
    }
   ]
  },
  {
   "name": "page_ACC1",
   "title": "Acceptance",
   "description": "The following statements concern artificial intelligence tools used in sport, exercise and musculoskeletal care. Please answer about such tools in general, as you understand them.",
   "visibleIf": "{A1} anyof [1,2,3,4,5,6,7,8,9,10,11]",
   "elements": [
    {
     "type": "matrix",
     "name": "C_PE",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Quite disagree"
      },
      {
       "value": 3,
       "text": "Slightly disagree"
      },
      {
       "value": 4,
       "text": "Neither agree or disagree"
      },
      {
       "value": 5,
       "text": "Slightly agree"
      },
      {
       "value": 6,
       "text": "Quite agree"
      },
      {
       "value": 7,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "C-PE1",
       "text": "I think these tools will be useful in my job."
      },
      {
       "value": "C-PE2",
       "text": "I think using these tools will enable me to accomplish tasks quicker."
      },
      {
       "value": "C-PE4",
       "text": "I think using these tools will improve the outcomes of my work."
      }
     ]
    },
    {
     "type": "matrix",
     "name": "C_EE",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Quite disagree"
      },
      {
       "value": 3,
       "text": "Slightly disagree"
      },
      {
       "value": 4,
       "text": "Neither agree or disagree"
      },
      {
       "value": 5,
       "text": "Slightly agree"
      },
      {
       "value": 6,
       "text": "Quite agree"
      },
      {
       "value": 7,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "C-EE2",
       "text": "I think it will be easy for me to become skilful at using these tools."
      },
      {
       "value": "C-EE3",
       "text": "I think these tools will be easy to use."
      },
      {
       "value": "C-EE4",
       "text": "I think learning to operate these tools will be easy for me."
      }
     ]
    }
   ]
  },
  {
   "name": "page_ACC2",
   "title": "Acceptance",
   "visibleIf": "{A1} anyof [1,2,3,4,5,6,7,8,9,10,11]",
   "elements": [
    {
     "type": "matrix",
     "name": "C_SI",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Quite disagree"
      },
      {
       "value": 3,
       "text": "Slightly disagree"
      },
      {
       "value": 4,
       "text": "Neither agree or disagree"
      },
      {
       "value": 5,
       "text": "Slightly agree"
      },
      {
       "value": 6,
       "text": "Quite agree"
      },
      {
       "value": 7,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "C-SI1",
       "text": "People (for example, colleagues and friends) who influence my behaviour think that I should use these tools."
      },
      {
       "value": "C-SI2",
       "text": "People who are important to me (for example, department heads, tutors, superiors, and hospital leaders) think that I should use these tools."
      },
      {
       "value": "C-SI4",
       "text": "In general, my organisation and my department have supported the use of these tools."
      }
     ]
    },
    {
     "type": "matrix",
     "name": "C_FC",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Quite disagree"
      },
      {
       "value": 3,
       "text": "Slightly disagree"
      },
      {
       "value": 4,
       "text": "Neither agree or disagree"
      },
      {
       "value": 5,
       "text": "Slightly agree"
      },
      {
       "value": 6,
       "text": "Quite agree"
      },
      {
       "value": 7,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "C-FC1",
       "text": "I have the resources (devices, support from colleagues, etc) necessary to use these tools."
      },
      {
       "value": "C-FC2",
       "text": "I have the knowledge (the clinical and computer skills) necessary to use these tools."
      },
      {
       "value": "C-FC3",
       "text": "Health and information technology personnel in my organisation are available to assist with difficulties with these tools."
      }
     ]
    }
   ]
  },
  {
   "name": "page_ID1",
   "title": "Your profession",
   "description": "The next statements are about how artificial intelligence might affect {profession} as a profession. Answer for your own profession as it is today.",
   "visibleIf": "{A1} anyof [1,2,3,4,5,6,7]",
   "elements": [
    {
     "type": "matrix",
     "name": "D_REC",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Totally disagree"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "Totally agree"
      }
     ],
     "rows": [
      {
       "value": "D-REC1",
       "text": "I fear that when using these tools, {profession} may lose their expert status."
      },
      {
       "value": "D-REC3",
       "text": "I fear that when using these tools, {profession}' position in the organisational hierarchy may be undermined."
      },
      {
       "value": "D-REC4",
       "text": "I fear that when using these tools, {profession} may have a lower professional status."
      }
     ]
    },
    {
     "type": "matrix",
     "name": "D_CAP",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Totally disagree"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "Totally agree"
      }
     ],
     "rows": [
      {
       "value": "D-CAP1",
       "text": "I fear that when using these tools {profession}' job autonomy may be reduced."
      },
      {
       "value": "D-CAP3",
       "text": "I fear that when using these tools {profession} may have less control over patient medical decisions."
      },
      {
       "value": "D-CAP6",
       "text": "I fear that when using these tools {profession} have less influence on patient care."
      }
     ]
    }
   ]
  },
  {
   "name": "page_ID2",
   "title": "Your profession",
   "visibleIf": "{A1} anyof [1,2,3,4,5,6,7]",
   "elements": [
    {
     "type": "matrix",
     "name": "D_ST",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "5"
      },
      {
       "value": 6,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "D-ST1",
       "text": "Using these tools undermines my sense of self-worth."
      },
      {
       "value": "D-ST2",
       "text": "Using these tools makes me feel less competent."
      }
     ]
    },
    {
     "type": "matrix",
     "name": "D_RES",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Totally disagree"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "Totally agree"
      }
     ],
     "rows": [
      {
       "value": "D-RC1",
       "text": "I do not want these tools to change the way I order patient tests."
      },
      {
       "value": "D-RC2",
       "text": "I do not want these tools to change the way I make clinical decisions."
      },
      {
       "value": "D-RC4",
       "text": "Overall, I do not want these tools to change the way I currently work."
      }
     ]
    }
   ]
  },
  {
   "name": "page_ID_nonclin",
   "title": "Risk and resistance",
   "description": "The following statements concern artificial intelligence tools used in sport, exercise and musculoskeletal care. Please answer about such tools in general, as you understand them.",
   "visibleIf": "{A1} anyof [8,9,10,11]",
   "elements": [
    {
     "type": "matrix",
     "name": "C_RB",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Quite disagree"
      },
      {
       "value": 3,
       "text": "Slightly disagree"
      },
      {
       "value": 4,
       "text": "Neither agree or disagree"
      },
      {
       "value": 5,
       "text": "Slightly agree"
      },
      {
       "value": 6,
       "text": "Quite agree"
      },
      {
       "value": 7,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "C-RB1",
       "text": "I do not want these tools to change how I currently do my work because they are unfamiliar to me."
      },
      {
       "value": "C-RB2",
       "text": "I do not want to use these tools because of past experience; these new high-tech products always fall flat during practical application."
      },
      {
       "value": "C-RB3",
       "text": "I do not want to use these tools because there is a possibility of losing my job, as artificial intelligence-assisted technology may do my work better than me."
      }
     ]
    },
    {
     "type": "matrix",
     "name": "C_PR",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Quite disagree"
      },
      {
       "value": 3,
       "text": "Slightly disagree"
      },
      {
       "value": 4,
       "text": "Neither agree or disagree"
      },
      {
       "value": 5,
       "text": "Slightly agree"
      },
      {
       "value": 6,
       "text": "Quite agree"
      },
      {
       "value": 7,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "C-PR1",
       "text": "There is a possibility of malfunction and performance failure, so these tools might fail to deliver accurate output and could mislead my work with inaccurate output."
      },
      {
       "value": "C-PR2",
       "text": "There is a probability that I need more time to fix the errors and nuances of these tools."
      },
      {
       "value": "C-PR3",
       "text": "I think using these tools may cause psychological distress, as it could have a negative effect on my self-perception of my own work."
      }
     ]
    }
   ]
  },
  {
   "name": "page_O",
   "title": "Attitudes to artificial intelligence in medicine",
   "visibleIf": "{A1} contains 12",
   "elements": [
    {
     "type": "matrix",
     "name": "O",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Disagree"
      },
      {
       "value": 3,
       "text": "Neither"
      },
      {
       "value": 4,
       "text": "Agree"
      },
      {
       "value": 5,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "O1",
       "text": "I would like AI to help me with routine health monitoring and alerts."
      },
      {
       "value": "O2",
       "text": "I would like to receive AI-generated personalised health educational materials based on my medical records."
      },
      {
       "value": "O3",
       "text": "AI could make healthcare more accessible to many people."
      },
      {
       "value": "O4",
       "text": "The added efficiency of AI will reduce unnecessary procedures and visits."
      },
      {
       "value": "O5",
       "text": "I believe that AI can lead to faster development of new medical treatments."
      },
      {
       "value": "O6",
       "text": "I believe that AI can improve my understanding of medical options."
      },
      {
       "value": "O7",
       "text": "AI and human healthcare providers could complement each other through their different strengths."
      },
      {
       "value": "O8",
       "text": "I am hopeful that an increased use of AI in healthcare will free up medical professionals' time to give patients more personalised attention."
      },
      {
       "value": "O9",
       "text": "I am optimistic about AI's ability to innovate and advance medical treatments."
      },
      {
       "value": "O10",
       "text": "I trust AI to accurately diagnose medical conditions."
      },
      {
       "value": "O11",
       "text": "I feel that AI-based diagnostic tools are reliable."
      },
      {
       "value": "O12",
       "text": "I would follow a treatment plan recommended by AI."
      },
      {
       "value": "O13",
       "text": "I trust AI-enabled telemedicine platforms to provide correct diagnoses and treatment plans."
      },
      {
       "value": "O14",
       "text": "I believe AI tools are at least as accurate as a human medical provider."
      },
      {
       "value": "O15",
       "text": "I am comfortable with AI helping doctors interpret pathology slides from a biopsy and generate a diagnosis."
      },
      {
       "value": "O16",
       "text": "I am comfortable with AI helping doctors interpret radiology scans such as x-rays."
      },
      {
       "value": "O17",
       "text": "I am comfortable with AI helping doctors evaluate photographs of my skin lesions."
      },
      {
       "value": "O18",
       "text": "I feel anxious about AI making decisions in healthcare."
      },
      {
       "value": "O19",
       "text": "I fear that increased use of AI in healthcare will lead to less human contact in medical services."
      },
      {
       "value": "O20",
       "text": "I am concerned about the long-term effects of AI on the quality of healthcare."
      }
     ]
    }
   ]
  },
  {
   "name": "page_CON",
   "title": "Concerns",
   "elements": [
    {
     "type": "matrix",
     "name": "H1",
     "title": "How concerned are you about each of the following?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Not concerned"
      },
      {
       "value": 2,
       "text": "Slightly"
      },
      {
       "value": 3,
       "text": "Moderately"
      },
      {
       "value": 4,
       "text": "Very"
      },
      {
       "value": 5,
       "text": "Extremely concerned"
      }
     ],
     "rows": [
      {
       "value": "wrong",
       "text": "Incorrect output reaching a patient"
      },
      {
       "value": "deskill",
       "text": "Over-reliance and loss of skill"
      },
      {
       "value": "bias",
       "text": "Bias against particular groups"
      },
      {
       "value": "privacy",
       "text": "Data privacy and security"
      },
      {
       "value": "liability",
       "text": "Unclear liability when harm occurs"
      }
     ]
    }
   ]
  },
  {
   "name": "page_GOV",
   "title": "Governance",
   "elements": [
    {
     "type": "matrix",
     "name": "J1",
     "title": "How far do you agree that each of these should be required before a tool is used with patients in this field?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Disagree"
      },
      {
       "value": 3,
       "text": "Neither"
      },
      {
       "value": 4,
       "text": "Agree"
      },
      {
       "value": 5,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "purpose",
       "text": "The intended purpose is declared before development begins"
      },
      {
       "value": "popn",
       "text": "Performance is demonstrated in the population that will use the tool, not only the one that produced it"
      },
      {
       "value": "safety",
       "text": "The tool is deliberately tested against serious conditions it might miss"
      },
      {
       "value": "monitor",
       "text": "Performance is monitored continuously after adoption"
      },
      {
       "value": "disclose",
       "text": "Users are told when they are interacting with an artificial intelligence tool"
      },
      {
       "value": "named",
       "text": "A named person is accountable for the tool's outputs"
      }
     ]
    },
    {
     "type": "radiogroup",
     "name": "J2",
     "title": "Who should be primarily responsible for ensuring these tools are safe?",
     "choices": [
      "The developer",
      "The regulator",
      "The employing organisation",
      "The individual clinician",
      "A professional body",
      "Shared, with no single owner"
     ]
    }
   ]
  },
  {
   "name": "page_SJT",
   "title": "A situation",
   "elements": [
    {
     "type": "html",
     "name": "I1_scenario",
     "html": "\n            <div class=\"ath-scenario\">\n              <p>A service manager proposes withdrawing an artificial intelligence\n              rehabilitation tool that patients like and that has reduced waiting\n              times, on the grounds that it has never been externally validated and\n              the service could not defend it if something went wrong.</p>\n            </div>"
    },
    {
     "type": "comment",
     "name": "I1",
     "title": "Whatever your own view, set out the strongest case against the position you personally hold.",
     "isRequired": true,
     "rows": 6,
     "placeholder": "A few sentences is plenty."
    }
   ]
  },
  {
   "name": "page_VOICE",
   "title": "In your own words",
   "elements": [
    {
     "type": "comment",
     "name": "I2",
     "title": "{anchorText}",
     "isRequired": false,
     "rows": 6,
     "placeholder": "A few sentences is plenty."
    }
   ]
  },
  {
   "name": "page_CHAR",
   "title": "A little more about you",
   "description": "Every question here has a prefer not to say option.",
   "elements": [
    {
     "type": "radiogroup",
     "name": "CH_age",
     "title": "Age",
     "choices": [
      "18 to 24",
      "25 to 34",
      "35 to 44",
      "45 to 54",
      "55 to 64",
      "65 and over",
      "Prefer not to say"
     ]
    },
    {
     "type": "radiogroup",
     "name": "CH_sex",
     "title": "Sex",
     "choices": [
      "Female",
      "Male",
      "Prefer not to say"
     ]
    },
    {
     "type": "radiogroup",
     "name": "CH_dis1",
     "title": "Do you have any physical or mental health conditions or illnesses lasting or expected to last 12 months or more?",
     "choices": [
      "Yes",
      "No",
      "Prefer not to say"
     ]
    },
    {
     "type": "radiogroup",
     "name": "CH_dis2",
     "title": "Do any of your conditions or illnesses reduce your ability to carry out day-to-day activities?",
     "visibleIf": "{CH_dis1} = 'Yes'",
     "choices": [
      "Yes, a lot",
      "Yes, a little",
      "Not at all",
      "Prefer not to say"
     ]
    },
    {
     "type": "radiogroup",
     "name": "CH_edu",
     "title": "Highest qualification",
     "choices": [
      "No formal qualification",
      "School leaving qualification",
      "Further education or apprenticeship",
      "Bachelor's degree",
      "Master's degree or postgraduate qualification",
      "Doctorate",
      "Prefer not to say"
     ]
    },
    {
     "type": "rating",
     "name": "CH_ladder",
     "title": "Think of this ladder as representing where people stand in your country. At the top are the people who are best off, those who have the most money, the most education and the most respected jobs. At the bottom are the people who are worst off. Where would you place yourself on this ladder?",
     "rateMin": 1,
     "rateMax": 10,
     "minRateDescription": "Bottom",
     "maxRateDescription": "Top"
    },
    {
     "type": "checkbox",
     "name": "CH_ladder_pnts",
     "titleLocation": "hidden",
     "choices": [
      {
       "value": "pnts",
       "text": "Prefer not to say (ladder)"
      }
     ]
    }
   ]
  },
  {
   "name": "page_BONUS_GATE",
   "title": "The core is complete",
   "elements": [
    {
     "type": "html",
     "name": "core_done",
     "html": "<div class=\"ath-info\"><p><strong>Thank you. The core survey is complete and has been saved.</strong> Registration for the findings and the consensus panel is available after you finish. Would you like to continue with additional sections? Each takes two to four minutes and you can stop after any of them.</p></div>"
    },
    {
     "type": "radiogroup",
     "name": "bonus",
     "title": "Continue with additional sections?",
     "isRequired": true,
     "choices": [
      {
       "value": "yes",
       "text": "Yes, continue"
      },
      {
       "value": "no",
       "text": "No, finish now"
      }
     ]
    },
    {
     "type": "radiogroup",
     "name": "WHY",
     "title": "You chose to continue. What is the main reason?",
     "visibleIf": "{bonus} = 'yes'",
     "isRequired": true,
     "showOtherItem": true,
     "otherText": "Something else, namely",
     "choices": [
      "My group's view should be represented",
      "I am interested in the subject",
      "I want to influence the consensus statements",
      "I use or build these tools",
      "I have concerns I want recorded"
     ]
    },
    {
     "type": "radiogroup",
     "name": "STOP",
     "title": "What would have made you continue? (optional)",
     "visibleIf": "{bonus} = 'no'",
     "choices": [
      "No time now",
      "Nothing, I have said what I wanted to",
      "The questions were not relevant to me",
      "Too many questions",
      "Something else"
     ]
    }
   ]
  },
  {
   "name": "page_IDX",
   "title": "Your profession, continued",
   "visibleIf": "{bonus} = 'yes' and {A1} anyof [1,2,3,4,5,6,7]",
   "elements": [
    {
     "type": "matrix",
     "name": "D_ENH",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Totally disagree"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "Totally agree"
      }
     ],
     "rows": [
      {
       "value": "D-ENH1",
       "text": "I hope that when using these tools {profession} may gain in their expert status."
      },
      {
       "value": "D-ENH4",
       "text": "I hope that when using these tools {profession} may improve in their professional status."
      },
      {
       "value": "D-ENH7",
       "text": "I hope that {profession}' diagnostic and therapeutic decisions will less be monitored by people outside my profession."
      },
      {
       "value": "D-ENH10",
       "text": "I hope that when using these tools {profession} may have more control over the distribution of scarce resources."
      }
     ]
    },
    {
     "type": "matrix",
     "name": "D_TEMP",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Totally disagree"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "Totally agree"
      }
     ],
     "rows": [
      {
       "value": "D-TD1",
       "text": "Such tools will only become relevant in the distant future."
      },
      {
       "value": "D-TD2",
       "text": "Such tools are unlikely to be implemented technically."
      },
      {
       "value": "D-TD3",
       "text": "Such tools are too abstract and intangible for me."
      }
     ]
    },
    {
     "type": "matrix",
     "name": "D_ST2",
     "title": "How far do you agree?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "2"
      },
      {
       "value": 3,
       "text": "3"
      },
      {
       "value": 4,
       "text": "4"
      },
      {
       "value": 5,
       "text": "5"
      },
      {
       "value": 6,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "D-ST3",
       "text": "Using these tools would have to change who I am."
      },
      {
       "value": "D-ST4",
       "text": "Using these tools makes me feel less unique as a person."
      }
     ]
    }
   ]
  },
  {
   "name": "page_DOMX_P",
   "title": "Injury & Illness Prevention, continued",
   "visibleIf": "{bonus} = 'yes'",
   "elements": [
    {
     "type": "checkbox",
     "name": "EP_2",
     "title": "escalation",
     "isRequired": true,
     "choices": [
      {
       "value": "serious",
       "text": "Any suspicion of serious pathology"
      },
      {
       "value": "scope",
       "text": "Symptoms outside the tool's stated scope"
      },
      {
       "value": "worse",
       "text": "The person is deteriorating"
      },
      {
       "value": "disagree",
       "text": "The person disagrees with the tool"
      },
      {
       "value": "lowconf",
       "text": "The tool's own confidence is low"
      },
      {
       "value": "distress",
       "text": "The person is distressed"
      },
      {
       "value": "safeguard",
       "text": "A safeguarding concern"
      },
      {
       "value": "updated",
       "text": "The tool has been updated mid-programme"
      }
     ],
     "showOtherItem": true,
     "otherText": "Something else, namely"
    },
    {
     "type": "rating",
     "name": "EP_3",
     "title": "How high a priority is work in this domain for the specialty over the next three years?",
     "isRequired": true,
     "rateValues": [
      {
       "value": 1,
       "text": "Not a priority"
      },
      {
       "value": 2,
       "text": "Low"
      },
      {
       "value": 3,
       "text": "Moderate"
      },
      {
       "value": 4,
       "text": "High"
      },
      {
       "value": 5,
       "text": "Highest priority"
      }
     ]
    }
   ]
  },
  {
   "name": "page_DOMX_S",
   "title": "Health Data Science, continued",
   "visibleIf": "{bonus} = 'yes'",
   "elements": [
    {
     "type": "checkbox",
     "name": "ES_2",
     "title": "escalation",
     "isRequired": true,
     "choices": [
      {
       "value": "purpose",
       "text": "Data are used beyond the purpose for which they were collected"
      },
      {
       "value": "reident",
       "text": "Individuals could be re-identified from the output"
      },
      {
       "value": "subgroup",
       "text": "An unexplained difference between patient groups appears in the results"
      },
      {
       "value": "quality",
       "text": "Data quality falls below what the analysis assumes"
      },
      {
       "value": "harm",
       "text": "A finding suggests possible harm in current practice"
      },
      {
       "value": "individual",
       "text": "The analysis is used to make decisions about individuals rather than services"
      },
      {
       "value": "consent",
       "text": "Consent or opt-out arrangements do not cover the use"
      }
     ],
     "showOtherItem": true,
     "otherText": "Something else, namely"
    },
    {
     "type": "rating",
     "name": "ES_3",
     "title": "How high a priority is work in this domain for the specialty over the next three years?",
     "isRequired": true,
     "rateValues": [
      {
       "value": 1,
       "text": "Not a priority"
      },
      {
       "value": 2,
       "text": "Low"
      },
      {
       "value": 3,
       "text": "Moderate"
      },
      {
       "value": 4,
       "text": "High"
      },
      {
       "value": 5,
       "text": "Highest priority"
      }
     ]
    }
   ]
  },
  {
   "name": "page_DOMX_G",
   "title": "Implementation, Regulation & Governance, continued",
   "visibleIf": "{bonus} = 'yes'",
   "elements": [
    {
     "type": "checkbox",
     "name": "EG_2",
     "title": "escalation",
     "isRequired": true,
     "choices": [
      {
       "value": "below",
       "text": "Performance falls below the level at which it was approved"
      },
      {
       "value": "update",
       "text": "The model is updated or retrained without notice to users"
      },
      {
       "value": "subgroup",
       "text": "An unexplained difference in performance between patient groups"
      },
      {
       "value": "offlabel",
       "text": "The tool is being used outside its stated intended purpose"
      },
      {
       "value": "incident",
       "text": "A serious incident or near miss is reported"
      },
      {
       "value": "evidence",
       "text": "The evidence supporting it is withdrawn or contradicted"
      },
      {
       "value": "noowner",
       "text": "No named person can be identified as accountable for it"
      },
      {
       "value": "unsupported",
       "text": "The vendor stops supporting or maintaining it"
      }
     ],
     "showOtherItem": true,
     "otherText": "Something else, namely"
    },
    {
     "type": "rating",
     "name": "EG_3",
     "title": "How high a priority is work in this domain for the specialty over the next three years?",
     "isRequired": true,
     "rateValues": [
      {
       "value": 1,
       "text": "Not a priority"
      },
      {
       "value": 2,
       "text": "Low"
      },
      {
       "value": 3,
       "text": "Moderate"
      },
      {
       "value": 4,
       "text": "High"
      },
      {
       "value": 5,
       "text": "Highest priority"
      }
     ]
    }
   ]
  },
  {
   "name": "page_GOVX",
   "title": "Governance, continued",
   "visibleIf": "{bonus} = 'yes'",
   "elements": [
    {
     "type": "matrix",
     "name": "H1x",
     "title": "How concerned are you about each of the following?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Not concerned"
      },
      {
       "value": 2,
       "text": "Slightly"
      },
      {
       "value": 3,
       "text": "Moderately"
      },
      {
       "value": 4,
       "text": "Very"
      },
      {
       "value": 5,
       "text": "Extremely concerned"
      }
     ],
     "rows": [
      {
       "value": "relation",
       "text": "Loss of the therapeutic relationship"
      },
      {
       "value": "control",
       "text": "Commercial control of clinical tools"
      },
      {
       "value": "drift",
       "text": "Models changing without notice"
      },
      {
       "value": "vendor",
       "text": "Evidence produced by the vendor selling the tool"
      },
      {
       "value": "equity",
       "text": "Widening inequity of access"
      }
     ]
    },
    {
     "type": "matrix",
     "name": "J1x",
     "title": "How far do you agree that each of these should be required before a tool is used with patients in this field?",
     "isAllRowRequired": true,
     "columns": [
      {
       "value": 1,
       "text": "Strongly disagree"
      },
      {
       "value": 2,
       "text": "Disagree"
      },
      {
       "value": 3,
       "text": "Neither"
      },
      {
       "value": 4,
       "text": "Agree"
      },
      {
       "value": 5,
       "text": "Strongly agree"
      }
     ],
     "rows": [
      {
       "value": "training",
       "text": "The training data are described in public"
      },
      {
       "value": "changes",
       "text": "Model changes are notified to users"
      },
      {
       "value": "certified",
       "text": "An independent body has certified the tool"
      },
      {
       "value": "decline",
       "text": "Patients can decline its use without disadvantage"
      }
     ]
    }
   ]
  },
  {
   "name": "page_USE",
   "title": "How you have used these tools",
   "visibleIf": "{bonus} = 'yes'",
   "elements": [
    {
     "type": "rating",
     "name": "B5",
     "title": "In your experience, do the people you work with or care for consult artificial intelligence tools about their musculoskeletal problems before, or instead of, seeking professional advice?",
     "rateValues": [
      {
       "value": 1,
       "text": "Never"
      },
      {
       "value": 2,
       "text": "Rarely"
      },
      {
       "value": 3,
       "text": "Sometimes"
      },
      {
       "value": 4,
       "text": "Often"
      },
      {
       "value": 5,
       "text": "Very often"
      },
      {
       "value": 0,
       "text": "I don't know"
      }
     ]
    },
    {
     "visibleIf": "{A1} anyof [1,2,3,4,5,6,7,8,9,10,11]",
     "type": "radiogroup",
     "name": "B6",
     "title": "Have you received any formal training in the evaluation, safe use or governance of artificial intelligence?",
     "choices": [
      "None",
      "Brief, under a day",
      "Substantial, more than a day",
      "A formal qualification"
     ]
    }
   ]
  },
  {
   "name": "page_OWN",
   "title": "In your own words, continued",
   "visibleIf": "{bonus} = 'yes'",
   "elements": [
    {
     "type": "comment",
     "name": "K1",
     "title": "Anything else you would like to say about artificial intelligence in this field?",
     "rows": 4
    },
    {
     "type": "comment",
     "name": "K3",
     "title": "Did any question feel poorly worded, ambiguous, or inapplicable to your role?",
     "rows": 3
    }
   ]
  }
 ]
};

/* Role code for routing and stems: the main role if several were chosen. */
function roleCode(data) {
  if (typeof data.A1_main === "number") return data.A1_main;
  if (Array.isArray(data.A1)) { const n = data.A1.filter(v => typeof v === "number"); return n.length ? n[0] : null; }
  return typeof data.A1 === "number" ? data.A1 : null;
}
function modulesComplete(survey) {
  const done = new Set();
  for (const p of survey.visiblePages) {
    const m = MODULES[p.name]; if (!m) continue;
    const idx = survey.visiblePages.indexOf(p);
    const cur = survey.visiblePages.indexOf(survey.currentPage);
    if (idx < cur && p.questions.every(q => !q.isRequired || !q.isEmpty())) {
      const later = survey.visiblePages.filter(x => MODULES[x.name] === m && survey.visiblePages.indexOf(x) >= cur);
      if (later.length === 0) done.add(m);
    }
  }
  return [...done];
}
function coreComplete(mods) { return CORE_MODULES.filter(m => m !== "ACC" && m !== "ID").every(m => mods.includes(m)) && (mods.includes("ACC") || mods.includes("ID") || mods.includes("O")); }

window.ALTHING = { INSTRUMENT_VERSION, surveyJson, chooseAnchor, constructMeans, setRoleStems, roleCode, DOMAIN_STEMS,
  modulesComplete, coreComplete, MODULES, CORE_MODULES, DOMAINS, ESCALATION_STEMS, ANCHOR_RULES, ANCHOR_DEFAULT, ANCHOR_HIGH, ANCHOR_LOW };
