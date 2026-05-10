import asyncio
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright

ROOT_DIR = Path(__file__).resolve().parents[2]
DIST_DIR = ROOT_DIR / "dist"
SITE_DATA = json.loads((ROOT_DIR / "data/data.json").read_text(encoding="utf-8"))
BLOG_CONTENT_DIR = ROOT_DIR / "src/content/blog"


def wait_for_server(base_url, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(base_url, timeout=0.5) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.1)
    raise RuntimeError(f"Timed out waiting for local server: {base_url}")


def start_dist_server():
    base_url = os.environ.get("BASE_URL")
    if base_url:
        return base_url.rstrip("/"), None

    if not DIST_DIR.exists():
        raise RuntimeError("dist directory does not exist. Run npm run build first.")

    port = int(os.environ.get("ASTRO_TEST_PORT", "8081"))
    base_url = f"http://127.0.0.1:{port}"
    process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(DIST_DIR)],
        cwd=ROOT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    time.sleep(0.1)
    if process.poll() is not None:
        output = process.stdout.read() if process.stdout else ""
        raise RuntimeError(f"Failed to start dist server on {base_url}: {output}")
    wait_for_server(base_url)
    return base_url, process


def stop_server(process):
    if not process:
        return
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def meta_for(page_key, lang="ko"):
    page = SITE_DATA["meta"]["pages"][page_key]
    return page["title"][lang], page["description"][lang]


def post_by_id(post_id):
    for file_path in BLOG_CONTENT_DIR.glob("*.md"):
        markdown = file_path.read_text(encoding="utf-8")
        frontmatter = parse_frontmatter(markdown)
        if int(frontmatter["id"]) == post_id:
            return frontmatter
    raise AssertionError(f"Missing post id: {post_id}")


def parse_frontmatter(markdown):
    if not markdown.startswith("---\n"):
        raise AssertionError("Missing frontmatter.")
    end = markdown.find("\n---", 4)
    if end == -1:
        raise AssertionError("Unclosed frontmatter.")

    data = {}
    for line in markdown[4:end].splitlines():
        if ":" not in line or line.startswith(" "):
            continue
        key, value = line.split(":", 1)
        value = value.strip().strip('"').strip("'")
        if value:
            data[key.strip()] = value
    return data


def content_post_count():
    return len(list(BLOG_CONTENT_DIR.glob("*.md")))


def read_url(base_url, path):
    with urllib.request.urlopen(f"{base_url}{path}", timeout=5) as response:
        return response.read().decode("utf-8")


async def content(page, selector):
    locator = page.locator(selector)
    if await locator.count() == 0:
        raise AssertionError(f"Missing selector: {selector}")
    return await locator.first.get_attribute("content")


async def href(page, selector):
    locator = page.locator(selector)
    if await locator.count() == 0:
        raise AssertionError(f"Missing selector: {selector}")
    return await locator.first.get_attribute("href")


async def expect_metadata(page, spec):
    title = await page.title()
    if title != spec["title"]:
        raise AssertionError(f"{spec['name']} title mismatch: {title!r}")

    description = await content(page, 'meta[name="description"]')
    canonical = await href(page, 'link[rel="canonical"]')
    og_title = await content(page, 'meta[property="og:title"]')
    og_description = await content(page, 'meta[property="og:description"]')
    og_image = await content(page, 'meta[property="og:image"]')

    if description != spec["description"]:
        raise AssertionError(f"{spec['name']} description mismatch: {description!r}")
    if canonical != spec["canonical"]:
        raise AssertionError(f"{spec['name']} canonical mismatch: {canonical!r}")
    if og_title != spec["title"]:
        raise AssertionError(f"{spec['name']} og:title mismatch: {og_title!r}")
    if og_description != spec["description"]:
        raise AssertionError(f"{spec['name']} og:description mismatch: {og_description!r}")
    if og_image != spec.get("og_image", SITE_DATA["meta"]["image"]):
        raise AssertionError(f"{spec['name']} og:image mismatch: {og_image!r}")

    for lang, expected_href in spec.get("alternates", {}).items():
        actual = await href(page, f'link[rel="alternate"][hreflang="{lang}"]')
        if actual != expected_href:
            raise AssertionError(f"{spec['name']} hreflang {lang} mismatch: {actual!r}")


async def expect_text(page, selector, expected):
    locator = page.locator(selector).first
    await locator.wait_for(timeout=5000)
    actual = (await locator.text_content()) or ""
    if expected not in actual:
        raise AssertionError(f"Expected {selector} to contain {expected!r}, got {actual!r}")


async def expect_count(page, selector, minimum):
    await page.wait_for_function(
        "(args) => document.querySelectorAll(args.selector).length >= args.minimum",
        arg={"selector": selector, "minimum": minimum},
        timeout=7000,
    )


