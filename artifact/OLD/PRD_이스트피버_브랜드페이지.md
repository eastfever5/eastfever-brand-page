# 이스트피버 브랜드 페이지 PRD

> **프로젝트**: eastfever.com 브랜드 페이지 구축
> **목적**: 앱 개발자 '이스트피버' 브랜딩 및 서비스 소개
> **도메인**: `eastfever.com` (루트 도메인)
> **최종수정**: 2026-03-19

---

## 1. 프로젝트 개요

이스트피버(EastFever) 브랜드의 공식 웹 페이지를 구축한다.
개발자 브랜딩, 서비스 링크 모음, SNS 연결, 문의처 안내를 목적으로 한다.

---

## 2. 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| **기본 구조** | HTML5 + Vanilla CSS + JavaScript (ES6+) | 외부 프레임워크 의존 없이 경량 유지, Cloudflare 정적 호스팅 최적 |
| **i18n** | 자체 JSON 기반 i18n (별도 라이브러리 미사용) | 단일 JSON 파일로 다국어 문자열 관리, 의존성 최소화 |
| **빌드 도구** | 없음 (순수 정적 파일) | 빌드 파이프라인 복잡도 제거, 즉시 배포 가능 |
| **배포** | Cloudflare Pages | 루트 도메인 배포, 글로벌 CDN, 자동 HTTPS |
| **다크 모드** | 미지원 | 라이트 모드 단일 테마로 유지 |

> **i18n URL 구조**: URL 변경 없이 클라이언트 사이드에서 언어 전환 (예: `eastfever.com` 유지, 선택 언어는 `localStorage`에 저장)

---

## 3. SEO 요구사항

### 3.1 기본 메타 태그
- `<title>`: 언어별 문자열 지원
- `<meta name="description">`: 언어별 설명문 (JSON에서 관리)
- `<meta name="robots" content="index, follow">`
- `<link rel="canonical" href="https://eastfever.com">`

### 3.2 Open Graph (OG) 태그
```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://eastfever.com">
<meta property="og:title" content="[언어별 타이틀]">
<meta property="og:description" content="[언어별 설명]">
<meta property="og:image" content="https://eastfever.com/og-image.png">
<meta property="og:locale" content="[현재 언어]">
```

### 3.3 추가 SEO 파일
- `sitemap.xml` 제공
- `robots.txt` 제공 (UTF-8 without BOM)
- `favicon.ico` 및 `apple-touch-icon.png` 제공

---

## 4. 반응형 디자인 브레이크포인트

| 디바이스 | 기준 너비 |
|----------|-----------|
| 모바일 | `~767px` |
| 태블릿 | `768px ~ 1023px` |
| 데스크탑 | `1024px~` |

---

## 5. 디자인 요구사항

- **메인 컬러**: 하늘색 계열
- **분위기**: 차분하고 따뜻한 감성
- **애니메이션**: 은은한 효과로 호기심 자극 (과하지 않게)
- **다크 모드**: 미지원 (라이트 모드 단일 테마)
- **폰트**: Google Fonts 활용 (한/영/일 모두 지원 가능한 폰트 조합)
- **카드 UI**: 서비스 링크는 카드 형태로 제공

---

## 6. 페이지 영역 구성

### 6.1 히어로 섹션 (Hero Section)
- **페이지 메인 문구** (페이드인 + 스케일업 애니메이션)
  - `"Beyond Here, Another World"`
  - `"안녕하세요. 이스트(동)피버(열)의 앱 개발 공작소에 오신 것을 환영합니다"`
- **안내 문구** (비주얼 노블 스타일 타이핑 효과)
- **주요 키워드 나열** (Marquee 효과, 무한 가로 스크롤)
- **언어 변경** (우측 상단 드롭다운, 🌐 아이콘 + 언어명)

### 6.2 서비스 섹션 (Service Section)
카드 형태로 각 서비스 표시. 수집된 실제 서비스 자산을 활용한다.

**웹앱**
| 서비스 | URL | 설명 | 상태 | 썸네일 자산 |
|--------|-----|------|------|----------|
| 신묘한 만세력 | https://sinmyo.eastfever.com | AI 사주 상담 프롬프트 생성 | 운영중 | `assets/sinmyo-thumb.png` (OG) |
| 마훼카 | https://mfc.eastfever.com | 편리한 복붙 창고 | 운영중 | `assets/mfc-thumb.webp` (OG) |

**모바일 게임**
| 서비스 | URL | 설명 | 상태 | 썸네일 자산 |
|--------|-----|------|------|----------|
| 하이하이 | https://apps.apple.com/us/app/하이-하이/id1511662492?l=ko | 2D 캐주얼 플랫포머 지렁이 액션 | 운영중 | `assets/hihi-thumb.png` (AppStore) |
| 인생낱말찾기 | https://apps.apple.com/us/app/인생낱말찾기/id1521387913?l=ko | 낱말 찾기 퍼즐 게임 | 운영중 | `assets/insaeng-thumb.png` (AppStore) |

**카드 구성 요소**
- 서비스 아이콘 / 썸네일 이미지 (수집된 자산 우선 사용)
- 서비스 이름 (다국어)
- 형식 배지 (웹앱 / 모바일 게임)
- 상태 배지 (운영중 / 개발중 / 점검중)
- 간략 설명 (다국어)
- 링크 이동 버튼

