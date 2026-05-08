import asyncio
from playwright.async_api import async_playwright

async def test_page(page, url, name, expected_og_image=None):
    print(f"Testing {name} ({url})...")
    try:
        response = await page.goto(url)
        if response.status != 200:
            print(f"Error: {name} returned status {response.status}")
        await asyncio.sleep(1)
        if expected_og_image:
            actual_og_image = await page.locator('meta[property="og:image"]').get_attribute('content')
            if actual_og_image != expected_og_image:
                raise AssertionError(f"Unexpected og:image for {name}: {actual_og_image}")
        print(f"Successfully loaded {name}")
    except Exception as e:
        print(f"Exception during testing {name}: {str(e)}")
        raise

async def run_all_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Catch all console messages and page errors
        page.on("console", lambda msg: print(f"[{msg.type.upper()}] Browser Console: {msg.text}") if msg.type in ["error", "warning"] else None)
        page.on("pageerror", lambda err: print(f"Browser Error: {err.message}"))

        base_url = "http://localhost:8081" # 기본 개발 서버 포트
        
        site_og_image = "https://eastfever.com/assets/og-image-final.webp?v=38"
        pages = [
            ("/", "Home", site_og_image),
            ("/about/", "About", site_og_image),
            ("/blog.html", "Blog", site_og_image),
            ("/post.html?id=26", "Post 26", site_og_image),
            ("/terms.html", "Terms", site_og_image),
            ("/privacy.html", "Privacy", site_og_image)
        ]

        print("--- Starting E2E Page Tests ---")
        for path, name, expected_og_image in pages:
            await test_page(page, f"{base_url}{path}", name, expected_og_image)
        print("--- E2E Page Tests Completed ---")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_all_tests())
