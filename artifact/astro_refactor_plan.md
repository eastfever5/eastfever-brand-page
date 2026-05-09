# EastFever 브랜드 페이지 Astro 리팩토링 계획서

작성일: 2026-05-09  
대상 저장소: `/Users/ep_macair/Documents/GitHub/eastfever-brand-page`

## 1. 목적

현재 EastFever 브랜드 페이지는 빌드 과정 없는 바닐라 HTML/CSS/JS 정적 사이트다. 구조가 단순하고 배포가 쉬운 장점은 유지하되, 블로그 SEO, 언어별 URL, 글별 메타데이터, sitemap 자동화, 콘텐츠 관리 안정성을 높이기 위해 Astro 기반 정적 사이트로 단계적으로 리팩토링한다.

이 계획은 기존 `artifact/nextjs_refactor_plan.md`의 목표를 Astro 기준으로 재정리한 문서다. Next.js App Router 전환 대신 Astro의 정적 빌드, Markdown, Content Collections, 파일 기반 라우팅을 우선 사용한다.

핵심 목표는 다음과 같다.

- 정적 호스팅 가능한 산출물을 유지한다.
- 홈, 법적 페이지, 블로그 글의 초기 HTML에 정확한 `title`, `description`, OG/Twitter 메타, canonical, `hreflang`을 포함한다.
- `post.html?id=N` 기반 블로그 상세를 `/ko/blog/{slug}/` 정적 라우트로 전환한다.
- `posts/*.md` frontmatter를 블로그 콘텐츠의 단일 기준으로 만들고, 중복된 `data/posts.json` 의존을 줄인다.
- 기존 디자인 톤과 콘텐츠는 유지하고, 구조와 SEO 생산성을 먼저 개선한다.

## 2. Astro 선택 이유

이 저장소는 사용자 로그인, 서버 API, 대시보드 앱보다 개인 브랜드/블로그 중심의 콘텐츠 사이트에 가깝다. 따라서 Next.js보다 Astro가 1차 리팩토링 목적에 더 잘 맞는다.

| 항목 | Next.js | Astro |
|---|---|---|
| 기본 성격 | 웹 앱/풀스택 프레임워크 | 콘텐츠 중심 정적 사이트 프레임워크 |
| 블로그 Markdown | 직접 로더/파서 구성 필요 | Markdown, MDX, Content Collections가 핵심 기능 |
| 클라이언트 JS | React 런타임과 client/server 구분 관리 필요 | 기본 HTML 중심, 필요한 JS만 추가 |
| 정적 배포 | `output: 'export'` 제약 관리 필요 | 정적 빌드가 기본 흐름 |
| 이 사이트와의 적합도 | 가능하지만 다소 무거움 | 현재 구조와 목표에 더 직접적 |

결론: EastFever 사이트의 1차 전환은 Astro가 더 작고 명확하다. 향후 로그인, 관리자, 서버 API가 필요해지면 별도 앱 또는 서버 기능을 검토한다.

## 3. 현재 구조 요약

주요 파일:

- `index.html`: 홈, 다국어 지원
- `blog.html`: 블로그 목록, 한국어 전용
- `post.html`: 블로그 상세, `?id=N` 기반 한국어 전용
- `about/index.html`: 어바웃, 한국어 전용
- `privacy.html`, `terms.html`: 법적 고지, 다국어 지원
- `data/data.json`: 사이트 메타, 홈 콘텐츠, 서비스, SNS, 법적 문구
- `data/posts.json`: 블로그 포스트 인덱스
- `posts/*.md`: 블로그 본문 Markdown, 일부 frontmatter 포함
- `about/about.md`: 어바웃 본문 Markdown
- `css/style.css`, `css/mobile.css`, `css/blog.css`: 전역/모바일/블로그 스타일
- `js/data-loader.js`, `js/i18n.js`, `js/components.js`, `js/main.js`, `js/blog.js`, `js/modal.js`: 런타임 데이터 로딩과 렌더링
- `robots.txt`, `sitemap.xml`, `ads.txt`, `naverb37bc6141b6aa0ce1682ef1c8dd37842.html`: 검색/광고/검증용 정적 파일

현재 한계:

