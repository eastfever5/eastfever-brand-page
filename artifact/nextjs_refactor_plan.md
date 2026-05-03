# EastFever 브랜드 페이지 Next.js 리팩토링 계획서

작성일: 2026-05-03  
대상 저장소: `/Users/ep_macair/Documents/GitHub/eastfever-brand-page`

## 1. 목적

현재 EastFever 브랜드 페이지는 빌드 과정 없는 바닐라 HTML/CSS/JS 정적 사이트다. 구조가 단순한 장점은 유지하되, 향후 SEO 고도화, 언어별 라우팅, 블로그 글별 메타데이터, sitemap 자동화, 컴포넌트 재사용성을 위해 Next.js App Router 기반으로 단계적 리팩토링한다.

핵심 목표는 다음과 같다.

- 언어별 페이지가 초기 HTML부터 정확한 `title`, `description`, OG/Twitter 메타, `html lang`, canonical, `hreflang`을 갖도록 한다.
- 블로그 상세 페이지를 `post.html?id=N` 쿼리 기반에서 정적 slug 라우트로 전환해 글별 SEO 메타를 빌드 시점에 생성한다.
- 기존 정적 호스팅 방식을 유지할 수 있도록 Next.js `output: 'export'` 기반 배포를 우선 검토한다.
- 현재 디자인과 콘텐츠 톤은 유지하고, 구조와 SEO 생산성만 먼저 개선한다.

## 2. 현재 구조 요약

현재 주요 파일은 다음과 같다.

- `index.html`: 홈, 다국어 지원
- `blog.html`: 블로그 목록, 한국어 전용
- `post.html`: 블로그 상세, `?id=N` 기반 한국어 전용
- `about/index.html`: 어바웃, 한국어 전용
- `privacy.html`, `terms.html`: 법적 고지, 다국어 지원
- `data/data.json`: 홈/서비스/공통 문구/법적 문구/i18n 데이터
- `data/posts.json`: 블로그 포스트 인덱스
- `posts/*.md`: 블로그 본문 마크다운
- `js/i18n.js`: 런타임 언어 전환과 메타 태그 갱신
- `js/data-loader.js`, `js/components.js`, `js/main.js`, `js/blog.js`, `js/modal.js`: 런타임 렌더링
- `css/style.css`, `css/mobile.css`, `css/blog.css`: 전역 CSS
- `robots.txt`, `sitemap.xml`, `ads.txt`, `naverb37bc6141b6aa0ce1682ef1c8dd37842.html`: 검색/광고/검증용 정적 파일

현재 구조의 SEO 한계:

- 주요 메타데이터 일부가 JS 실행 후 갱신된다.
- `post.html?id=N` 구조에서는 글별 정적 HTML과 글별 메타를 만들기 어렵다.
- 언어별 URL이 분리되어 있지 않아 canonical/hreflang 구성이 제한된다.
- sitemap을 수동 관리해야 하며 블로그 포스트 추가 시 누락 위험이 있다.

## 3. 권장 목표 구조

Next.js App Router와 정적 export를 기준으로 다음 구조를 권장한다.

```text
app/
  [lang]/
    layout.tsx
    page.tsx
    privacy/page.tsx
    terms/page.tsx
  ko/
    about/page.tsx
    blog/page.tsx
    blog/[slug]/page.tsx
  layout.tsx
  globals.css
  robots.ts
  sitemap.ts
components/
  Header.tsx
  Footer.tsx
  LanguageSwitcher.tsx
  ServiceSection.tsx
  DevStoryList.tsx
  MarkdownBody.tsx
lib/
  i18n.ts
  metadata.ts
  posts.ts
  site.ts
content/
  data.json
  posts.json
  posts/*.md
public/
  assets/*
  ads.txt
  naverb37bc6141b6aa0ce1682ef1c8dd37842.html
next.config.js
package.json
tsconfig.json
```

비고:

- 기존 `/assets/...` URL을 유지하려면 현재 `assets/*`는 `public/assets/*`로 옮긴다.
- `robots.txt`, `sitemap.xml`은 Next metadata route로 생성하거나, 정적 export 제약이 생기면 빌드 전 생성 스크립트로 `public/`에 출력한다.
- 블로그는 한국어 전용 정책을 유지하되 URL은 `/ko/blog/[slug]`로 분리한다.

