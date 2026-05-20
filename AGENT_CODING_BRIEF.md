# AI 에이전트 코딩 작업 계획

## 0. 목표

GitHub 저장소를 Cloudflare Pages에 연결해 AI건축융합학과 홍보 페이지를 만든다. 사람은 웹페이지로 보고, AI는 `llms.txt`, `sitemap.xml`, `robots.txt`, JSON 데이터, Markdown 원문, `/api/ask` 엔드포인트를 통해 읽을 수 있어야 한다.

## 1. 1차 구현 범위

### 반드시 구현

- 반응형 랜딩페이지
- 학과소개 섹션
- 교육 핵심 섹션
- 4년 로드맵 섹션
- 2개 심화 교육축 섹션
- 졸업 후 진로 섹션
- 입학정보 요약 섹션
- FAQ 섹션
- “AI건축융합학과에 물어보기” 입력창
- `/api/ask` API
- `llms.txt`, `robots.txt`, `sitemap.xml`
- JSON-LD 구조화 데이터

### 처음에는 하지 말 것

- 벡터DB RAG
- 로그인 기능
- 관리자 페이지
- LLM API 키 연동
- MCP 정식 서버

## 2. 권장 기술스택

- 정적 페이지: HTML/CSS/Vanilla JS 또는 Astro/React 중 하나
- 배포: Cloudflare Pages
- 동적 API: Cloudflare Pages Functions
- 데이터: `public/data/*.json`
- AI 안내: `public/llms.txt`, `public/content/canonical.md`

## 3. 구현 순서

1. `public/data/*.json`이 정상 JSON인지 확인한다.
2. `public/index.html`을 디자인 개선한다.
3. FAQ 데이터를 읽어 FAQ 리스트를 자동 렌더링한다.
4. `/api/ask`가 질문을 받고 FAQ 기반 답변을 반환하는지 확인한다.
5. 입학 관련 질문에는 항상 최종 모집요강 확인 문구를 붙인다.
6. `sitemap.xml`, `robots.txt`, `llms.txt`의 도메인을 실제 주소로 바꾼다.
7. Cloudflare Pages에 GitHub 저장소를 연결한다.
8. 배포 후 `/`, `/llms.txt`, `/sitemap.xml`, `/robots.txt`, `/api/health`, `/api/ask?q=...`를 테스트한다.

## 4. 품질 기준

- 모바일에서 먼저 읽기 쉬워야 한다.
- 수험생 기준으로 문장이 짧고 명확해야 한다.
- AI가 이미지를 읽지 않아도 모든 핵심정보를 텍스트로 읽을 수 있어야 한다.
- 모든 핵심정보는 Markdown과 JSON에 중복 제공되어야 한다.
- 미확정 정보는 확정처럼 말하면 안 된다.

## 5. 나중에 확장할 것

- Cloudflare AI Search 또는 NLWeb 템플릿 연동
- `/mcp` 엔드포인트 추가
- OpenAI/Gemini/Claude용 공식 커넥터 검토
- FAQ 검색에 한국어 임베딩 또는 LLM reranking 적용
- 관리자용 FAQ 수정 UI 추가
