# 01_walkthrough_add_rankboard_card.md

## 작업 개요
메인 페이지의 웹앱(Web Apps) 섹션에 새롭게 런칭된 **점수 순위 계산기(RankBoard Maker)** 소개 카드를 추가하였습니다. 또한, 기존의 2개 카드에서 3개 카드로 늘어남에 따라 모바일 및 태블릿 화면의 스크롤 피로도를 줄이기 위해 모바일 뷰에서 카드가 가로 스크롤(Carousel/Scroll Snap)되도록 CSS를 개선하였습니다.

## 작업 상세 내용

### 1. 썸네일 리소스 연동
* [rank_board_maker](file:///Users/ep_macair/Documents/GitHub/rank_board_maker) 프로젝트의 `public/og-image.png` 파일을 본 프로젝트의 에셋 폴더 아래로 복사하였습니다.
  * 복사된 경로 (웹 배포용 및 로컬 테스트용):
    * [public/assets/rankboard-thumb.png](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/public/assets/rankboard-thumb.png)
    * [assets/rankboard-thumb.png](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/assets/rankboard-thumb.png)

### 2. 다국어 메타데이터 연동
* [data/data.json](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/data/data.json)의 `services` 배열에 새 웹앱 항목을 등록했습니다. 한국어, 영어, 일본어의 제목과 상세 설명을 설정하여 글로벌 사용자를 대응하도록 조치했습니다.
```json
    {
      "id": "rankboard",
      "type": "webapp",
      "status": "online",
      "url": "https://rank.eastfever.com/",
      "name": {
        "ko": "점수 순위 계산기",
        "en": "RankBoard Maker",
        "ja": "得점순위계산기"
      },
      "description": {
        "ko": "점수 리스트를 입력하면 실시간으로 정렬된 순위표와 백분율 기반의 랭크 분포를 생성해 주는 웹 도구",
        "en": "A web tool that generates a real-time sorted scoreboard and percentile-based rank distribution from a list of scores.",
        "ja": "得점 리스트를 입력하면 실시간으로 정렬된 순위표와 백분율 기반의 랭크 분포를 생성해 주는 웹 도구"
      },
      "thumbnail": "assets/rankboard-thumb.png"
    }
```

### 3. 반응형 가로 스크롤(Scroll Snap) CSS 구현
* 모바일 환경(최대 너비 767px 이하)에서 웹앱 그리드(.service-grid)가 수직 누적이 아닌 가로 스크롤 컨테이너로 동작하도록 [src/styles/mobile.css](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/src/styles/mobile.css)를 수정했습니다.
* **디테일한 모던 CSS 스냅 기법 적용**:
  * `display: flex !important;` 구조를 활용하여 가로 방향 정렬을 수립했습니다.
  * `scroll-snap-type: x mandatory !important;` 및 개별 카드 `.service-card`에 `scroll-snap-align: center !important;`를 추가하여 모바일 터치 스와이프 시 카드가 부드럽게 중심을 잡아 정렬되도록 디자인했습니다.
  * `margin-left: -1rem; margin-right: -1rem;`을 활용하여 모바일 화면 좌우 여백을 채우는 시원한 Full-width 스크롤을 구현하고, `scrollbar-width: none !important;` 설정으로 불필요한 스크롤바를 숨겨 미니멀한 감성을 연출했습니다.

## 테스트 및 검증 결과

### 1. 빌드 검증 (`npm run build`)
* Astro 정적 사이트 빌드 결과물이 정상적으로 빌드되었습니다.

### 2. 통합 및 E2E 테스트 검증 (`npm test`)
* **Unit Test & Asset Integrity Test**: 새로 추가된 `rankboard-thumb.png` 리소스 매핑 무결성이 온전히 통과되었습니다.
* **Astro E2E Page Tests**: 로컬 http 서버(Playwright 기반) E2E 테스트 역시 모든 페이지 리다이렉트와 모달 작동을 포함해 최종 `SUCCESS`를 기록하며 정상 수립되었습니다.
