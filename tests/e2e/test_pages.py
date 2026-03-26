import asyncio
from playwright.async_api import async_playwright

async def test_page(page, url, name):
    print(f"Testing {name} ({url})...")
    try:
        response = await page.goto(url)
        if response.status != 200:
            print(f"Error: {name} returned status {response.status}")
        await asyncio.sleep(1)
        print(f"Successfully loaded {name}")
    except Exception as e:
        print(f"Exception during testing {name}: {str(e)}")

async def run_all_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Catch all console messages and page errors
        page.on("console", lambda msg: print(f"[{msg.type.upper()}] Browser Console: {msg.text}") if msg.type in ["error", "warning"] else None)
        page.on("pageerror", lambda err: print(f"Browser Error: {err.message}"))

        base_url = "http://localhost:8081" # 기본 개발 서버 포트
        
        pages = [
            ("/", "Home"),
            ("/about/", "About"),
            ("/blog.html", "Blog"),
            ("/terms.html", "Terms"),
            ("/privacy.html", "Privacy")
        ]

        print("--- Starting E2E Page Tests ---")
        for path, name in pages:
            await test_page(page, f"{base_url}{path}", name)
        print("--- E2E Page Tests Completed ---")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_all_tests())
