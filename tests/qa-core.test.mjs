import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  STATIC_ANSWER_SCORE,
  appendDisclaimers,
  buildModelContext,
  buildWikiFallbackAnswer,
  getDisclaimers,
  isAdmissionsQuestion,
  isProtectedAdmissionsQuestion,
  isClearlyOutOfScope,
  isLikelyDepartmentQuestion,
  scoreFaq
} from "../functions/_lib/qa-core.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const publicRoot = path.join(repoRoot, "public");
const faq = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "faq.json"), "utf8"));
const department = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "department.json"), "utf8"));
const admissionsData = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "admissions.json"), "utf8"));
const facultyData = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "faculty.json"), "utf8"));
const peopleProjects = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "people-projects.json"), "utf8"));
const curriculumPlan = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "curriculum-plan.json"), "utf8"));
const curriculumCourseDetails = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "curriculum-course-details.json"), "utf8"));
const canonicalText = fs.readFileSync(path.join(publicRoot, "content", "canonical.md"), "utf8");
const wikiText = fs.readFileSync(path.join(publicRoot, "content", "llm-wiki.md"), "utf8");

async function loadAskModule() {
  const askPath = path.join(repoRoot, "functions", "api", "ask.js");
  const coreUrl = pathToFileURL(path.join(repoRoot, "functions", "_lib", "qa-core.mjs")).href;
  const source = fs.readFileSync(askPath, "utf8")
    .replace("../_lib/qa-core.mjs", coreUrl);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

function createAssetsBinding() {
  return {
    async fetch(input) {
      const url = new URL(input);
      const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const filePath = path.resolve(publicRoot, relativePath);
      if (!filePath.startsWith(publicRoot) || !fs.existsSync(filePath)) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(fs.readFileSync(filePath), { status: 200 });
    }
  };
}

async function ask(question, envOverrides = {}) {
  const { onRequest } = await loadAskModule();
  const request = new Request("https://example.test/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  const response = await onRequest({
    request,
    env: { ASSETS: createAssetsBinding(), ...envOverrides }
  });
  assert.equal(response.status, 200);
  return response.json();
}

test("FAQ identifiers are unique", () => {
  assert.equal(new Set(faq.map(item => item.id)).size, faq.length);
});

test("curriculum plan and course details cover the same 30 draft courses", () => {
  const planCourses = curriculumPlan.years.flatMap(year =>
    year.semesters.flatMap(semester => semester.courses)
  );
  const detailCourses = curriculumCourseDetails.courses;
  const planIds = planCourses.map(course => course.id).sort();
  const detailIds = detailCourses.map(course => course.id).sort();

  assert.equal(planCourses.length, 30);
  assert.equal(detailCourses.length, 30);
  assert.equal(new Set(planIds).size, 30);
  assert.equal(new Set(detailIds).size, 30);
  assert.deepEqual(detailIds, planIds);
  assert.match(curriculumPlan.notice, /검토|심의|변경/);
  assert.match(curriculumCourseDetails.meta.source_note, /검토 중|1차 제안/);

  for (const course of detailCourses) {
    assert.ok(course.subtitle, course.id);
    assert.ok(course.card, course.id);
    assert.ok(course.detail.length >= 2, course.id);
    assert.ok(course.objectives.length >= 3, course.id);
    assert.ok(course.topics.length >= 3, course.id);
    assert.ok(course.activities.length >= 2, course.id);
    assert.ok(course.ai_role.length >= 2, course.id);
    assert.ok(course.student_role.length >= 2, course.id);
    assert.ok(course.outputs.length >= 2, course.id);
  }
});

