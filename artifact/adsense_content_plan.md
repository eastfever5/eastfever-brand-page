# EastFever 브랜드 페이지 콘텐츠 보강 구현 계획서

구글 애드센스 승인을 위해 `eastfever.com` 브랜드 페이지에 **About 페이지**, **Dev Story(블로그) 섹션 20편**, **이용약관 페이지**를 추가합니다. 블로그 글은 한국어만 사용합니다.

---

## 선별된 블로그 글 20편

네이버 블로그 아카이브 37편 중, **콘텐츠 분량**, **주제 다양성**, **독자 가치**를 기준으로 20편을 선별했습니다.

| # | 원본 번호 | 제목 | 카테고리 | 선별 이유 |
|---|-----------|------|----------|-----------|
| 1 | 0003 | AI를 활용한 게임 개발 계획 | AI | AI 개발 프로세스 소개 |
| 2 | 0004 | [Unity] 버전이 바뀌어도 변하지 않을 개념들 | 강의 | 교육 콘텐츠, 분량 풍부(3.7KB) |
| 3 | 0008 | 최신 맥북 안드로이드 게임 실행 및 녹화 | 개발Tips | 실용 튜토리얼 |
| 4 | 0009 | AI 영상 분석으로 게임의 유저 이탈 구간 잡아내기 | AI | 실험 사례, 분량 풍부(4.7KB) |
| 5 | 0010 | 생존을 위해 외주 개발을 결심하다 | 개발Tips | 개발자 이야기 |
| 6 | 0011 | 바이브 코딩으로 브랜드 페이지 만들어 보기 | AI | 바이브코딩 체험기, 분량 최대(7.8KB) |
| 7 | 0012 | AI(Gemini)와 함께 수십년 묵은 장 트러블 극복하기 | AI | 일상 AI 활용 사례 |
| 8 | 0013 | 금융 자산 시세 자동 갱신 구글 시트 만들기 | AI | 실용 튜토리얼, 분량 풍부(8.8KB) |
| 9 | 0015 | 공짜로 쉽고 간단하게 웹 페이지 배포하기 | 개발Tips | 초보자 가이드 |
| 10 | 0016 | Gemini AI를 활용한 웹 서비스 프로토타입 만들기 | AI | AI 개발 사례 |
| 11 | 0025 | AI 제대로 써먹기 위해 공부해 볼만한 것들 | AI | 학습 자료 큐레이션 |
| 12 | 0026 | AI와 함께하는 게임 기획(1) | AI | 시리즈물 |
| 13 | 0027 | AI와 함께하는 게임 기획(2) | AI | 시리즈물 |
| 14 | 0030 | 2026년 개발 업계 대격변 | 브레인스토밍 | 인사이트 |
| 15 | 0031 | 무료 AI 사주 풀이 "신묘한 만세력" | 홍보 | 자사 서비스 소개 |
| 16 | 0032 | 바이브코딩, 개발 몰라도 가능? | 바이브개발 | 시리즈 시작 |
| 17 | 0033 | 바이브 코딩 도전, 쉽고 빠르게 시작하기 | 바이브개발 | 실전 가이드 |
| 18 | 0035 | AI와 함께하는 게임 기획(3) | AI | 시리즈 완결 |
| 19 | 0042 | 바이브코딩, 어떤 도구를 써야 하나요? | 바이브개발 | 도구 비교, 분량 풍부(6.1KB) |
| 20 | 0043 | 바이브 코딩 시작은 PRD 문서부터 | 바이브개발 | 실전 가이드 |

> [!NOTE]
> 0001번은 About 페이지 전용으로 사용하므로 Dev Story 20편에는 포함하지 않습니다.

---

## Proposed Changes

### 프로젝트 전체 구조 (변경 후)

```
eastfever-brand-page/
├── index.html              (수정) 네비게이션 메뉴 추가
├── blog.html               (신규) Dev Story 목록 페이지
├── post.html               (신규) 마크다운 렌더링용 단일 템플릿 페이지
├── terms.html              (신규) 이용약관 페이지
├── privacy.html            (신규) 개인정보처리방침 독립 페이지
├── robots.txt              (기존 유지)
├── Ads.txt                 (신규) 애드 센스 등록용
├── sitemap.xml             (수정) 새 페이지 URL 추가
├── about/
│   ├── index.html          (신규) About 페이지 (마크다운 렌더링)
│   └── about.md            (신규) About 콘텐츠 (Markdown)
├── css/
│   ├── style.css           (수정) 공통 네비게이션/Breadcrumbs 스타일
│   └── blog.css            (신규) 블로그 전용 스타일
├── js/
│   ├── ... (기존 유지)
│   └── blog.js             (신규) 블로그 목록 로딩/필터 로직
├── data/
│   ├── data.json           (기존 유지)
│   └── posts.json          (신규) 블로그 글 메타데이터 20편
└── posts/                  (신규 디렉토리)
    └── 001.md ~ 020.md     (신규) 개별 블로그 콘텐츠 (Markdown)
```

