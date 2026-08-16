export const MIN_RELEVANCE_SCORE = 24;
export const STATIC_ANSWER_SCORE = 68;

export const AUTOMATIC_DISCLAIMERS = {
  career: "진로 분야는 가능성 예시이며, 특정 취업이나 직무 진출을 보장하는 표현은 아닙니다.",
  license: "건축사 등 자격·면허 관련 사항은 관련 법령, 인증, 학사 요건을 공식적으로 확인해야 합니다."
};

const INTENT_ROUTES = [
  {
    intent: "교수진",
    triggers: ["교수진", "교수님", "참여교수", "참여 교수", "산학 전문가", "멘토단"],
    preferred_faq_id: "ops-002a",
    preferred_url: "/#faculty"
  },
  {
    intent: "건축학 비교",
    triggers: ["건축학", "건축학과", "건축설계", "설계 중심"],
    preferred_faq_id: "seo-diff-architecture-001",
    preferred_url: "/architecture-vs-ai-architecture"
  },
  {
    intent: "건축사 자격",
    triggers: [
      "건축사 자격", "건축사 면허", "건축사 되는", "건축사 시험",
      "건축사 딸", "건축사 따", "건축사 취득", "건축사 가능", "건축사 할 수", "건축사 할수"
    ],
    preferred_faq_id: "diff-006",
    preferred_url: "/architecture-vs-ai-architecture"
  },
  {
    intent: "건축공학 비교",
    triggers: ["건축공학", "건축공학과", "구조안전", "시공품질", "건축환경"],
    preferred_faq_id: "seo-diff-engineering-001",
    preferred_url: "/architectural-engineering-vs-ai-architecture"
  },
  {
    intent: "BIM 디지털트윈",
    triggers: ["bim", "cim", "디지털트윈", "디지털 모델", "디지털모델"],
    preferred_faq_id: "seo-tech-bim-001",
    preferred_url: "/bim-digital-twin"
  },
  {
    intent: "스마트건축",
    triggers: ["스마트건축", "스마트건설", "현장 자동화", "건축 데이터", "건설 데이터", "안전관리", "센서"],
    preferred_faq_id: "seo-tech-smartconstruction-001",
    preferred_url: "/smart-construction-ai"
  },
  {
    intent: "수험생 준비",
    triggers: ["고등학생", "고교생", "수험생", "입학 전 준비", "무엇을 준비"],
    preferred_faq_id: "seo-student-001",
    preferred_url: "/student-preparation-guide"
  },
  {
    intent: "직업 변화",
    triggers: ["사라질까", "대체", "직업 변화", "일자리", "사라지"],
    preferred_faq_id: "hope-007",
    preferred_url: "/ai-changes-architecture"
  },
  {
    intent: "진로",
    triggers: ["진로", "취업", "직업", "회사", "졸업 후", "대학원", "연구개발", "r&d", "bim 엔지니어", "데이터 분석가"],
    preferred_faq_id: "seo-career-001",
    preferred_url: "/ai-architecture-careers"
  },
  {
    intent: "신설학과 불안",
    triggers: ["신설", "불안", "괜찮을까", "학부모", "안정성"],
    preferred_faq_id: "seo-parent-001",
    preferred_url: "/parent-guide"
  }
];

const STOP_WORDS = new Set([
  "무엇", "어떤", "어떻게", "왜", "관련", "대해", "정도", "조금", "가능", "설명", "문의",
  "알려", "알려줘", "알려주세요", "해주세요", "해줘", "있나요", "인가요", "일까요", "몇", "명"
]);

const DOMAIN_TERMS = [
  "ai건축", "건축", "학과", "교수", "교육", "교과", "배우", "수업", "심화", "트랙", "진로", "취업",
  "대학원", "bim", "cim", "디지털트윈", "구조", "시공", "안전", "환경", "프로젝트", "포트폴리오",
  "코딩", "수학", "물리", "디자인", "캠퍼스", "연구", "자격증", "건축사", "정란", "이상현", "강태웅",
  "위진복", "정광량", "김종호", "김종수"
];

const FACULTY_TERMS = [
  "교수", "전문가", "멘토", "참여교수", "정란", "이상현", "강태웅", "위진복", "정광량", "김종호", "김종수"
];

