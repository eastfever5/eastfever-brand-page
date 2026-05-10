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
SITE_DATA = json.loads((ROOT_DIR / "data/data.json").read_text(encoding="utf-8"))
POST_DATA = json.loads((ROOT_DIR / "data/posts.json").read_text(encoding="utf-8"))
DEFAULT_OG_IMAGE = SITE_DATA["meta"]["image"]


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


def start_local_server():
    base_url = os.environ.get("BASE_URL")
    if base_url:
        return base_url.rstrip("/"), None

    port = int(os.environ.get("LEGACY_TEST_PORT", "8081"))
    base_url = f"http://127.0.0.1:{port}"
    process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(ROOT_DIR)],
        cwd=ROOT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    time.sleep(0.1)
    if process.poll() is not None:
        output = process.stdout.read() if process.stdout else ""
        raise RuntimeError(f"Failed to start local server on {base_url}: {output}")
    wait_for_server(base_url)
    return base_url, process


def stop_local_server(process):
    if not process:
        return
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def page_meta(page_key, lang="ko"):
    return SITE_DATA["meta"]["pages"][page_key]["title"][lang], SITE_DATA["meta"]["pages"][page_key]["description"][lang]


def post_by_id(post_id):
    for post in POST_DATA["posts"]:
        if post["id"] == post_id:
            return post
    raise AssertionError(f"Missing post id: {post_id}")


async def get_content(page, selector):
    locator = page.locator(selector)
    count = await locator.count()
    if count == 0:
        raise AssertionError(f"Missing selector: {selector}")
    return await locator.first.get_attribute("content")


async def get_href(page, selector):
    locator = page.locator(selector)
    count = await locator.count()
    if count == 0:
        raise AssertionError(f"Missing selector: {selector}")
    return await locator.first.get_attribute("href")


async def expect_text(page, selector, expected):
    locator = page.locator(selector).first
    await locator.wait_for(timeout=5000)
    actual = (await locator.text_content()) or ""
    if expected not in actual:
        raise AssertionError(f"Expected {selector} to contain {expected!r}, got {actual!r}")


async def expect_count_at_least(page, selector, minimum):
    await page.wait_for_function(
        "(args) => document.querySelectorAll(args.selector).length >= args.minimum",
        arg={"selector": selector, "minimum": minimum},
        timeout=7000,
    )


async def assert_page_metadata(page, spec):
    title = await page.title()
    if title != spec["title"]:
        raise AssertionError(f"{spec['name']} title mismatch: {title!r}")

    description = await get_content(page, 'meta[name="description"]')
    if description != spec["description"]:
        raise AssertionError(f"{spec['name']} description mismatch: {description!r}")

    canonical = await get_href(page, 'link[rel="canonical"]')
    if canonical != spec["canonical"]:
        raise AssertionError(f"{spec['name']} canonical mismatch: {canonical!r}")

    og_title = await get_content(page, 'meta[property="og:title"]')
    og_description = await get_content(page, 'meta[property="og:description"]')
    og_image = await get_content(page, 'meta[property="og:image"]')
    og_type = await get_content(page, 'meta[property="og:type"]')

    if og_title != spec["title"]:
        raise AssertionError(f"{spec['name']} og:title mismatch: {og_title!r}")
    if og_description != spec["description"]:
        raise AssertionError(f"{spec['name']} og:description mismatch: {og_description!r}")
    if og_image != spec.get("og_image", DEFAULT_OG_IMAGE):
        raise AssertionError(f"{spec['name']} og:image mismatch: {og_image!r}")
    if og_type != spec.get("og_type", "website"):
        raise AssertionError(f"{spec['name']} og:type mismatch: {og_type!r}")

    twitter_title = await get_content(page, 'meta[name="twitter:title"]')
    twitter_description = await get_content(page, 'meta[name="twitter:description"]')
    twitter_image = await get_content(page, 'meta[name="twitter:image"]')

    if twitter_title != spec["title"]:
        raise AssertionError(f"{spec['name']} twitter:title mismatch: {twitter_title!r}")
    if twitter_description != spec["description"]:
        raise AssertionError(f"{spec['name']} twitter:description mismatch: {twitter_description!r}")
    if twitter_image != spec.get("og_image", DEFAULT_OG_IMAGE):
        raise AssertionError(f"{spec['name']} twitter:image mismatch: {twitter_image!r}")

    for lang, href in spec.get("alternates", {}).items():
        actual = await get_href(page, f'link[rel="alternate"][hreflang="{lang}"]')
        if actual != href:
            raise AssertionError(f"{spec['name']} hreflang {lang} mismatch: {actual!r}")


