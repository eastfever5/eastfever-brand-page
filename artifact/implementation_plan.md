# About 페이지 마크다운 렌더링 이슈 해결 계획

About 페이지(about/index.html)에서 데스크탑 환경 시 마크다운 문법이 HTML 태그로 변환되지 않고 일반 텍스트로 노출되는 문제를 해결합니다.

## 분석 결과
- **데이터 로딩 오류**: `DataLoader`가 `/data/data.json`을 호출할 때 서버 환경에 따라 `about/data/data.json`으로 잘못 해석되거나 404 오류(HTML 반환)가 발생하여 JSON 파싱 에러가 발생합니다.
- **스크립트 중단**: `await window.dataLoader.load()`에서 오류가 발생하거나 지연될 경우, 그 이후의 마크다운 페치 및 렌더링 로직이 실행되지 않거나 영향을 받을 수 있습니다.
- **렌더링 방식 시각화**: 브라우저 분석 결과 `#about-content` 내부가 `<h3>` 등의 태그가 아닌 텍스트 노드로만 구성되어 있음을 확인했습니다.

## Proposed Changes

### [Core JS]
#### [MODIFY] [data-loader.js](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/js/data-loader.js)
- `fetch` 경로를 현재 페이지 위치에 상관없이 루트를 참조하도록 보장하거나, 절대 경로가 어려운 환경을 위해 상대 경로 폴백 로직을 검토합니다.

### [About Page]
#### [MODIFY] [index.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/about/index.html)
- `i18n` 초기화와 마크다운 로딩 로직을 분리하여, 데이터 로딩 실패가 마크다운 렌더링에 영향을 주지 않도록 `try-catch` 구조를 강화합니다.
- `marked.parse` 호출 전 `marked` 라이브러리 로드 여부를 확인하는 방어 코드를 추가합니다.
- Frontmatter 제거 로직을 정규식으로 개선하여 더 견고하게 만듭니다. (post.html과 동일한 방식 적용)

## Verification Plan

### Automated Tests
- 브라우저 도구를 사용하여 `http://localhost:8083/about/index.html`에 접속.
- `#about-content` 내부에 `<h3>`, `<ul>`, `<li>` 등의 HTML 태그가 생성되었는지 확인.
- 콘솔에 `SyntaxError`나 `404` 에러가 더 이상 발생하지 않는지 확인.

### Manual Verification
- 데스크탑 뷰(1200px)와 모바일 뷰(500px) 모두에서 마크다운 스타일(헤더 간격, 굵기 등)이 정상적으로 적용되는지 확인.