const ADMISSIONS_PATTERNS = [
  /입학처/u,
  /입학\s*(전형|요강|정원|인원|일정|절차|조건|자격|점수|상담|문의|원서|지원)/u,
  /입학(?:은|이|을|에|으로)?\s*(어떻게|가능|방법|절차|조건|자격|문의)/u,
  /입학(?:하려면|하려고|하고\s*싶|할\s*수|할수)/u,
  /입시/u,
  /수시/u,
  /정시/u,
  /수능/u,
  /내신/u,
  /입결/u,
  /커트\s*라인/u,
  /합격\s*(선|점수|등급|가능성)/u,
  /경쟁률/u,
  /학생부/u,
  /생기부/u,
  /세특/u,
  /원서\s*접수/u,
  /지원\s*자격/u,
  /수능\s*최저/u,
  /최저\s*학력/u,
  /반영\s*비율/u,
  /모집\s*(요강|인원|정원|단위|군|일정)/u,
  /정원\s*(내|외)/u,
  /가군|나군|다군/u,
  /dku\s*인재/iu,
  /지역\s*균형/u,
  /기회\s*균형/u,
  /사회적\s*배려/u,
  /논술/u,
  /특성화고/u,
  /마이스터고/u,
  /몇\s*명.{0,8}뽑/u,
  /뽑.{0,8}몇\s*명/u
];

export function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[()\[\]{}.,!?"'“”‘’·:;\/\\|_+=~`<>\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripKoreanSuffix(token) {
  const suffixes = [
    "알려주세요", "알려줘", "해주세요", "해줘", "인가요", "일까요", "있나요", "입니다", "이에요", "예요",
    "에서", "에게", "부터", "까지", "처럼", "으로", "하고", "이며", "은", "는", "이", "가", "을", "를",
    "의", "에", "와", "과", "도", "만", "로"
  ];

  for (const suffix of suffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 2) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

export function tokenize(text) {
  return normalize(text)
    .split(" ")
    .map(stripKoreanSuffix)
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));
}

function overlapCount(left, right) {
  const rightSet = new Set(right);
  return [...new Set(left)].filter(token => rightSet.has(token)).length;
}

function textMatchScore(queryText, targetText, weights) {
  const query = normalize(queryText);
  const target = normalize(targetText);
  if (!query || !target) return 0;

  if (query === target) return weights.exact;

  let score = 0;
  const shorterLength = Math.min(query.length, target.length);
  if (shorterLength >= 4 && (query.includes(target) || target.includes(query))) {
    const ratio = shorterLength / Math.max(query.length, target.length);
    score = Math.max(score, weights.contains * Math.max(0.55, ratio));
  }

  const queryTokens = tokenize(query);
  const targetTokens = tokenize(target);
  if (queryTokens.length && targetTokens.length) {
    const overlap = overlapCount(queryTokens, targetTokens);
    if (overlap > 0) {
      const queryCoverage = overlap / new Set(queryTokens).size;
      const targetCoverage = overlap / new Set(targetTokens).size;
      score = Math.max(score, weights.tokens * ((queryCoverage * 0.75) + (targetCoverage * 0.25)));
    }
  }

  return score;
}

export function findIntentRoute(query) {
  const normalized = normalize(query);
  return INTENT_ROUTES.find(route => route.triggers.some(trigger => normalized.includes(normalize(trigger)))) || null;
}

export function isAdmissionsQuestion(question) {
  const normalized = normalize(question);
  const isLicenseQuestion = /건축사|기사|기술사|자격증|면허/u.test(normalized);
  const hasExplicitAdmissionContext = /입학|입시|수시|정시|수능|내신|모집|원서|학생부|생기부|세특/u.test(normalized);
  if (isLicenseQuestion && !hasExplicitAdmissionContext) return false;
  return ADMISSIONS_PATTERNS.some(pattern => pattern.test(normalized));
}

export function isLikelyDepartmentQuestion(question) {
  const normalized = normalize(question);
  return DOMAIN_TERMS.some(term => normalized.includes(term));
}

export function isFacultyQuestion(question) {
  const normalized = normalize(question);
  return FACULTY_TERMS.some(term => normalized.includes(term));
}

