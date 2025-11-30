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

REPO_ROOT="$SCRIPT_DIR"
if command -v git >/dev/null 2>&1 && git -C "$SCRIPT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
fi

# Clean previous archive
rm -f "$OUTPUT"

# 1) Spróbuj zbudować archiwum bezpośrednio z Git (najpewniejsze na repozytorium)
if command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git -C "$REPO_ROOT" archive -o "$TMP_DIR/$OUTPUT" HEAD >/dev/null 2>&1 && [ -s "$TMP_DIR/$OUTPUT" ]; then
    echo "Użyto git archive (HEAD)" >&2
    mv "$TMP_DIR/$OUTPUT" "$SCRIPT_DIR/$OUTPUT"
    echo "Zapisano paczkę: $OUTPUT"
    exit 0
  fi
fi

# 2) Fallback – staging i zip (gdy brak Git lub archive się nie powiodło)
if command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --show-toplevel >/dev/null 2>&1; then
  (cd "$REPO_ROOT" && git ls-files -z) | rsync -a --files-from=- --from0 "$REPO_ROOT/" "$TMP_DIR/"
else
  rsync -a --exclude='.git' --exclude='.gitignore' --exclude="$OUTPUT" \
    --exclude='package.sh' --exclude='package.ps1' --exclude='drzewko.txt' "$REPO_ROOT/" "$TMP_DIR/"
fi

if ! find "$TMP_DIR" -type f -print -quit | grep -q .; then
  echo "Brak plików do spakowania (staging pusty)." >&2
  exit 1
fi

(cd "$TMP_DIR" && zip -r "$OUTPUT" .)
if [ ! -s "$TMP_DIR/$OUTPUT" ] || [ "$(zipinfo -1 "$TMP_DIR/$OUTPUT" | wc -l | tr -d ' ')" -eq 0 ]; then
  echo "Archiwum wygląda na puste – przerwano." >&2
  exit 1
fi
mv "$TMP_DIR/$OUTPUT" "$SCRIPT_DIR/$OUTPUT"

echo "Zapisano paczkę: $OUTPUT"