---

### 네비게이션 컴포넌트

#### [MODIFY] [index.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/index.html)

- `<header>` 영역에 네비게이션 메뉴 링크 추가: `Home`, `About`, `Dev Story`
- 기존 로고, 이메일, 언어 선택기는 그대로 유지
- 언어 선택기는 index.html에서만 노출 (About, Blog, Terms는 한국어 전용)

#### [MODIFY] [style.css](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/css/style.css)

- 네비게이션 메뉴 스타일 추가 (`.nav-menu`, `.nav-link`)
- 공통 헤더/푸터 스타일이 다른 페이지에서도 재사용 가능하도록 정리
- 현재 페이지 활성 표시 스타일 (`.nav-link.active`)

---

### About 페이지

#### [NEW] [about/index.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/about/index.html) + [about.md](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/about/about.md)

0001번 블로그 글을 기반으로 다음 내용을 포함하는 About 페이지를 작성합니다:

- **개발자 소개**: 이스트피버 / 2007년부터 PC·모바일 게임/앱 개발 경력
- **이스트피버 소개**: 앱 개발 공작소, 개인 개발 및 프리랜싱
- **주요 서비스**: 신묘한 만세력, 마훼카, 하이하이, 인생낱말찾기
- **협업 및 연락처**: 이메일, SNS
- 원문의 블로그 특화 표현을 공식 소개 페이지에 맞게 재구성

> [!IMPORTANT]
> 원문 내용을 기반으로 하되, 문장 구조와 표현을 전면 재작성하여 중복 콘텐츠 문제를 방지합니다.

---

### Dev Story (블로그) 섹션

#### [NEW] [blog.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/blog.html)

블로그 글 목록 페이지:
- 카테고리 필터 탭: `전체`, `AI`, `바이브개발`, `개발Tips`, `강의`, `기타`
- 카드 그리드 레이아웃 (기존 서비스 카드와 유사한 디자인)
- 각 카드: 제목 + 요약(2줄) + 카테고리 뱃지 + 날짜
- 클릭 시 개별 글 페이지로 이동
- Breadcrumbs: `Home > Dev Story`

#### [NEW] [blog.css](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/css/blog.css)

블로그 전용 스타일:
- 카테고리 필터 탭 스타일
- 블로그 카드 레이아웃
- 개별 글 페이지의 본문 타이포그래피 (article 스타일)
- 기존 브랜드 페이지 디자인 톤(스카이 블루 계열) 유지

#### [NEW] [blog.js](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/js/blog.js)

- `posts.json`에서 메타데이터 로딩
- 카테고리 필터링 로직
- 카드 동적 렌더링

#### [NEW] [posts.json](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/data/posts.json)

20편의 블로그 글 메타데이터:
```json
{
  "posts": [
    {
      "id": 1,
      "title": "AI를 활용한 게임 개발, 어떻게 접근해야 할까",
      "summary": "AI 시대에 맞는 게임 개발 프로세스를 7단계로 정리합니다...",
      "category": "AI",
      "date": "2026-01-04",
      "file": "001.md"
    },
    ...
  ]
}
```

#### [NEW] [posts/001.md ~ 020.md](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/posts/)

20개의 개별 블로그 글 Markdown 파일:
- 본문은 원문을 기반으로 **재작성** (중복 콘텐츠 방지)
   - 제목 변경 또는 보완
   - 문장 구조 재구성
   - 부가 설명 추가/보강
   - **최신 정보 업데이트** 또는 **브랜드 페이지 전용 인사이트** 추가하여 원본성 강화
- 네이버 블로그 특유의 표현(댓글, 이웃추가 등) 제거 및 가독성 개선

#### [NEW] [post.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/post.html)

Markdown 콘텐츠를 렌더링하기 위한 단일 템플릿 페이지:
- URL 파라미터(예: `?id=1`)를 통해 해당하는 `.md` 파일을 로드
- `marked.js` 라이브러리를 사용하여 Markdown을 HTML로 변환
- `posts.json` 메타데이터를 기반으로 `<title>`, `<meta description>`을 JS에서 동적 주입 (SEO)
- 공통 헤더, 푸터, 네비게이션 포함
- Breadcrumbs: `Home > Dev Story > [글 제목]`
- 가독성 높은 아티클 스타일 적용
- 하단에 "목록으로 돌아가기" 링크

