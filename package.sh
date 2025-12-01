#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

OUTPUT="fabryka_blysku.zip"
INCLUDE_GIT=true

for arg in "$@"; do
  case "$arg" in
    --lite|--no-git)
      INCLUDE_GIT=false
      ;;
    --with-git)
      INCLUDE_GIT=true
      ;;
    -h|--help)
      echo "Usage: ./package.sh [--lite|--no-git]" >&2
      exit 0
      ;;
  esac
done

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
if ! $INCLUDE_GIT && command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git -C "$REPO_ROOT" archive -o "$TMP_DIR/$OUTPUT" HEAD >/dev/null 2>&1 && [ -s "$TMP_DIR/$OUTPUT" ]; then
    echo "Użyto git archive (HEAD)" >&2
    mv "$TMP_DIR/$OUTPUT" "$SCRIPT_DIR/$OUTPUT"
    echo "Zapisano paczkę: $OUTPUT"
    exit 0
  fi
fi

# 2) Fallback – staging i zip (gdy brak Git lub archive się nie powiodło)
if command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --show-toplevel >/dev/null 2>&1; then
  if $INCLUDE_GIT; then
    rsync -a --delete --exclude="$OUTPUT" "$REPO_ROOT/" "$TMP_DIR/"
  else
    (cd "$REPO_ROOT" && git ls-files -z) | rsync -a --files-from=- --from0 "$REPO_ROOT/" "$TMP_DIR/"
  fi
else
  rsync -a --delete --exclude="$OUTPUT" --exclude='drzewko.txt' "$REPO_ROOT/" "$TMP_DIR/"
fi

if ! find "$TMP_DIR" -type f -print -quit | grep -q .; then
  echo "Brak plików do spakowania (staging pusty)." >&2
  exit 1
fi

(cd "$TMP_DIR" && zip -r "$OUTPUT" .)
# Weryfikacja, że archiwum zawiera realne pliki (a nie tylko puste katalogi)
if [ ! -s "$TMP_DIR/$OUTPUT" ] || [ "$(zipinfo -1 "$TMP_DIR/$OUTPUT" | wc -l | tr -d ' ')" -eq 0 ]; then
  echo "Archiwum wygląda na puste – przerwano." >&2
  exit 1
fi

python - <<'PY'
import sys
from zipfile import ZipFile

zip_path = """$TMP_DIR/$OUTPUT"""
with ZipFile(zip_path) as zf:
    files = [z for z in zf.infolist() if not z.is_dir() and z.file_size > 0]
    if not files:
        sys.stderr.write("Archiwum nie zawiera żadnych plików (>0B).\n")
        sys.exit(1)
PY
mv "$TMP_DIR/$OUTPUT" "$SCRIPT_DIR/$OUTPUT"

echo "Zapisano paczkę: $OUTPUT"
