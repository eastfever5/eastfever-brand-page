#!/usr/bin/env python3
"""Import a public Naver Blog post from mobile HTML into markdown.

This script intentionally uses public mobile post pages such as:
https://m.blog.naver.com/{blog_id}/{log_no}

It does not spoof a browser, use login cookies, or bypass access controls.
"""

from __future__ import annotations

import argparse
import dataclasses
import html
import json
import re
import ssl
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError
from urllib.parse import parse_qs, quote, urlparse, urlsplit, urlunsplit
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_BLOG_ID = "five_east_fever"
DEFAULT_OUTPUT_DIR = ROOT_DIR / "artifact" / "naver-imported"
LOCAL_IMAGE_ROOT = ROOT_DIR / "assets" / "blog"
HONEST_USER_AGENT = "eastfever-brand-page-importer/1.0 (+https://eastfever.com)"
DEV_STORY_CATEGORIES = {"AI", "바이브개발", "개발Tips", "강의", "기타"}
CATEGORY_MAP = {
    "강의자료": "강의",
    "Unity": "강의",
    "브레인스토밍": "기타",
    "인사말": "기타",
    "홍보": "기타",
}


@dataclasses.dataclass
class ParsedPost:
    blog_id: str
    log_no: str
    title: str
    category: str
    published_text: str
    published_date: str
    summary: str
    tags: list[str]
    source_url: str
    mobile_url: str
    markdown_body: str
    component_counts: dict[str, int]
    warnings: list[str]
    text_align: str = "left"

    @property
    def markdown(self) -> str:
        tag_section = ["tags: []"]
        if self.tags:
            tag_section = ["tags:"]
            tag_section.extend(f"  - {yaml_string(tag)}" for tag in self.tags)

        frontmatter_lines = [
            "---",
            f"title: {yaml_string(self.title)}",
            f"date: {yaml_string(self.published_date)}",
            f"category: {yaml_string(self.category)}",
            f"summary: {yaml_string(self.summary)}",
            f"source_url: {yaml_string(self.source_url)}",
            f"source_mobile_url: {yaml_string(self.mobile_url)}",
            "source_type: \"naver_blog\"",
        ]
        if self.text_align != "left":
            frontmatter_lines.append(f"textAlign: {yaml_string(self.text_align)}")
        frontmatter_lines.extend(tag_section)
        frontmatter_lines.append("---")
        
        frontmatter = "\n".join(frontmatter_lines)
        return f"{frontmatter}# {self.title}\n\n{self.markdown_body.strip()}\n"


def yaml_string(value: str) -> str:
    return json.dumps(value or "", ensure_ascii=False)


def decode_js_string(value: str) -> str:
    try:
        return json.loads(f'"{value}"')
    except json.JSONDecodeError:
        return html.unescape(value)


def strip_tags(raw_html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", "", raw_html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", "", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("\u200b", "").replace("\ufeff", "")
    return re.sub(r"[ \t]+\n", "\n", text).strip()


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def clean_summary(text: str, fallback_lines: Iterable[str]) -> str:
    summary = normalize_spaces(text)
    if summary:
        return summary
    fallback = normalize_spaces(" ".join(line for line in fallback_lines if line))
    return fallback[:157] + "..." if len(fallback) > 160 else fallback


def parse_source(source: str, default_blog_id: str) -> tuple[str, str, str, str]:
    if re.fullmatch(r"\d{6,}", source):
        blog_id = default_blog_id
        log_no = source
    else:
        parsed = urlparse(source)
        query = parse_qs(parsed.query)
        path_parts = [part for part in parsed.path.split("/") if part]

        blog_id = query.get("blogId", [None])[0]
        log_no = query.get("logNo", [None])[0]

        if not log_no and len(path_parts) >= 2 and path_parts[-1].isdigit():
            blog_id = blog_id or path_parts[-2]
            log_no = path_parts[-1]

        if not blog_id or not log_no:
            raise ValueError(
                "source must be a log number or a Naver Blog post URL with blogId/logNo"
            )

    mobile_url = f"https://m.blog.naver.com/{blog_id}/{log_no}"
    source_url = f"https://blog.naver.com/{blog_id}/{log_no}"
    return blog_id, log_no, source_url, mobile_url


def ssl_context() -> ssl.SSLContext:
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def fetch_html(url: str, timeout: float) -> str:
    request = Request(url, headers={"User-Agent": HONEST_USER_AGENT})
    with urlopen(request, timeout=timeout, context=ssl_context()) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def request_safe_url(url: str) -> str:
    parts = urlsplit(url.strip())
    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            quote(parts.path, safe="/%"),
            quote(parts.query, safe="=&?/:+,%"),
            parts.fragment,
        )
    )


