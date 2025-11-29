#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"
OUTPUT="fabryka_blysku.zip"

# Clean previous archive
rm -f "$OUTPUT"

# Create archive excluding VCS and the archive itself
zip -r "$OUTPUT" . \
  -x "./.git/*" "./.gitignore" "./$OUTPUT" "./package.sh" "./package.ps1" "./drzewko.txt"

echo "Zapisano paczkę: $OUTPUT"
