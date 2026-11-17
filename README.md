# 단국대학교 AI건축융합학과

기존 학과 자료를 보존한 정적 홈페이지 + Cloudflare Pages Functions 기반 학과 Q&A입니다.

건축 정보를 읽고, AI와 데이터로 판단·설계·개선하는 융합형 책임기술 인재 양성

## 실행

- `npm install`
- `npm test`: 위키·페이지 생성 및 검증
- `npm run dev:local`: API 키 없는 자료 안내 모드
- `npm run dev:secure`: 키를 숨김 입력으로 받아 학교 AI 연결 검증 후 로컬 미리보기 실행
- `npm run dev`: 기존 Wrangler 개발 서버

키는 파일이나 코드에 저장하지 않습니다. 로컬 기본 주소는 `http://127.0.0.1:8788`입니다.

## 콘텐츠 관리

학과 기본정보와 문의처는 `public/data/department.json`, 입학정보는 `public/data/admissions.json`, FAQ는 `public/data/faq.json`, 통합 원문은 `public/content/canonical.md`가 기준입니다. 교육·연구철학은 `public/content/education-philosophy.md`에 보존했습니다.

원본 수정 후 `npm run build`로 메인 페이지·위키·상세 가이드를 재생성합니다. 생성된 파일을 직접 수정하지 않습니다. 교수 사진·브로셔·프로젝트 자료는 기존 자산을 사용합니다.

[구축·운영·검증 안내](docs/REBUILD.md) · [이미지 생성 프롬프트](docs/image-generation-prompts.md)

## 배포

기존 Cloudflare Pages 프로젝트에서 Build command `npm run build`, output directory `public`, functions directory `functions`를 사용합니다. 학교 API 키는 프로젝트의 비밀 환경변수 `SCHOOL_AI_API_KEY`로 등록합니다. 키가 없으면 공식 자료 안내 모드로 동작합니다.

입학자료는 기존 자료 기준일을 표시합니다. 원서 접수 전 반드시 해당 학년도 최종 모집요강을 확인해야 합니다.