def image_download_candidates(url: str) -> list[str]:
    candidates = [url]
    parts = urlsplit(url)
    if "pstatic.net" in parts.netloc and not parts.query:
        candidates.extend([f"{url}?type=w800", f"{url}?type=w400"])
    return candidates


def fetch_binary(url: str, timeout: float) -> tuple[bytes, str]:
    last_error: Exception | None = None
    for candidate in image_download_candidates(url):
        try:
            request = Request(
                request_safe_url(candidate),
                headers={"User-Agent": HONEST_USER_AGENT},
            )
            with urlopen(request, timeout=timeout, context=ssl_context()) as response:
                content_type = response.headers.get_content_type()
                return response.read(), content_type
        except HTTPError as exc:
            last_error = exc
            if exc.code != 404:
                raise

    if last_error:
        raise last_error
    raise ValueError(f"No download candidates for image URL: {url}")


def meta_content(page_html: str, property_name: str) -> str:
    pattern = (
        r"<meta\s+property=[\"']"
        + re.escape(property_name)
        + r"[\"']\s+content=[\"']([^\"']*)[\"']"
    )
    match = re.search(pattern, page_html, flags=re.I)
    return html.unescape(match.group(1)).strip() if match else ""


def js_var(page_html: str, name: str) -> str:
    match = re.search(rf"var\s+{re.escape(name)}\s*=\s*\"([^\"]*)\";", page_html)
    return decode_js_string(match.group(1)).strip() if match else ""


def extract_main_container(page_html: str) -> str:
    start = page_html.find('<div class="se-main-container">')
    if start == -1:
        raise ValueError("Naver SmartEditor main container was not found")

    markers = [
        '<div class="post_footer',
        '<div id="post_footer',
        '<div class="post_tag',
        '<div class="wrap_postcomment',
        '<div id="blog_fe_feed',
    ]
    ends = [page_html.find(marker, start) for marker in markers]
    ends = [pos for pos in ends if pos != -1]
    end = min(ends) if ends else len(page_html)
    return page_html[start:end]


def component_blocks(container_html: str) -> list[str]:
    starts = [match.start() for match in re.finditer(r'<div class="se-component ', container_html)]
    blocks = []
    for index, start in enumerate(starts):
        end = starts[index + 1] if index + 1 < len(starts) else len(container_html)
        blocks.append(container_html[start:end])
    return blocks


def component_type(block: str) -> str:
    match = re.search(r'<div class="se-component\s+([^"]+)"', block)
    if not match:
        return "unknown"
    return match.group(1).split()[0]


def text_lines_from_component(block: str) -> list[str]:
    lines = []
    for match in re.finditer(
        r'<p class="se-text-paragraph[^"]*"[^>]*>([\s\S]*?)</p>', block
    ):
        line = strip_tags(match.group(1))
        if not line:
            line = "&nbsp;"
        lines.append(line)
    return lines


def image_markdowns_from_component(block: str) -> list[str]:
    images: list[str] = []
    seen_sources: set[str] = set()

    for match in re.finditer(r"data-linkdata='([^']*?\"src\"[^']*?)'", block):
        data = html.unescape(match.group(1))
        source_match = re.search(r'"src"\s*:\s*"([^"]+)"', data)
        if not source_match:
            continue

        source = source_match.group(1)
        if source in seen_sources:
            continue
        seen_sources.add(source)

        alt_match = re.search(r'alt="([^"]*)"', block[match.end() :])
        alt = html.unescape(alt_match.group(1)).strip() if alt_match else ""
        alt = alt or "네이버 블로그 이미지"
        images.append(f"![{alt}]({source})")

    return images


