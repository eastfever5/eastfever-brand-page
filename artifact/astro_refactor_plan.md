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
- Astro 산출물 검증 대상 페이지: `/ko/`, `/en/`, `/ja/`, `/ko/about/`, `/ko/blog/`, `/ko/blog/026/`, `/en/privacy/`, `/ja/terms/`

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

- 호스팅 레벨 301 리다이렉트 지원 여부는 아직 배포 환경에서 확인해야 한다.
- RSS 피드가 필요한지는 아직 결정하지 않았다.
- 루트 레거시 HTML/JS/CSS는 baseline 검증용으로 유지 중이며, 실제 배포 안정화 후 제거 또는 archive 이동을 결정한다.

Astro 도입 전 최소 보강 게이트:

- 현재 레거시 사이트 기준 `npm test`를 통과시킨 뒤 Astro 전환 작업을 시작한다.
- Astro Phase마다 `npm test`를 통과시킨다.
- Astro 전환 후에는 빌드 산출물 HTML을 대상으로 메타데이터와 본문 존재 여부를 검사한다.

### 2026-05-09 현재 상황 요약

현재 상태:

- 레거시 사이트와 Astro 사이트가 공존한다.
- 레거시 파일(`index.html`, `blog.html`, `post.html` 등)은 아직 삭제하지 않았다.
- Astro 구현은 `src/`에 추가되었고, `npm run build`로 `dist/` 정적 산출물을 생성한다.
- `public/`에는 Astro 배포용 정적 파일과 기존 `/assets/...` 경로를 보존하기 위한 이미지 복사본이 들어 있다.
- 전체 검증 명령은 `npm test`이며, 레거시 baseline과 Astro 산출물 E2E를 모두 통과한다.

완료된 범위:

- Astro 6 기반 스캐폴딩: `astro.config.mjs`, `tsconfig.json`, `src/`, `public/`
- `@astrojs/sitemap` 적용. 현재 산출물은 `sitemap-index.xml`, `sitemap-0.xml`을 생성한다.
- 기존 CSS를 `src/styles/`로 복사하고 Astro 레이아웃에서 import
- 공통 레이아웃과 컴포넌트: `BaseLayout.astro`, `Header.astro`, `Footer.astro`, `LanguageSwitcher.astro`
- 언어별 홈 정적 렌더링: `/ko/`, `/en/`, `/ja/`
- 한국어 About 정적 렌더링: `/ko/about/`
- 한국어 블로그 목록과 상세 정적 렌더링: `/ko/blog/`, `/ko/blog/{slug}/`
- 다국어 법적 페이지 정적 렌더링: `/{lang}/privacy/`, `/{lang}/terms/`
- 포스트별 OG 이미지 반영. 예: `/ko/blog/draw-the-life-vibe-webgame-3-weeks/`는 `/assets/blog/026/image-18.jpg` 사용
- 기존 URL 호환 레이어: `/blog.html`, `/post.html?id=N`, `/ko/blog/0XX/`, `/privacy.html?lang=...`, `/terms.html?lang=...`, `/about/`을 신규 Astro URL로 이동
- Content Collections 전환: `src/content.config.ts`, `src/content/blog/*.md`, `src/content/pages/about.ko.md`
- `data/posts.json`은 `npm run posts:sync`로 생성하는 레거시 호환 인덱스로 전환
- sitemap canonical URL 포함/redirect URL 제외 검사 추가
- Astro 산출물 E2E: `tests/e2e/test_astro_pages.py`
- 최종 검증: `npm test` 통과

아직 완료되지 않은 범위:

- 운영 환경은 Cloudflare Pages다. 경로 기반 301은 `_redirects`로 처리할 수 있으나, query parameter 매칭은 `_redirects`에서 지원하지 않으므로 `/post.html?id=N`, `/privacy.html?lang=en` 같은 URL은 Pages Functions 또는 현재 정적 HTML fallback을 유지해야 한다.
- RSS 피드 필요 여부는 아직 확정하지 않았다.
- 루트 레거시 JS/HTML은 삭제하지 않고 baseline 검증용으로 유지한다. 실제 배포는 Astro `dist/` 기준이다.

다음 권장 작업 순서:

1. Cloudflare Pages 301 리다이렉트 운영 방식을 결정하고 적용한다. 경로 기반은 `public/_redirects`, query 기반은 Pages Functions 또는 정적 HTML fallback 중 하나를 선택한다.
2. RSS 피드가 필요한지 결정한다.
3. Astro 배포가 충분히 안정화되면 루트 레거시 HTML/JS/CSS를 별도 archive로 이동하거나 제거한다.

### Cloudflare Pages 301 리다이렉트 적용 계획

Cloudflare Pages 기준 결론:

- `public/_redirects` 파일을 사용하면 빌드 결과의 `dist/_redirects`로 복사되어 Pages가 redirect rule로 적용한다.
- `_redirects`는 301/302/303/307/308, splat, placeholder를 지원한다.
- `_redirects`는 query parameter 매칭을 지원하지 않는다. 따라서 `/post.html?id=26`, `/privacy.html?lang=en`, `/terms.html?lang=ja`처럼 query 값에 따라 목적지가 달라지는 URL은 `_redirects`만으로 정확히 처리하지 않는다.
- Pages Functions는 file-based routing을 지원하므로, 필요하면 `/functions/post.html.ts`, `/functions/privacy.html.ts`, `/functions/terms.html.ts` 같은 함수에서 `request.url`의 `searchParams`를 읽고 301 `Response.redirect()`를 반환한다.
- `_redirects`는 Pages Functions가 매칭되는 요청에는 적용되지 않으므로, 같은 route를 Function과 `_redirects`에 중복 정의하지 않는다.

권장 운영안:

1. 1차 적용은 source-controlled `public/_redirects`로 경로 기반 301만 처리한다.

```text
/ /ko/ 301
/blog.html /ko/blog/ 301
/about/ /ko/about/ 301
/ko/blog/001/ /ko/blog/ai-game-development-plan/ 301
/ko/blog/026/ /ko/blog/draw-the-life-vibe-webgame-3-weeks/ 301
/ko/blog/027/ /ko/blog/draw-the-life-prototype-retrospective/ 301
```

2. `/post.html`, `/privacy.html`, `/terms.html`은 query 기반 분기가 필요하므로 `_redirects`에 넣지 않는다. 현재 Astro 정적 호환 HTML fallback을 유지한다.
3. 검색 유입에서 query 기반 URL 비중이 의미 있게 보이면 Pages Functions로 승격한다.
   - `/functions/post.html.ts`: `id`를 읽어 Content Collections에서 생성한 `id -> slug` 매핑으로 301
   - `/functions/privacy.html.ts`: `lang`이 `ko/en/ja`면 `/{lang}/privacy/`, 없거나 잘못되면 `/ko/privacy/`로 301
   - `/functions/terms.html.ts`: `lang`이 `ko/en/ja`면 `/{lang}/terms/`, 없거나 잘못되면 `/ko/terms/`로 301
4. Functions를 도입하면 Cloudflare Pages의 Functions invocation route가 필요한 route만 포함하는지 확인한다. 정적 파일 전체가 Function을 타지 않도록 `_routes.json` 또는 자동 생성 결과를 점검한다.
5. 적용 후 production에서 아래 명령으로 상태 코드를 확인한다.

```bash
curl -I https://eastfever.com/blog.html
curl -I https://eastfever.com/about/
curl -I https://eastfever.com/ko/blog/026/
curl -I "https://eastfever.com/post.html?id=26"
curl -I "https://eastfever.com/privacy.html?lang=en"
curl -I "https://eastfever.com/terms.html?lang=ja"
```

기대 결과:

- `_redirects` 적용 URL은 `301`과 새 `Location`을 반환한다.
- query 기반 URL은 Pages Functions를 도입한 경우 `301`, 도입하지 않은 경우 현재처럼 `200` HTML fallback 후 canonical URL로 이동한다.
- query 기반 URL이 `_redirects`에 의해 잘못된 언어/글로 이동하면 안 된다.

현재 적용 상태:

- `public/_redirects`로 `/blog.html`, `/about/`, `/ko/blog/0XX/` 같은 경로 기반 legacy URL을 301 처리한다.
- `/`, `/index.html`, `/post.html`, `/privacy.html`, `/terms.html`은 query parameter에 따라 목적지가 달라질 수 있으므로 `_redirects`에 넣지 않고 Cloudflare Pages Functions에서 301 처리한다.
- `public/_routes.json`으로 Pages Functions 호출 범위를 위 query-sensitive legacy URL에만 제한한다.
- 정적 HTML fallback은 로컬 정적 서버와 비 Cloudflare 환경을 위한 안전망으로 유지한다.