async def test_page(page, base_url, spec, console_errors, page_errors):
    print(f"Testing {spec['name']} ({spec['path']})...")
    console_start = len(console_errors)
    page_error_start = len(page_errors)

    response = await page.goto(f"{base_url}{spec['path']}", wait_until="domcontentloaded")
    if not response or response.status != 200:
        raise AssertionError(f"{spec['name']} returned status {response.status if response else 'NO_RESPONSE'}")

    if "wait_selector" in spec:
        await page.locator(spec["wait_selector"]).first.wait_for(timeout=7000)
    if "wait_count" in spec:
        await expect_count_at_least(page, spec["wait_count"]["selector"], spec["wait_count"]["minimum"])
    if "wait_post_title" in spec:
        await page.wait_for_function(
            "(expected) => document.querySelector('#post-title')?.textContent.trim() === expected",
            arg=spec["wait_post_title"],
            timeout=7000,
        )

    await assert_page_metadata(page, spec)

    for selector, expected in spec.get("expected_text", []):
        await expect_text(page, selector, expected)

    new_console_errors = console_errors[console_start:]
    new_page_errors = page_errors[page_error_start:]
    if new_console_errors:
        raise AssertionError(f"{spec['name']} console errors: {new_console_errors}")
    if new_page_errors:
        raise AssertionError(f"{spec['name']} page errors: {new_page_errors}")

    print(f"Successfully verified {spec['name']}")


async def run_all_tests():
    base_url, server_process = start_local_server()
    post_26 = post_by_id(26)
    home_title, home_description = page_meta("home")
    about_title, about_description = page_meta("about")
    blog_title, blog_description = page_meta("blog")
    terms_title, terms_description = page_meta("terms")
    privacy_title, privacy_description = page_meta("privacy")

    pages = [
        {
            "name": "Home",
            "path": "/",
            "title": home_title,
            "description": home_description,
            "canonical": "https://eastfever.com/",
            "alternates": {
                "ko": "https://eastfever.com/",
                "en": "https://eastfever.com/?lang=en",
                "ja": "https://eastfever.com/?lang=ja",
                "x-default": "https://eastfever.com/",
            },
            "wait_count": {"selector": "#devstory-list .devstory-card", "minimum": 2},
            "expected_text": [
                ("#hero-main-text", "Beyond Here"),
                ("#title-devstories", SITE_DATA["sections"]["devstories"]["ko"]),
            ],
        },
        {
            "name": "About",
            "path": "/about/",
            "title": about_title,
            "description": about_description,
            "canonical": "https://eastfever.com/about/",
            "alternates": {"ko": "https://eastfever.com/about/"},
            "wait_selector": "#about-content",
            "expected_text": [("#about-content", "이스트피버(EastFever) 소개")],
        },
        {
            "name": "Blog",
            "path": "/blog.html",
            "title": blog_title,
            "description": blog_description,
            "canonical": "https://eastfever.com/blog.html",
            "alternates": {"ko": "https://eastfever.com/blog.html"},
            "wait_count": {"selector": ".blog-card", "minimum": len(POST_DATA["posts"])},
            "expected_text": [(".blog-title", "Dev Story")],
        },
        {
            "name": "Post 26",
            "path": "/post.html?id=26",
            "title": f"{post_26['title']} - EastFever",
            "description": post_26["summary"],
            "canonical": "https://eastfever.com/post.html?id=26",
            "og_type": "article",
            "alternates": {"ko": "https://eastfever.com/post.html?id=26"},
            "wait_post_title": post_26["title"],
            "expected_text": [
                ("#post-title", post_26["title"]),
                ("#post-category", post_26["category"]),
                ("#post-body", "Draw the Life"),
            ],
        },
        {
            "name": "Terms",
            "path": "/terms.html",
            "title": terms_title,
            "description": terms_description,
            "canonical": "https://eastfever.com/terms.html",
            "alternates": {
                "ko": "https://eastfever.com/terms.html",
                "en": "https://eastfever.com/terms.html?lang=en",
                "ja": "https://eastfever.com/terms.html?lang=ja",
                "x-default": "https://eastfever.com/terms.html",
            },
            "wait_selector": "#legal-body",
            "expected_text": [("#legal-title", SITE_DATA["common"]["terms"]["ko"])],
        },
        {
            "name": "Privacy",
            "path": "/privacy.html",
            "title": privacy_title,
            "description": privacy_description,
            "canonical": "https://eastfever.com/privacy.html",
            "alternates": {
                "ko": "https://eastfever.com/privacy.html",
                "en": "https://eastfever.com/privacy.html?lang=en",
                "ja": "https://eastfever.com/privacy.html?lang=ja",
                "x-default": "https://eastfever.com/privacy.html",
            },
            "wait_selector": "#legal-body",
            "expected_text": [("#legal-title", SITE_DATA["common"]["privacy"]["ko"])],
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

            print("--- Starting E2E Page Tests ---")
            print(f"Base URL: {base_url}")
            for spec in pages:
                await test_page(page, base_url, spec, console_errors, page_errors)
            print("--- E2E Page Tests Completed ---")

            await browser.close()
    finally:
        stop_local_server(server_process)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