def directive_attr(value: str) -> str:
    return html.escape(value or "", quote=True)


def image_src_by_class(block: str, class_name: str) -> str:
    for match in re.finditer(r"<img\b[^>]*>", block):
        tag = match.group(0)
        if class_name not in tag:
            continue

        source_match = re.search(r'\bsrc="([^"]+)"', tag)
        if source_match:
            return html.unescape(source_match.group(1)).strip()

    return ""


def oglink_markdown_from_component(block: str) -> str:
    link = ""
    linkdata = re.search(r'data-linkdata=\'([^\']*?"link"[^\']*?)\'', block)
    if linkdata:
        link_match = re.search(r'"link"\s*:\s*"([^"]+)"', html.unescape(linkdata.group(1)))
        if link_match:
            link = link_match.group(1)
    if not link:
        href_match = re.search(r'<a href="([^"]+)"[^>]*data-linktype="oglink"', block)
        link = html.unescape(href_match.group(1)) if href_match else ""

    title_match = re.search(r'<strong class="se-oglink-title">([\s\S]*?)</strong>', block)
    summary_match = re.search(r'<p class="se-oglink-summary">([\s\S]*?)</p>', block)
    title = strip_tags(title_match.group(1)) if title_match else link
    summary = strip_tags(summary_match.group(1)) if summary_match else ""
    thumbnail = image_src_by_class(block, "se-oglink-thumbnail-resource")

    if not title and not link:
        return ""

    attrs = [
        f'url="{directive_attr(link)}"',
        f'title="{directive_attr(title)}"',
    ]
    if summary:
        attrs.append(f'description="{directive_attr(summary)}"')
    if thumbnail:
        attrs.append(f'image="{directive_attr(thumbnail)}"')
    return f"::og-card{{{' '.join(attrs)}}}"


def video_markdown_from_component(block: str) -> str:
    vid_match = re.search(r'"vid"\s*:\s*"([^"]+)"', block)
    if not vid_match:
        vid_match = re.search(r"vid\s*[:=]\s*['\"]([^'\"]+)['\"]", block)
    video_id = vid_match.group(1) if vid_match else "video"
    return f"[네이버 블로그 영상: {video_id}]"


def build_markdown_body(container_html: str) -> tuple[str, dict[str, int], list[str], list[str]]:
    parts: list[str] = []
    warnings: list[str] = []
    all_text_lines: list[str] = []
    counts: Counter[str] = Counter()
    alignments: Counter[str] = Counter()

    for block in component_blocks(container_html):
        ctype = component_type(block)
        counts[ctype] += 1

        if ctype == "se-text":
            lines = text_lines_from_component(block)
            all_text_lines.extend(lines)
            if lines:
                parts.append("\n\n".join(lines))
        elif ctype in {"se-image", "se-imageStrip"}:
            images = image_markdowns_from_component(block)
            if images:
                parts.append("\n\n".join(images))
            else:
                warnings.append("Image component without a parseable source URL was skipped.")
        elif ctype == "se-oglink":
            link = oglink_markdown_from_component(block)
            if link:
                parts.append(link)
            else:
                warnings.append("OG link component without a parseable URL was skipped.")
        elif ctype == "se-video":
            parts.append(video_markdown_from_component(block))
        elif ctype == "se-horizontalLine":
            parts.append("---")
        elif ctype in {"se-sticker", "se-quotation", "se-placesMap"}:
            text = "\n\n".join(text_lines_from_component(block))
            if text:
                parts.append(text)
            else:
                warnings.append(f"{ctype} component was not converted.")
        else:
            warnings.append(f"Unsupported component type skipped: {ctype}")

        if ctype in {"se-text", "se-image", "se-imageStrip", "se-video", "se-oglink"}:
            if "se-text-align-center" in block or "se-text-paragraph-align-center" in block:
                alignments["center"] += 1
            elif "se-text-align-right" in block or "se-text-paragraph-align-right" in block:
                alignments["right"] += 1
            else:
                alignments["left"] += 1

    body = "\n\n".join(part.strip() for part in parts if part.strip())
    # Determine overall alignment (center or right if it's dominant, otherwise left)
    total_blocks = sum(alignments.values())
    text_align = "left"
    if total_blocks > 0:
        most_common, count = alignments.most_common(1)[0]
        if most_common != "left" and count / total_blocks > 0.5:
            text_align = most_common

    return body, dict(counts), warnings, all_text_lines, text_align


