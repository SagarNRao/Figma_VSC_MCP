"""
FigmaToCode-MCP server.

Tools exposed to the agent:
  read_figma_payload()          pruned, LLM-sized JSON of the selected Figma node
  read_figma_image()            PNG render of the selected node
  write_and_render_code(code)   writes sandbox/src/GeneratedComponent.tsx
  capture_render_screenshot()   headless-browser screenshot of the Vite sandbox

Run:  python mcp-server.py      (serves http://localhost:8000/mcp)
"""
import json
import socket
import subprocess
import time
from pathlib import Path

from fastmcp import FastMCP
from fastmcp.utilities.types import Image

mcp = FastMCP("Figma_Local_Side")

# --------------------------------------------------------------------------
# Paths  (server.ts writes to <repo>/MCP/resources, so we resolve relative
# to this file instead of the current working directory)
# --------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
RESOURCES = ROOT / "resources"
PAYLOAD_PATH = RESOURCES / "payload.json"
IMAGE_PATH = RESOURCES / "image.png"
SANDBOX = ROOT / "sandbox"
COMPONENT_PATH = SANDBOX / "src" / "GeneratedComponent.tsx"
EXTRA_CSS_PATH = SANDBOX / "src" / "generated.css"
VITE_PORT = 5173
VITE_URL = f"http://localhost:{VITE_PORT}"

MAX_ATTEMPTS = 3
_attempts = 0          # write_and_render_code calls since last read_figma_payload
_vite_proc = None


# --------------------------------------------------------------------------
# Payload pruning: 500 KB of raw Figma node dump -> a few KB the LLM can use
# --------------------------------------------------------------------------
def _hex(c: dict, opacity: float = 1.0) -> str:
    to = lambda v: round(v * 255)
    h = "#{:02X}{:02X}{:02X}".format(to(c["r"]), to(c["g"]), to(c["b"]))
    a = c.get("a", 1) * opacity
    return h if a >= 0.999 else f"{h} @{round(a, 2)}"


def _paints(paints) -> list:
    out = []
    if not isinstance(paints, list):
        return out
    for p in paints:
        if p.get("visible") is False:
            continue
        t = p.get("type")
        op = p.get("opacity", 1)
        if t == "SOLID":
            out.append(_hex(p["color"], op))
        elif t and t.startswith("GRADIENT"):
            stops = [_hex(s["color"]) + f"@{round(s['position'], 2)}"
                     for s in p.get("gradientStops", [])]
            out.append({"gradient": t, "stops": stops})
        elif t == "IMAGE":
            out.append({"image": p.get("scaleMode")})
    return out


def _effects(effects) -> list:
    out = []
    for e in effects or []:
        if e.get("visible") is False:
            continue
        item = {"type": e.get("type")}
        for k in ("radius", "spread", "offset"):
            if k in e:
                item[k] = e[k]
        if "color" in e:
            item["color"] = _hex(e["color"])
        out.append(item)
    return out


