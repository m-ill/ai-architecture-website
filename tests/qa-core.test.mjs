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
