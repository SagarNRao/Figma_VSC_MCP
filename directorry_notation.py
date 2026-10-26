from pathlib import Path

# Get Current Working Directory (CWD)
cwd = Path.cwd()
print(f"Current Working Directory: {cwd}")

# Get Directory of the Executing Script
# (.resolve() ensures it returns the absolute notation)
script_dir = Path(__file__).parent.resolve()
print(f"Script Directory: {script_dir}")

# Get User's Home Directory (~ notation)
home_dir = Path.home()
print(f"Home Directory: {home_dir}")

# Convert path to standard POSIX notation (forward slashes '/')
posix_notation = cwd.as_posix()
print(f"POSIX notation: {posix_notation}")