def parse_published_date(raw_date: str) -> str:
    match = re.search(r"(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})", raw_date)
    if not match:
        return raw_date.strip()
    year, month, day = (int(value) for value in match.groups())
    return datetime(year, month, day).strftime("%Y-%m-%d")


def normalize_category(category: str) -> str:
    return CATEGORY_MAP.get(category, category or "기타")


def parse_post(source: str, default_blog_id: str, timeout: float) -> ParsedPost:
    blog_id, log_no, source_url, mobile_url = parse_source(source, default_blog_id)
    page_html = fetch_html(mobile_url, timeout=timeout)
    container = extract_main_container(page_html)
    body, counts, warnings, text_lines, text_align = build_markdown_body(container)

    title = meta_content(page_html, "og:title") or js_var(page_html, "sPostTitle")
    category = strip_tags(
        re.search(r'<div class="blog_category"><a[^>]*>([\s\S]*?)</a></div>', page_html).group(1)
    ) if re.search(r'<div class="blog_category"><a[^>]*>([\s\S]*?)</a></div>', page_html) else ""
    category = normalize_category(category or js_var(page_html, "gsCategoryName"))

    date_match = re.search(r'<p class="blog_date">([\s\S]*?)</p>', page_html)
    published_text = strip_tags(date_match.group(1)) if date_match else ""
    published_date = parse_published_date(published_text)

    summary = clean_summary(meta_content(page_html, "og:description"), text_lines)
    tags_raw = js_var(page_html, "gsTagName")
    tags = [tag.strip() for tag in tags_raw.split(",") if tag.strip()]

    if not title:
        warnings.append("Title was not found in og:title.")
    if category not in DEV_STORY_CATEGORIES:
        warnings.append(
            f"Category '{category}' is not in the current Dev Story filter list."
        )
    if not body:
        warnings.append("No markdown body was extracted.")

    return ParsedPost(
        blog_id=blog_id,
        log_no=log_no,
        title=title,
        category=category,
        published_text=published_text,
        published_date=published_date,
        summary=summary,
        tags=tags,
        source_url=source_url,
        mobile_url=mobile_url,
        markdown_body=body,
        component_counts=counts,
        text_align=text_align,
        warnings=warnings,
    )


def safe_filename(value: str, limit: int = 90) -> str:
    name = re.sub(r"[\\/:*?\"<>|#]+", "", value)
    name = re.sub(r"\s+", "_", name).strip("._ ")
    return (name[:limit] or "naver-blog-post").rstrip("._ ")


def image_extension(url: str, content_type: str) -> str:
    ext = Path(urlsplit(url).path).suffix.lower()
    if ext == ".jpeg":
        return ".jpg"
    if ext in {".jpg", ".png", ".webp", ".gif"}:
        return ext

    content_extensions = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    return content_extensions.get(content_type.lower(), ".jpg")


