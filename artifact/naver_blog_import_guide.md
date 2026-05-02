# 네이버 블로그 원문 가져오기 가이드

## 목적

네이버 블로그 공개 글을 DEV STORY에 옮기기 위한 안전한 수집/변환 절차를 정리한다.

## 확인된 사실

- `https://blog.naver.com/{blogId}/{logNo}`는 본문이 아니라 프레임셋 껍데기를 반환한다.
- `https://rss.blog.naver.com/{blogId}.xml`은 목록과 요약에는 쓸 수 있지만 원문은 자주 잘린다.
- `https://m.blog.naver.com/{blogId}/{logNo}`는 공개 글의 SmartEditor 본문 HTML을 포함한다.
- 본문 루트는 `se-main-container`이고, 텍스트/이미지/링크/영상 컴포넌트를 순서대로 파싱할 수 있다.

## 추가된 파일

- `ops/import_naver_blog.py`: 공개 모바일 HTML을 마크다운으로 변환하는 실제 importer.
- `.agent/skills/naver-blog-import/SKILL.md`: 다음 Codex가 사용할 로컬 스킬.
- `.agent/skills/naver-blog-import/references/naver-blog-parsing.md`: 파싱 구조 참고 문서.

## 기본 사용법

드래프트만 생성:

```bash
python3 ops/import_naver_blog.py 224270816323
```

결과는 기본적으로 `artifact/naver-imported/`에 저장된다.

마크다운을 터미널에만 출력:

```bash
python3 ops/import_naver_blog.py 224270816323 --stdout
```

URL을 직접 지정:

```bash
python3 ops/import_naver_blog.py https://m.blog.naver.com/five_east_fever/224270816323
```

## DEV STORY 등록

검토 후 DEV STORY에 바로 추가하려면:

```bash
python3 ops/import_naver_blog.py 224270816323 --dev-story
```

이 명령은 다음 작업을 한다.

- `posts/NNN.md` 생성
- `data/posts.json`에 새 항목 추가
- `source` 필드에 원문 URL 저장

카테고리를 명시하려면:

```bash
python3 ops/import_naver_blog.py 224270816323 --dev-story --category 바이브개발
```

## 현재 지원 범위

- 텍스트: 문단 줄 단위 변환
- 이미지: 네이버 공개 이미지 URL을 마크다운 이미지로 변환
- 링크 카드: 인용 블록 형태로 변환
- 영상: 영상 ID placeholder로 보존
- 구분선: `---`로 변환

## 주의사항

- 브라우저 위장, 로그인 쿠키 사용, 차단 우회는 하지 않는다.
- 기본 출력물을 먼저 검토하고 `--dev-story`를 쓰는 흐름을 권장한다.
- `--dev-story` 실행 전 중복 제목이나 이미 이관한 원문인지 확인한다.
- 카테고리는 현재 DEV STORY 필터인 `AI`, `바이브개발`, `개발Tips`, `강의`, `기타` 중 하나로 정리하는 것이 좋다.

## 완료 기준

- importer가 공개 모바일 URL에서 원문을 가져온다.
- 변환 결과가 제목, 날짜, 카테고리, 요약, 원문 URL, 본문을 포함한다.
- 다음 에이전트가 `.agent/skills/naver-blog-import` 스킬만 보고 같은 절차를 반복할 수 있다.
