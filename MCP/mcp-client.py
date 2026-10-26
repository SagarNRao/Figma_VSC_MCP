"""Smoke-test the server: lists tools and calls each one once."""
import asyncio
from fastmcp import Client

client = Client("http://localhost:8000/mcp")

async def main():
    async with client:
        print("tools:", [t.name for t in await client.list_tools()])

        payload = await client.call_tool("read_figma_payload", {})
        print("payload chars:", len(payload.content[0].text))

        img = await client.call_tool("read_figma_image", {})
        print("image block:", img.content[0].type)

        w = await client.call_tool("write_and_render_code", {
            "code": "export default function C(){return <h1 className='p-8 text-3xl'>hi</h1>}"})
        print(w.content[0].text)

        shot = await client.call_tool("capture_render_screenshot", {})
        print([c.type for c in shot.content], shot.content[-1].text)

asyncio.run(main())