---

### 이용약관 페이지

#### [NEW] [terms.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/terms.html)

현재 서비스 상황에 맞는 이용약관 페이지 (정적 HTML):
- 서비스 소개 및 목적
- 이용자의 의무
- 콘텐츠 저작권
- 면책 조항 (AI 생성 콘텐츠 관련)
- 약관 변경 고지
- 연락처 (mysticodoi@gmail.com)

---

### 개인정보처리방침 독립 페이지

#### [NEW] [privacy.html](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/privacy.html)

기존 `index.html`의 모달에만 있던 개인정보처리방침을 **독립 페이지로 분리** (정적 HTML):
- 크롤러가 직접 접근 가능한 별도 URL 확보 (애드센스 필수 조건)
- 기존 `data.json`의 privacy 내용을 정적 HTML로 작성
- 기존 모달은 유지하되, 모달 내에서 `privacy.html`로의 링크도 추가
- footer의 개인정보보호방침 버튼도 `privacy.html`로 링크하는 옵션 추가

---

### SEO 및 기타

#### [MODIFY] [sitemap.xml](file:///Users/ep_macair/Documents/GitHub/eastfever-brand-page/sitemap.xml)

새로 추가되는 페이지 URL을 모두 포함:
- `https://eastfever.com/about/`
- `https://eastfever.com/blog.html`
- `https://eastfever.com/terms.html`
- `https://eastfever.com/privacy.html`
- `https://eastfever.com/post.html?id=1` ~ `id=20`

---

## 디자인 가이드라인

>모든 새 페이지는 기존 브랜드 페이지의 디자인 톤을 유지합니다.

- **색상**: `--accent-color: #0ea5e9` (스카이 블루) 계열
- **폰트**: Outfit(영문 제목), Inter/Noto Sans KR(본문)
- **카드**: 라운드 코너(`1.25rem`), hover 시 상승 효과
- **배경**: `#f8fafc` (밝은 슬레이트)
- **모바일 반응형**: 768px 이하 단일 컬럼

---

## Ads.txt 파일 추가
> 사이트에 광고를 게재하려면 아래의 텍스트를 복사하여 각 ads.txt 파일에 붙여넣은 후 사이트의 루트 디렉터리에 업로드하세요. 기존 ads.txt 파일이 있는 경우에는 텍스트를 각 파일에 붙여넣기만 하면 됩니다.
- google.com, pub-8554521451326441, DIRECT, f08c47fec0942fa0

---

## Verification Plan

### 브라우저 테스트

로컬 개발 서버(`/rundev` 워크플로우 사용)를 구동한 상태에서 아래 항목을 브라우저로 직접 확인합니다:

1. **네비게이션 동작 확인**
   - `index.html` → About, Dev Story 링크 클릭 시 각 페이지로 정상 이동
   - 각 하위 페이지에서 Home으로 돌아오기 정상 동작
   - 현재 페이지 활성 표시 확인

2. **About 페이지 검증**
   - `http://localhost:8081/about.html` 접속
   - 개발자 소개 및 서비스 소개 내용 확인
   - 모바일 뷰포트(500px)에서 레이아웃 깨짐 없는지 확인

3. **Dev Story 목록 페이지 검증**
   - `http://localhost:8081/blog.html` 접속
   - 20개 글 카드가 모두 렌더링되는지 확인
   - 카테고리 필터 탭 동작 확인 (각 카테고리 클릭 시 필터링)
   - 카드 클릭 시 개별 글 페이지로 이동 확인

4. **개별 글 페이지 검증**
   - `http://localhost:8081/post.html?id=1` 등 개별 접속
   - 본문 타이포그래피 및 레이아웃 확인
   - Breadcrumbs(`Home > Dev Story > 글 제목`) 정상 表시 확인
   - "목록으로 돌아가기" 링크 동작 확인
   - `<title>`, `<meta description>` 동적 주입 확인

5. **이용약관 페이지 검증**
   - `http://localhost:8081/terms.html` 접속
   - 전체 내용 렌더링 확인

6. **개인정보처리방침 독립 페이지 검증**
   - `http://localhost:8081/privacy.html` 직접 접속 가능 확인
   - 기존 모달과 내용 일치 확인

7. **기존 기능 영향도 확인**
   - `index.html` 기존 기능(다국어, 서비스 카드, SNS, 개인정보보호 모달) 정상 동작 확인
   - 이전과 동일하게 마키 애니메이션, 타이핑 효과 작동 확인

### 수동 검증 (사용자)

- Cloudflare Pages에 배포 후 `eastfever.com`에서 실제 접속 테스트
- 모바일 기기에서 직접 접속하여 반응형 확인
