# 블로그 포스트 본문 중앙 정렬 기능 추가 계획

블로그 포스트(특히 @[028.md](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/src/content/blog/028.md)와 같이 모바일 최적화된 콘텐츠)의 가독성을 높이기 위해, 포스트별로 텍스트 정렬을 설정할 수 있는 기능을 추가하고, 네이버 블로그 가져오기 도구(`ops/import_naver_blog.py`)가 이를 자동으로 감지하도록 개선합니다.

## 제안 사항

현재 모든 블로그 포스트는 `.markdown-body` 스타일을 통해 기본적으로 왼쪽 정렬(`text-align: left`)이 적용되어 있습니다. 하지만 네이버 블로그 스타일의 짧은 문장 중심 콘텐츠는 중앙 정렬이 더 어울리는 경우가 많습니다.

이를 위해:
1. 포스트의 **Frontmatter**에 `textAlign` 속성을 추가하고, 이를 Astro 컴포넌트에서 동적으로 적용합니다.
2. **Naver Blog Importer**를 수정하여 원문 블로그의 정렬 상태(주로 `se-text-align-center`)를 자동으로 파악해 Frontmatter에 반영합니다.

## 변경 사항

### 1. [Astro Content Config] [content.config.ts](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/src/content.config.ts)
- `blog` 컬렉션 스키마에 `textAlign` 필드 추가 (`z.enum(['left', 'center', 'right']).optional()`).

### 2. [Site Library] [site.ts](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/src/lib/site.ts)
- `PostMeta` 타입 정의에 `textAlign?: 'left' | 'center' | 'right'` 추가.

### 3. [Blog Template] [[slug].astro](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/src/pages/ko/blog/[slug].astro)
- `#post-body` 요소에 `style={{ textAlign: post.textAlign }}` 적용. (기본값은 CSS에 정의된 대로 left)

### 4. [Import Tool] [import_naver_blog.py](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/ops/import_naver_blog.py)
- `build_markdown_body` 및 컴포넌트 파싱 로직에서 정렬 클래스(`se-text-align-center` 등)를 감지하도록 수정.
- 포스트 전체의 지배적인 정렬 상태를 계산하여 `ParsedPost` 및 최종 마크다운의 Frontmatter에 `textAlign` 필드 추가.

### 5. [Blog Content] [028.md](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/src/content/blog/028.md)
- Frontmatter에 `textAlign: center` 추가.

## 검증 계획

### 수동 확인
- `npm run dev` 실행 후 `/ko/blog/vibe-coding-ai-tools-one-month-review/` 페이지 접속하여 중앙 정렬 확인.
- `python3 ops/import_naver_blog.py [URL] --dev-story` 실행 시 생성된 마크다운에 `textAlign: center`가 자동으로 들어가는지 확인 (중앙 정렬된 원본 기준).
- 다른 포스트(027.md 등)는 여전히 왼쪽 정렬을 유지하는지 확인.
