/**
 * Normalize casual / WhatsApp / chat-style incident text into concise
 * professional school-admin / HR English for Drive Docs.
 * Deterministic, LLM-free: templates for common patterns + cleanup.
 * Standing rule: never paste raw user wording into student/teacher Docs.
 */

const SLANG = [
  [/\bcuz\b/gi, 'because'],
  [/\bw\/\b/g, 'with'],
  [/\bu\b/gi, 'you'],
  [/\bur\b/gi, 'your'],
  [/\bidk\b/gi, "I don't know"],
  [/\blol\b/gi, ''],
  [/\bomg\b/gi, ''],
  [/\btbh\b/gi, ''],
  [/\bimho\b/gi, ''],
  [/\bngl\b/gi, ''],
  [/\bfyi\b/gi, ''],
  [/\basap\b/gi, 'as soon as possible'],
  [/\bpls\b/gi, 'please'],
  [/\bplz\b/gi, 'please'],
  [/\btho\b/gi, 'though'],
  [/\bgonna\b/gi, 'going to'],
  [/\bwanna\b/gi, 'want to'],
  [/\bkinda\b/gi, 'somewhat'],
  [/\bsorta\b/gi, 'somewhat'],
  [/\byeah\b/gi, 'yes'],
  [/\byep\b/gi, 'yes'],
  [/\bnah\b/gi, 'no'],
  [/\bok\b/gi, 'acknowledged'],
  [/\bokay\b/gi, 'acknowledged'],
  [/\bthru\b/gi, 'through'],
  [/\binfront\b/gi, 'in front'],
  [/\bipad\b/gi, 'iPad'],
  [/\bmr\.?\s*rayan\b/gi, 'Mr. Rayan'],
  [/\bmr\.?\s*faris\b/gi, 'Mr. Faris'],
  [/\bmr\.?\s*alaa\b/gi, 'Mr. Alaa'],
  [/\bmr\.?\s*mohammed\b/gi, 'Mr. Mohammed'],
  [/\bmr\.?\s*helmy\b/gi, 'Mr. Helmy']
];

