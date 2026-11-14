import asyncio
import subprocess
import sys
import time
from pathlib import Path
from fastmcp import Client

ROOT = Path(__file__).resolve().parent

# Initialize the FastMCP Client connected to your running mcp-server.py
mcp_client = Client("http://localhost:8000/mcp")

async def fetch_context_via_mcp():
    print("\n--- Connecting to MCP Server via Protocol ---")
    try:
        async with mcp_client:
            # Dynamically call the tool on your MCP server
            result = await mcp_client.call_tool("get_figma_context", {})
            print("✓ Successfully fetched Figma context via MCP protocol!")
            return result
    except Exception as e:
        print(f"\n✗ Failed to connect to MCP server: {e}")
        print("💡 Tip: Make sure your MCP server is running first (python mcp-server.py)!")
        sys.exit(1)

def run_script(script_name):
    script_path = ROOT / script_name
    print(f"\n--- Running {script_name} ---")
    
    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=ROOT
    )

    if result.returncode != 0:
        print(f"\n✗ {script_name} failed")
        sys.exit(result.returncode)

async def main():
    print("\n=== FIGMA → MCP AGENTIC PIPELINE ===")

    # 1. Fetch design payload dynamically through the Model Context Protocol
    # This proves your client is actively querying your MCP server!
    figma_context = await fetch_context_via_mcp()

    # 2. Generate initial Next.js page using Groq + design assets
    run_script("tools/generate_code.py")

    # Give Next.js a moment to hot reload
    print("\nWaiting for Next.js hot reload...")
    time.sleep(2)

    # 3. Screenshot generated page (via Playwright)
    run_script("tools/screenshot.py")

    # 4. Compare visual differences & auto-correct code with Groq Vision
    run_script("tools/correct_code.py")

    # Give Next.js another moment after correction
    print("\nWaiting for Next.js hot reload after correction...")
    time.sleep(2)

    # 5. Take final screenshot
    run_script("tools/screenshot.py")

    print("\n=== PIPELINE COMPLETE ===")
    print("✓ Figma Context retrieved via MCP Server")
    print("✓ Initial Code Generated")
    print("✓ Visual Correction Finished")
    print("✓ Final Screenshot Saved")

if __name__ == "__main__":
    asyncio.run(main())