참고 문서:

- Cloudflare Pages Redirects: https://developers.cloudflare.com/pages/configuration/redirects/
- Cloudflare Pages Functions Routing: https://developers.cloudflare.com/pages/functions/routing/
- Cloudflare Redirect Rules settings: https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/

### Phase 0. 전환 기준 확정 — 부분 완료

목표:

- URL 정책, 호환 방식, 배포 환경 제약을 확정한다.

작업:

- [부분 완료] 운영 환경은 Cloudflare Pages로 확인. 경로 기반 301은 `_redirects`로 가능하고, query 기반 URL은 Pages Functions 또는 정적 HTML fallback이 필요하다.
- [부분 결정] `/`는 Astro에서 `/ko/`로 이동하는 정적 refresh 페이지를 생성한다. 최종 배포에서는 301 지원 여부에 따라 조정한다.
- [완료] 블로그 slug 규칙 확정: 영문 소문자, 숫자, 하이픈만 사용하고 한 번 정한 slug는 변경하지 않는다.
- [부분 완료] 기존 핵심 검색 유입 URL은 `/blog.html`, `/post.html?id=N`, `/privacy.html`, `/terms.html`, `/about/`, `/ko/blog/0XX/`로 보고 호환 레이어를 적용했다.

완료 기준:

- URL 매핑표와 호환 방식이 확정되어 있다.
- `id -> slug` 매핑 생성 기준이 정해져 있다.

### Phase 1. Astro 스캐폴딩 — 완료

목표:

- 기존 사이트를 훼손하지 않고 Astro 프로젝트 기반을 추가한다.

작업:

- [완료] `package.json`, `astro.config.mjs`, `tsconfig.json` 추가
- [완료] `npm` scripts 추가: `dev`, `build`, `preview`, `test:astro`
- [완료] `@astrojs/sitemap` 추가
- [완료] `src/pages/[lang]/index.astro` 생성
- [완료] `src/layouts/BaseLayout.astro` 생성
- [완료] 기존 `assets/*`, `ads.txt`, `robots.txt`, 검증 HTML을 `public/`로 복사

완료 기준:

- `npm run dev`로 Astro 개발 서버가 뜬다.
- `npm run build`가 성공한다.
- 기존 정적 사이트 파일은 아직 삭제하지 않았다.

### Phase 2. 스타일과 공통 레이아웃 이전 — 완료

목표:

- 화면 구조를 크게 바꾸지 않고 Header/Footer/전역 CSS를 Astro로 옮긴다.

작업:

- [완료] `css/style.css` -> `src/styles/global.css`
- [완료] `css/mobile.css` -> `src/styles/mobile.css`
- [완료] `css/blog.css` -> `src/styles/blog.css`
- [완료] `Header.astro`, `Footer.astro`, `LanguageSwitcher.astro` 구현
- [완료] 기존 네비게이션 링크를 신규 URL 기준으로 변경

완료 기준:

- `/ko/`에서 기존 홈과 유사한 헤더/푸터/기본 스타일이 보인다.
- CSS 캐시 버스팅 쿼리 파라미터에 더 의존하지 않는다.

### Phase 3. 홈 이전 — 완료

목표:

- `index.html`의 런타임 렌더링 영역을 Astro 빌드 시점 렌더링으로 이전한다.

작업:

- [완료] 기존 `data/data.json`에서 hero, keywords, services, sns, contact 데이터 읽기
- [완료] 홈 hero, keyword marquee, dev story preview, services, SNS, contact 섹션 구현
- [완료] `/ko/`, `/en/`, `/ja/` 홈 생성
- [완료] 언어별 `title`, `description`, canonical, hreflang 생성

완료 기준:

- 각 언어 홈의 초기 HTML에 주요 텍스트와 SEO 메타가 포함된다.
- 홈 화면이 기존 디자인과 크게 다르지 않다.

### Phase 4. 법적 페이지와 About 이전 — 완료

목표:

- `privacy.html`, `terms.html`, `about/index.html`의 Markdown 렌더링을 Astro로 이전한다.

작업:

