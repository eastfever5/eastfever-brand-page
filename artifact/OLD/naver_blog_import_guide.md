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
- 네이버 원격 이미지를 `assets/blog/NNN/`로 내려받고, 본문 이미지 경로를 `/assets/blog/NNN/image-XX.ext`로 교체

카테고리를 명시하려면:

```bash
python3 ops/import_naver_blog.py 224270816323 --dev-story --category 바이브개발
```

## 이미지 로컬 제공 규약

- DEV STORY에 등록되는 네이버 블로그 이미지는 외부 원격 URL을 그대로 쓰지 않는다.
- 포스트 ID가 `024`라면 이미지는 `assets/blog/024/` 폴더에 저장한다.
- 파일명은 본문 등장 순서대로 `image-01.png`, `image-02.jpg`처럼 2자리 번호를 사용한다.
- 마크다운에서는 절대 경로 `/assets/blog/024/image-01.png` 형식으로 참조한다.
- 네이버 이미지 URL이 남아 있는지 `rg -n "mblogthumb|blogthumb|pstatic|dthumb" posts/NNN.md`로 확인한다.
- 기존 포스트를 로컬 이미지 방식으로 바꿀 때는 다음 명령을 사용한다.

```bash
python3 ops/import_naver_blog.py --localize-post posts/024.md
```

예외적으로 원격 이미지를 유지해야 하는 경우가 아니라면 `--keep-remote-images`는 사용하지 않는다.

## DEV STORY 썸네일 규약

- 메인 페이지의 Dev Story 카드는 포스트 마크다운에서 썸네일을 결정한다.
- 우선순위는 frontmatter `thumbnail` 값, `<!-- thumbnail -->` 마킹 다음 이미지, 본문 첫 이미지 순서다.
- 대표 이미지를 명시하려면 frontmatter에 다음처럼 쓴다.

```yaml
thumbnail: "/assets/blog/026/image-18.jpg"
```

- 본문 안에서 대표 이미지를 지정하려면 다음처럼 마킹 바로 다음에 이미지를 둔다.

```markdown
<!-- thumbnail -->

![대표 이미지](/assets/blog/026/image-18.jpg)
```

- `thumbnail`도 네이버 원격 URL을 쓰지 않고 `/assets/blog/NNN/...` 로컬 경로를 사용한다.

## 링크 카드 규약

- 본문에 독립 링크나 링크 카드를 넣을 때는 링크 바로 다음 줄을 빈 줄로 둔다.
- 네이버 SmartEditor `se-oglink` 링크 박스는 일반 링크나 인용문으로 변환하지 않는다.
- 링크 박스는 반드시 `::og-card{url="..." title="..." description="..." image="..."}` 문법으로 작성한다.
- 네이버 링크 박스의 썸네일도 원격 URL을 그대로 두지 않고 `assets/blog/NNN/`에 내려받은 뒤 `/assets/blog/NNN/image-XX.ext` 경로를 `image`에 넣는다.
- 네이버 원문에 썸네일이 없는 경우에만 `image` 속성 없는 텍스트 카드로 허용한다.
- 예시:

```markdown
::og-card{url="https://blog.naver.com/five_east_fever/224270816323" title="2026년, 바이브코딩 웹게임 개발 3주일차 기록, 개발 영상 편집도 AI에게" description="바이브 게임 개발 잼 참여를 목표로 게임 개발을 시작한지 이제 3주차! 이제 잼 마감 기한은 하루!!! 1주차..." image="/assets/blog/028/image-03.jpg"}
```

## 본문 개행 규약

- 네이버 본문에서 줄이 나뉜 문장은 DEV STORY에서도 같은 줄 단위로 보이게 유지한다.
- 가져오기 결과 마크다운에서 문단 안의 단일 개행을 공백으로 합치거나 한 줄 문단으로 재작성하지 않는다.
- DEV STORY 렌더러는 블로그 포스트 마크다운을 렌더링할 때 단일 개행을 `<br>`로 보존해야 한다.
- 법적 고지나 About처럼 일반 마크다운 문법을 따르는 문서는 별도 판단하되, 네이버 블로그에서 가져온 Dev Story 포스트는 원문 개행 보존을 우선한다.

## 현재 지원 범위

- 텍스트: 문단 줄 단위 변환
- 이미지: 네이버 공개 이미지 URL을 로컬 파일로 내려받고 마크다운 이미지 경로로 변환
- 이미지 묶음: SmartEditor `se-imageStrip` 이미지도 순서대로 변환
- 링크 카드: SmartEditor `se-oglink`를 `::og-card{...}`로 변환하고 썸네일도 로컬 이미지로 저장
- 영상: 영상 ID placeholder로 보존
- 구분선: `---`로 변환

## 주의사항

- 브라우저 위장, 로그인 쿠키 사용, 차단 우회는 하지 않는다.
- 기본 출력물을 먼저 검토하고 `--dev-story`를 쓰는 흐름을 권장한다.
- `--dev-story` 실행 전 중복 제목이나 이미 이관한 원문인지 확인한다.
- DEV STORY 등록 후 네이버 이미지 핫링크가 남아 있으면 완료로 보지 않는다.
- DEV STORY 등록 후 네이버 링크 박스가 인용문(`> [제목](URL)`)으로 남아 있으면 완료로 보지 않는다.
- DEV STORY 등록 후 네이버 원문의 문단 내 줄바꿈이 화면에서 사라졌다면 완료로 보지 않는다.
- 카테고리는 현재 DEV STORY 필터인 `AI`, `바이브개발`, `개발Tips`, `강의`, `기타` 중 하나로 정리하는 것이 좋다.

## 완료 기준

- importer가 공개 모바일 URL에서 원문을 가져온다.
- 변환 결과가 제목, 날짜, 카테고리, 요약, 원문 URL, 본문을 포함한다.
- 본문의 이미지는 `assets/blog/NNN/`에 저장된 로컬 파일을 가리킨다.
- 다음 에이전트가 `.agent/skills/naver-blog-import` 스킬만 보고 같은 절차를 반복할 수 있다.