- 홈과 법적 페이지의 다국어 메타 일부가 런타임 JS에 의존한다.
- 블로그 목록과 상세가 클라이언트 `fetch()` 이후 렌더링된다.
- `post.html?id=N` 구조라 포스트별 canonical URL과 고유 메타데이터를 정적으로 만들기 어렵다.
- `data/posts.json`과 `posts/*.md` frontmatter가 중복 소스가 될 위험이 있다.
- sitemap을 수동 관리해야 하며 포스트 추가 시 누락 가능성이 있다.

## 4. 권장 목표 구조

Astro 기준 권장 구조:

```text
astro.config.mjs
package.json
tsconfig.json
public/
  assets/*
  ads.txt
  robots.txt
  naverb37bc6141b6aa0ce1682ef1c8dd37842.html
src/
  components/
    Header.astro
    Footer.astro
    LanguageSwitcher.astro
    Seo.astro
    ServiceSection.astro
    DevStoryList.astro
    BlogCard.astro
  content/
    config.ts
    blog/
      001.md
      002.md
      ...
    pages/
      about.ko.md
  data/
    site.json
    legacy-post-map.json
  layouts/
    BaseLayout.astro
    BlogPostLayout.astro
  pages/
    index.astro
    ko/
      index.astro
      about/index.astro
      blog/index.astro
      blog/[slug].astro
      privacy/index.astro
      terms/index.astro
    en/
      index.astro
      privacy/index.astro
      terms/index.astro
    ja/
      index.astro
      privacy/index.astro
      terms/index.astro
  scripts/
    typing-effect.js
    category-filter.js
  styles/
    global.css
    blog.css
    mobile.css
```

비고:

- 기존 `/assets/...` URL을 유지하려면 `assets/*`를 `public/assets/*`로 이동한다.
- `ads.txt`, `robots.txt`, 네이버 검증 HTML은 `public/`에 둔다.
- `sitemap.xml`은 `@astrojs/sitemap`으로 생성한다.
- 기존 CSS는 처음부터 전면 재작성하지 말고 `src/styles/`로 옮겨 import한 뒤 점진 정리한다.
- 런타임에 DOM을 비워두고 주입하던 영역은 Astro 컴포넌트에서 빌드 시 HTML로 렌더링한다.

## 5. URL 정책

권장 신규 URL:

| 현재 URL | 신규 URL | 정책 |
|---|---|---|
| `/` | `/ko/` | 기본 한국어 홈. 호스팅 301 지원 여부에 따라 리다이렉트 또는 canonical 처리 |
| `/index.html` | `/ko/` | 호환 리다이렉트 또는 canonical |
| `/?lang=en` | `/en/` | 영어 홈 |
| `/?lang=ja` | `/ja/` | 일본어 홈 |
| `/blog.html` | `/ko/blog/` | 한국어 블로그 목록 |
| `/post.html?id=26` | `/ko/blog/{slug}/` | 포스트별 정적 상세 |
| `/about/` | `/ko/about/` | 한국어 어바웃 |
| `/privacy.html` | `/ko/privacy/` | 한국어 개인정보처리방침 |
| `/privacy.html?lang=en` | `/en/privacy/` | 영어 개인정보처리방침 |
| `/privacy.html?lang=ja` | `/ja/privacy/` | 일본어 개인정보처리방침 |
| `/terms.html` | `/ko/terms/` | 한국어 이용약관 |
| `/terms.html?lang=en` | `/en/terms/` | 영어 이용약관 |
| `/terms.html?lang=ja` | `/ja/terms/` | 일본어 이용약관 |

권장 방침:

1. 배포 환경이 301 리다이렉트를 지원하면 기존 URL을 신규 URL로 영구 리다이렉트한다.
2. 순수 정적 호스팅만 가능하면 `public/blog.html`, `public/post.html`, `public/privacy.html`, `public/terms.html` 호환 페이지를 둔다.
3. 호환 페이지는 가능한 한 짧게 유지하고 canonical은 신규 URL로 지정한다.
4. `/post.html?id=N`은 `legacy-post-map.json`에서 `id -> slug`를 찾아 `/ko/blog/{slug}/`로 이동한다.

## 6. 콘텐츠 모델

### 6.1 블로그

최종 목표는 `posts/*.md`와 `data/posts.json`의 중복을 없애고, `src/content/blog/*.md` frontmatter를 단일 기준으로 삼는 것이다.