def _prune(node: dict, origin: tuple, root: bool = False):
    if node.get("visible") is False:
        return None

    bb = node.get("absoluteBoundingBox") or {}
    out = {"type": node.get("type"), "name": node.get("name")}
    if bb:
        out["box"] = {
            "x": round(bb["x"] - origin[0]), "y": round(bb["y"] - origin[1]),
            "w": round(bb["width"]), "h": round(bb["height"]),
        }

    t = node.get("type")

    # Decorative vectors (dot grids, skylines, icons): geometry is huge and
    # useless to an LLM. Report size + colour only.
    if t in ("VECTOR", "BOOLEAN_OPERATION", "STAR", "POLYGON", "LINE"):
        fills = _paints(node.get("fills"))
        if fills:
            out["fills"] = fills
        strokes = _paints(node.get("strokes"))
        if strokes:
            out["strokes"] = strokes
        return out

    fills = _paints(node.get("fills"))
    if fills:
        out["fills"] = fills
    strokes = _paints(node.get("strokes"))
    if strokes:
        out["strokes"] = strokes
        out["strokeWeight"] = node.get("strokeWeight")
    fx = _effects(node.get("effects"))
    if fx:
        out["effects"] = fx
    if node.get("opacity", 1) != 1:
        out["opacity"] = round(node["opacity"], 2)

    # corner radius
    cr = node.get("cornerRadius")
    if isinstance(cr, (int, float)) and cr:
        out["radius"] = cr
    elif any(node.get(k) for k in ("topLeftRadius", "topRightRadius",
                                   "bottomLeftRadius", "bottomRightRadius")):
        out["radii"] = [node.get(k, 0) for k in (
            "topLeftRadius", "topRightRadius", "bottomRightRadius", "bottomLeftRadius")]

    # auto layout
    if node.get("layoutMode") in ("HORIZONTAL", "VERTICAL"):
        out["autoLayout"] = {
            "dir": node["layoutMode"],
            "gap": node.get("itemSpacing", 0),
            "pad": [node.get("paddingTop", 0), node.get("paddingRight", 0),
                    node.get("paddingBottom", 0), node.get("paddingLeft", 0)],
            "mainAlign": node.get("primaryAxisAlignItems"),
            "crossAlign": node.get("counterAxisAlignItems"),
            "wrap": node.get("layoutWrap"),
        }
    if node.get("layoutGrow"):
        out["layoutGrow"] = node["layoutGrow"]
    if node.get("layoutPositioning") == "ABSOLUTE":
        out["positioning"] = "ABSOLUTE"
    if node.get("clipsContent"):
        out["clip"] = True

    # text
    if t == "TEXT":
        font = node.get("fontName") if isinstance(node.get("fontName"), dict) else {}
        out["text"] = {
            "characters": node.get("characters"),
            "font": font.get("family"), "style": font.get("style"),
            "size": node.get("fontSize"), "weight": node.get("fontWeight"),
            "lineHeight": node.get("lineHeight"),
            "letterSpacing": node.get("letterSpacing"),
            "align": node.get("textAlignHorizontal"),
        }
        # mixed-style runs (e.g. 2-tone headline). Segments may carry their own fills.
        segs = node.get("segments")
        if isinstance(segs, list) and segs:
            out["text"]["segments"] = [
                {k: v for k, v in {
                    "chars": s.get("characters"),
                    "fills": _paints(s.get("fills")),
                    "size": s.get("fontSize"), "weight": s.get("fontWeight"),
                }.items() if v not in (None, [])} for s in segs]
        return out

    children = []
    for ch in node.get("children") or []:
        p = _prune(ch, origin)
        if p:
            children.append(p)
    if children:
        out["children"] = children
    return out


def _load_payload() -> dict:
    if not PAYLOAD_PATH.exists():
        raise FileNotFoundError(
            f"{PAYLOAD_PATH} not found. In Figma: run the plugin, select a "
            "frame and press 'Get Selection' (and make sure server.ts is running).")
    return json.loads(PAYLOAD_PATH.read_text(encoding="utf-8"))


def _design_width() -> int:
    try:
        bb = _load_payload()["documentTree"]["absoluteBoundingBox"]
        return int(bb["width"])
    except Exception:
        return 1440


# --------------------------------------------------------------------------
# Tools
# --------------------------------------------------------------------------
@mcp.tool()
def read_figma_payload() -> str:
    """Return the structural JSON of the selected Figma node (pruned): boxes
    relative to the root frame, hex colours, auto-layout (direction, gap,
    padding, alignment), typography, radii and effects. Decorative vector
    shapes are reported by size/colour only. Calling this starts a fresh
    attempt budget for write_and_render_code."""
    global _attempts
    _attempts = 0
    data = _load_payload()
    tree = data["documentTree"]
    bb = tree.get("absoluteBoundingBox") or {"x": 0, "y": 0}
    pruned = _prune(tree, (bb["x"], bb["y"]), root=True)
    fonts = sorted({
        f"{n['text']['font']} {n['text']['style']}"
        for n in _walk(pruned) if n.get("text") and n["text"].get("font")})
    return json.dumps({
        "fileKey": data.get("fileKey"),
        "nodeId": data.get("nodeId"),
        "fontsUsed": fonts,
        "tree": pruned,
    }, indent=1)


def _walk(n):
    yield n
    for c in n.get("children", []):
        yield from _walk(c)