test("all seven participating people have two credited project images", () => {
  const facultyIds = [
    ...facultyData.faculty.map(person => person.id),
    ...facultyData.industry_experts.map(person => person.id)
  ].sort();
  const projectPeopleIds = peopleProjects.people.map(person => person.id).sort();

  assert.equal(peopleProjects.people.length, 7);
  assert.deepEqual(projectPeopleIds, facultyIds);

  for (const person of peopleProjects.people) {
    assert.equal(person.projects.length, 2, person.id);
    for (const project of person.projects) {
      const relativeImagePath = project.imageCandidate.replace(/^\/+/, "");
      assert.ok(fs.existsSync(path.join(publicRoot, relativeImagePath)), project.imageCandidate);
      assert.ok(project.credit, `${person.id}: ${project.name}`);
      assert.match(project.sourceUrl, /^https:\/\//, `${person.id}: ${project.name}`);
      assert.equal(project.imageStatus, "provided_research_material");
    }
  }
});

test("admissions detection identifies admissions questions only", () => {
  for (const question of [
    "2027 수시 모집인원은 몇 명인가요?",
    "내신 몇 등급이면 되나요?",
    "원서 접수 일정 알려줘",
    "DKU인재 전형 지원자격은 무엇인가요?",
    "진학 상담을 받고 싶어요",
    "지원 방법이 궁금해요",
    "편입가능한가요?",
    "전과 가능한가요?"
  ]) {
    assert.equal(isAdmissionsQuestion(question), true, question);
  }

  for (const question of [
    "대학원 진학은 가능한가요?",
    "교수 인원은 확정됐나요?",
    "교육 일정은 어떻게 되나요?",
    "건축사 시험 합격 방법을 알려주세요",
    "건축사 시험 합격 점수는 몇 점인가요?",
    "프로그래밍 경험이 없어도 지원할 수 있나요?",
    "입학 전에 무엇을 공부해야 하나요?",
    "입학 후 어떤 과목을 배우나요?"
  ]) {
    assert.equal(isAdmissionsQuestion(question), false, question);
  }

  for (const question of [
    "내신 몇 등급이면 되나요?",
    "2027 수시 모집인원은 몇 명인가요?",
    "DKU인재 전형 지원자격은 무엇인가요?",
    "원서 접수 일정 알려줘"
  ]) {
    assert.equal(isProtectedAdmissionsQuestion(question), true, question);
  }

  for (const question of [
    "편입가능한가요?",
    "전과 가능한가요?",
    "지원 방법이 궁금해요",
    "코딩 몰라도 지원할 수 있나요?"
  ]) {
    assert.equal(isProtectedAdmissionsQuestion(question), false, question);
  }
});

test("unrelated questions no longer receive category baseline scores", () => {
  const weather = scoreFaq("오늘 날씨 어때?", faq)[0];
  const lunch = scoreFaq("점심 메뉴 추천해줘", faq)[0];

  assert.equal(weather.score, 0);
  assert.equal(isLikelyDepartmentQuestion("오늘 날씨 어때?"), false);
  assert.ok(lunch.score < STATIC_ANSWER_SCORE);
  assert.equal(isLikelyDepartmentQuestion("점심 메뉴 추천해줘"), false);
  assert.equal(isClearlyOutOfScope("오늘 날씨 어때?"), true);
  assert.equal(isClearlyOutOfScope("점심 메뉴 추천해줘"), true);
  assert.equal(isClearlyOutOfScope("어떤 거 배우는 거예요?"), false);
});

test("LLM Wiki covers common conversational department questions", () => {
  assert.match(wikiText, /건축 정보를 읽고, AI와 데이터로 판단·설계·개선하는 융합형 책임기술 인재 양성/);
  assert.match(wikiText, /## 무엇을 배우나요\?/);
  assert.match(wikiText, /## 코딩은 얼마나, 어떻게 배우나요\?/);
  assert.match(wikiText, /## 입학 질문은 어디까지 답하나요\?/);
  assert.match(wikiText, /## 편입할 수 있나요\?/);
  assert.match(wikiText, /## 전과·다전공이 가능한가요\?/);
  assert.match(wikiText, /## 입학 상담은 어디로 문의하나요\?/);

  const learning = buildWikiFallbackAnswer("어떤 거 배우는 거예요?", wikiText);
  assert.equal(learning.matchedId, "wiki-learning");
  assert.match(learning.answer, /자연어코딩과 건축데이터분석/);

  const difficulty = buildWikiFallbackAnswer("수업이 어렵나요?", wikiText);
  assert.equal(difficulty.matchedId, "wiki-preparation");
  assert.match(difficulty.answer, /입학 전부터 전문적으로/);

  const coding = buildWikiFallbackAnswer("코딩 배워야해요?", wikiText);
  assert.equal(coding.matchedId, "wiki-coding");
  assert.match(coding.answer, /코드 자체를 깊게 만드는 것이 목표는 아닙니다/);
  assert.match(coding.answer, /입학 전에 코딩을 잘해야 하는 것은 아닙니다/);
  assert.doesNotMatch(coding.answer, /짧은 질문은/);

  const career = buildWikiFallbackAnswer("졸업하면 뭐해요?", wikiText);
  assert.equal(career.matchedId, "wiki-career");
  assert.match(career.answer, /BIM·디지털트윈 엔지니어/);

  const transfer = buildWikiFallbackAnswer("편입가능한가요?", wikiText);
  assert.equal(transfer.matchedId, "wiki-transfer");
  assert.match(transfer.answer, /편입학 모집요강에 AI건축융합학과가 모집단위로 포함되는지/);
  assert.doesNotMatch(transfer.answer, /어떤 점이 궁금한지 조금만 더/);
});

test("prospective student harness keeps readiness questions in scope", () => {
  for (const question of [
    "코딩 몰라도 되나요?",
    "프로그래밍 경험이 없어도 지원할 수 있나요?",
    "건축을 배운 적 없어도 괜찮나요?",
    "문과인데 따라갈 수 있나요?",
    "진학 상담을 받고 싶어요",
    "수학에 자신 없어도 괜찮을까요?",
    "편입가능한가요?",
    "전과 가능한가요?"
  ]) {
    assert.equal(isLikelyDepartmentQuestion(question), true, question);
  }

  assert.equal(isLikelyDepartmentQuestion("오늘 날씨 몰라도 괜찮나요?"), false);
});

test("strong department questions route to the expected FAQ", () => {
  const professor = scoreFaq("교수 인원은 확정됐나요?", faq)[0];
  const bim = scoreFaq("BIM은 어떻게 배우나요?", faq)[0];
  const graduateSchool = scoreFaq("대학원 진학은 가능한가요?", faq)[0];
  const license = scoreFaq("건축사 시험 합격 방법", faq)[0];
  const colloquialLicense = scoreFaq("건축사 딸 수 있어요?", faq)[0];
  const noCodingBackground = scoreFaq("코딩 몰라도 되나요?", faq)[0];
  const humanitiesStudent = scoreFaq("문과인데 따라갈 수 있나요?", faq)[0];
  const transfer = scoreFaq("편입가능한가요?", faq)[0];

  assert.equal(professor.item.id, "ops-002a");
  assert.ok(professor.score >= STATIC_ANSWER_SCORE);
  assert.equal(bim.item.id, "seo-tech-bim-001");
  assert.ok(bim.score >= STATIC_ANSWER_SCORE);
  assert.equal(graduateSchool.item.id, "career-009");
  assert.ok(graduateSchool.score >= 55);
  assert.equal(license.item.id, "diff-006");
  assert.equal(colloquialLicense.item.id, "diff-006");
  assert.ok(colloquialLicense.score >= STATIC_ANSWER_SCORE);
  assert.equal(noCodingBackground.item.id, "fit-004");
  assert.ok(noCodingBackground.score >= STATIC_ANSWER_SCORE);
  assert.equal(humanitiesStudent.item.id, "seo-student-001");
  assert.ok(humanitiesStudent.score >= STATIC_ANSWER_SCORE);
  assert.equal(transfer.item.id, "admissions-transfer-001");
  assert.ok(transfer.score >= STATIC_ANSWER_SCORE);
});

test("the default generative model is Gemini 3.7 Flash", async () => {
  const { DEFAULT_GEMINI_MODEL, resolveGeminiModel } = await loadAskModule();
  assert.equal(DEFAULT_GEMINI_MODEL, "gemini-3.7-flash");
  assert.equal(resolveGeminiModel("gemini-3.7-flash"), "gemini-3.7-flash");
  assert.equal(resolveGeminiModel("gemini-3.5-flash"), "gemini-3.5-flash");
});

test("disclaimers depend on the user intent and are not duplicated", () => {
  assert.deepEqual(getDisclaimers("오늘 날씨 어때?", "안내"), []);
  assert.equal(getDisclaimers("졸업 후 진로가 궁금해요", "진로")[0].id, "career");
  assert.equal(getDisclaimers("건축사 자격이 나오나요?", "학과 비교")[0].id, "license");

  const answer = "취업을 보장하는 것은 아니며 개인별 준비가 필요합니다.";
  const result = appendDisclaimers(answer, getDisclaimers("졸업 후 진로", "진로"));
  assert.equal(result, answer);
});

test("named faculty context is scoped and neutral", () => {
  const matches = scoreFaq("김종호 대표 프로젝트는 무엇인가요?", faq);
  const context = buildModelContext({
    question: "김종호 대표 프로젝트는 무엇인가요?",
    matches,
    department,
    facultyData,
    admissionsData,
    canonicalText
  });

  assert.match(context, /김종호/);
  assert.doesNotMatch(context, /정란/);
  assert.doesNotMatch(context, /초일류|최고 권위자/);
  assert.match(context, /건축 정보를 읽고, AI와 데이터로 판단·설계·개선하는 융합형 책임기술 인재 양성/);
});

test("worker returns safe static and fallback answers without Gemini", async () => {
  const identity = await ask("AI건축융합학과는 어떤 학과인가요?");
  assert.equal(identity.type, "answer");
  assert.equal(identity.matched_id, "identity-001");

  for (const [question, expectedId, answerPattern] of [
    ["어떤거 배우는거에요?", "wiki-learning", /자연어코딩과 건축데이터분석/],
    ["코딩 배워야해요?", "wiki-coding", /건축 데이터를 정리·분석/],
    ["뭘 배우나요?", "wiki-learning", /BIM·CAD·CIM/],
    ["여기 뭐하는 곳이에요?", "wiki-identity", /AI건축융합학과는 건축 정보를 읽고/],
    ["졸업하면 뭐해요?", "wiki-career", /건축 데이터 분석/],
    ["수업이 어렵나요?", "wiki-preparation", /기초부터 배우는 흐름/]
  ]) {
    const result = await ask(question);
    assert.equal(result.type, "wiki-answer", question);
    assert.equal(result.matched_id, expectedId, question);
    assert.match(result.answer, answerPattern, question);
    assert.notEqual(result.type, "fallback", question);
    assert.ok(result.sources.includes("/content/llm-wiki.md"), question);
  }

  const weather = await ask("오늘 날씨 어때?");
  assert.equal(weather.type, "fallback");
  assert.equal(weather.confidence, 0);
  assert.doesNotMatch(weather.answer, /취업.*보장/);

  const graduateSchool = await ask("대학원 진학은 가능한가요?");
  assert.notEqual(graduateSchool.type, "admissions-redirect");
  assert.equal(graduateSchool.matched_id, "career-009");

  const professor = await ask("교수 인원은 확정됐나요?");
  assert.notEqual(professor.type, "admissions-redirect");
  assert.equal(professor.matched_id, "ops-002a");
  assert.doesNotMatch(professor.answer, /최고 권위|총괄|초일류/);

  const preparation = await ask("입학 전에 무엇을 공부해야 하나요?");
  assert.notEqual(preparation.type, "admissions-redirect");
  assert.equal(preparation.matched_id, "seo-student-001");

  const afterAdmission = await ask("입학 후 어떤 과목을 배우나요?");
  assert.notEqual(afterAdmission.type, "admissions-redirect");
  assert.equal(afterAdmission.matched_id, "cur-005");

  const colloquialLicense = await ask("건축사 딸 수 있어요?");
  assert.equal(colloquialLicense.type, "answer");
  assert.equal(colloquialLicense.matched_id, "diff-006");
  assert.match(colloquialLicense.answer, /졸업하는 것만으로.*자동으로 주어지는 과정은 아닙니다/);
  assert.match(colloquialLicense.answer, /건축학교육 인증|실무수련/);

  const noCodingBackground = await ask("코딩 몰라도 되나요?");
  assert.equal(noCodingBackground.type, "answer");
  assert.equal(noCodingBackground.matched_id, "fit-004");
  assert.match(noCodingBackground.answer, /코딩을 몰라도 지원할 수/);

  const humanitiesStudent = await ask("문과인데 따라갈 수 있나요?");
  assert.equal(humanitiesStudent.type, "answer");
  assert.equal(humanitiesStudent.matched_id, "seo-student-001");

  const noProgrammingExperience = await ask("프로그래밍 경험이 없어도 지원할 수 있나요?");
  assert.equal(noProgrammingExperience.type, "answer");
  assert.equal(noProgrammingExperience.matched_id, "fit-004");

  for (const [question, expectedId] of [
    ["트랙은 몇 개인가요?", "area-001"],
    ["4년 동안 무엇을 배우나요?", "cur-001"],
    ["코딩을 못해도 괜찮나요?", "cur-006"],
    ["수학을 잘해야 하나요?", "cur-007"],
    ["학과는 어디에 있나요?", "ops-006"],
    ["등록금은 얼마인가요?", "ops-007"],
    ["장학금이 있나요?", "ops-008"]
  ]) {
    const result = await ask(question);
    assert.equal(result.matched_id, expectedId, question);
  }

  const admissions = await ask("2027 수시 모집인원은 몇 명인가요?");
  assert.equal(admissions.type, "admissions-answer");
  assert.match(admissions.answer, /수시 모집인원은 12명/);
  assert.match(admissions.answer, /지역균형선발: 3명/);
  assert.match(admissions.answer, /DKU인재\(서류형\): 3명/);
  assert.equal(admissions.related_url, "https://ipsi.dankook.ac.kr/jukjeon/doumi/mojip.html?bbsid=juk_paper&ctg_cd=01");
  assert.ok(admissions.sources.length >= 2);
  assert.doesNotMatch(admissions.answer, /[😊📌🌐☎📋🎓]/u);

  const admissionsGuidance = await ask("내신 몇 등급이면 되나요?");
  assert.equal(admissionsGuidance.type, "admissions-guidance");
  assert.match(admissionsGuidance.answer, /단정할 수 없습니다/);
  assert.match(admissionsGuidance.answer, /031-8005-2550~3/);
  assert.ok(admissionsGuidance.sources.length >= 2);

  const transferGuidance = await ask("편입가능한가요?");
  assert.equal(transferGuidance.type, "answer");
  assert.equal(transferGuidance.matched_id, "admissions-transfer-001");
  assert.match(transferGuidance.answer, /편입학 모집요강에 AI건축융합학과가 모집단위로 포함되는지/);
  assert.doesNotMatch(transferGuidance.answer, /어떤 점이 궁금한지 조금만 더/);
  assert.equal(transferGuidance.related_url, "https://ipsi.dankook.ac.kr/jukjeon/doumi/mojip.html?bbsid=juk_paper&ctg_cd=05");

  const counselingGuidance = await ask("진학 상담을 받고 싶어요");
  assert.equal(counselingGuidance.type, "wiki-answer");
  assert.equal(counselingGuidance.matched_id, "wiki-admissions-contact");
  assert.match(counselingGuidance.answer, /031-8005-2550~3/);

  const facultyProject = await ask("김종호 대표 프로젝트는 무엇인가요?");
  assert.equal(facultyProject.type, "answer");
  assert.equal(facultyProject.matched_id, "faculty-kim-jongho");
  assert.equal(facultyProject.category, "교수진");
  assert.equal(facultyProject.related_url, "/#faculty");
  assert.match(facultyProject.answer, /롯데월드타워/);
  assert.doesNotMatch(facultyProject.answer, /은탑산업훈장|최고 권위|총괄|초일류/);
});

test("worker sends a grounded project prompt to Gemini", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  let requestUrl;
  let requestHeaders;
  globalThis.fetch = async (url, options) => {
    requestUrl = String(url);
    requestHeaders = new Headers(options.headers);
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: "자료에는 김종호 대표의 롯데월드타워 피어리뷰 검토 참여가 소개되어 있습니다." }]
        }
      }]
    }), { headers: { "Content-Type": "application/json" } });
  };

  try {
    const result = await ask("대공간 구조 전문가의 프로젝트를 소개해 주세요", {
      GEMINI_API_KEY: "test-key",
      GEMINI_MODEL: "gemini-3.7-flash"
    });

    assert.equal(result.type, "ai-answer");
    assert.equal(result.category, "교수진");
    assert.equal(result.related_url, "/#faculty");
    assert.equal(result.debug, undefined);
    assert.equal(result.ai.status, "generated");
    assert.equal(result.ai.model, "gemini-3.7-flash");
    assert.doesNotMatch(result.answer, /자랑스러운|거장|총괄/);

    assert.match(requestUrl, /models\/gemini-3\.7-flash:generateContent$/);
    assert.doesNotMatch(requestUrl, /[?&]key=/);
    assert.equal(requestHeaders.get("x-goog-api-key"), "test-key");
    assert.equal(requestBody.generationConfig.maxOutputTokens, 2048);
    assert.equal("temperature" in requestBody.generationConfig, false);
    assert.match(requestBody.contents[0].parts[0].text, /김종수/);
    assert.match(requestBody.contents[0].parts[0].text, /Relevant Faculty Data/);
    assert.match(requestBody.contents[0].parts[0].text, /Primary LLM Wiki/);
    assert.match(requestBody.contents[0].parts[0].text, /어떤 거 배워요/);
    assert.match(requestBody.systemInstruction.parts[0].text, /이모지는 사용하지 않는다/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Gemini is the primary responder for ordinary high-confidence questions", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: "코딩은 건축 데이터를 분석하고 BIM·디지털트윈 작업을 자동화하는 도구로 기초부터 배웁니다. 입학 전에 코딩을 잘해야 하는 것은 아닙니다."
          }]
        }
      }]
    }), { headers: { "Content-Type": "application/json" } });
  };

  try {
    const result = await ask("코딩 몰라도 되나요?", {
      GEMINI_API_KEY: "test-key"
    });

    assert.equal(requestCount, 1);
    assert.equal(result.type, "ai-answer");
    assert.equal(result.matched_id, "gemini-grounded");
    assert.equal(result.ai.model, "gemini-3.7-flash");
    assert.match(result.answer, /입학 전에 코딩을 잘해야 하는 것은 아닙니다/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Gemini receives grounded transfer guidance and answers transfer questions first", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestCount += 1;
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: "편입 지원 가능 여부는 지원 학년도의 편입학 모집요강에 AI건축융합학과가 모집단위로 포함되는지에 따라 확정됩니다. 현재는 2027년 신설 학과이므로 향후 모집 시기와 인원을 단정할 수 없으며, 모집단위 포함 여부와 일반편입·학사편입 지원자격을 확인해 주세요."
          }]
        }
      }]
    }), { headers: { "Content-Type": "application/json" } });
  };

  try {
    const result = await ask("편입가능한가요?", {
      GEMINI_API_KEY: "test-key"
    });

    assert.equal(requestCount, 1);
    assert.equal(result.type, "ai-answer");
    assert.equal(result.matched_id, "gemini-grounded");
    assert.equal(result.ai.status, "generated");
    assert.equal(result.category, "편입학 안내");
    assert.match(result.answer, /모집단위로 포함되는지/);
    assert.match(requestBody.contents[0].parts[0].text, /\[Relevant Admissions Data\]/);
    assert.match(requestBody.contents[0].parts[0].text, /official_transfer_guide_url/);
    assert.match(requestBody.systemInstruction.parts[0].text, /단순히 "모집요강을 확인하세요"로 끝내거나/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