권장 frontmatter:

```yaml
---
id: 26
slug: draw-the-life-vibe-webgame-3-weeks
title: "Draw the Life 바이브 웹게임 개발 3주 기록"
date: "2026-04-30"
updatedAt: "2026-04-30"
category: "바이브개발"
summary: "AI 개발 도구를 활용해 Draw the Life 웹게임을 3주 동안 만들며 겪은 변화와 작업 흐름을 정리합니다."
thumbnail: "/assets/blog/026/image-18.jpg"
ogImage: "/assets/blog/026/image-18.jpg"
sourceType: "naver_blog_series"
sourceUrls:
  - "https://blog.naver.com/five_east_fever/224250564905"
tags:
  - "바이브코딩"
  - "웹게임"
---
```

필수 작업:

- 모든 포스트에 `id`, `slug`, `title`, `date`, `category`, `summary`를 보장한다.
- `slug`는 한 번 정하면 변경하지 않는다.
- `thumbnail`과 `ogImage`는 없을 경우 기본 OG 이미지로 fallback한다.
- `data/posts.json`은 마이그레이션 중에만 유지하고, 최종적으로는 생성 산출물 또는 삭제 대상으로 본다.

### 6.2 사이트 데이터

`data/data.json`은 다음 중 하나로 이전한다.

- 단기: `src/data/site.json`으로 이동하고 기존 구조를 최대한 유지한다.
- 중기: SEO, navigation, services, legal copy를 목적별 파일로 분리한다.

권장 중기 구조:

```text
src/data/
  site.json
  navigation.json
  services.json
  legal.json
```

다만 1차 리팩토링에서는 파일 분리보다 동작 동일성과 SEO 개선을 우선한다.

## 7. Astro 구현 방침

### 7.1 `astro.config.mjs`

권장 설정:

- `site: "https://eastfever.com"`
- 정적 출력 유지
- `@astrojs/sitemap` integration 사용
- `/ko/`, `/en/`, `/ja/` prefix 정책을 명확히 하기 위해 Astro i18n 설정 또는 명시적 파일 라우팅 사용

초기에는 명시적 파일 라우팅을 우선한다. 즉, `src/pages/ko`, `src/pages/en`, `src/pages/ja`를 직접 만들고, 필요할 때 `astro:i18n` helper를 보조적으로 사용한다.

### 7.2 레이아웃과 SEO

`src/layouts/BaseLayout.astro`가 모든 페이지의 공통 HTML 골격을 담당한다.

필수 props:

- `lang`
- `title`
- `description`
- `canonicalPath`
- `alternateLanguages`
- `ogType`
- `ogImage`
- `jsonLd`

페이지별 Astro 파일은 데이터를 읽어 BaseLayout에 넘긴다. 이렇게 하면 JS 실행 전 초기 HTML부터 검색 엔진과 SNS 공유에 필요한 메타가 들어간다.

### 7.3 클라이언트 JS 최소화

Astro 전환 후에도 필요한 상호작용은 유지한다.

- 언어 선택: localStorage 기반 UI 전환 대신 언어별 링크 이동
- 타이핑 효과: `src/scripts/typing-effect.js`로 분리하고 홈에서만 로드
- 블로그 카테고리 필터: 우선 정적 링크 또는 작은 클라이언트 스크립트로 유지
- 모달/프리뷰: 현재 기능이 필요한 서비스 카드에서만 로드

원칙: SEO에 필요한 콘텐츠는 클라이언트 JS 주입에 의존하지 않는다.

## 8. 단계별 작업 계획

### 현재 테스트 파이프라인 상태

점검 및 보강일: 2026-05-09

Astro 전환 전 baseline을 잡기 위해 현재 레거시 사이트 기준 테스트 파이프라인을 보강했다.

보강된 명령:

- `npm run test:unit`: i18n, Markdown/data, 포스트/에셋 무결성 검사
- `npm run test:e2e`: 임시 로컬 서버를 자동 실행하고 주요 페이지 브라우저 검증
- `npm test`: 유닛과 E2E 전체 실행

검증 결과:

- `npm test`: 통과
- 검증 대상 페이지: `/`, `/about/`, `/blog.html`, `/post.html?id=26`, `/terms.html`, `/privacy.html`

현재 유닛 테스트가 확인하는 것:

- 홈 i18n의 `title`, `description`, canonical, `hreflang`, OG locale 갱신
- 한국어 전용 페이지의 SEO 언어 고정
- `data/data.json` 필수 섹션 존재
- privacy/terms/about/posts Markdown 파싱 가능 여부
- `data/posts.json`의 id/file/date 필수값, 중복, 파일 존재 여부
- 포스트 frontmatter 필수값과 Markdown/서비스 이미지 에셋 존재 여부

현재 E2E가 확인하는 것:

- 주요 페이지 HTTP 200
- 브라우저 console error/page error 부재
- 페이지별 `title`, `description`, canonical, `hreflang`
- `og:title`, `og:description`, `og:image`, `og:type`
- Twitter card title/description/image
- 홈 Dev Story 카드 렌더링
- 블로그 목록 카드 렌더링
- 블로그 상세 26번의 제목, 카테고리, 본문 핵심 문구
- About/legal Markdown 렌더링 핵심 문구

남은 한계:

- 아직 Astro 빌드 산출물 HTML 기준 검사는 없다.
- 기존 URL에서 신규 Astro URL로 이동하는 리다이렉트/호환 페이지 검사는 Astro 전환 후 추가해야 한다.
- sitemap 자동 생성 결과 검사는 Astro 도입 후 추가해야 한다.
- `data/posts.json`과 Markdown frontmatter의 내용 일치까지는 강제하지 않는다. 현재 여러 포스트에서 제목/요약/날짜 표현 차이가 있어, Astro Content Collections 전환 Phase에서 정규화해야 한다.

Astro 도입 전 최소 보강 게이트:

- 현재 레거시 사이트 기준 `npm test`를 통과시킨 뒤 Astro 전환 작업을 시작한다.
- Astro Phase마다 `npm test`를 통과시킨다.
- Astro 전환 후에는 빌드 산출물 HTML을 대상으로 메타데이터와 본문 존재 여부를 검사한다.

### Phase 0. 전환 기준 확정

목표:

- URL 정책, 호환 방식, 배포 환경 제약을 확정한다.

작업:

- `https://eastfever.com` 배포 환경이 301 리다이렉트를 지원하는지 확인
- `/`를 `/ko/`로 리다이렉트할지, `/`를 한국어 호환 홈으로 남길지 결정
- 블로그 slug 규칙 확정
- 기존 검색 유입 URL 목록 확인

완료 기준:

- URL 매핑표와 호환 방식이 확정되어 있다.
- `id -> slug` 매핑 생성 기준이 정해져 있다.

### Phase 1. Astro 스캐폴딩

목표:

- 기존 사이트를 훼손하지 않고 Astro 프로젝트 기반을 추가한다.

작업:

- `package.json`, `astro.config.mjs`, `tsconfig.json` 추가
- `npm` scripts 추가: `dev`, `build`, `preview`
- `@astrojs/sitemap` 추가
- `src/pages/ko/index.astro` 빈 페이지 또는 최소 페이지 생성
- `src/layouts/BaseLayout.astro` 생성
- 기존 `assets/*`, `ads.txt`, `robots.txt`, 검증 HTML을 `public/`로 이전할 준비

완료 기준:

- `npm run dev`로 Astro 개발 서버가 뜬다.
- `npm run build`가 성공한다.
- 기존 정적 사이트 파일은 아직 삭제하지 않았다.

### Phase 2. 스타일과 공통 레이아웃 이전

목표:

- 화면 구조를 크게 바꾸지 않고 Header/Footer/전역 CSS를 Astro로 옮긴다.

작업:

- `css/style.css` -> `src/styles/global.css`
- `css/mobile.css` -> `src/styles/mobile.css`
- `css/blog.css` -> `src/styles/blog.css`
- `Header.astro`, `Footer.astro`, `LanguageSwitcher.astro` 구현
- 기존 네비게이션 링크를 신규 URL 기준으로 변경

완료 기준:

- `/ko/`에서 기존 홈과 유사한 헤더/푸터/기본 스타일이 보인다.
- CSS 캐시 버스팅 쿼리 파라미터에 더 의존하지 않는다.

### Phase 3. 홈 이전

목표:

- `index.html`의 런타임 렌더링 영역을 Astro 빌드 시점 렌더링으로 이전한다.