@mcp.tool()
def read_figma_image() -> Image:
    """Return the PNG render of the selected Figma node (the visual target)."""
    if not IMAGE_PATH.exists():
        raise FileNotFoundError(f"{IMAGE_PATH} not found. Run the Figma plugin first.")
    return Image(data=IMAGE_PATH.read_bytes(), format="png")


@mcp.tool()
def write_and_render_code(code: str, extra_css: str = "") -> str:
    """Write a React TSX component to sandbox/src/GeneratedComponent.tsx.
    The file MUST `export default` a component. Tailwind v4 utility classes are
    available. Use `extra_css` for @font-face / Google Font @import rules or
    custom CSS (it is written to sandbox/src/generated.css). Max 3 attempts per
    design; call read_figma_payload to start a new budget."""
    global _attempts
    if _attempts >= MAX_ATTEMPTS:
        return (f"Attempt limit reached ({MAX_ATTEMPTS}/{MAX_ATTEMPTS}). Stop iterating and "
                "report remaining visual differences to the user.")
    if "export default" not in code:
        return "Rejected: the component must `export default` a React component."

    COMPONENT_PATH.parent.mkdir(parents=True, exist_ok=True)
    COMPONENT_PATH.write_text(code, encoding="utf-8")
    # @import rules must come first in a CSS file, so extra_css is written verbatim
    EXTRA_CSS_PATH.write_text(extra_css or "/* none */", encoding="utf-8")
    _attempts += 1
    _ensure_vite()
    time.sleep(1.5)  # let HMR pick the change up
    left = MAX_ATTEMPTS - _attempts
    return (f"Wrote {len(code)} chars to {COMPONENT_PATH.name} "
            f"(attempt {_attempts}/{MAX_ATTEMPTS}, {left} left). "
            "Now call capture_render_screenshot.")


@mcp.tool()
async def capture_render_screenshot() -> list:
    """Load the Vite sandbox in headless Chromium at the design's width, and
    return a full-page screenshot plus any browser console/page errors."""
    from playwright.async_api import async_playwright

    _ensure_vite()
    errors: list[str] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": _design_width(), "height": 900})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}")
                if m.type in ("error", "warning") else None)
        await page.goto(VITE_URL, wait_until="networkidle")
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(500)
        png = await page.screenshot(full_page=True)
        dims = await page.evaluate(
            "({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})")
        await browser.close()

    report = f"Rendered page size: {dims['w']}x{dims['h']}px."
    if errors:
        report += "\nBrowser errors:\n" + "\n".join(errors[:15])
    return [Image(data=png, format="png"), report]


# --------------------------------------------------------------------------
# Prompt: the agent protocol, so any MCP client can load it by name
# --------------------------------------------------------------------------
@mcp.prompt()
def figma_to_code() -> str:
    """Self-healing Figma -> React/Tailwind loop."""
    return f"""You are an autonomous frontend engineer converting a Figma design into pixel-accurate,
responsive React (TSX) + Tailwind CSS.

Loop (max {MAX_ATTEMPTS} write attempts):
1. ANALYZE   read_figma_image() then read_figma_payload(): layout, spacing, fonts, hex colours.
2. SYNTHESIZE  semantic, modular TSX with Tailwind classes. Use extra_css for Google Fonts.
               Decorative vectors (dot grids, skylines) -> approximate with CSS gradients/SVG.
3. DEPLOY    write_and_render_code(code, extra_css)
4. INSPECT   capture_render_screenshot()
5. EVALUATE  compare against the target: overflow, flex/grid, padding, font weight, colours.
             Fix and repeat from 3 until it matches or attempts run out.
Finish by summarising any remaining differences."""


# --------------------------------------------------------------------------
# Vite sandbox lifecycle
# --------------------------------------------------------------------------
def _port_open(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def _ensure_vite():
    global _vite_proc
    if _port_open(VITE_PORT):
        return
    if not (SANDBOX / "node_modules").exists():
        raise RuntimeError(f"Run `npm install` in {SANDBOX} first.")
    _vite_proc = subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", str(VITE_PORT), "--strictPort"],
        cwd=SANDBOX, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        shell=(__import__("os").name == "nt"))
    for _ in range(40):
        if _port_open(VITE_PORT):
            return
        time.sleep(0.5)
    raise RuntimeError("Vite dev server failed to start on :5173")


if __name__ == "__main__":
    mcp.run(transport="http", port=8000)