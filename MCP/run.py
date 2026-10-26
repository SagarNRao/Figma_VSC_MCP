import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / "tools"


def run(script):
    print(f"\n--- Running {script} ---")

    result = subprocess.run(
        [sys.executable, str(TOOLS / script)],
        cwd=ROOT.parent
    )

    if result.returncode != 0:
        print(f"\n✗ {script} failed")
        sys.exit(result.returncode)


print("\n=== FIGMA → CODE ===")

# 1. Generate initial page
run("generate_code.py")

# Give Next.js a moment to hot reload
time.sleep(2)

# 2. Screenshot generated page
run("screenshot.py")

# 3. Compare + correct
run("correct_code.py")

# Give Next.js another moment
time.sleep(2)

# 4. Final screenshot
run("screenshot.py")

print("\n✓ DONE")
print("Figma → Generate → Screenshot → Correct → Final Screenshot")