## 4. 라우팅 정책

권장 라우트:

| 현재 URL | 신규 URL | 정책 |
|---|---|---|
| `/` | `/ko` 또는 `/ko/` | 기본 한국어 홈으로 연결 |
| `/index.html` | `/ko` | 호환 리다이렉트 또는 canonical |
| `/blog.html` | `/ko/blog` | 블로그 목록 |
| `/post.html?id=26` | `/ko/blog/{slug}` | 포스트별 정적 라우트 |
| `/about/` | `/ko/about` | 한국어 전용 |
| `/privacy.html` | `/ko/privacy`, `/en/privacy`, `/ja/privacy` | 언어별 법적 페이지 |
| `/terms.html` | `/ko/terms`, `/en/terms`, `/ja/terms` | 언어별 법적 페이지 |

기존 URL 보존 전략:

1. 호스팅에서 리다이렉트를 지원하면 301 리다이렉트 규칙을 둔다.
2. 정적 호스팅만 가능하면 `public/blog.html`, `public/post.html`, `public/privacy.html`, `public/terms.html` 호환 페이지를 두고 canonical을 신규 URL로 지정한다.
3. `post.html?id=N`은 JS 리다이렉트 호환 페이지로 처리하되, SEO 기준 페이지는 반드시 `/ko/blog/[slug]`로 한다.

## 5. 데이터 모델 변경

### `content/data.json`

현재 `data/data.json`의 다국어 구조를 유지하되, 페이지별 SEO 데이터를 분리한다.

```json
{
  "seo": {
    "home": {
      "ko": {
        "title": "EastFever - Beyond Here, Another World",
        "description": "..."
      }
    },
    "privacy": {},
    "terms": {}
  }
}
```

### `content/posts.json`

현재 필드:

- `id`
- `title`
- `summary`
- `category`
- `date`
- `file`

추가 권장 필드:

- `slug`: URL용 고정 식별자
- `seoTitle`: 검색 결과용 제목, 없으면 `title` 사용
- `seoDescription`: 검색 결과용 설명, 없으면 `summary` 사용
- `ogImage`: 글별 대표 이미지, 없으면 기본 OG 이미지 사용
- `updatedAt`: 글 수정일이 생기면 sitemap `lastModified`에 사용

예시:

```json
{
  "id": 26,
  "slug": "ai-game-planning-4",
  "title": "AI와 함께하는 게임 기획(4)",
  "summary": "...",
  "seoTitle": "AI와 함께하는 게임 기획(4) - EastFever Dev Story",
  "seoDescription": "...",
  "category": "AI",
  "date": "2026-05-02",
  "updatedAt": "2026-05-02",
  "file": "026.md",
  "ogImage": "/assets/blog/026/image-01.png"
}
```

## 6. SEO 구현 방침

Next.js에서는 `metadata` 또는 `generateMetadata()`를 사용한다.

- 정적 페이지는 `metadata` 또는 공통 helper로 생성한다.
- 블로그 상세는 `generateMetadata({ params })`에서 slug에 해당하는 포스트 데이터를 읽어 생성한다.
- `alternates.canonical`과 `alternates.languages`로 canonical/hreflang을 구성한다.
- `openGraph.locale`은 `ko_KR`, `en_US`, `ja_JP`를 사용한다.
- `twitter.card`는 기본적으로 `summary_large_image`를 사용한다.
- 언어별 layout에서 `<html lang={lang}>`을 명확히 지정한다.

공통 helper 예시 위치:

- `lib/metadata.ts`

담당 역할:

- 사이트 기본 이름, URL, 기본 OG 이미지 관리
- 페이지별 title template 적용
- 언어별 canonical URL 생성
- 블로그 포스트 metadata 생성

## 7. 단계별 작업 계획

### Phase 0. 전환 기준 확정

목표:

- Next.js 전환 범위와 URL 정책 확정
- 정적 export 유지 여부 확정
- 기존 URL 호환 방식 확정

작업:

- `https://eastfever.com`의 실제 배포 환경이 순수 정적 호스팅인지 확인
- 301 리다이렉트 지원 여부 확인
- `/ko`, `/en`, `/ja` prefix 정책 확정
- 블로그 slug 규칙 확정

