import os
import base64
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


ROOT = Path(__file__).resolve().parents[2]

ORIGINAL_IMAGE = ROOT / "MCP" / "resources" / "image.png"
GENERATED_IMAGE = ROOT / "MCP" / "resources" / "generated.png"

PAGE_PATH = ROOT / "generated-app" / "app" / "page.tsx"

load_dotenv(ROOT / ".env")

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env")

client = Groq(api_key=api_key)


def encode_image(path):
    return base64.b64encode(path.read_bytes()).decode("utf-8")


def correct_code():

    print("Reading current page...")

    current_code = PAGE_PATH.read_text(encoding="utf-8")

    original_b64 = encode_image(ORIGINAL_IMAGE)
    generated_b64 = encode_image(GENERATED_IMAGE)

    prompt = f"""
You are correcting a generated Next.js page.

IMAGE 1 is the TARGET Figma design.
IMAGE 2 is the CURRENT generated webpage.

Compare them visually and fix the current page so that it
matches the target more closely.

Focus on:
- layout
- spacing
- sizing
- colors
- typography
- positioning
- borders
- backgrounds

Do not unnecessarily rewrite things that already match.

CURRENT page.tsx:

{current_code}

REQUIREMENTS:
- Return the complete corrected page.tsx.
- Use Next.js, TypeScript and Tailwind CSS.
- Do not create other files.
- Do not explain anything.
- Do not use markdown fences.
- Return ONLY valid TSX.
"""

    print("Asking Groq to correct page...")

    response = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "data:image/png;base64," + original_b64
                        }
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "data:image/png;base64," + generated_b64
                        }
                    }
                ]
            }
        ],
        temperature=0.2,
        max_completion_tokens=900
    )

    code = response.choices[0].message.content

    if not code:
        raise RuntimeError("Groq returned no code.")

    code = code.strip()

    # Remove markdown fences if Groq adds them
    if code.startswith("```"):
        lines = code.splitlines()
        lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        code = "\n".join(lines)

    PAGE_PATH.write_text(code, encoding="utf-8")

    print("✓ Correction complete")
    print(f"✓ Updated: {PAGE_PATH}")


if __name__ == "__main__":
    correct_code()