def localize_markdown_images(
    markdown: str,
    post_id: int,
    timeout: float,
    require_all: bool = True,
) -> tuple[str, list[Path], list[str]]:
    image_pattern = re.compile(
        r"!\[([^\]]*)\]\((https?://[^)]+)\)"
        r"|(::og-card\{[^}\n]*?\bimage=)([\"'])(https?://[^\"']+)(\4)([^}\n]*\})"
    )
    output_dir = LOCAL_IMAGE_ROOT / f"{post_id:03d}"
    written: list[Path] = []
    warnings: list[str] = []
    url_to_local: dict[str, str] = {}
    existing_indexes = []
    if output_dir.exists():
        for path in output_dir.glob("image-*.*"):
            match = re.fullmatch(r"image-(\d+)", path.stem)
            if match:
                existing_indexes.append(int(match.group(1)))
    image_index = max(existing_indexes, default=0)

    def local_image_path(source_url: str) -> str:
        nonlocal image_index
        source_url = html.unescape(source_url)
        if source_url not in url_to_local:
            image_index += 1
            try:
                payload, content_type = fetch_binary(source_url, timeout)
                output_dir.mkdir(parents=True, exist_ok=True)
                filename = f"image-{image_index:02d}{image_extension(source_url, content_type)}"
                output_path = output_dir / filename
                output_path.write_bytes(payload)
                written.append(output_path)
                url_to_local[source_url] = f"/assets/blog/{post_id:03d}/{filename}"
            except Exception as exc:
                warnings.append(f"Image download failed: {source_url} ({exc})")
                url_to_local[source_url] = source_url

        return url_to_local[source_url]

    def replace(match: re.Match[str]) -> str:
        if match.group(1) is not None:
            alt_text, source_url = match.group(1), match.group(2)
            return f"![{alt_text}]({local_image_path(source_url)})"

        prefix, quote, source_url, suffix = (
            match.group(3),
            match.group(4),
            match.group(5),
            match.group(7),
        )
        return f"{prefix}{quote}{local_image_path(source_url)}{quote}{suffix}"

    localized = image_pattern.sub(replace, markdown)
    remaining_remote_images = image_pattern.findall(localized)
    if require_all and remaining_remote_images:
        failed_urls = ", ".join(match[1] or match[4] for match in remaining_remote_images)
        raise ValueError(f"Some markdown images still use remote URLs: {failed_urls}")

    return localized, written, warnings


