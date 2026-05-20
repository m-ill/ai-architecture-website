# GitHub + Cloudflare Pages 배포 가이드

## 1. GitHub 저장소 만들기

1. GitHub에서 새 저장소를 만든다.
2. 이 패키지의 전체 파일을 저장소에 올린다.
3. `public/assets/`에 최종 브로셔 이미지를 확인한다.
4. `public/data/*.json`을 열어 문의처와 도메인 placeholder를 수정한다.

## 2. Cloudflare Pages 연결

1. Cloudflare Dashboard → Workers & Pages → Create application → Pages
2. Connect to Git 선택
3. GitHub 저장소 선택
4. 설정값:
   - Framework preset: None
   - Build command: 없음
   - Build output directory: `public`
5. 배포한다.

## 3. 도메인 치환

배포 주소가 정해지면 다음 파일에서 `https://YOUR-DOMAIN.example`을 실제 주소로 바꾼다.

- `public/llms.txt`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/data/site.json`
- `public/schema/department.jsonld`

## 4. 테스트 URL

- `/`
- `/llms.txt`
- `/robots.txt`
- `/sitemap.xml`
- `/content/canonical.md`
- `/data/department.json`
- `/data/faq.json`
- `/api/health`
- `/api/ask?q=AI건축융합학과는 어떤 학과인가요?`

## 5. 검색/AI 노출 체크

- Google Search Console에 sitemap 제출
- Cloudflare Web Analytics 또는 서버 로그에서 Googlebot, OAI-SearchBot, Claude-SearchBot 접근 확인
- ChatGPT/Claude/Gemini에서 학과명으로 검색 테스트

## 6. 업데이트 기준

- 최종 모집요강이 나오면 admissions 관련 파일 전체 업데이트
- 교육과정 세부 교과목 확정 시 curriculum 파일 업데이트
- 공식 연락처 확정 시 site, index, FAQ 업데이트
- 브로셔 수정 시 assets 이미지 교체 및 Markdown/JSON 원문 동시 수정