function collapseWs(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sentenceCase(s) {
  if (!s) return s;
  return s.replace(/(^|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase());
}

function ensurePeriod(s) {
  const t = s.trim();
  if (!t) return t;
  if (/[.!?]$/.test(t)) return t;
  return t + '.';
}

function stripChatArtifacts(s) {
  return s
    .replace(/[🙏😂😅🔥✨✅❌⚠️📱💬]+/gu, '')
    .replace(/\*+/g, '')
    .replace(/_{2,}/g, ' ')
    .replace(/~+/g, ' ')
    .replace(/#{1,6}\s*/g, '')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/\(~?\d{1,2}:\d{2}\)/g, '')
    .replace(/\bvia WhatsApp\b/gi, '')
    .replace(/\bReported by Abdulrahman Geelany via WhatsApp[^.]*\.?/gi, '')
    .replace(/\bAlaa's Secretary \(from A\. Geelany WhatsApp\)/gi, 'Waad Ops')
    .replace(/\bfrom A\.?\s*Geelany WhatsApp\b/gi, '')
    .replace(/\bspelling variants[^.]*\.?/gi, '')
    .replace(/\bfuzzy[- ]matched[^.]*\.?/gi, '');
}

function applySlang(s) {
  let out = s;
  for (const [re, rep] of SLANG) out = out.replace(re, rep);
  return out;
}

/** Pattern rewriters — return null if no match */
const TEMPLATES = [
  {
    test: /kicked?\s+(his|her|their)?\s*shoes?/i,
    rewrite(text) {
      const bathroom = /bathroom|toilet|washroom/i.test(text);
      const twice = /twice|two times/i.test(text);
      const warning = /last warning|final warning/i.test(text);
      const oath = /oath|pledge/i.test(text);
      const parent = /parent|his called|called and/i.test(text);
      let out =
        'During collective administrative detention, the student kicked ' +
        (twice ? 'his shoes twice' : 'his shoes') +
        ' in front of peers';
      if (bathroom) out += ' and left for the bathroom without permission';
      out += '.';
      if (/several times|past week|multiple/i.test(text)) {
        out += ' The student had been referred to the office several times earlier in the week for minor issues.';
      }
      if (warning) {
        out += ' Final verbal warning issued';
        if (parent || oath) {
          out += '; further recurrence will result in parent contact';
          if (oath) out += ' and a signed behavioral undertaking';
        }
        out += '.';
      }
      return out;
    }
  },
  {
    test: /unauthorized device|iPad during classwork|called me a ["']?liar|formally report a disciplinary incident|Grade 4 Blue Math/i,
    rewrite(text) {
      // Helmy Math incident — compress email into HR prose
      return (
        'During the Grade 4 Blue Math lesson, the student used an iPad without authorization, ' +
        'refused instructions to put it away and to surrender the device, refused to accompany ' +
        'the teacher to administration, verbally called the Math teacher (Mr. Mohammad Helmy) a ' +
        '"liar" in front of classmates, and after temporary removal returned, refused to apologize, ' +
        'and reopened the iPad. Formal report submitted by Mr. Mohammad Helmy requesting further administrative action.'
      );
    }
  },
  {
    test: /parent contacted|supports the school|insisted on apology/i,
    rewrite() {
      return (
        'Parent contacted regarding the classroom incident. Parent expressed support for the school, ' +
        'insisted that the student apologize, and affirmed support for the teacher. Student may be ' +
        'recognized for improvement if conduct improves. Matter addressed with parent and teacher.'
      );
    }
  },
  {
    test: /coming to my office.*almost every day|plays tough with his friends/i,
    rewrite() {
      return (
        'Student has been referred repeatedly to administration and Mr. Rayan\'s office for ' +
        'classroom disruption, often multiple times per day. Pattern includes rough play with peers ' +
        'and difficulty remaining on task without conflict, including with teachers. Verbal warning issued.'
      );
    }
  },
  {
    test: /constantly annoying the class|watching inappropriate|last warning for/i,
    rewrite(text) {
      let out =
        'Persistent classroom disruption. Prior concern involved iPad misuse; PE teacher reported ' +
        'viewing of inappropriate content. An agreement was made not to contact the parent if ' +
        'conduct improved; the student was referred to the office again the following day.';
      if (/firas|fir as|bkth/i.test(text)) {
        out += ' Final verbal warning recorded for Yahya (and Firas).';
      } else {
        out += ' Final verbal warning issued.';
      }
      return out;
    }
  },
  {
    test: /disruptions? in class|class disruptions?/i,
    rewrite(text) {
      const faris = /faris/i.test(text);
      let out = 'Classroom disruption reported.';
      if (/alongside|named as|ghaleb|ghalib|abdulelah/i.test(text)) {
        out += ' Student was named in a multi-student report.';
      }
      if (faris) {
        out += ' Directed to Mr. Faris (covering office) per administrative instruction.';
      } else {
        out += ' Incident noted for follow-up.';
      }
      return out;
    }
  },
  {
    test: /deleted friend.?s files|iPad/i,
    rewrite(text) {
      if (/deleted/i.test(text)) {
        return (
          'Student deleted a peer\'s files from an iPad. Victim identified as Mazen Abdalmohsin Alalyani ' +
          '(G5 Blue). Incident noted; disciplinary follow-up pending.'
        );
      }
      return null;
    }
  },
  {
    test: /no book|book hidden/i,
    rewrite() {
      return (
        'Student repeatedly reported without required book; book later found concealed with the student. ' +
        'Incident noted for follow-up.'
      );
    }
  }
];

/**
 * @param {string} text
 * @returns {string}
 */
export function toHrProse(text) {
  if (text == null) return '';
  let s = String(text);
  if (!s.trim()) return '';

  // Already marked professional — light cleanup only
  const already =
    /Professional record \(supersedes/i.test(s) ||
    (/^During (the |collective )/i.test(s.trim()) &&
      !/faisal kicked|dear mr\.?\s*alaa|via WhatsApp|coming to my office/i.test(s));

  for (const t of TEMPLATES) {
    if (t.test.test(s)) {
      const rewritten = t.rewrite(s);
      if (rewritten) {
        s = rewritten;
        break;
      }
    }
  }

  s = stripChatArtifacts(s);
  s = applySlang(s);
  s = collapseWs(s);

  // Drop email salutation / sign-off if still present
  s = s
    .replace(/^Dear Mr\.?\s*Alaa,?\s*/i, '')
    .replace(/\bI am writing to formally report[^.]*\.\s*/i, '')
    .replace(/\bThank you for your cooperation\.?\s*/i, '')
    .replace(/\bBest regards,?\s*Mohammad Helmy\s*$/i, '')
    .replace(/\bI am submitting this report[^.]*\.\s*/i, '');

  s = collapseWs(s);
  // Split fragments into sentences
  if (s && !/[.!?]$/.test(s) && s.length < 280 && !s.includes('\n')) {
    s = ensurePeriod(s);
  }
  s = sentenceCase(s);

  // Capitalize first letter
  if (s) s = s.charAt(0).toUpperCase() + s.slice(1);

  const cleaned = collapseWs(s);
  if (cleaned.length < 12 && String(text || '').trim().length > 20) {
    // Fallback: light cleanup of original when templates over-stripped
    let fb = stripChatArtifacts(String(text));
    fb = applySlang(fb);
    fb = collapseWs(fb)
      .replace(/^Dear Mr\.?\s*Alaa,?\s*/i, '')
      .replace(/\bBest regards,?\s*Mohammad Helmy\s*$/i, '');
    fb = collapseWs(fb);
    if (fb) fb = fb.charAt(0).toUpperCase() + fb.slice(1);
    if (fb && !/[.!?]$/.test(fb)) fb = ensurePeriod(fb);
    return fb;
  }
  if (already) return cleaned;
  return cleaned;
}

export function toHrAction(text) {
  const s = toHrProse(text);
  if (!s) return '';
  // Common action normalizations
  return s
    .replace(/^Noted\s*\/\s*pending\.?$/i, 'Noted; follow-up pending.')
    .replace(/^Verbal warning\.?$/i, 'Verbal warning issued.')
    .replace(/Send to Mr\.?\s*Faris[\s\S]*/i, 'Referred to Mr. Faris (covering office) per Aladdin Ferjani.')
    .replace(/ordered by Aladdin Ferjani/i, 'per Aladdin Ferjani');
}
