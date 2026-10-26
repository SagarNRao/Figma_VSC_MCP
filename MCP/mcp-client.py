import asyncio
from fastmcp import Client

client = Client("http://localhost:8000/mcp")


async def main():
    async with client:
        result = await client.call_tool("get_figma_context", {})
        print("✓ Figma context tool works")


asyncio.run(main())