작업:

- `src/data/site.json`에서 hero, keywords, services, sns, contact 데이터 읽기
- 홈 hero, keyword marquee, dev story preview, services, SNS, contact 섹션 구현
- `/ko/`, `/en/`, `/ja/` 홈 생성
- 언어별 `title`, `description`, canonical, hreflang 생성

완료 기준:

- 각 언어 홈의 초기 HTML에 주요 텍스트와 SEO 메타가 포함된다.
- 홈 화면이 기존 디자인과 크게 다르지 않다.

### Phase 4. 법적 페이지와 About 이전

목표:

- `privacy.html`, `terms.html`, `about/index.html`의 Markdown 렌더링을 Astro로 이전한다.

작업:

- `/ko/privacy/`, `/en/privacy/`, `/ja/privacy/` 구현
- `/ko/terms/`, `/en/terms/`, `/ja/terms/` 구현
- `/ko/about/` 구현
- 기존 `data/data.json`의 legal Markdown 또는 분리된 `src/data/legal.json` 사용
- `about/about.md`를 `src/content/pages/about.ko.md`로 이전

완료 기준:

- 법적 페이지와 About 페이지가 클라이언트 `marked.js` 없이 정적 HTML로 렌더링된다.
- 각 페이지의 canonical, OG, Twitter 메타가 초기 HTML에 존재한다.

### Phase 5. 블로그 이전

목표:

- 블로그 목록과 상세를 Astro Content Collections 기반 정적 페이지로 이전한다.

작업:

- `posts/*.md`를 `src/content/blog/*.md`로 이전
- 모든 포스트 frontmatter 정규화
- `src/content/config.ts`에서 blog collection schema 정의
- `/ko/blog/` 목록 페이지 구현
- `/ko/blog/[slug].astro` 상세 페이지 구현
- `getStaticPaths()`로 모든 포스트 라우트 생성
- 포스트별 `title`, `summary`, `ogImage`, `date`, `updatedAt` 기반 메타 생성
- 목록의 상세 링크를 `/ko/blog/{slug}/`로 변경

완료 기준:

- 모든 포스트가 고유 slug URL을 가진다.
- 각 포스트 HTML에 본문, 제목, 설명, canonical, OG 메타가 정적으로 포함된다.
- 기존 `data/posts.json` 없이도 블로그 목록과 상세가 렌더링된다.

### Phase 6. SEO 인프라와 호환 레이어

목표:

- 검색엔진, SNS, 기존 유입 URL을 안전하게 처리한다.

작업:

- `@astrojs/sitemap`으로 sitemap 생성
- `robots.txt`, `ads.txt`, 네이버 검증 HTML이 빌드 결과에 포함되는지 확인
- `legacy-post-map.json` 생성
- `/blog.html`, `/post.html`, `/privacy.html`, `/terms.html` 호환 페이지 또는 호스팅 리다이렉트 적용
- JSON-LD 구조화 데이터 재구성
- RSS 피드가 필요하면 별도 Phase로 검토

완료 기준:

- sitemap에 언어별 홈, 법적 페이지, 블로그 글이 포함된다.
- 기존 핵심 URL 접근 시 신규 URL로 이동하거나 canonical이 명확하다.
- Search Console/Naver/AdSense 검증 파일이 배포 결과에 포함된다.

### Phase 7. 테스트 갱신

목표:

- Astro 전환 후 깨진 경로와 SEO 회귀를 자동으로 잡는다.

작업:

- `tests/e2e/test_pages.py` 대상 경로를 신규 URL로 갱신
- 블로그 상세 샘플 1개 이상에서 title/meta/canonical/og:image 확인
- 빌드 산출물 HTML 검사 스크립트 추가
- Content Collections schema 검증 실패를 빌드 실패로 연결
- 기존 `test_i18n.js`는 런타임 i18n 테스트에서 라우트/메타 테스트로 전환
- 기존 `test_markdown.js`는 Astro Markdown/frontmatter 검증 테스트로 전환

권장 검증 명령:

```bash
npm run build
npm run dev
python3 tests/e2e/test_pages.py
```

완료 기준:

- 빌드가 성공한다.
- 주요 페이지 e2e가 통과한다.
- 블로그 포스트 누락, slug 중복, 필수 메타 누락을 자동 검출한다.

