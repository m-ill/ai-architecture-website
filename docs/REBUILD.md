# 학과 홈페이지 재구축

## 원본과 생성물

- 학과 정체성·현재 문의처: `public/data/department.json`
- 입학 수치·전형: `public/data/admissions.json` (자료 기준일 보존, 최종 모집요강 확인)
- 검토된 FAQ: `public/data/faq.json`
- 통합 원문: `public/content/canonical.md`
- 교육·연구철학: `public/content/education-philosophy.md`
- 기존 상담 문서는 `public/content/conversation-guide.md`로 보존했습니다.
- 기존 10개 상세 가이드 본문은 `docs/guide-sources/`에 보존하며 동일한 헤더·화면 스타일로 생성합니다.

`npm run build`는 원본에서 위키 검색 문서, 위키 페이지, 메인 페이지, 상세 가이드와 FAQ 원문을 생성합니다. `public/index.html`, `public/wiki/index.html`, `public/data/wiki-index.json`, `public/content/llm-wiki.md`는 직접 편집하지 않습니다. 메인 구조는 `tools/home-template.html`, 공통 화면 스타일은 `public/assets/site.css`와 `design-v2.css`입니다.

원본 수정 → 변경 내용 검토 → `npm test` → 위키의 출처·기준일·운영 상태 확인 → 배포 순서로 운영합니다. AI가 발견한 지식 부족은 원본 수정 후보로만 다루며 자동으로 공개 문서에 기록하지 않습니다. 날짜 미기재 자료에는 임의로 최신 날짜를 부여하지 않습니다.

## 로컬 실행

- 자료 안내 모드: `npm run dev:local`
- 학교 AI 연결 검증과 미리보기: `npm run dev:secure`
- 학교 AI만 검증: `npm run check:school`

보안 입력은 화면에 표시되지 않으며 키를 코드·파일·로그에 기록하지 않습니다. 프로세스가 종료되면 다시 입력해야 합니다. 환경변수 `SCHOOL_AI_API_KEY`가 있으면 이를 사용합니다. `SCHOOL_AI_MODEL`의 기본값은 `local/qwen3.8-flash`, `SCHOOL_AI_BASE_URL`은 학교가 제공한 API 주소입니다. 시작 시 `/models`, 텍스트, 스트리밍과 위키 기반 답변을 확인합니다. DANB 토큰을 사용하지 않습니다.

## 배포

기존 GitHub + Cloudflare Pages 구성을 유지합니다. Build command는 `npm run build`, output directory는 `public`, functions directory는 `functions`입니다. Cloudflare 프로젝트의 비밀 환경변수에 `SCHOOL_AI_API_KEY`를 등록해야 실제 배포 사이트에서도 생성형 답변을 사용할 수 있습니다. 키가 없으면 위키/FAQ 안내 모드로 동작합니다. `.dev.vars.example`에는 비밀값을 넣지 않습니다.

현재 변경은 로컬 구현이며 공개 서비스에 배포하지 않았습니다. 로컬 학교 API 연결 성공은 Cloudflare 서버에서 학교 API에 접근 가능한지까지 보장하지 않습니다. 배포 시 학교 측 접근 정책과 환경변수 주입을 검증해야 합니다.

API는 요청 크기 제한, 동일 출처 검사, 제한된 대화 이력, 응답 시간 제한과 중지, 장애 시 원문 대체를 사용합니다. 프로세스 내 요청량 제한은 최선형 방어이며 다중 인스턴스 전체의 한도를 보장하지 않습니다. 공개 운영에는 `QA_RATE_LIMITER` 분산 바인딩 또는 Cloudflare의 해당 경로 rate-limit 정책을 설정합니다. IP·질문·답변·키를 별도 영구 저장하지 않습니다.

## 시각 자료와 검증

교수 사진은 기존 소개 브로셔의 사진 부분을 CSS로 표시합니다. 인물 사진을 생성하거나 수정하지 않았고 원본 브로셔 링크를 유지합니다. 프로젝트 이미지 파일과 크레딧도 보존합니다.

학습 모션은 Blender 3D 건축 모형입니다. 기초는 하단, 실무는 상단에 배치합니다. 하단과 상단을 같은 프레임에 조립하기 시작해 학년에 관계없이 두 방향의 배움이 동시에 진행됨을 나타냅니다. 시카고 마천루의 묶음형 매스를 참고한 짙은 유리·금속 외관과 밝은 과목명을 사용합니다. AI 허브에서 책 아이콘과 AI 표시가 있는 학습 카드가 기존 기초·실무 과목으로 동시에 이동하고, 도움받은 공간에는 AI 배지가 남습니다. 물음표가 있는 데이터 분석·건축설계·설계 실무 공간은 AI 카드 도착 후 순차적으로 채웁니다. 기초·실무 공간 라벨만 표시하고 하단 설명 자막은 없습니다. 특정 과목만 AI를 활용한다는 의미가 아닙니다. `tools/build-learning-architecture.py --animate`를 Blender의 background Python 실행 옵션으로 렌더링한 뒤 `npm run build:animation`으로 MP4·GIF·포스터를 생성합니다. 메인 페이지는 MP4를 사용하며, 모션 최소화 설정에서는 포스터를 표시합니다. 재생·일시정지 버튼은 영상의 현재 위치를 유지합니다. 편집 가능한 장면과 중간 프레임은 `output/learning-film/`에 저장되며 Git에서는 제외합니다. 기존 GIF와 원본 자료도 보존했습니다.

디자인 참고: [Apple WWDC26 — Principles of great design](https://developer.apple.com/videos/play/wwdc2026/250/). 익숙한 조작, 단순성, 사용자의 제어권을 반영했습니다. 아이콘은 웹에서 배포 가능한 [Lucide](https://lucide.dev/license) 공식 자산이며 SF Symbols 파일을 재배포하지 않습니다. 라이선스는 `public/assets/icons/LICENSE.txt`에 포함합니다.

자동 검증: `npm test`. Cloudflare 함수 번들 검증: `npx wrangler pages functions build functions --outdir=output/rebuild-review/worker`. 브라우저에서 모바일 메뉴·헤더 고정·교수 사진·학년 탭·위키 검색·Q&A·GIF 재생/정지를 확인합니다.
