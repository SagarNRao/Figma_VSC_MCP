from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]

OUTPUT_PATH = ROOT / "MCP" / "resources" / "generated.png"

# Change this to 3001 if Next is running there
PAGE_URL = "http://localhost:3000"


def take_screenshot():
    print("Capturing generated page...")

    with sync_playwright() as p:
        browser = p.chromium.launch()

        page = browser.new_page(
            viewport={
                "width": 1440,
                "height": 1239
            }
        )

        page.goto(PAGE_URL)
        page.wait_for_load_state("networkidle")

        page.screenshot(
            path=str(OUTPUT_PATH),
            full_page=True
        )

        browser.close()

    print(f"✓ Screenshot saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    take_screenshot()