### 6.3 SNS 섹션 (SNS Section)
- 스레드: https://www.threads.com/@five_east_fever
- 네이버 블로그: https://blog.naver.com/five_east_fever

### 6.4 인포 섹션 (Info Section)
- **문의 및 제안**: 이메일 링크 (`mysticodoi@gmail.com`)
- **개인정보보호방침**: 버튼 또는 텍스트 링크 클릭 시 **모달 팝업**으로 표시
  - 대상 앱: 신묘한 만세력, 하이하이, 인생낱말찾기 공통 방침 재작성
  - 수집 항목, 이용 목적, 보관 기간, 제3자 제공 여부 포함
  - 다국어 지원 (한/영/일)

---

## 7. 다국어 지원 (i18n)

### 7.1 지원 언어
| 코드 | 언어 |
|------|------|
| `ko` | 한국어 (기본) |
| `en` | 영어 |
| `ja` | 일본어 |

### 7.2 언어 전환 방식
- 우측 상단 드롭다운 (🌐 아이콘 + 선택된 언어명 표시)
- 선택 언어는 `localStorage`에 저장, 재방문 시 유지
- URL 구조 변경 없음 (`eastfever.com` 고정)
- OG 태그는 기본 언어(한국어)로 고정

### 7.3 다국어 적용 범위
- 페이지 타이틀, 메타 설명
- 히어로 메인 문구, 안내 문구
- 서비스 이름, 서비스 설명
- 섹션 제목, 버튼 텍스트
- 개인정보보호방침 전문
- 주요 키워드

---

## 8. JSON 데이터 관리

단일 JSON 파일 (`data.json`) 하나로 모든 동적 문자열 관리.

### 8.1 구조 예시

```json
{
  "meta": {
    "ko": { "title": "...", "description": "..." },
    "en": { "title": "...", "description": "..." },
    "ja": { "title": "...", "description": "..." }
  },
  "hero": {
    "mainText": { "ko": "...", "en": "...", "ja": "..." },
    "subText":  { "ko": "...", "en": "...", "ja": "..." }
  },
  "keywords": {
    "ko": ["#이스트피버", "#신묘한만세력", "..."],
    "en": ["#EastFever", "#Sinmyo", "..."],
    "ja": ["#イーストフィーバー", "..."]
  },
  "services": [
    {
      "id": "sinmyo",
      "type": "webapp",
      "status": "active",
      "url": "https://sinmyo.eastfever.com",
      "name": { "ko": "신묘한 만세력", "en": "Sinmyo", "ja": "神妙な万歳暦" },
      "description": { "ko": "...", "en": "...", "ja": "..." },
      "thumbnail": "assets/sinmyo-thumb.png"
    }
  ],
  "sns": [
    { "id": "threads", "label": "Threads", "url": "https://www.threads.com/@five_east_fever" },
    { "id": "naver-blog", "label": "Naver Blog", "url": "https://blog.naver.com/five_east_fever" }
  ],
  "contact": {
    "email": "mysticodoi@gmail.com"
  },
  "privacy": {
    "ko": "...",
    "en": "...",
    "ja": "..."
  }
}
```

---

## 9. 컴포넌트 명세

| 컴포넌트 | 설명 |
|----------|------|
| `LanguageDropdown` | 우측 상단 언어 선택 드롭다운. 🌐 아이콘 + 현재 언어명 표시 |
| `HeroSection` | 메인 문구(페이드인), 안내 문구(타이핑), 키워드 Marquee |
| `ServiceCard` | 썸네일, 이름, 형식/상태 배지, 설명, 링크 버튼, 호버 미리보기 |
| `SnsCard` | SNS 아이콘 + 이름 + 링크 |
| `PrivacyModal` | 개인정보보호방침 전문 모달 팝업. 닫기 버튼 및 배경 클릭으로 닫힘 |
| `MarqueeBar` | 주요 키워드 무한 가로 스크롤 |
| `Footer` | 문의 이메일, 개인정보보호방침 링크, 저작권 표기 |

---

## 10. 파일 구조 (예상)

```
eastfever-brand-page/
├── index.html
├── robots.txt
├── sitemap.xml
├── css/
│   └── style.css
├── js/
│   ├── main.js          # 진입점, 초기화
│   ├── i18n.js          # i18n 처리 로직
│   ├── components.js    # 컴포넌트 렌더링
│   └── modal.js         # 모달 팝업 처리
├── data/
│   └── data.json        # 모든 동적 문자열 및 서비스 데이터
├── assets/
│   ├── og-image.png
│   ├── favicon.ico
│   └── [service-thumbnails]/
└── doc/
    └── 이스트피버 브랜드 페이지 PRD.md
```

---

## 11. 검증 계획

| 항목 | 방법 |
|------|------|
| SEO 태그 확인 | 브라우저 DevTools 및 [OG Debugger](https://developers.facebook.com/tools/debug/) |
| 반응형 확인 | Chrome DevTools 디바이스 에뮬레이터 (모바일/태블릿/데스크탑) |
| 다국어 전환 | 3개 언어 수동 전환 후 전체 텍스트 확인 |
| 개인정보방침 모달 | 모달 열기/닫기, 배경 클릭 닫힘, 다국어 전환 확인 |
| Cloudflare 배포 | Pages 배포 후 루트 도메인 접속 확인 |
| robots.txt / sitemap.xml | 직접 URL 접근으로 제공 여부 확인 |
