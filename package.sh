#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

OUTPUT="fabryka_blysku.zip"
TMP_DIR=$(mktemp -d)
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# Clean previous archive
rm -f "$OUTPUT"

# Copy repo contents to a clean staging directory, excluding VCS and packaging scripts
rsync -a --exclude='.git' --exclude='.gitignore' --exclude="$OUTPUT" \
  --exclude='package.sh' --exclude='package.ps1' --exclude='drzewko.txt' ./ "$TMP_DIR/"

# Safety check – fail fast if staging is empty
if ! find "$TMP_DIR" -mindepth 1 -print -quit | grep -q .; then
  echo "Brak plików do spakowania (staging pusty)." >&2
  exit 1
fi

# Create archive from staged content
(cd "$TMP_DIR" && zip -r "$OUTPUT" .)
# Move archive back to project root
mv "$TMP_DIR/$OUTPUT" "$SCRIPT_DIR/$OUTPUT"

echo "Zapisano paczkę: $OUTPUT"
