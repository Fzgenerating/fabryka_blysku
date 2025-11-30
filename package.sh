#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

# Prefer Git-tracked files to avoid pusty zip when working tree jest pusta/niezcommitowana
if command -v git >/dev/null 2>&1 && git -C "$SCRIPT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
else
  REPO_ROOT="$SCRIPT_DIR"
fi

OUTPUT="fabryka_blysku.zip"
TMP_DIR=$(mktemp -d)
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# Clean previous archive
rm -f "$OUTPUT"

# Copy repo contents to a clean staging directory
if command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --show-toplevel >/dev/null 2>&1; then
  # Git ścieżki zapewniają spójny, niepusty zestaw plików
  (cd "$REPO_ROOT" && git ls-files -z) | rsync -a --files-from=- --from0 "$REPO_ROOT/" "$TMP_DIR/"
else
  # Fallback na rsync całego katalogu roboczego, z wyłączeniem metadanych
  rsync -a --exclude='.git' --exclude='.gitignore' --exclude="$OUTPUT" \
    --exclude='package.sh' --exclude='package.ps1' --exclude='drzewko.txt' "$REPO_ROOT/" "$TMP_DIR/"
fi

# Safety check – fail fast if staging has no plików
if ! find "$TMP_DIR" -type f -print -quit | grep -q .; then
  echo "Brak plików do spakowania (staging pusty)." >&2
  exit 1
fi

# Create archive from staged content
(cd "$TMP_DIR" && zip -r "$OUTPUT" .)
# Verify archive zawiera wpisy
if [ ! -s "$TMP_DIR/$OUTPUT" ] || [ "$(zipinfo -1 "$TMP_DIR/$OUTPUT" | wc -l | tr -d ' ')" -eq 0 ]; then
  echo "Archiwum wygląda na puste – przerwano." >&2
  exit 1
fi
# Move archive back to project root
mv "$TMP_DIR/$OUTPUT" "$SCRIPT_DIR/$OUTPUT"

echo "Zapisano paczkę: $OUTPUT"
