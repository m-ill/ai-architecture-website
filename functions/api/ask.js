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

    const [faq, policy, department, canonicalText] = await Promise.all([
      fetchAssetJson(env, request, "/data/faq.json"),
      fetchAssetJson(env, request, "/data/answer_policy.json"),
      fetchAssetJson(env, request, "/data/department.json"),
      fetchAssetString(env, request, "/content/canonical.md")
    ]);

    const matches = scoreFaq(question, faq);
    const best = matches[0];
    const score = best ? best.score : 0;
    const confidence = Math.min(1.0, score / 10000.0);

    // Rule A: Exact or highly confident match in static FAQ -> Return instantly to save cost and latency
    if (best && score >= 10000) {
      let answer = best.item.answer;
      const isAdmissionQuery = ["정원", "수시", "정시", "논술", "수능", "최저", "dku", "지역균형", "모집"].some(k => question.toLowerCase().includes(k)) || best.item.category === "입학";
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
    }

    // Rule B: Generative AI natural language search via Gemini API (if API Key provided)
    const apiKey = env.GEMINI_API_KEY;
    const apiModel = env.GEMINI_MODEL || "gemini-3.5-flash";
    let apiErrorMsg = null;
    
    if (apiKey) {
      try {
        const systemInstruction = `너는 단국대학교 AI융합대학 AI건축융합학과 공식 AI 안내원이야. 아래 제공되는 학과 공식 문서(Context)를 바탕으로 사용자의 질문에 친절하고 전문적인 자연어로 대답해야 해.

[중요 규칙 - 절대 준수]
1. 학과 정체성 슬로건은 반드시 다음 표현을 토씨 하나 바꾸지 말고 사용해라: "건축 정보를 읽고, AI와 데이터로 판단·설계·개선하는 융합형 책임기술 인재 양성"
2. 공식 UI 및 공개 답변에서는 "심화 교육축"이라는 용어를 반드시 사용해라. ("트랙"이라는 단어가 질문에 오면 "심화 교육축"의 내용으로 답변해야 한다.)
3. 어떠한 경우에도 입학, 취업, 건축사 자격증 취득, 교수 참여 등이 보장(guaranteed)된다고 단정적으로 답하지 말라. (예시 기업명은 단순 예시일 뿐이다.)
4. 내신 등급컷, 수능 합격 등급선, 경쟁률 등 구체적인 등급이나 수치가 확정적인 것처럼 말하지 말고, "모집요강을 통해 최종 확인해야 한다"고 입학처 홈페이지 확인을 유도해라.
5. 입학 정보(정원, 전형별 모집 인원 등)에 관해 답할 때는 2027학년도 대입전형시행계획 기준임을 명시하고, 다음의 공식 디스클레이머 문구를 답변 끝에 반드시 삽입해라:
"${policy.admission_disclaimer}"
6. 주어진 문서(Context)에 기반하여 사실에만 입각해 답하고 없는 내용은 절대 날조하지 말며, 만약 관련 정보가 Context에 전혀 명시되어 있지 않다면 반드시 다음의 폴백 공식 답변으로만 응답해라:
"${policy.fallback_answer}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            contents: [
              {
                role: "user",
                parts: [{ text: `[Context]\n${canonicalText}\n\n[User Question]\n${question}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1200
            }
          })
        });

        if (response.ok) {
          const apiData = await response.json();
          const generatedAnswer = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedAnswer) {
            return json({
              ok: true,
              type: "ai-answer",
              question,
              answer: generatedAnswer.trim(),
              confidence: 0.95,
              match: {
                id: "gemini-generative",
                question: "AI 자연어 탐색",
                category: "AI 자연어 답변"
              },
              related: matches.slice(0, 3).filter(m => m.score >= 1000).map(m => ({
                id: m.item.id,
                question: m.item.question,
                category: m.item.category,
                score: m.score
              })),
              sources: ["/content/canonical.md", `Gemini API (${apiModel})`],
              debug: {
                gemini_configured: true,
                gemini_model: apiModel,
                gemini_error: null,
                static_score: score,
                best_match: best ? best.item.question : null
              }
            }, corsHeaders);
          } else {
            apiErrorMsg = "Gemini API returned no text parts: " + JSON.stringify(apiData);
          }
        } else {
          const errText = await response.text().catch(() => "");
          apiErrorMsg = `Gemini API returned HTTP ${response.status}: ${errText}`;
        }
      } catch (aiError) {
        apiErrorMsg = `Gemini API fetch error: ${aiError.message || String(aiError)}`;
      }
      
      if (apiErrorMsg) {
        console.error("Gemini API call failed, falling back to static matching:", apiErrorMsg);
      }
    } else {
      apiErrorMsg = "GEMINI_API_KEY environment variable is missing or empty. Please check Cloudflare Pages settings and Redeploy.";
    }

    // Rule C: Standard Static Scored Matching (Fallback if Gemini is missing or fails)
    if (!best || score < 1000) {
      return json({
        ok: true,
        type: "fallback",
        question,
        answer: policy.fallback_answer,
        confidence: 0,
        department: department.name_ko,
        sources: ["/data/faq.json", "/data/answer_policy.json"],
        debug: {
          gemini_configured: !!apiKey,
          gemini_model: apiModel,
          gemini_error: apiErrorMsg,
          static_score: score,
          best_match: best ? best.item.question : null
        }
      }, corsHeaders);
    }

    let answer = best.item.answer;
    const isAdmissionQuery = ["정원", "수시", "정시", "논술", "수능", "최저", "dku", "지역균형", "모집"].some(k => question.toLowerCase().includes(k)) || best.item.category === "입학";
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
      sources: ["/data/faq.json", "/content/faq.md", "/llms.txt"],
      debug: {
        gemini_configured: !!apiKey,
        gemini_model: apiModel,
        gemini_error: apiErrorMsg,
        static_score: score,
        best_match: best ? best.item.question : null
      }
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

async function fetchAssetString(env, request, path) {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = "";
  const response = await env.ASSETS.fetch(url.toString());
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return await response.text();
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
