# Sentry 연동 및 사용자 분석 설정 (2026-03-31)

본 문서는 브랜드 페이지 내 사용자 방문 및 서비스 관심도(클릭) 분석을 위한 Sentry 연동 작업 내역을 기록합니다.

## 1. 프로젝트 정보
- **Organization**: `east-fever`
- **Project**: `eastfever-page`
- **Platform**: `javascript` (Vanilla JS)
- **DSN**: `https://af3e882da224a7237d22a6aca33e149f@o4510979889889280.ingest.us.sentry.io/4511137831387136`

## 2. 주요 변경 사항

### A. Sentry SDK 초기화 (index.html)
- 최신 Sentry 브라우저 SDK(8.54.0) 로드 및 초기화 코드 추가.
- `tracesSampleRate`를 1.0으로 설정하여 성능 모니터링 활성화.
- `replayIntegration`을 추가하여 사용자 행동 리플레이 기능(세션 리플레이) 활성화.

### B. ID 기반 앱 클릭 추적 (js/components.js & js/main.js)
- **ID 부여**: `js/components.js`의 `createServiceCard`에서 '방문하기' 버튼에 `data-id="${service.id}"` 속성을 추가하여 언어 설정에 관계없이 일관된 데이터 수집 가능.
- **이벤트 캡처**: `js/main.js`의 `setupAnalytics()`에서 `app_id` 기반의 클릭 이벤트를 캡처하도록 구현.

### C. 추적 이벤트 명세
Sentry로 전송되는 주요 커스텀 메시지와 태그 구조입니다.

| 이벤트 명 (Message) | 태그 (Tags) | 설명 |
| :--- | :--- | :--- |
| `Page Visit: [Lang]` | `referrer`, `resolution`, `language` | 페이지 최초 접속 시 메타데이터 포함 수집 |
| `App Interest: [app_id]` | `action: click_visit`, `app_id`, `app_name` | '방문하기' 버튼 클릭 시 앱 ID와 이름 수집 |
| `Connect Interest: [label]` | `action: click_sns`, `sns_label` | SNS 채널 링크 클릭 시 채널 종류 수집 |
| `Brand Logo Click` | `action: click_home` | 로고를 통한 홈 이동 횟수 수집 |

## 3. 분석 가이드 (Sentry 활용법)
- **전체 클릭 횟수**: `action:click_visit` 쿼리로 조회.
- **앱별 인기 순위**: `app_id` 기준으로 이벤트를 그룹화하여 통계 확인.
- **사용자 기기 정보**: `extra.resolution` 또는 Sentry 기본 수집 데이터(Browser, OS) 활용.

---
*Last Updated: 2026-03-31*
