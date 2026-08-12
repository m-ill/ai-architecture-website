import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  STATIC_ANSWER_SCORE,
  appendDisclaimers,
  buildModelContext,
  getDisclaimers,
  isAdmissionsQuestion,
  isLikelyDepartmentQuestion,
  scoreFaq
} from "../functions/_lib/qa-core.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const publicRoot = path.join(repoRoot, "public");
const faq = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "faq.json"), "utf8"));
const department = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "department.json"), "utf8"));
const facultyData = JSON.parse(fs.readFileSync(path.join(publicRoot, "data", "faculty.json"), "utf8"));
const canonicalText = fs.readFileSync(path.join(publicRoot, "content", "canonical.md"), "utf8");

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

test("admissions detection identifies admissions questions only", () => {
  for (const question of [
    "2027 수시 모집인원은 몇 명인가요?",
    "내신 몇 등급이면 되나요?",
    "원서 접수 일정 알려줘",
    "DKU인재 전형 지원자격은 무엇인가요?"
  ]) {
    assert.equal(isAdmissionsQuestion(question), true, question);
  }

  for (const question of [
    "대학원 진학은 가능한가요?",
    "교수 인원은 확정됐나요?",
    "교육 일정은 어떻게 되나요?",
    "건축사 시험 합격 방법을 알려주세요",
    "건축사 시험 합격 점수는 몇 점인가요?",
    "입학 전에 무엇을 공부해야 하나요?",
    "입학 후 어떤 과목을 배우나요?"
  ]) {
    assert.equal(isAdmissionsQuestion(question), false, question);
  }
});

test("unrelated questions no longer receive category baseline scores", () => {
  const weather = scoreFaq("오늘 날씨 어때?", faq)[0];
  const lunch = scoreFaq("점심 메뉴 추천해줘", faq)[0];

  assert.equal(weather.score, 0);
  assert.equal(isLikelyDepartmentQuestion("오늘 날씨 어때?"), false);
  assert.ok(lunch.score < STATIC_ANSWER_SCORE);
  assert.equal(isLikelyDepartmentQuestion("점심 메뉴 추천해줘"), false);
});

test("strong department questions route to the expected FAQ", () => {
  const professor = scoreFaq("교수 인원은 확정됐나요?", faq)[0];
  const bim = scoreFaq("BIM은 어떻게 배우나요?", faq)[0];
  const graduateSchool = scoreFaq("대학원 진학은 가능한가요?", faq)[0];
  const license = scoreFaq("건축사 시험 합격 방법", faq)[0];

  assert.equal(professor.item.id, "ops-002a");
  assert.ok(professor.score >= STATIC_ANSWER_SCORE);
  assert.equal(bim.item.id, "seo-tech-bim-001");
  assert.ok(bim.score >= STATIC_ANSWER_SCORE);
  assert.equal(graduateSchool.item.id, "career-009");
  assert.ok(graduateSchool.score >= 55);
  assert.equal(license.item.id, "diff-006");
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
  globalThis.fetch = async (_url, options) => {
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
      GEMINI_MODEL: "test-model"
    });

    assert.equal(result.type, "ai-answer");
    assert.equal(result.category, "교수진");
    assert.equal(result.related_url, "/#faculty");
    assert.equal(result.debug, undefined);
    assert.doesNotMatch(result.answer, /자랑스러운|거장|총괄/);

    assert.equal(requestBody.generationConfig.maxOutputTokens, 1200);
    assert.equal(requestBody.generationConfig.temperature, 0.2);
    assert.match(requestBody.contents[0].parts[0].text, /김종수/);
    assert.match(requestBody.contents[0].parts[0].text, /Relevant Faculty Data/);
    assert.match(requestBody.systemInstruction.parts[0].text, /이모지는 사용하지 않는다/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
