# AI건축융합학과 NLWeb-lite 자료 패키지

이 저장소는 **GitHub + Cloudflare Pages**로 AI건축융합학과 홍보 페이지를 만들기 위한 자료 패키지입니다.

목표는 두 가지입니다.

1. 사람이 보는 학과 홈페이지를 빠르게 공개한다.
2. ChatGPT, Gemini, Claude 같은 AI가 학과 정보를 잘 읽고 근거로 사용할 수 있게 한다.

## 핵심 구조

```text
public/
  index.html                    # 사람용 랜딩페이지
  llms.txt                      # AI 안내파일
  robots.txt                    # 접근정책
  sitemap.xml                   # 검색엔진 안내
  content/
    canonical.md                # AI가 읽을 통합 원문
    about.md                    # 학과소개 원문
    curriculum.md               # 교과과정 요약
    advanced-areas.md           # 심화 교육축
    careers.md                  # 진로정보
    admissions.md               # 입학정보 요약
    faq.md                      # FAQ
  data/
    department.json             # 학과 핵심정보
    curriculum.json             # 교과과정 데이터
    advanced_areas.json         # 심화 교육축 데이터
    careers.json                # 진로정보 데이터
    admissions.json             # 입학정보 데이터
    faq.json                    # FAQ 데이터
    answer_policy.json          # AI 답변 정책
    search-index.json           # 검색용 간이 색인
  assets/
    brochure-page-1.png
    brochure-page-2.png
    talent-identity.png
functions/
  api/ask.js                    # Cloudflare Pages Function: /api/ask
  api/health.js                 # 상태 확인: /api/health
```

## 배포 방식

Cloudflare Pages에서 GitHub 저장소를 연결하고 다음처럼 설정합니다.

- Framework preset: None
- Build command: 비움 또는 없음
- Build output directory: `public`
- Functions directory: `functions`

## 배포 전 꼭 바꿀 것

아래 파일의 `https://YOUR-DOMAIN.example`을 실제 Cloudflare Pages 주소나 학교 도메인으로 바꾸세요.

- `public/llms.txt`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/data/site.json`
- `public/schema/department.jsonld`

문의처가 확정되면 다음도 바꾸세요.

- `public/data/site.json`
- `public/content/about.md`
- `public/index.html` 하단 문의 영역

## /api/ask 사용 예시

```bash
curl -X POST https://YOUR-DOMAIN.example/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"AI건축융합학과는 어떤 학과인가요?"}'
```

## 주의

입학 관련 수치와 일정은 2027학년도 대학입학전형시행계획 기준입니다. 최종 모집요강이 공개되면 `public/data/admissions.json`, `public/content/admissions.md`, `public/data/faq.json`을 업데이트해야 합니다.
