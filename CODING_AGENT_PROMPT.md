# 코딩 에이전트에게 줄 프롬프트

너는 AI건축융합학과 홍보용 NLWeb-lite 웹사이트를 구현하는 프론트엔드/서버리스 개발자다.

## 목표

GitHub 저장소를 Cloudflare Pages에 배포할 수 있게 만들고, 사람이 보는 학과 홈페이지와 AI가 읽는 지식 엔드포인트를 함께 구현하라.

## 현재 저장소 구조

- `public/`: 정적 사이트 루트
- `public/data/*.json`: 학과 핵심정보, FAQ, 교육과정, 진로, 입학정보
- `public/content/*.md`: AI와 검색엔진이 읽을 Markdown 원문
- `public/llms.txt`: AI 안내파일
- `public/robots.txt`: 접근정책
- `public/sitemap.xml`: 검색엔진 안내
- `functions/api/ask.js`: Cloudflare Pages Function

## 요구사항

1. Cloudflare Pages 설정은 Build output directory를 `public`으로 쓸 수 있어야 한다.
2. `/api/ask`는 GET `?q=`와 POST `{ "question": "..." }`를 모두 지원해야 한다.
3. `/api/ask`는 `public/data/faq.json`을 기준으로 가장 알맞은 답을 반환해야 한다.
4. 입학 카테고리 답변에는 반드시 최종 모집요강 확인 안내를 포함해야 한다.
5. 랜딩페이지에는 다음 섹션을 포함해야 한다.
   - Hero
   - 학과 기본정보
   - 학과소개
   - 왜 지금 AI건축융합학과인가
   - 교육 핵심 3가지
   - 4년 로드맵
   - 2개 심화 교육축
   - 학생이 배우는 내용
   - 졸업 후 진로
   - 입학정보 요약
   - FAQ
   - AI건축융합학과에 물어보기
6. 이미지 안의 텍스트에 의존하지 말고, 모든 핵심정보를 HTML 텍스트로 렌더링해야 한다.
7. `https://YOUR-DOMAIN.example`은 실제 배포 도메인으로 교체할 수 있게 유지하거나 환경변수/설정값으로 처리하라.
8. 외부 LLM API는 붙이지 않는다. 첫 버전은 FAQ 기반 deterministic answer로 충분하다.
9. 디자인은 파란색/흰색 계열의 학과 브로셔 분위기를 유지하되, 접근성을 위해 글자 대비와 모바일 가독성을 확보하라.
10. README에 Cloudflare Pages 배포 절차를 정리하라.

## 답변 정책

- 학과 정체성: “건축 정보를 읽고, AI와 데이터로 판단·설계·개선”으로 설명한다.
- “AI 도구만 배우는 학과”라고 오해하지 않게 설명한다.
- 입학정보는 2027학년도 시행계획 기준이라고 말한다.
- 최종 모집요강 확인 문구를 누락하지 않는다.
- 교수진, 세부 과목명, 연락처, 자격·면허 요건은 공식 확정 전까지 단정하지 않는다.
- 회사명은 진출 가능 예시로만 표현하고 취업 보장처럼 쓰지 않는다.

## 완료 기준

- `npm run check:json` 통과
- `/` 접속 가능
- `/llms.txt` 접속 가능
- `/robots.txt` 접속 가능
- `/sitemap.xml` 접속 가능
- `/data/faq.json` 접속 가능
- `/api/health` 응답 가능
- `/api/ask?q=졸업 후 진로는?` 응답 가능
- 모바일 폭 390px에서 주요 섹션이 깨지지 않음
