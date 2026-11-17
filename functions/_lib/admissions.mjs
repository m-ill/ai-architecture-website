export function buildAdmissionsResponse(question, admissions) {
  const officialGuideUrl = admissions?.official_susi_guide_url ||
    "https://ipsi.dankook.ac.kr/jukjeon/doumi/mojip.html?bbsid=juk_paper&ctg_cd=01";
  const admissionsUrl = admissions?.official_admissions_url || "https://ipsi.dankook.ac.kr/jukjeon/main.html";
  const transferGuideUrl = admissions?.official_transfer_guide_url ||
    "https://ipsi.dankook.ac.kr/jukjeon/doumi/mojip.html?bbsid=juk_paper&ctg_cd=05";
  const phone = admissions?.admissions_phone || "031-8005-2550~3";
  const rows = Array.isArray(admissions?.admission_breakdown_regular)
    ? admissions.admission_breakdown_regular
    : [];
  const normalized = String(question || "").toLowerCase().replace(/\s+/g, "");
  const asksForCount = /(모집인원|선발인원|모집정원|정원|몇명|몇 명|인원|뽑)/u.test(question);

  if (/편입/u.test(normalized)) {
    return {
      ok: true,
      type: "admissions-guidance",
      question,
      answer: `편입 지원 가능 여부는 **지원하려는 학년도의 편입학 모집요강에 AI건축융합학과가 모집단위로 포함되는지**로 확정됩니다. 이 학과는 2027년 신설 학과이므로 현재 공개된 신입학 자료만으로 편입생 모집 시기나 인원을 단정할 수 없습니다.\n\n모집요강에서 학과 포함 여부, 일반편입·학사편입 구분, 전적대학 수료·학점 요건, 전형방법을 확인해 주세요. 학과가 해당 연도 편입 모집단위에 포함되면 그 요강에 따라 지원할 수 있습니다.\n\n- 단국대학교 죽전캠퍼스 편입학 모집요강: ${transferGuideUrl}\n- 단국대학교 입학팀: ${phone}`,
      confidence: 1,
      matched_id: "admissions-transfer-guidance",
      category: "편입학 안내",
      related_url: transferGuideUrl,
      related_questions: ["일반편입과 학사편입은 어떻게 다른가요?", "편입 모집단위는 어디서 확인하나요?"],
      disclaimer: "편입학 모집단위, 인원과 지원자격은 해당 학년도의 최종 편입학 모집요강을 확인해야 합니다.",
      sources: ["/data/admissions.json", "/content/llm-wiki.md", transferGuideUrl]
    };
  }

  if (asksForCount && rows.length > 0) {
    const namedRow = rows.find(row => normalized.includes(String(row.name || "").toLowerCase().replace(/\s+/g, ""))) ||
      (normalized.includes("dku인재") ? rows.find(row => row.name.includes("DKU인재")) : null) ||
      (normalized.includes("지역균형") ? rows.find(row => row.name.includes("지역균형")) : null) ||
      (normalized.includes("기회균형") ? rows.find(row => row.name.includes("기회균형")) : null) ||
      (normalized.includes("사회적배려") ? rows.find(row => row.name.includes("사회적배려")) : null) ||
      (normalized.includes("논술") ? rows.find(row => row.name.includes("논술")) : null);
    const period = normalized.includes("수시") ? "수시" : normalized.includes("정시") ? "정시" : null;
    const selectedRows = namedRow ? [namedRow] : period ? rows.filter(row => row.period === period) : rows;
    const total = selectedRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const label = namedRow ? namedRow.name : period || "정원내 전체";
    const breakdown = selectedRows
      .map(row => `- ${row.period} ${row.name}: ${row.count}명`)
      .join("\n");
    const basis = selectedRows.every(row => row.period === "수시")
      ? "2027학년도 수시 신입생 모집요강 기준"
      : selectedRows.every(row => row.period === "정시")
        ? "2027학년도 대학입학전형시행계획 기준"
        : "수시는 2027학년도 수시 모집요강, 정시는 대학입학전형시행계획 기준";
    const caution = selectedRows.some(row => row.period === "정시")
      ? "정시 인원은 수시 이월 등에 따라 달라질 수 있으므로 원서 접수 전 최종 정시 모집요강을 확인해 주세요."
      : "지원자격과 평가방법 등 세부사항은 원서 접수 전 최종 수시 모집요강을 확인해 주세요.";

    return {
      ok: true,
      type: "admissions-answer",
      question,
      answer: `AI건축융합학과의 **${label} 모집인원은 ${total}명**입니다.\n\n${breakdown}\n\n${basis}입니다. ${caution}`,
      confidence: 1,
      matched_id: "admissions-counts",
      category: "입학 안내",
      related_url: officialGuideUrl,
      related_questions: ["수시 전형별 모집인원은 어떻게 되나요?", "정시는 몇 명을 선발하나요?", "입학 상담은 어디로 문의하나요?"],
      disclaimer: caution,
      sources: ["/data/admissions.json", officialGuideUrl]
    };
  }

  return {
    ok: true,
    type: "admissions-guidance",
    question,
    answer: `합격 가능 점수·등급, 지원자격, 원서접수 일정은 질문만으로 단정할 수 없습니다. 2027학년도 최종 모집요강에서 해당 전형의 기준을 확인해 주세요.\n\n- 단국대학교 입학안내: ${admissionsUrl}\n- 단국대학교 입학팀(죽전캠퍼스): ${phone}`,
    confidence: 1,
    matched_id: "admissions-guidance",
    category: "입학 안내",
    related_url: officialGuideUrl,
    related_questions: ["수시 전형별 모집인원은 어떻게 되나요?", "AI건축융합학과 모집정원은 몇 명인가요?"],
    disclaimer: "입학 관련 세부사항은 원서 접수 전 단국대학교 입학처의 최종 모집요강을 확인해야 합니다.",
    sources: ["/data/admissions.json", officialGuideUrl]
  };
}