export function scoreFaq(query, faq) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenize(normalizedQuery);
  const route = findIntentRoute(normalizedQuery);
  const hasTrack = normalizedQuery.includes("트랙");

  return faq.map(item => {
    let score = textMatchScore(normalizedQuery, item.question, {
      exact: 100,
      contains: 72,
      tokens: 55
    });

    let aliasScore = 0;
    for (const alias of item.aliases || []) {
      aliasScore = Math.max(aliasScore, textMatchScore(normalizedQuery, alias, {
        exact: 94,
        contains: 66,
        tokens: 48
      }));
    }
    score = Math.max(score, aliasScore);

    let keywordScore = 0;
    for (const keyword of item.keywords || []) {
      const normalizedKeyword = normalize(keyword);
      if (normalizedKeyword.length >= 2 && normalizedQuery.includes(normalizedKeyword)) {
        keywordScore += normalizedKeyword.length >= 4 ? 24 : 18;
      }
    }
    score += Math.min(keywordScore, 44);

    const answerTokens = tokenize(item.answer);
    if (queryTokens.length && answerTokens.length) {
      const overlap = overlapCount(queryTokens, answerTokens);
      if (overlap > 0) {
        score += Math.min(12, (overlap / new Set(queryTokens).size) * 12);
      }
    }

    if (hasTrack && item.category === "심화 교육축") {
      score += 28;
    }

    if (normalizedQuery.includes(normalize(item.category))) {
      score += 18;
    }

    if (route && item.id === route.preferred_faq_id) {
      score += 48;
    }

    if (score > 0) {
      score += Math.min(1, (item.priority || 0) / 100);
    }

    return { item, score: Math.round(score * 100) / 100 };
  }).sort((left, right) => right.score - left.score || (right.item.priority || 0) - (left.item.priority || 0));
}

export function getRelatedQuestions(matches, excludeId, limit = 3) {
  const seen = new Set();
  const related = [];

  for (const match of matches) {
    if (match.score < MIN_RELEVANCE_SCORE || match.item.id === excludeId) continue;
    const normalizedQuestion = normalize(match.item.question);
    if (seen.has(normalizedQuestion)) continue;
    seen.add(normalizedQuestion);
    related.push({
      id: match.item.id,
      question: match.item.question,
      category: match.item.category,
      score: match.score
    });
    if (related.length >= limit) break;
  }

  return related;
}

export function getDisclaimers(question, category) {
  const normalized = normalize(question);
  const normalizedCategory = normalize(category);
  const disclaimers = [];

  if (
    ["취업", "진로", "직업", "회사", "대기업", "초봉", "연봉", "졸업 후"].some(term => normalized.includes(term)) ||
    normalizedCategory === "진로" || normalizedCategory === "졸업 후 진로"
  ) {
    disclaimers.push({ id: "career", text: AUTOMATIC_DISCLAIMERS.career });
  }

  if (["건축사", "기사", "자격증", "면허", "자격", "기술사"].some(term => normalized.includes(term))) {
    disclaimers.push({ id: "license", text: AUTOMATIC_DISCLAIMERS.license });
  }

  return disclaimers;
}

export function appendDisclaimers(answer, disclaimers) {
  let result = String(answer || "").trim();
  const additions = disclaimers.filter(disclaimer => {
    if (result.includes(disclaimer.text)) return false;
    if (disclaimer.id === "career" && /취업.{0,20}보장.{0,20}(아니|않)/u.test(result)) return false;
    if (disclaimer.id === "license" && /자격.{0,20}(확인|요건|법령)/u.test(result)) return false;
    return true;
  });

  if (additions.length > 0) {
    result += `\n\n${additions.map(item => item.text).join("\n")}`;
  }
  return result;
}

