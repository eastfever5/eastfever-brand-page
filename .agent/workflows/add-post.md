---
description: 네이버 블로그 포스트를 기반으로 브랜드 페이지의 Dev Story에 새 글을 자동으로 추가합니다.
---

1. `/Users/ep_macair/Documents/GitHub/eastfever-naver-blog/posts` 폴더 내의 최근 포스트 목록을 조회하여 사용자에게 보여줍니다.
2. 어떤 글을 Dev Story에 추가할지 사용자에게 질문하고 승인을 받습니다.
3. 선택된 네이버 블로그 포스트의 원문을 읽어 내용을 분석합니다.
4. 기존 `src/content/blog/` 폴더 내의 마지막 파일 번호를 확인하여 다음 ID(예: `028.md`)를 결정합니다.
5. 분석된 내용을 브랜드 페이지의 디자인 톤과 마크다운 형식에 맞춰 재구성하여 `src/content/blog/0XX.md` 파일을 생성합니다.
6. frontmatter에는 `id`, 고정 `slug`, `title`, `date`, `updatedAt`, `category`, `summary`, `thumbnail`, `ogImage`, `sourceType`, `sourceUrls`, `tags`를 넣습니다.
7. 네이버 블로그 이미지는 원격 URL을 그대로 쓰지 않고 `public/assets/blog/0XX/`에 내려받은 뒤, 본문에서는 `/assets/blog/0XX/image-XX.ext` 경로로 참조합니다.
8. 메인 페이지 Dev Story 썸네일은 frontmatter `thumbnail`을 우선 사용합니다. 대표 이미지를 지정할 때는 로컬 이미지 경로를 `thumbnail: "/assets/blog/0XX/image-XX.ext"`로 넣습니다.
9. 본문에 독립 링크나 링크 카드가 있으면 링크 바로 다음 줄을 빈 줄로 둡니다. 링크 카드 설명문은 `> [제목](URL)`, `>`, `> 설명문` 형태로 작성합니다.
10. `npm run posts:sync`로 `data/posts.json` 레거시 호환 인덱스를 갱신합니다.
11. `rg -n "mblogthumb|blogthumb|pstatic" src/content/blog/0XX.md`로 원격 네이버 이미지 URL이 남아 있지 않은지 확인합니다.
12. `npm test`로 Content Collections, 레거시 인덱스, Astro 산출물 E2E를 검증합니다.
13. 작업이 완료되면 사용자에게 새로운 포스트가 추가되었음을 알리고 사이트에서 확인을 요청합니다.
