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

# Zawsze używamy stagingu z aktualnego drzewa roboczego (obejmuje pliki nie-commitowane)
RSYNC_EXCLUDES=("$OUTPUT" "drzewko.txt")
if ! $INCLUDE_GIT; then
  RSYNC_EXCLUDES+=(".git")
fi

RSYNC_ARGS=("-a" "--delete")
for ex in "${RSYNC_EXCLUDES[@]}"; do
  RSYNC_ARGS+=("--exclude=$ex")
done

rsync "${RSYNC_ARGS[@]}" "$REPO_ROOT/" "$TMP_DIR/"

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

export TMP_DIR OUTPUT
python - <<PY
import os
import sys
from zipfile import ZipFile

zip_path = os.path.join(os.environ["TMP_DIR"], os.environ["OUTPUT"])
with ZipFile(zip_path) as zf:
    files = [z for z in zf.infolist() if not z.is_dir() and z.file_size > 0]
    if not files:
        sys.stderr.write("Archiwum nie zawiera żadnych plików (>0B).\n")
        sys.exit(1)
PY
mv "$TMP_DIR/$OUTPUT" "$SCRIPT_DIR/$OUTPUT"

echo "Zapisano paczkę: $OUTPUT"
