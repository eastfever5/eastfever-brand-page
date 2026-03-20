# 모바일 UI 고도화 및 언어 선택기 수정 계획서 (v4)

본 계획서는 About 및 Dev Story 페이지의 언어 선택기 문구 고정 및 모바일 환경에서의 헤더 구조 개선, 블로그 텍스트 최적화를 목표로 합니다.

## 주요 변경 사항

### 1. [공통] 언어 선택기 문구 수정
- **대상 페이지**: `/about/`, `blog.html`, `post.html`
- **변경 내용**: 해당 페이지들은 현재 한국어 콘텐츠만 제공하므로, 언어 선택 버튼의 문구를 선택된 언어에 관계없이 **"Korean Only"**로 표시하여 사용자 혼선을 방지합니다.
- **구현 방법**: `js/i18n.js`의 `updateUI` 함수에서 현재 URL을 체크하여 특정 페이지일 경우 문구를 강제 지정합니다.

### 2. [모바일] 헤더 이메일 배치 수정
- **변경 내용**: 이메일 주소를 로고(EastFever) 바로 아래에 배치하고 좌측 정렬합니다. 폰트 크기를 줄여 정갈한 느낌을 줍니다.
- **CSS 상세**:
    - `.header-container`의 `grid-template-areas`를 `logo lang`, `email lang`, `menu menu` 구조로 변경.
    - `.header-email`에 `justify-self: start`, `font-size: 0.75rem`, `margin-top: -0.25rem` 등을 적용.

### 3. [모바일] Dev Story 하단 문구 축소
- **대상**: 블로그 목록(`blog.html`) 및 메인 게시물 카드 내 요약문(`.blog-card-summary`)
- **변경 내용**: 모바일 화면에서의 가독성과 정보 밀도를 위해 요약 텍스트 크기를 기존 대비 **70%** 수준으로 축소합니다.
- **CSS 상세**: `mobile.css` 내 `.blog-card-summary` 또는 관련 요소에 `font-size: 0.7em` 적용.

## 상세 변경 파일

### [MODIFY] [i18n.js](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/js/i18n.js)
- `updateUI()` 내에 페이지 경로 체크 로직 추가 및 언어 버튼 텍스트 조건부 할당.

### [MODIFY] [mobile.css](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/css/mobile.css)
- `.header-container` Grid 레이아웃 수정.
- `.header-email` 스타일 조정.
- `.blog-card-summary` 폰트 크기 축소 속성 추가.

## 검증 계획

### 1. 자동 검증 (Browser Subagent)
- About 및 블로그 페이지 접속 시 언어 버튼이 "Korean Only"로 표시되는지 확인.
- 모바일 뷰포트(375px)에서 이메일 주소가 로고 아래 좌측 정렬되는지 확인.
- 블로그 목록의 요약 텍스트 크기가 축소되었는지 확인.

### 2. 수동 검증 요청
- 데스크톱 및 모바일 각 페이지의 헤더 균형 확인 부탁드립니다.
