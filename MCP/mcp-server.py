from prefab_ui.app import PrefabApp
from prefab_ui.components import Column, Heading, Text, Badge, Row
from fastmcp import FastMCP
import base64
from PIL import Image
import io
import json

mcp = FastMCP("Figma_Local_Side")

payload_path = "./resources/payload.json"
image_path = "./images/image.png"

@mcp.tool(app=True)
def greet(name: str) -> PrefabApp:
    """Greet someone with a visual card"""
    with Column(gap=4, css_class="p-6") as view:
        Heading(f"Hello {name}")
        with Row(gap=2, align="center"):
            Text("Status")
            Badge("Greeted", variant="Success")

        return PrefabApp(view=view)
    
@mcp.resource("resource://payload")
def get_payload() -> str:
    """Exposes the deep structural JSON node tree of the selected Figma component."""
    with open("./resources/payload.json", "r", encoding="utf-8") as f:
        payload = json.load(f)
    return json.dumps(payload, indent=2)

@mcp.resource("resource://image")
def get_image() -> bytes:
    """Expose the high-fidelity PNG render of the Figma component for visual analysis."""
    with open("./images/image.")
        

if __name__ == "__main__":
    mcp.run(transport="http", port=8000)