- [완료] `/ko/privacy/`, `/en/privacy/`, `/ja/privacy/` 구현
- [완료] `/ko/terms/`, `/en/terms/`, `/ja/terms/` 구현
- [완료] `/ko/about/` 구현
- [완료] 기존 `data/data.json`의 legal Markdown 사용
- [완료] `about/about.md`를 `src/content/pages/about.ko.md`로 이전. 루트 `about/`는 레거시 baseline용으로 유지한다.

완료 기준:

- 법적 페이지와 About 페이지가 클라이언트 `marked.js` 없이 정적 HTML로 렌더링된다.
- 각 페이지의 canonical, OG, Twitter 메타가 초기 HTML에 존재한다.

### Phase 5. 블로그 이전 — 완료

목표:

- 블로그 목록과 상세를 Astro Content Collections 기반 정적 페이지로 이전한다.

작업:

- [완료] `posts/*.md`를 `src/content/blog/*.md`로 이전. 루트 `posts/`는 레거시 baseline/reference로만 유지
- [완료] 모든 포스트 frontmatter 정규화
- [완료] `src/content.config.ts`에서 blog/pages collection schema 정의
- [완료] `/ko/blog/` 목록 페이지 구현
- [완료] `/ko/blog/[slug].astro` 상세 페이지 구현
- [완료] `getStaticPaths()`로 모든 포스트 라우트 생성
- [완료] 포스트별 `title`, `summary`, `ogImage`, `date`, `updatedAt` 기반 메타 생성
- [완료] 목록의 상세 링크를 `/ko/blog/{slug}/`로 변경
- [완료] 기존 숫자 URL `/ko/blog/0XX/`는 canonical slug URL로 이동

완료 기준:

- 모든 포스트가 고유 slug URL을 가진다.
- 각 포스트 HTML에 본문, 제목, 설명, canonical, OG 메타가 정적으로 포함된다.
- 기존 `data/posts.json` 없이도 블로그 목록과 상세가 렌더링된다.

### Phase 6. SEO 인프라와 호환 레이어 — 부분 완료

목표:

- 검색엔진, SNS, 기존 유입 URL을 안전하게 처리한다.

작업:

- [완료] `@astrojs/sitemap`으로 sitemap 생성
- [완료] `robots.txt`, `ads.txt`, 네이버 검증 HTML이 빌드 결과에 포함됨
- [완료] `post.html` 호환 endpoint에서 Content Collections 기반 `id -> /ko/blog/{slug}/` 매핑을 빌드 시 생성
- [완료] `/blog.html`, `/post.html`, `/privacy.html`, `/terms.html`, `/about/` 정적 호환 페이지 적용
- [완료] sitemap에서 `/`, `/about/`, `/ko/blog/0XX/` 같은 redirect-only URL 제외
- [완료] `robots.txt` sitemap 경로를 `sitemap-index.xml`로 확정
- [부분 완료] 홈과 블로그 상세 JSON-LD 구조화 데이터 추가
- [대기] RSS 피드 필요 여부 검토

완료 기준:

- sitemap에 언어별 홈, 법적 페이지, 블로그 글이 포함된다.
- 기존 핵심 URL 접근 시 신규 URL로 이동하거나 canonical이 명확하다.
- Search Console/Naver/AdSense 검증 파일이 배포 결과에 포함된다.

### Phase 7. 테스트 갱신 — 부분 완료

목표:

- Astro 전환 후 깨진 경로와 SEO 회귀를 자동으로 잡는다.

작업:

- [완료] 기존 `tests/e2e/test_pages.py`는 레거시 baseline으로 유지
- [완료] Astro 신규 URL 검증용 `tests/e2e/test_astro_pages.py` 추가
- [완료] 블로그 상세 샘플 1개 이상에서 title/meta/canonical/og:image 확인
- [완료] Astro 산출물 E2E에 기존 URL 호환 이동 검증 추가
- [완료] 빌드 산출물 HTML 검사 스크립트 추가: `tests/unit/test_dist_static_html.js`
- [완료] Content Collections schema 검증 실패를 빌드 실패로 연결
- [완료] Markdown/에셋 무결성 검사를 `src/content/blog` 기준으로 갱신

권장 검증 명령:

```bash
npm test
```

완료 기준:

