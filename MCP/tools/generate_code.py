import os
import json
import base64
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


# --------------------------------------------------
# Paths
# --------------------------------------------------

ROOT = Path(__file__).resolve().parents[2]

PAYLOAD_PATH = ROOT / "MCP" / "resources" / "payload.json"
IMAGE_PATH = ROOT / "MCP" / "resources" / "image.png"

# OUTPUT_PATH = ROOT / "latest generated-app" / "app" / "page.tsx"
OUTPUT_PATH = "C:/Projects/Web/Figma_MCP/Figma_vsc_MCP/generated-app/app/page.tsx"



# --------------------------------------------------
# Setup
# --------------------------------------------------

load_dotenv(ROOT / ".env")

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env")

client = Groq(api_key=api_key)


# --------------------------------------------------
# Generate
# --------------------------------------------------

def generate_code():

    print("Reading Figma data...")

    # Read payload
    with open(PAYLOAD_PATH, "r", encoding="utf-8") as f:
        payload = json.load(f)

    # Read image and convert to base64
    image_bytes = IMAGE_PATH.read_bytes()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    print("Sending design to Groq...")

    prompt = f"""
You are converting a Figma design into a Next.js page.

Use the attached screenshot as the PRIMARY visual reference.

Use the Figma node data below as supporting information for:
- exact text
- dimensions
- spacing
- colors
- typography
- layout

FIGMA NODE DATA:

{json.dumps(payload)}

Generate the page shown in the screenshot.

REQUIREMENTS:

- Return ONE complete app/page.tsx file.
- Use Next.js.
- Use TypeScript.
- Use Tailwind CSS.
- Reproduce the screenshot as closely as possible.
- Keep the code simple.
- Do not create additional files.
- Do not explain your answer.
- Do not include markdown code fences.
- Return ONLY valid TSX code.
"""

    response = client.chat.completions.create(
        model="qwen/qwen3.8-27b",

        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": (
                                "data:image/png;base64,"
                                + image_base64
                            )
                        },
                    },
                ],
            }
        ],

        temperature=0.2,
        max_completion_tokens=8000,
    )

    code = response.choices[0].message.content

    if not code:
        raise RuntimeError("Groq returned no code.")

    code = code.strip()

    # --------------------------------------------------
    # Remove markdown fences if model ignores instruction
    # --------------------------------------------------

    if code.startswith("```"):
        lines = code.splitlines()

        # Remove first ```tsx / ```typescript / etc.
        lines = lines[1:]

        # Remove final ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        code = "\n".join(lines)

    # --------------------------------------------------
    # Write Next.js page
    # --------------------------------------------------
    
    print(code)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(code, encoding="utf-8")

    print()
    print("✓ Page generated")
    print(f"✓ Written to: {OUTPUT_PATH}")


# --------------------------------------------------
# Run
# --------------------------------------------------

if __name__ == "__main__":
    generate_code()