async def verify_page(page, base_url, spec, console_errors, page_errors):
    print(f"Testing Astro {spec['name']} ({spec['path']})...")
    console_start = len(console_errors)
    page_error_start = len(page_errors)

    response = await page.goto(f"{base_url}{spec['path']}", wait_until="domcontentloaded")
    if not response or response.status != 200:
        raise AssertionError(f"{spec['name']} returned status {response.status if response else 'NO_RESPONSE'}")

    await expect_metadata(page, spec)

    for selector, minimum in spec.get("counts", []):
        await expect_count(page, selector, minimum)

    for selector, expected in spec.get("texts", []):
        await expect_text(page, selector, expected)

    if console_errors[console_start:]:
        raise AssertionError(f"{spec['name']} console errors: {console_errors[console_start:]}")
    if page_errors[page_error_start:]:
        raise AssertionError(f"{spec['name']} page errors: {page_errors[page_error_start:]}")

    print(f"Successfully verified Astro {spec['name']}")


async def verify_legacy_redirect(page, base_url, spec, console_errors, page_errors):
    print(f"Testing Astro legacy redirect {spec['name']} ({spec['path']})...")
    console_start = len(console_errors)
    page_error_start = len(page_errors)

    response = await page.goto(f"{base_url}{spec['path']}", wait_until="commit")
    if response and response.status != 200:
        raise AssertionError(f"{spec['name']} returned status {response.status}")

    expected_url = f"{base_url}{spec['target']}"
    await page.wait_for_url(expected_url, timeout=5000)
    await page.wait_for_load_state("domcontentloaded")

    if page.url != expected_url:
        raise AssertionError(f"{spec['name']} redirect mismatch: {page.url!r}")
    if console_errors[console_start:]:
        raise AssertionError(f"{spec['name']} console errors: {console_errors[console_start:]}")
    if page_errors[page_error_start:]:
        raise AssertionError(f"{spec['name']} page errors: {page_errors[page_error_start:]}")

    print(f"Successfully verified Astro legacy redirect {spec['name']}")


async def verify_service_preview(page, base_url, console_errors, page_errors):
    print("Testing Astro service preview modal...")
    console_start = len(console_errors)
    page_error_start = len(page_errors)

    response = await page.goto(f"{base_url}/ko/", wait_until="domcontentloaded")
    if not response or response.status != 200:
        raise AssertionError("Korean home returned a non-200 response.")

    button = page.locator('[data-id="e-fi-board"][data-preview-trigger="true"]')
    if await button.count() != 1:
        raise AssertionError("E-Fi-Board preview button was not rendered.")

    await button.first.scroll_into_view_if_needed()
    await button.first.click()
    await page.wait_for_selector("#service-preview-modal:not(.hidden)", timeout=5000)

    title = await page.locator("#service-preview-title").inner_text()
    if title.strip() != "이피보드":
        raise AssertionError(f"Unexpected service preview title: {title!r}")

    image_srcs = await page.locator("#service-preview-modal .preview-card img").evaluate_all(
        "(images) => images.map((image) => image.getAttribute('src'))"
    )
    if len(image_srcs) != 6:
        raise AssertionError(f"Expected 6 E-Fi-Board preview images, got {len(image_srcs)}.")
    for src in image_srcs:
        if not src.startswith("/assets/e-fi-board/"):
            raise AssertionError(f"Preview image should use an absolute asset path: {src!r}")

    iframe_src = await page.locator("#service-preview-modal iframe").first.get_attribute("src")
    if iframe_src != "https://www.youtube.com/embed/5hLcmZGMoAs":
        raise AssertionError(f"Unexpected E-Fi-Board preview iframe src: {iframe_src!r}")

    await page.locator("#service-preview-modal .modal-close-btn").click()
    await page.wait_for_function(
        "() => document.querySelector('#service-preview-modal')?.classList.contains('hidden')",
        timeout=5000,
    )

    if console_errors[console_start:]:
        raise AssertionError(f"Service preview console errors: {console_errors[console_start:]}")
    if page_errors[page_error_start:]:
        raise AssertionError(f"Service preview page errors: {page_errors[page_error_start:]}")

    print("Successfully verified Astro service preview modal")


def verify_sitemap_urls(base_url, expected_urls, excluded_urls):
    sitemap_index = read_url(base_url, "/sitemap-index.xml")
    if "https://eastfever.com/sitemap-0.xml" not in sitemap_index:
        raise AssertionError("sitemap-index.xml does not reference sitemap-0.xml.")

    sitemap = read_url(base_url, "/sitemap-0.xml")
    for url in expected_urls:
        if f"<loc>{url}</loc>" not in sitemap:
            raise AssertionError(f"Sitemap is missing canonical URL: {url}")
    for url in excluded_urls:
        if f"<loc>{url}</loc>" in sitemap:
            raise AssertionError(f"Sitemap should not include redirect URL: {url}")


