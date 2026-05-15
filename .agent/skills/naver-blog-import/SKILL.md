---
name: naver-blog-import
description: Import public Naver Blog posts into EastFever Dev Story markdown. Use when Codex needs to bring a Naver Blog article into this repository, parse mobile Naver SmartEditor HTML, create a draft artifact, or optionally register the converted post in posts/ and data/posts.json.
---

# Naver Blog Import

## Overview

Use the repository importer instead of ad hoc scraping. The reliable public source is the mobile post page:

```bash
python3 ops/import_naver_blog.py 224270816323 --stdout
python3 ops/import_naver_blog.py https://m.blog.naver.com/five_east_fever/224270816323
```

The desktop URL usually returns a frameset shell. RSS returns summaries. The mobile URL includes the SmartEditor body under `se-main-container`.

## Workflow

1. Use `ops/import_naver_blog.py` with a Naver log number or public post URL.
2. Review the generated markdown and warnings before publishing.
3. Keep the default artifact output for drafts:

```bash
python3 ops/import_naver_blog.py 224270816323
```

This writes markdown and metadata under `artifact/naver-imported/`.

4. Only when the user wants to add it to Dev Story, use:

```bash
python3 ops/import_naver_blog.py 224270816323 --dev-story
```

This creates the next `posts/NNN.md` file and appends to `data/posts.json`.

## Guardrails

- Do not spoof a browser, use private cookies, bypass login, or work around access controls.
- Prefer `m.blog.naver.com/{blogId}/{logNo}` and public `PostView` output.
- Treat RSS as a discovery or summary source only; it is usually truncated.
- If `--dev-story` is used, inspect `data/posts.json` for duplicate titles or source URLs.
- If the imported category is not one of `AI`, `바이브개발`, `개발Tips`, `강의`, `기타`, choose the closest site category or pass `--category`.
- Preserve Naver SmartEditor `se-oglink` link boxes as `::og-card{url="..." title="..." description="..." image="..."}`. Do not convert them to plain Markdown links or blockquotes.
- Download `se-oglink` thumbnails into the post's local `/assets/blog/NNN/` folder and reference the local path in the `image` attribute. A text-only `::og-card` is allowed only when the original link box has no thumbnail.
- After importing, check for leftover Naver image hosts with `rg -n "mblogthumb|blogthumb|pstatic|dthumb" posts/NNN.md`.
- Preserve line-by-line breaks from the Naver post body. Do not reflow short Naver lines into one Markdown line, and make sure Dev Story renders single newlines in blog posts as visible line breaks.

## Parser Notes

Read `references/naver-blog-parsing.md` when debugging extraction failures or adding support for new SmartEditor component types.

**Examples from other skills:**
- PDF skill: `fill_fillable_fields.py`, `extract_form_field_info.py` - utilities for PDF manipulation
- DOCX skill: `document.py`, `utilities.py` - Python modules for document processing

**Appropriate for:** Python scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Codex for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform Codex's process and thinking.

**Examples from other skills:**
- Product management: `communication.md`, `context_building.md` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Codex should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output Codex produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Not every skill requires all three types of resources.**
