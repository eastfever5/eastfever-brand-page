# DEV STORY UI 변경에 따른 E2E 회귀 방지 적용 완료 보고서 (04)

이 문서는 DEV STORY의 노출 개수가 3개로 늘어나고, 하단 버튼 스타일이 변경된 사항이 향후 코드 변경에 의해 원상복구되거나 깨지지 않도록 E2E 테스트 케이스에 엄격한 검증식을 추가하고 성공 여부를 검증한 내역을 담고 있습니다.

## 작업 상세 내용

### 1. Astro E2E 테스트 단언문(Assertion) 강화 (`tests/e2e/test_astro_pages.py`)
- 메인 페이지에 노출되어야 하는 DEV STORY 카드의 최소 렌더링 개수 조건을 기존 2개에서 **3개**로 수정하여, 노출 포스트 수가 2개 이하로 축소되는 회귀 발생 시 즉각 실패하도록 수정했습니다.
- 추가적으로, 변경된 하단 버튼 클래스(.visit-btn)가 카드 내부에서 제대로 렌더링되는지 검증하기 위한 조건(`.devstory-card .visit-btn`, 3)을 새로 추가하여, 디자인이 예전 형태로 원복되거나 깨지지 않도록 안전장치를 마련했습니다.

```python
# tests/e2e/test_astro_pages.py 수정 내용
"counts": [
    (".devstory-card", 3),
    (".devstory-card .visit-btn", 3),
    (".service-card", len(SITE_DATA["services"])),
],
```

---

## 검증 (Verification) 결과

- **전체 E2E 테스트 재수행**: `npm test` 스크립트를 재수행하여 새로 적용된 3개 카드 및 버튼 구조의 단언문이 오류 없이 통과하는지 검증을 완료하였으며, 전체 테스트 결과 `SUCCESS`를 확인했습니다.