async def run_all_tests():
    base_url, process = start_dist_server()
    post_26 = post_by_id(26)
    home_ko = meta_for("home", "ko")
    home_en = meta_for("home", "en")
    home_ja = meta_for("home", "ja")
    about = meta_for("about")
    blog = meta_for("blog")
    privacy_en = meta_for("privacy", "en")
    terms_ja = meta_for("terms", "ja")
    post_26_path = f"/ko/blog/{post_26['slug']}/"
    post_26_url = f"https://eastfever.com{post_26_path}"

    specs = [
        {
            "name": "Korean Home",
            "path": "/ko/",
            "title": home_ko[0],
            "description": home_ko[1],
            "canonical": "https://eastfever.com/ko/",
            "alternates": {
                "ko": "https://eastfever.com/ko/",
                "en": "https://eastfever.com/en/",
                "ja": "https://eastfever.com/ja/",
                "x-default": "https://eastfever.com/ko/",
            },
            "counts": [(".devstory-card", 2), (".service-card", len(SITE_DATA["services"]))],
            "texts": [("#hero-main-text", "Beyond Here"), ("#title-devstories", SITE_DATA["sections"]["devstories"]["ko"])],
        },
        {
            "name": "English Home",
            "path": "/en/",
            "title": home_en[0],
            "description": home_en[1],
            "canonical": "https://eastfever.com/en/",
            "texts": [("#title-webapps", SITE_DATA["sections"]["webapps"]["en"])],
        },
        {
            "name": "Japanese Home",
            "path": "/ja/",
            "title": home_ja[0],
            "description": home_ja[1],
            "canonical": "https://eastfever.com/ja/",
            "texts": [("#title-games", SITE_DATA["sections"]["games"]["ja"])],
        },
        {
            "name": "About",
            "path": "/ko/about/",
            "title": about[0],
            "description": about[1],
            "canonical": "https://eastfever.com/ko/about/",
            "texts": [("#about-content", "이스트피버(EastFever) 소개")],
        },
        {
            "name": "Blog",
            "path": "/ko/blog/",
            "title": blog[0],
            "description": blog[1],
            "canonical": "https://eastfever.com/ko/blog/",
            "counts": [(".blog-card", content_post_count())],
            "texts": [(".blog-title", "Dev Story")],
        },
        {
            "name": "Post 26",
            "path": post_26_path,
            "title": f"{post_26['title']} - EastFever",
            "description": post_26["summary"],
            "canonical": post_26_url,
            "og_image": "https://eastfever.com/assets/blog/026/image-18.jpg",
            "texts": [("#post-title", post_26["title"]), ("#post-body", "Draw the Life")],
        },
        {
            "name": "English Privacy",
            "path": "/en/privacy/",
            "title": privacy_en[0],
            "description": privacy_en[1],
            "canonical": "https://eastfever.com/en/privacy/",
            "texts": [("#legal-title", SITE_DATA["common"]["privacy"]["en"])],
        },
        {
            "name": "Japanese Terms",
            "path": "/ja/terms/",
            "title": terms_ja[0],
            "description": terms_ja[1],
            "canonical": "https://eastfever.com/ja/terms/",
            "texts": [("#legal-title", SITE_DATA["common"]["terms"]["ja"])],
        },
    ]

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            console_errors = []
            page_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            print("--- Starting Astro E2E Page Tests ---")
            print(f"Base URL: {base_url}")
            for spec in specs:
                await verify_page(page, base_url, spec, console_errors, page_errors)

            await verify_service_preview(page, base_url, console_errors, page_errors)

            legacy_redirects = [
                {"name": "Blog HTML", "path": "/blog.html", "target": "/ko/blog/"},
                {"name": "Post HTML id", "path": "/post.html?id=26", "target": post_26_path},
                {"name": "Post HTML padded id", "path": "/post.html?id=026", "target": post_26_path},
                {"name": "Post HTML missing id", "path": "/post.html", "target": "/ko/blog/"},
                {"name": "Numeric Post", "path": "/ko/blog/026/", "target": post_26_path},
                {"name": "Privacy English", "path": "/privacy.html?lang=en", "target": "/en/privacy/"},
                {"name": "Privacy default", "path": "/privacy.html", "target": "/ko/privacy/"},
                {"name": "Terms Japanese", "path": "/terms.html?lang=ja", "target": "/ja/terms/"},
                {"name": "About directory", "path": "/about/", "target": "/ko/about/"},
            ]
            for spec in legacy_redirects:
                await verify_legacy_redirect(page, base_url, spec, console_errors, page_errors)

            response = await page.goto(f"{base_url}/sitemap-index.xml")
            if not response or response.status != 200:
                raise AssertionError("Astro sitemap-index.xml is not available.")

            verify_sitemap_urls(
                base_url,
                expected_urls=[
                    "https://eastfever.com/ko/",
                    "https://eastfever.com/en/",
                    "https://eastfever.com/ja/",
                    "https://eastfever.com/ko/about/",
                    "https://eastfever.com/ko/blog/",
                    post_26_url,
                    "https://eastfever.com/en/privacy/",
                    "https://eastfever.com/ja/terms/",
                ],
                excluded_urls=[
                    "https://eastfever.com/",
                    "https://eastfever.com/about/",
                    "https://eastfever.com/ko/blog/026/",
                ],
            )

            response = await page.goto(f"{base_url}/robots.txt")
            if not response or response.status != 200:
                raise AssertionError("Astro robots.txt is not available.")
            await expect_text(page, "body", "sitemap-index.xml")

            print("--- Astro E2E Page Tests Completed ---")
            await browser.close()
    finally:
        stop_server(process)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
