from prefab_ui.app import PrefabApp
from prefab_ui.components import Column, Heading, Text, Badge, Row
from fastmcp import FastMCP
import base64
from PIL import Image
import io
import json
from fastmcp import FastMCP
from pathlib import Path
import json


mcp = FastMCP("Figma_Local_Side")

BASE_DIR = Path(__file__).parent
RESOURCES_DIR = BASE_DIR / "resources"

payload_path = "./resources/payload.json"
image_path = "./resources/image.png"

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
    """Returns the selected Figma node tree."""
    payload_path = RESOURCES_DIR / "payload.json"

    with open(payload_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    return json.dumps(payload, indent=2)

@mcp.resource("resource://image")
def get_image() -> bytes:
    """Returns the PNG render of the selected Figma frame."""
    image_path = RESOURCES_DIR / "image.png"

    return image_path.read_bytes()   
   
@mcp.tool()
def get_figma_context() -> str:
    """Returns the current Figma design payload for code generation."""
    payload_path = RESOURCES_DIR / "payload.json"

    with open(payload_path, "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    mcp.run(transport="http", port=8000)