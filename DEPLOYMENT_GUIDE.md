# 배포 안내

기존 GitHub + Cloudflare Pages 구조를 유지합니다.

1. `npm install` 후 `npm test`를 실행합니다.
2. Cloudflare Pages Build command: `npm run build`
3. Build output directory: `public`, Functions directory: `functions`
4. 비밀 환경변수: `SCHOOL_AI_API_KEY`
5. 선택 환경변수: `SCHOOL_AI_BASE_URL`, `SCHOOL_AI_MODEL` (기본 `local/qwen3.8-flash`)
6. 공개 운영 시 `/api/ask`에 분산 rate limit을 적용합니다.
7. 배포 환경에서 학교 API 접근, 실제 답변과 근거 링크를 확인합니다.

키를 Git·정적 파일·명령 인수에 넣지 않습니다. 키가 없거나 API 장애가 있으면 FAQ/위키 원문 답변으로 동작합니다. 입학 수치와 기준일은 원본 자료를 재확인합니다.

세부 사항은 [재구축 운영 문서](docs/REBUILD.md)를 참고하세요.

배포 파일 준비: npm run package:pages. 최신 업로드 폴더는 output/releases/latest.json의 site 값입니다. 컴파일된 _worker.js와 _routes.json을 포함하며, 실제 게시 전 Cloudflare 로그인이 필요합니다. 학교 AI 키는 업로드 파일에 포함하지 않고 기존 프로젝트의 암호화된 환경변수를 사용합니다.