- 빌드가 성공한다.
- 주요 페이지 e2e가 통과한다.
- 블로그 포스트 누락, slug 중복, 필수 메타 누락을 자동 검출한다.

### Phase 8. 정리 — 부분 완료

목표:

- 더 이상 쓰지 않는 바닐라 JS/HTML 구조를 제거하거나 보관한다.

작업:

- [결정] `js/data-loader.js`, `js/i18n.js`, `js/components.js`, `js/main.js`, `js/blog.js`는 배포 안정화 전까지 레거시 baseline용으로 유지
- [결정] 기존 HTML 파일은 배포 안정화 전까지 레거시 baseline용으로 유지
- [완료] `data/posts.json`은 `npm run posts:sync`로 생성하는 레거시 호환 산출물로 전환
- [결정] `ops/burst_version.py`는 레거시 baseline용으로만 유지하며 Astro 작업에서는 사용하지 않는다
- [완료] 문서와 워크플로우 갱신: `AGENTS.md`, `CLAUDE.md`, `.agent/workflows/add-post.md`, `.agent/workflows/rundev.md`

완료 기준:

- 새 포스트 추가 절차가 Astro 기준으로 정리되어 있다.
- 캐시 버스팅 수동 증가 작업이 필요 없다.
- 레거시 파일의 보관/삭제 기준이 명확하다.

## 9. 권장 PR 분할

### PR 1. Astro 기반 공존 구조 — 완료

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

현재 PR 1 범위는 완료되었고 `npm test`가 통과한다.

### PR 2. 기존 URL 호환 레이어 — 완료

목표:

- 기존 검색/공유 유입 URL이 신규 Astro URL로 안전하게 이어지도록 한다.

포함:

- `/blog.html` -> `/ko/blog/`
- `/post.html?id=N` -> `/ko/blog/{id}/` 또는 slug 전환 후 `/ko/blog/{slug}/`
- `/privacy.html?lang=en` -> `/en/privacy/`
- `/terms.html?lang=ja` -> `/ja/terms/`
- `/about/` -> `/ko/about/`
- 호환 페이지 또는 호스팅 301 리다이렉트 방식 결정
- E2E에 기존 URL 호환 검증 추가

현재 PR 2 범위는 정적 호환 HTML 방식으로 완료되었다. `npm run build` 산출물에 `/blog.html`, `/post.html`, `/privacy.html`, `/terms.html`, `/about/`이 포함되며, `npm test`가 통과한다. Cloudflare Pages에서는 경로 기반 URL을 `public/_redirects`로 301 처리하고, query 기반 URL은 Pages Functions 또는 현재 정적 HTML fallback 중 하나로 운영한다.

### PR 3. 블로그 slug와 Content Collections — 완료

목표:

- 블로그 데이터의 단일 기준을 Astro Content Collections로 옮긴다.

포함:

- `posts/*.md` -> `src/content/blog/*.md`
- `src/content.config.ts` schema 추가
- 모든 포스트에 `slug`, `id`, `summary`, `category`, `date`, `updatedAt`, `thumbnail`, `ogImage` 정규화
- `legacy-post-map.json` 또는 동등한 `id -> slug` 매핑 추가
- `/ko/blog/{slug}/`를 canonical로 사용

현재 PR 3 범위는 완료되었다. Astro 블로그는 `data/posts.json` 없이 Content Collections에서 렌더링하며, `/post.html?id=N`과 `/ko/blog/0XX/`는 canonical slug URL로 이동한다.

### PR 4. 배포/SEO 마무리와 레거시 정리 — 완료

목표:

- 실제 배포 산출물 기준으로 검색/공유/검증 파일을 확정하고 레거시 구조를 정리한다.

포함:

- sitemap 개별 URL 포함 검사
- robots sitemap 경로 최종 확정
- Search Console/Naver/AdSense 검증 파일 포함 확인
- 더 이상 쓰지 않는 `js/*.js`, 루트 HTML, `ops/burst_version.py` 보관/삭제 결정
- `AGENTS.md`, `.agent/workflows/*`를 Astro 기준으로 최종 갱신

현재 PR 4 범위는 완료되었다. `tests/unit/test_dist_static_html.js`와 Astro E2E가 sitemap/robots/검증 파일/legacy redirect를 확인한다. 루트 레거시 파일은 삭제하지 않고 baseline 검증용으로 유지하는 것으로 결정했다.

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
