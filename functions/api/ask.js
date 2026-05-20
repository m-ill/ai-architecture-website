export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const question = await getQuestion(request);
    if (!question) {
      return json({
        ok: true,
        type: "help",
        message: "질문을 입력해 주세요.",
        examples: ["AI건축융합학과는 어떤 학과인가요?", "졸업 후 진로는 무엇인가요?", "전형별 모집인원은 어떻게 되나요?"]
      }, corsHeaders);
    }

    const [faq, policy, department] = await Promise.all([
      fetchAssetJson(env, request, "/data/faq.json"),
      fetchAssetJson(env, request, "/data/answer_policy.json"),
      fetchAssetJson(env, request, "/data/department.json")
    ]);

    const matches = scoreFaq(question, faq);
    const best = matches[0];
    const score = best ? best.score : 0;
    const confidence = Math.min(1.0, score / 10000.0);

    // Fallback threshold
    if (!best || score < 1000) {
      return json({
        ok: true,
        type: "fallback",
        question,
        answer: policy.fallback_answer,
        confidence: 0,
        department: department.name_ko,
        sources: ["/data/faq.json", "/data/answer_policy.json"]
      }, corsHeaders);
    }

    let answer = best.item.answer;
    
    // Automatic Disclaimer Rules
    // 키워드: 정원, 수시, 정시, 논술, 수능, 최저, DKU, 지역균형, 모집
    const admissionKeywords = ["정원", "수시", "정시", "논술", "수능", "최저", "dku", "지역균형", "모집"];
    const normQ = question.toLowerCase();
    const isAdmissionQuery = admissionKeywords.some(k => normQ.includes(k)) || best.item.category === "입학";

    if (isAdmissionQuery && !answer.includes("모집요강")) {
      answer += "\n\n" + policy.admission_disclaimer;
    }

    return json({
      ok: true,
      type: "answer",
      question,
      answer,
      confidence,
      match: {
        id: best.item.id,
        question: best.item.question,
        category: best.item.category
      },
      related: matches.slice(1, 4).filter(m => m.score >= 1000).map(m => ({
        id: m.item.id,
        question: m.item.question,
        category: m.item.category,
        score: m.score
      })),
      sources: ["/data/faq.json", "/content/faq.md", "/llms.txt"]
    }, corsHeaders);
  } catch (error) {
    return json({ ok: false, error: String(error && error.message ? error.message : error) }, corsHeaders, 500);
  }
}

async function getQuestion(request) {
  const url = new URL(request.url);
  if (request.method === "GET") return (url.searchParams.get("q") || "").trim();
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    return String(body.question || body.q || "").trim();
  }
  return "";
}

async function fetchAssetJson(env, request, path) {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = "";
  const response = await env.ASSETS.fetch(url.toString());
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return await response.json();
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[()\[\]{}.,!?"'“”‘’·:;\/\\|_+=~`<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreFaq(query, faq) {
  const normQuery = normalize(query);
  const queryTokens = normQuery.split(" ").filter(t => t.length > 0);

  if (queryTokens.length === 0) return [];

  const hasTrack = normQuery.includes("트랙");
  const hasGrade = normQuery.includes("내신") || normQuery.includes("수능") || normQuery.includes("합격선") || normQuery.includes("경쟁률") || normQuery.includes("등급");

  return faq.map(item => {
    const normQ = normalize(item.question);
    const normAns = normalize(item.answer);
    const normAliases = (item.aliases || []).map(normalize);
    const normKeywords = (item.keywords || []).map(normalize);

    let score = 0;

    // Rule 1: question 직접 (일치/포함)
    if (normQuery === normQ) {
      score += 10000;
    } else if (normQ.includes(normQuery) || normQuery.includes(normQ)) {
      score += 8000;
    } else {
      const qTokens = normQ.split(" ").filter(t => t.length > 0);
      const overlap = queryTokens.filter(t => qTokens.includes(t)).length;
      score += overlap * 1000;
    }

    // Rule 2: aliases 유사 일치 (완전/부분 일치)
    let aliasScore = 0;
    for (const alias of normAliases) {
      if (normQuery === alias) {
        aliasScore = Math.max(aliasScore, 5000);
      } else if (alias.includes(normQuery) || normQuery.includes(alias)) {
        aliasScore = Math.max(aliasScore, 3000);
      } else {
        const aTokens = alias.split(" ").filter(t => t.length > 0);
        const overlap = queryTokens.filter(t => aTokens.includes(t)).length;
        aliasScore = Math.max(aliasScore, overlap * 500);
      }
    }
    score += aliasScore;

    // Rule 3: keywords 포함
    let keywordScore = 0;
    for (const keyword of normKeywords) {
      if (normQuery.includes(keyword) || keyword.includes(normQuery)) {
        keywordScore += 1000;
      }
    }
    score += keywordScore;

    // Rule 4: answer 포함
    if (normAns.includes(normQuery)) {
      score += 500;
    } else {
      const ansTokens = normAns.split(" ").filter(t => t.length > 0);
      const overlap = queryTokens.filter(t => ansTokens.includes(t)).length;
      score += overlap * 100;
    }

    // Rule 5: 동의어 / 카테고리 가중치
    // 5-1. 트랙 -> 심화 교육축 보정
    if (hasTrack && item.category === "심화 교육축") {
      score += 4000;
    }

    // 5-2. 내신 / 수능 / 합격선 / 경쟁률 보정
    if (hasGrade && item.category === "입학") {
      if (normQuery.includes("내신") && item.question.includes("내신")) {
        score += 6000;
      }
      if (normQuery.includes("수능") && item.question.includes("수능 몇 등급")) {
        score += 6000;
      }
      if (normQuery.includes("경쟁률") && item.question.includes("경쟁률")) {
        score += 6000;
      }
    }

    // 5-3. 카테고리 명칭 보정
    if (normQuery.includes(item.category)) {
      score += 1000;
    }

    // Rule 6: priority 점수 반영 (타이브레이커)
    score += (item.priority || 0) * 0.1;

    return { item, score };
  }).sort((a, b) => b.score - a.score);
}

function json(data, headers = {}, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}
