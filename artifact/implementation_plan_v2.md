# 추가 요구 사항 반영 및 모바일 최적화 수정 계획 (v2.1)

사용자의 피드백을 반영하여 모바일 환경에서의 UI 배치를 전면 수직 스택 구조로 재설계하고, 블로그 상세 페이지 및 푸터의 접근성을 개선합니다.

## User Review Required

> [!IMPORTANT]
> **모바일 UI 스택 구조**: 모바일에서 상단 요소들이 `이메일 주소 -> 메뉴바 -> 히어로 섹션` 순서로 일관되게 배치되도록 강제합니다.
> **블로그 제목 중앙 집중**: 우측에 치우쳐 보일 수 있는 블로그 제목 영역을 화면 중앙으로 이동시키고 본문과의 가독성을 확보합니다.

## Proposed Changes

### 1. 푸터 링크 강화 및 전용 CSS 분리
#### [MODIFY] [공통 HTML 파일들](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/)
- `index.html`, `blog.html`, `post.html`, `about/index.html`, `privacy.html`, `terms.html`
- 푸터 하단 바에 `이용약관`(`terms.html`) 및 `개인정보처리방침`(`privacy.html`) 링크를 텍스트로 명시하여 크롤러 및 사용자 접근성 강화.
- `<link rel="stylesheet" href="/css/mobile.css" media="screen and (max-width: 767px)">` 일괄 추가.

#### [NEW] [css/mobile.css](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/css/mobile.css)
- `style.css`와 `blog.css`에서 미디어 쿼리 내용을 축출하여 리팩토링.
- **모바일 네비게이션 레이아웃 강제**:
    - **최상단 고정**: 로고(좌측) 및 **언어 선택기(우측 상단 고정)** 유지.
    - 그 아래 **이메일 주소** 전용 행 배치.
    - 그 아래 **독립적인 메뉴바**(Home | About | Dev Story) 전용 섹션 배치.
    - 전체가 히어로 섹션 바로 위에 오도록 수직 스택 구조 형성.

### 2. 블로그 상세 페이지 (`post.html`) 레이아웃 조정
#### [MODIFY] [post.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/post.html)
- 제목(`h1`)과 메타 정보(`date`, `category`)를 감싸는 헤더가 화면 가로의 **중앙**에 배치되도록 CSS 및 마크업 보정.
- 제목 바로 아래에서 본문 텍스트가 자연스럽게 이어지도록 여백 재설정.

### 3. 모바일 전용 메뉴바 세부 구현
#### [MODIFY] [index.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/index.html) 및 헤더 컴포넌트
- 모바일에서 `nav-menu`가 이메일 주소(`header-email`)보다 **아래**에 오도록 DOM 구조 또는 Flex/Grid order 적용.
- 사용자의 시선이 `이메일 -> 메뉴바 -> 히어로` 순으로 흐르도록 배치.

## Verification Plan

### Automated/Tool Verification
- **브라우저 테스트**: `rundev` 실행 후 모바일 모드(375px~430px)에서 전수 점검.
    - 푸터 하단에서 새 링크(약관/정보방침) 확인.
    - 블로그 포스트(`post.html?id=1`) 제목의 중앙 정렬 확인.
    - 모바일 상단 네비게이션의 배치 순서(`이메일` 아래 `메뉴바` 확인).

### Manual Verification
- 실제 iOS/Android 기기 뷰포트에서 메뉴바 터치 조작성 확인.