완료 기준:

- URL 매핑표가 확정되어 있다.
- 기존 검색 유입 URL에 대한 호환 방침이 정해져 있다.

### Phase 1. Next.js 스캐폴딩

목표:

- 기존 사이트를 훼손하지 않고 Next.js 프로젝트 기반을 추가한다.

작업:

- `package.json`, `next.config.js`, `tsconfig.json` 추가
- `app/layout.tsx`, `app/globals.css` 추가
- `next.config.js`에 `output: 'export'` 설정 검토
- 정적 export에서 이미지 최적화 제약이 생기면 `images.unoptimized = true` 또는 일반 `<img>` 사용
- 기존 CSS를 `app/globals.css`에서 우선 import하거나 내용을 이전

완료 기준:

- `npm run dev`로 빈 Next.js 페이지가 뜬다.
- `npm run build`가 성공한다.

### Phase 2. 콘텐츠 로더 이전

목표:

- 런타임 `fetch()` 중심 데이터 로딩을 빌드/서버 컴포넌트 중심으로 전환한다.

작업:

- `lib/i18n.ts`에서 지원 언어와 dictionary getter 구현
- `lib/posts.ts`에서 `posts.json`과 `posts/*.md` 읽기 구현
- `content/` 폴더로 데이터 이동 또는 기존 `data/`, `posts/` 유지 후 import 경로만 정리
- 마크다운 파서는 서버 렌더링 가능한 라이브러리로 교체한다.

완료 기준:

- 홈/서비스/블로그 데이터가 클라이언트 fetch 없이 서버 컴포넌트에서 렌더링된다.
- 빌드 결과 HTML에 주요 텍스트가 포함된다.

### Phase 3. 홈/공통 레이아웃 이전

목표:

- `index.html`의 시각 구조를 Next 컴포넌트로 이전한다.

작업:

- `Header`, `Footer`, `LanguageSwitcher` 구현
- 홈 hero, keywords marquee, services, SNS, contact 섹션 이전
- 언어 선택은 localStorage 기반 런타임 전환 대신 언어별 링크 이동으로 단순화
- 타이핑 효과가 꼭 필요하면 해당 부분만 client component로 분리

완료 기준:

- `/ko`, `/en`, `/ja` 홈이 현재 화면과 거의 동일하게 보인다.
- 각 언어 홈의 초기 HTML에 언어별 title/description이 들어 있다.

### Phase 4. 법적 페이지 이전

목표:

- `privacy.html`, `terms.html`을 언어별 정적 페이지로 이전한다.

작업:

- `/[lang]/privacy/page.tsx`
- `/[lang]/terms/page.tsx`
- 기존 `data/data.json`의 `privacy`, `terms` 마크다운을 사용
- 페이지별 metadata 생성

완료 기준:

- `/ko/privacy`, `/en/privacy`, `/ja/privacy`가 정상 렌더링된다.
- `/ko/terms`, `/en/terms`, `/ja/terms`가 정상 렌더링된다.

### Phase 5. 블로그 이전

목표:

- 블로그 목록과 상세를 SEO 친화적인 정적 페이지로 이전한다.

작업:

- `/ko/blog/page.tsx` 구현
- `/ko/blog/[slug]/page.tsx` 구현
- `generateStaticParams()`로 모든 포스트 slug 생성
- `generateMetadata()`로 포스트별 title/description/OG 이미지 생성
- `posts.json`에 slug/SEO 필드 추가
- 기존 `post.html?id=N` 링크를 신규 slug 링크로 전환

완료 기준:

- 모든 포스트가 고유 URL을 갖는다.
- 각 포스트 HTML에 포스트별 메타가 포함된다.
- 블로그 목록에서 상세 링크가 `/ko/blog/[slug]`로 연결된다.

### Phase 6. SEO 인프라 이전

목표:

- 검색엔진과 SNS 공유에 필요한 보조 자산을 자동화한다.

작업:

- `app/sitemap.ts` 또는 sitemap 생성 스크립트 구현
- `robots.txt` 유지 또는 `app/robots.ts` 구현
- canonical/hreflang 점검
- 기본 OG 이미지와 글별 OG 이미지 정책 확정
- `ads.txt`, 네이버 검증 HTML 유지