def write_artifact(post: ParsedPost, output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    base = f"{post.log_no}_{safe_filename(post.title)}"
    markdown_path = output_dir / f"{base}.md"
    metadata_path = output_dir / f"{base}.json"
    markdown_path.write_text(post.markdown, encoding="utf-8")
    metadata_path.write_text(
        json.dumps(
            {
                "blogId": post.blog_id,
                "logNo": post.log_no,
                "title": post.title,
                "category": post.category,
                "publishedText": post.published_text,
                "publishedDate": post.published_date,
                "summary": post.summary,
                "tags": post.tags,
                "sourceUrl": post.source_url,
                "mobileUrl": post.mobile_url,
                "componentCounts": post.component_counts,
                "warnings": post.warnings,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return markdown_path, metadata_path


def next_dev_story_id(posts_dir: Path, posts_data: dict) -> int:
    ids = [int(post.get("id", 0)) for post in posts_data.get("posts", [])]
    ids.extend(int(path.stem) for path in posts_dir.glob("[0-9][0-9][0-9].md"))
    return max(ids, default=0) + 1


def write_dev_story(
    post: ParsedPost,
    force: bool,
    local_images: bool,
    timeout: float,
) -> tuple[Path, Path, list[Path]]:
    posts_dir = ROOT_DIR / "posts"
    data_path = ROOT_DIR / "data" / "posts.json"
    posts_dir.mkdir(exist_ok=True)

    posts_data = json.loads(data_path.read_text(encoding="utf-8"))
    for existing in posts_data.get("posts", []):
        if not force and (
            existing.get("title") == post.title
            or existing.get("source") == post.source_url
            or existing.get("sourceUrl") == post.source_url
        ):
            raise ValueError(
                "This post appears to be already registered in data/posts.json. "
                "Use --force to add it anyway."
            )

    post_id = next_dev_story_id(posts_dir, posts_data)
    filename = f"{post_id:03d}.md"
    post_path = posts_dir / filename
    if post_path.exists() and not force:
        raise ValueError(f"{post_path} already exists. Use --force to overwrite.")

    markdown = post.markdown
    image_paths: list[Path] = []
    if local_images:
        markdown, image_paths, image_warnings = localize_markdown_images(
            markdown,
            post_id,
            timeout,
            require_all=True,
        )
        post.warnings.extend(image_warnings)

    post_path.write_text(markdown, encoding="utf-8")
    posts_data.setdefault("posts", []).append(
        {
            "id": post_id,
            "title": post.title,
            "summary": post.summary,
            "category": post.category,
            "date": post.published_date,
            "file": filename,
            "source": post.source_url,
        }
    )
    data_path.write_text(
        json.dumps(posts_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return post_path, data_path, image_paths


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import public Naver Blog mobile HTML into markdown."
    )
    parser.add_argument("source", nargs="?", help="Naver log number or public post URL")
    parser.add_argument("--blog-id", default=DEFAULT_BLOG_ID, help="default blog id for numeric sources")
    parser.add_argument("--timeout", type=float, default=15.0, help="network timeout in seconds")
    parser.add_argument("--out", type=Path, help="directory for converted markdown and metadata")
    parser.add_argument("--stdout", action="store_true", help="print markdown instead of writing artifact output")
    parser.add_argument(
        "--dev-story",
        action="store_true",
        help="also write posts/NNN.md and append data/posts.json",
    )
    parser.add_argument("--title", help="override imported title")
    parser.add_argument("--category", help="override imported category")
    parser.add_argument("--summary", help="override imported summary")
    parser.add_argument("--force", action="store_true", help="allow duplicate or overwrite dev-story output")
    parser.add_argument(
        "--keep-remote-images",
        action="store_true",
        help="do not download images into assets/blog/NNN when writing a Dev Story post",
    )
    parser.add_argument(
        "--localize-post",
        type=Path,
        help="rewrite an existing markdown post so remote image URLs become local assets",
    )
    parser.add_argument(
        "--post-id",
        type=int,
        help="post id to use with --localize-post; defaults to numeric markdown filename",
    )
    args = parser.parse_args()

    try:
        if args.localize_post:
            post_path = args.localize_post
            post_id = args.post_id
            if post_id is None and post_path.stem.isdigit():
                post_id = int(post_path.stem)
            if post_id is None:
                raise ValueError("--post-id is required when --localize-post filename is not numeric")

            markdown = post_path.read_text(encoding="utf-8")
            markdown, image_paths, warnings = localize_markdown_images(
                markdown,
                post_id,
                args.timeout,
                require_all=True,
            )
            post_path.write_text(markdown, encoding="utf-8")
            print(
                json.dumps(
                    {
                        "ok": True,
                        "post": str(post_path),
                        "postId": post_id,
                        "warnings": warnings,
                        "written": [
                            str(path.relative_to(ROOT_DIR)) if path.is_relative_to(ROOT_DIR) else str(path)
                            for path in [post_path, *image_paths]
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0

        if not args.source:
            raise ValueError("source is required unless --localize-post is used")

        post = parse_post(args.source, args.blog_id, args.timeout)
        if args.title:
            post.title = args.title
        if args.category:
            post.category = normalize_category(args.category)
        if args.summary:
            post.summary = args.summary

        written: list[Path] = []
        if args.stdout:
            print(post.markdown)
        if args.out or (not args.stdout and not args.dev_story):
            markdown_path, metadata_path = write_artifact(post, args.out or DEFAULT_OUTPUT_DIR)
            written.extend([markdown_path, metadata_path])
        if args.dev_story:
            post_path, data_path, image_paths = write_dev_story(
                post,
                args.force,
                local_images=not args.keep_remote_images,
                timeout=args.timeout,
            )
            written.extend([post_path, data_path, *image_paths])

        print(
            json.dumps(
                {
                    "ok": True,
                    "title": post.title,
                    "category": post.category,
                    "date": post.published_date,
                    "sourceUrl": post.source_url,
                    "mobileUrl": post.mobile_url,
                    "componentCounts": post.component_counts,
                    "warnings": post.warnings,
                    "written": [str(path.relative_to(ROOT_DIR)) if path.is_relative_to(ROOT_DIR) else str(path) for path in written],
                },
                ensure_ascii=False,
                indent=2,
            ),
            file=sys.stderr if args.stdout else sys.stdout,
        )
        return 0
    except Exception as exc:
        print(f"import_naver_blog.py: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
