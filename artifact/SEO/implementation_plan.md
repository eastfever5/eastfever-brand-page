# EastFever 브랜드 페이지 리팩토링 및 SEO 적용 계획서

본 계획서는 임시로 생성된 테스트 파일들을 체계적으로 정리하는 리팩토링(Refactoring) 작업과 검색 엔진 최적화(SEO)를 위한 개선 작업을 다룹니다.

## 1. 테스트 코드 리팩토링 계획

프로젝트 루트 폴더에 산재된 테스트 및 검증 스크립트들을 `tests` 폴더 내의 역할별 하위 폴더(`e2e`, `unit`)로 이동/통합하여 일관되게 관리합니다.

### 대상 컴포넌트 구조 변경
#### [NEW] `tests/e2e/test_pages.py`
기존 UI 및 브라우저 콘솔 오류를 잡기 위해 나뉘어 있던 `test_browser.py`와 `run_test.py`의 기능을 하나로 합칩니다.

#### [NEW] `tests/unit/test_i18n.js`
`test_jsdom.js`의 방식을 다듬어 JSDOM 환경에서 언어 설정 및 치환 로직이 잘 동작하는지 검증합니다.

#### [NEW] `tests/unit/test_markdown.js`
`test_parse_2.js` 스크립트를 변경하여 마크다운 파싱 및 데이터 로딩 검증을 수행합니다.

#### [DELETE] 삭제 대상 파일들
다음 파일들은 위 스크립트 기능과 중복되거나 일회성 검증이므로 삭제(Delete)합니다.
- `run_test.py`
- `test_browser.py`
- `test_jsdom.js`
- `test_marked.html`
- `test_marked.py`
- `test_parse.js`
- `test_parse_2.js`
- `test_t.js`


## 2. SEO (검색 엔진 최적화) 개선 계획 (보류)

사용자 요청에 따라 현재 수준에서도 애드센스 승인 요건을 충족하므로, 정밀 SEO 및 `seo.json` 도입 작업은 추후 필요시 진행하기로 하고 이번 작업에서는 제외합니다.


## 3. 검증 계획 (Verification Plan)

### Automated Tests
1. 리팩토링이 완료되면 새로 생성된 `tests/e2e/test_pages.py`를 실행시켜 전체 페이지가 콘솔 에러 없이 로드되는지 확인합니다.
   - `python tests/e2e/test_pages.py`
2. 단위 테스트 실행을 통해 다국어 처리와 마크다운 변환에 문제가 없는지 확인합니다.
   - `node tests/unit/test_i18n.js`
   - `node tests/unit/test_markdown.js`

### Manual Verification
1. 브라우저에서 `index.html`, `about/index.html` 등의 소스 보기를 통해 Canonical 태그나 Twitter Card 등 추가 삽입한 텍스트 형태가 제대로 표시되는지 확인.
2. OG Tag 검사기(또는 Twitter Card Validator)를 사용하여 각 HTML을 시뮬레이터로 확인했을 때 메타 정보가 정상적으로 노출될 준비가 되었는지 검토.

---
**User Review Required**
위 작업 계획서를 검토해주시기 바랍니다. 괜찮으시다면 바로 테스트 폴더 구조 변경(삭제/이동)과 SEO 대응 코딩을 시작하도록 하겠습니다.
