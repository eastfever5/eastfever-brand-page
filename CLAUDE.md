# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 개발 서버

로컬 HTTP 서버를 8081 포트로 실행:
```bash
python3 -m http.server 8081 --directory .
```

모바일 테스트용 로컬 네트워크 IP 확인:
```bash
ipconfig getifaddr en0 || ipconfig getifaddr en1
```

에이전트 워크플로우로도 실행 가능: `.agent/workflows/rundev.md`

## 테스트

**유닛 테스트** (npm으로 `jsdom` 설치 필요):
```bash
node tests/unit/test_i18n.js
node tests/unit/test_markdown.js
```

**E2E 테스트** (8081 포트에 개발 서버 실행 중이어야 하며 Playwright 설치 필요):
```bash
python3 tests/e2e/test_pages.py
```

## 캐시 버스팅

CSS 또는 JS 파일 수정 후, 모든 HTML 파일의 `?v=N` 쿼리 파라미터를 일괄 증가:
```bash
python3 ops/burst_version.py
```

## 아키텍처

**빌드 과정 없는 바닐라 HTML/CSS/JS 정적 사이트** — 프레임워크, 번들러 없이 파일을 그대로 서빙한다.

### 데이터 레이어

모든 콘텐츠는 `data/` 폴더에 위치:
- `data/data.json` — 사이트 전체 콘텐츠 (히어로 텍스트, 키워드, 서비스, SNS 링크) — 언어별(`ko`/`en`/`ja`) 키로 구분
- `data/posts.json` — 블로그 포스트 인덱스 (id, 제목, 요약, 카테고리, 날짜)

`js/data-loader.js` 모듈이 런타임에 Fetch API로 이 데이터를 불러온다.

### 다국어(i18n)

`js/i18n.js`가 모든 다국어 동작을 담당한다. `window.efI18n`을 노출하며 `setLanguage(lang)`, `updateUI()` 메서드를 제공한다. 언어 설정은 `localStorage`에 저장된다. 지원 언어: 한국어(`ko`), 영어(`en`), 일본어(`ja`).

사용자에게 보이는 문자열은 반드시 `data/data.json`에서 가져와야 한다 — HTML이나 JS에 직접 하드코딩 금지.

### JavaScript 모듈

각 HTML `<head>`에 `?v=N` 캐시 버스팅 파라미터와 함께 스크립트를 개별 로드한다. 모듈 번들러가 없으므로 **로드 순서가 중요**하다:
1. `data-loader.js` — `i18n.js`, `components.js`보다 먼저 로드해야 함
2. `i18n.js` — `dataLoader`에 의존
3. `components.js` — 서비스 카드, 마퀴, SNS 섹션 렌더링
4. `main.js` — 앱 초기화 및 타이핑 효과
5. `modal.js` / `blog.js` — 페이지별 스크립트

### 블로그 시스템

블로그 포스트는 `posts/` 폴더의 마크다운 파일 (예: `001.md`, `022.md`). 포스트 추가 시 반드시 `data/posts.json` 인덱스도 함께 업데이트해야 한다. `post.html`은 URL의 `?id=N`을 읽어 해당 마크다운을 `marked.js`로 렌더링한다.

새 포스트 추가는 `.agent/workflows/add-post.md` 워크플로우를 따른다: `posts/0XX.md` 생성 후 `data/posts.json`에 항목 추가. 블로그 페이지는 한국어 전용.

### CSS 구조

- `css/style.css` — 기본 스타일 및 데스크톱 레이아웃
- `css/mobile.css` — 반응형 오버라이드 (브레이크포인트: 768px)
- `css/blog.css` — 블로그 전용 스타일

디자인 토큰은 `style.css`의 `:root`에 CSS 커스텀 프로퍼티로 정의되어 있다.

### 페이지 목록

| 파일 | 설명 |
|------|------|
| `index.html` | 홈 — 다국어 지원 |
| `blog.html` | 블로그 목록 — 한국어 전용 |
| `post.html` | 블로그 포스트 뷰어 — 한국어 전용, `?id=N` 사용 |
| `about/index.html` | 어바웃 페이지 — 한국어 전용 |
| `privacy.html` / `terms.html` | 법적 고지 — 다국어 지원, `marked.js`로 렌더링 |