완료 기준:

- sitemap에 홈, 언어별 페이지, 블로그 글이 포함된다.
- Search Console/Naver/AdSense 검증 파일이 배포 결과에 포함된다.

### Phase 7. 호환 레이어와 정리

목표:

- 기존 URL 유입을 보존하고 바닐라 JS 구조를 제거한다.

작업:

- 기존 `.html` URL 호환 페이지 또는 호스팅 리다이렉트 적용
- 사용하지 않는 `js/*.js` 제거
- 사용하지 않는 기존 HTML 제거 또는 `legacy/` 보관
- 테스트 스크립트의 base URL과 경로를 Next 라우트 기준으로 수정

완료 기준:

- 기존 주요 URL 접속 시 신규 페이지로 이동하거나 canonical이 명확하다.
- 더 이상 런타임 i18n JS가 SEO 메타를 책임지지 않는다.

## 8. 검증 계획

자동 검증:

```bash
npm run build
npm run dev
python3 tests/e2e/test_pages.py
node tests/unit/test_i18n.js
node tests/unit/test_markdown.js
```

Next.js 전환 후 테스트 보강:

- `tests/e2e/test_pages.py`의 대상 URL을 `/ko`, `/en`, `/ja`, `/ko/blog`, `/ko/privacy`, `/en/privacy`, `/ja/privacy`로 갱신한다.
- 블로그 상세 1개 이상을 샘플로 열어 title/meta/canonical을 확인한다.
- 빌드 산출물의 HTML을 대상으로 `title`, `description`, `og:title`, `og:description`, `canonical`, `hreflang` 존재 여부를 검사하는 스크립트를 추가한다.

수동 검증:

- Chrome에서 데스크톱/모바일 레이아웃 비교
- SNS 공유 디버거 또는 OG 검사기로 대표 페이지 확인
- Search Console sitemap 제출 전 로컬 sitemap 내용 확인
- 기존 `/blog.html`, `/post.html?id=N`, `/privacy.html`, `/terms.html` 접근 경로 확인

## 9. 주요 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 기존 URL 변경 | 검색 유입 손실 | 301 리다이렉트 또는 호환 HTML 제공 |
| 정적 export 제약 | 일부 Next 기능 사용 불가 | 서버 기능 없이 `generateStaticParams` 중심으로 구현 |
| 이미지 최적화 제약 | 빌드/배포 오류 가능 | `next/image` 대신 `<img>` 또는 `images.unoptimized` 사용 |
| 블로그 slug 중복 | 빌드 충돌 | `posts.json` 검증 스크립트 추가 |
| 메타데이터 누락 | SEO 개선 효과 감소 | 빌드 산출물 HTML 검사 추가 |
| 디자인 회귀 | 기존 브랜드 인상 손상 | CSS 이전 후 화면 캡처 비교 |

## 10. 제외 범위

이번 리팩토링 계획의 1차 범위에서 제외한다.

- 대규모 디자인 리뉴얼
- CMS 도입
- 서버 런타임 또는 DB 도입
- 사용자 로그인, 관리자 기능
- 블로그 다국어화
- 동적 OG 이미지 생성 API

## 11. 참고 문서

- Next.js `generateMetadata`: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js static export: https://nextjs.org/docs/app/guides/static-exports
- Next.js App Router internationalization: https://nextjs.org/docs/app/guides/internationalization

## 12. 최종 완료 기준

리팩토링은 다음 조건을 만족하면 완료로 본다.

- Next.js App Router 기반으로 전체 주요 페이지가 렌더링된다.
- 정적 export 빌드가 성공한다.
- `/ko`, `/en`, `/ja` 홈이 언어별 SEO 메타를 초기 HTML에 포함한다.
- 블로그 상세 페이지가 포스트별 고유 URL과 포스트별 SEO 메타를 갖는다.
- 기존 핵심 URL에 대한 호환 또는 리다이렉트 정책이 적용되어 있다.
- sitemap/robots/ads/검색엔진 검증 파일이 배포 결과에 포함된다.
- 기존 테스트 또는 갱신된 테스트가 통과한다.