function extractTopLevelSection(markdown, headingNeedle) {
  const lines = String(markdown || "").split(/\r?\n/);
  const start = lines.findIndex(line => /^#\s+/.test(line) && normalize(line.replace(/^#\s+/, "")).includes(normalize(headingNeedle)));
  if (start < 0) return "";

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^#\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

function selectCanonicalContext(question, canonicalText) {
  const normalized = normalize(question);
  const sectionNames = ["AI건축융합학과 소개"];

  if (["교육", "배우", "수업", "교과", "bim", "디지털트윈", "구조", "시공", "안전", "환경", "코딩", "수학", "디자인"].some(term => normalized.includes(term))) {
    sectionNames.push("교과과정 요약", "심화 교육축");
  }
  if (["진로", "취업", "직업", "회사", "졸업", "대학원", "연구개발"].some(term => normalized.includes(term))) {
    sectionNames.push("진로정보");
  }

  return [...new Set(sectionNames)]
    .map(name => extractTopLevelSection(canonicalText, name))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 10000);
}

function neutralizeFacultyDescription(text) {
  return String(text || "")
    .replace(/최고\s*권위자/gu, "전문가")
    .replace(/권위자/gu, "전문가")
    .replace(/초일류/gu, "산업계")
    .replace(/수많은\s*랜드마크/gu, "다수의")
    .replace(/기술\s*리더십(?:을)?\s*발휘/gu, "기술 검토");
}

export function buildNamedFacultyAnswer(question, facultyData) {
  if (!facultyData) return null;

  const normalizedQuestion = normalize(question);
  const allPeople = [...(facultyData.faculty || []), ...(facultyData.industry_experts || [])];
  const person = allPeople.find(item => normalizedQuestion.includes(normalize(item.name)));
  if (!person) return null;

  const heading = `${person.name} ${person.title || ""}`.trim();
  const organization = neutralizeFacultyDescription(person.company || "단국대학교");
  const domain = neutralizeFacultyDescription(person.domain);
  const projectIntent = /프로젝트|실적|성과|작품|건축물|대표작|설계\s*사례|수행\s*사례/u.test(normalizedQuestion);
  const achievements = (person.achievements || []).map(neutralizeFacultyDescription);
  const nonAwardAchievements = achievements.filter(item => !/수상|수훈|훈장|fellow|공로/iu.test(item));
  const researchAreas = (person.research_areas || []).map(neutralizeFacultyDescription);
  const lines = [
    `**${heading}**`,
    `- 소속: ${organization}`,
    `- 전문 분야: ${domain}`
  ];

  if (projectIntent) {
    const projectItems = nonAwardAchievements.length > 0 ? nonAwardAchievements : achievements;
    lines.push("", "소개 자료에 기재된 대표 프로젝트 및 실적입니다.");
    lines.push(...projectItems.slice(0, 4).map(item => `- ${item}`));
  } else {
    if (person.philosophy) {
      lines.push(`- 활동 관점: ${neutralizeFacultyDescription(person.philosophy)}`);
    }
    const detailItems = researchAreas.length > 0 ? researchAreas : achievements;
    if (detailItems.length > 0) {
      lines.push("", "주요 연구·실무 분야:");
      lines.push(...detailItems.slice(0, 4).map(item => `- ${item}`));
    }
  }

  if (facultyData.disclaimer) {
    lines.push("", facultyData.disclaimer);
  }

  return {
    answer: lines.join("\n"),
    category: "교수진",
    matchedId: `faculty-${person.id}`,
    person,
    relatedUrl: "/#faculty"
  };
}

function selectFacultyContext(question, facultyData) {
  if (!facultyData) return [];
  const normalized = normalize(question);
  const allPeople = [...(facultyData.faculty || []), ...(facultyData.industry_experts || [])];
  const namedPeople = allPeople.filter(person => normalized.includes(normalize(person.name)));
  const isFacultyQuery = ["교수", "전문가", "멘토", "프로젝트"].some(term => normalized.includes(term));
  const selected = namedPeople.length > 0 ? namedPeople : (isFacultyQuery ? allPeople : []);

  return selected.map(person => ({
    name: person.name,
    title: person.title,
    organization: person.company || "단국대학교",
    domain: neutralizeFacultyDescription(person.domain),
    philosophy: person.philosophy,
    achievements: person.achievements || []
  }));
}

export function buildModelContext({ question, matches, department, facultyData, canonicalText }) {
  const faculty = selectFacultyContext(question, facultyData);
  const normalizedQuestion = normalize(question);
  const allFaculty = facultyData
    ? [...(facultyData.faculty || []), ...(facultyData.industry_experts || [])]
    : [];
  const hasNamedFaculty = allFaculty.some(person => normalizedQuestion.includes(normalize(person.name)));
  const contextMatches = faculty.length > 0
    ? (hasNamedFaculty ? [] : matches.filter(match => match.item.id === "ops-002a"))
    : matches;
  const relevantFaq = contextMatches
    .filter(match => match.score >= MIN_RELEVANCE_SCORE)
    .slice(0, 4)
    .map(match => ({
      id: match.item.id,
      category: match.item.category,
      question: match.item.question,
      answer: match.item.answer,
      source: match.item.sources || []
    }));

  const identity = {
    name: department.name_ko,
    college: department.college,
    campus: department.campus,
    opening: department.opening,
    direction: department.direction,
    canonical_message: department.core_message || department.tagline
  };

  const canonical = selectCanonicalContext(question, canonicalText);

  return [
    "[Official Department Data]",
    JSON.stringify(identity, null, 2),
    "[Relevant FAQ Entries]",
    JSON.stringify(relevantFaq, null, 2),
    faculty.length ? "[Relevant Faculty Data]" : "",
    faculty.length ? JSON.stringify(faculty, null, 2) : "",
    faculty.length && facultyData.disclaimer ? `[Faculty Status Notice]\n${facultyData.disclaimer}` : "",
    canonical ? `[Relevant Canonical Sections]\n${canonical}` : ""
  ].filter(Boolean).join("\n\n");
}
