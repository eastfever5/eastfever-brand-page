# 블로그 포스트 정렬 기능 구현 결과

블로그 포스트 본문을 원하는 대로 정렬할 수 있는 기능을 추가하고, 네이버 블로그에서 글을 가져올 때 이 설정을 자동으로 감지하도록 시스템을 개선했습니다.

## 주요 변경 사항

### 1. 포스트별 정렬 제어 기능 추가
- **스키마 확장**: `src/content.config.ts`의 `blog` 컬렉션에 `textAlign` 필드(left, center, right)를 추가했습니다.
- **타입 정의**: `src/lib/site.ts`의 `PostMeta` 타입에 `textAlign` 속성을 반영했습니다.
- **템플릿 적용**: `src/pages/ko/blog/[slug].astro`에서 본문 렌더링 시 해당 스타일을 동적으로 적용합니다.

### 2. 네이버 블로그 가져오기 도구(`ops/import_naver_blog.py`) 개선
- **정렬 감지**: 스마트에디터의 `se-text-align-center` 등의 클래스를 분석하여 본문의 주요 정렬 상태를 파악합니다.
- **자동 반영**: 가져오기 시 감지된 정렬 상태를 생성되는 마크다운의 Frontmatter에 자동으로 기록합니다.

### 3. 콘텐츠 반영
- **[028.md](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/src/content/blog/028.md)**: 현재 포스트에 `textAlign: "center"`를 적용하여 중앙 정렬이 되도록 설정했습니다.

## 테스트 결과

- **스키마 검증**: `astro check` 등을 통해 스키마가 정상적으로 인식됨을 확인했습니다.
- **가져오기 도구**: 로컬 환경에서 정렬 감지 로직이 정상적으로 동작하도록 코드를 수정 및 보완했습니다. (기본값 설정 및 필드 순서 이슈 해결)

[태스크 리스트 확인하기 (task.md)](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/artifact/task.md)