### Phase 8. 정리

목표:

- 더 이상 쓰지 않는 바닐라 JS/HTML 구조를 제거하거나 보관한다.

작업:

- `js/data-loader.js`, `js/i18n.js`, `js/components.js`, `js/main.js`, `js/blog.js` 제거 검토
- 기존 HTML 파일은 호환이 끝난 것부터 제거 또는 `legacy/`로 보관
- `data/posts.json` 삭제 또는 생성 산출물로 전환
- `ops/burst_version.py` 제거 여부 검토
- 문서와 워크플로우 갱신: `AGENTS.md`, `.agent/workflows/add-post.md`, `.agent/workflows/rundev.md`

완료 기준:

- 새 포스트 추가 절차가 Astro 기준으로 정리되어 있다.
- 캐시 버스팅 수동 증가 작업이 필요 없다.
- 레거시 파일의 보관/삭제 기준이 명확하다.

## 9. 권장 1차 PR 범위

첫 PR은 전체 마이그레이션을 끝내려 하지 말고, Astro 기반이 안전하게 서는지 확인하는 데 집중한다.

포함:

- Astro 스캐폴딩
- `public/assets` 준비
- `BaseLayout.astro`, `Header.astro`, `Footer.astro`
- `/ko/` 홈 1개 페이지의 정적 렌더링
- `npm run build` 성공

제외:

- 모든 블로그 포스트 이전
- 기존 HTML/JS 삭제
- URL 리다이렉트 최종 적용
- 디자인 리뉴얼

이렇게 쪼개면 기존 사이트를 유지한 채 Astro 전환 위험을 작게 검증할 수 있다.

## 10. 주요 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 기존 URL 변경 | 검색 유입 손실 | 301 리다이렉트 또는 호환 HTML 제공 |
| slug 변경 | 공유 링크와 검색 색인 손실 | slug는 명시 필드로 관리하고 변경 금지 |
| `data/posts.json`과 frontmatter 불일치 | 목록/상세 데이터 오류 | frontmatter 단일 기준으로 전환 |
| CSS 이전 회귀 | 기존 브랜드 인상 손상 | CSS를 먼저 그대로 이전하고 이후 정리 |
| 이미지 경로 깨짐 | 블로그 본문/OG 이미지 누락 | `/assets/...` 경로 유지, `public/assets` 검증 |
| sitemap 누락 | 검색 반영 지연 | 빌드 후 sitemap 검사 추가 |
| 레거시 JS 의존 누락 | 일부 상호작용 손실 | 기능별로 필요한 JS만 `src/scripts`로 이전 |

## 11. 제외 범위

이번 Astro 리팩토링 1차 범위에서 제외한다.

- 대규모 디자인 리뉴얼
- CMS 도입
- 서버 런타임 또는 DB 도입
- 관리자/로그인 기능
- 블로그 다국어화
- 동적 OG 이미지 생성 API
- React/Vue/Svelte island 도입

## 12. 참고 문서

- Astro Markdown: https://docs.astro.build/en/guides/markdown-content/
- Astro Content Collections: https://docs.astro.build/en/guides/content-collections/
- Astro i18n Routing: https://docs.astro.build/en/guides/internationalization/
- Astro Sitemap Integration: https://docs.astro.build/en/guides/integrations-guide/sitemap/
- 기존 Next.js 검토 문서: `artifact/nextjs_refactor_plan.md`

## 13. 최종 완료 기준

Astro 리팩토링은 다음 조건을 만족하면 완료로 본다.

- Astro 정적 빌드가 성공한다.
- `/ko/`, `/en/`, `/ja/` 홈이 언어별 SEO 메타를 초기 HTML에 포함한다.
- `/ko/blog/`와 `/ko/blog/{slug}/`가 정적 HTML로 렌더링된다.
- 모든 블로그 포스트가 고유 slug, canonical, 포스트별 메타를 가진다.
- 기존 핵심 URL에 대한 호환 또는 리다이렉트 정책이 적용되어 있다.
- sitemap/robots/ads/검색엔진 검증 파일이 배포 결과에 포함된다.
- 갱신된 e2e/메타 검증 테스트가 통과한다.
- 새 포스트 추가 절차가 `src/content/blog/*.md` frontmatter 기준으로 문서화되어 있다.
