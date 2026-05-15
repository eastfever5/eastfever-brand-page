# AGENTS.md

이 파일은 Codex(Codex.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 개발 서버

Astro 개발 서버 실행:
```bash
npm run dev
```

빌드 산출물 확인:
```bash
npm run build
python3 -m http.server 8081 --directory dist
```

모바일 테스트용 로컬 네트워크 IP 확인:
```bash
ipconfig getifaddr en0 || ipconfig getifaddr en1
```

에이전트 워크플로우로도 실행 가능: `.agent/workflows/rundev.md`

## 테스트

의존성 설치:
```bash
npm install
```

전체 테스트 파이프라인:
```bash
npm test
```

유닛 테스트:
```bash
npm run test:unit
```

레거시 baseline E2E:
```bash
npm run test:e2e
```

Astro 빌드 및 산출물 E2E:
```bash
npm run test:astro
```

## 아키텍처

현재는 **Astro 정적 사이트가 주 구현**이고, 루트의 바닐라 HTML/CSS/JS 파일은 기존 URL과 baseline 검증을 위한 레거시 레이어로 남아 있다.

- Astro 사이트: `src/`에서 구현하고 `npm run build`로 `dist/` 정적 산출물을 생성
- 배포용 정적 파일: `public/` 아래에 `assets/`, `ads.txt`, `robots.txt`, 네이버 검증 HTML을 둔다
- 기존 URL 호환: Astro 산출물의 `/blog.html`, `/post.html`, `/privacy.html`, `/terms.html`, `/about/`이 신규 URL로 이동
- 레거시 파일: 루트 `index.html`, `blog.html`, `post.html`, `about/`, `privacy.html`, `terms.html`, `js/`, `css/`는 삭제 전까지 baseline 확인용으로 유지

### 데이터 레이어

주요 콘텐츠 소스:

- `data/data.json` — 사이트 전체 콘텐츠, 홈 섹션, 서비스, SNS, 법적 문구
- `src/content/blog/*.md` — 블로그 포스트의 단일 기준. frontmatter에 `id`, `slug`, `title`, `date`, `updatedAt`, `category`, `summary`, `thumbnail`, `ogImage`를 포함
- `src/content/pages/about.ko.md` — 한국어 About 본문
- `data/posts.json` — 레거시 호환 인덱스. 직접 편집하지 말고 `npm run posts:sync`로 `src/content/blog`에서 생성

Content Collections 스키마는 `src/content.config.ts`에서 정의한다. 블로그 목록과 상세는 `data/posts.json`을 직접 읽지 않는다.

### 다국어(i18n)

Astro URL 기준:

- 한국어 홈: `/ko/`
- 영어 홈: `/en/`
- 일본어 홈: `/ja/`
- 법적 페이지: `/{lang}/privacy/`, `/{lang}/terms/`
- 블로그와 About은 한국어 전용: `/ko/blog/`, `/ko/about/`

사용자에게 보이는 공통 문자열은 `data/data.json`에서 가져온다. SEO 메타, canonical, hreflang은 Astro 초기 HTML에 정적으로 렌더링한다.

### 블로그 시스템

새 포스트 추가 절차:

1. `src/content/blog/0XX.md`를 생성한다.
2. frontmatter에 고정 `slug`를 넣는다. slug는 한 번 정하면 변경하지 않는다.
3. 이미지가 있으면 `public/assets/blog/0XX/`와 `/assets/blog/0XX/...` 경로를 사용한다.
4. `npm run posts:sync`로 `data/posts.json` 레거시 인덱스를 갱신한다.
5. `npm test`로 Content Collections, 에셋, Astro 산출물 E2E를 검증한다.

기존 `/post.html?id=N`과 `/ko/blog/0XX/`는 canonical slug URL(`/ko/blog/{slug}/`)로 이동한다.

#### 네이버 링크 박스 규약

- 네이버 SmartEditor `se-oglink` 링크 박스는 일반 링크나 인용문으로 옮기지 않는다.
- 반드시 `::og-card{url="..." title="..." description="..." image="..."}` 문법으로 표현한다.
- 링크 박스 썸네일도 원격 네이버 URL을 그대로 두지 않고 `/assets/blog/0XX/...` 로컬 이미지로 저장한다.
- `description`은 네이버 링크 박스의 요약 문구를 유지하고, `image`가 없는 경우에만 텍스트 카드로 허용한다.
- 새 포스트 검수 시 `rg -n "mblogthumb|blogthumb|pstatic|dthumb" ...`로 네이버 원격 이미지 URL이 남아 있지 않은지 확인한다.

#### 네이버 본문 개행 규약

- 네이버 블로그 본문의 줄 단위 개행은 DEV STORY 본문에서도 그대로 보이게 유지한다.
- 가져오기/정리 과정에서 문단 안의 단일 개행을 공백으로 합치거나 문장을 한 줄로 재흐름 처리하지 않는다.
- DEV STORY 렌더러는 블로그 포스트 마크다운에 대해 단일 개행을 `<br>`로 렌더링해야 한다.
- 새 포스트 검수 시 원문에서 줄이 나뉜 짧은 문단이 DEV STORY 상세 화면에서도 같은 줄 단위로 나뉘어 보이는지 확인한다.

### CSS 구조

- `src/styles/global.css` — 기본 스타일 및 데스크톱 레이아웃
- `src/styles/mobile.css` — 반응형 오버라이드
- `src/styles/blog.css` — 블로그 전용 스타일

루트 `css/`는 레거시 baseline용이다. Astro 쪽 스타일 수정은 `src/styles/`에서 진행한다.

### 주요 Astro 페이지

| 경로 | 설명 |
|------|------|
| `/ko/`, `/en/`, `/ja/` | 언어별 홈 |
| `/ko/blog/` | 블로그 목록 |
| `/ko/blog/{slug}/` | 블로그 상세 canonical URL |
| `/ko/about/` | 어바웃 페이지 |
| `/{lang}/privacy/`, `/{lang}/terms/` | 법적 고지 |
| `/blog.html`, `/post.html`, `/privacy.html`, `/terms.html`, `/about/` | 기존 URL 호환 진입점 |
