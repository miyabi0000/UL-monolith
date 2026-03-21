#!/bin/bash
# Claude Code post-edit hook: 編集されたファイルに lint を実行
set -uo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# .ts / .tsx ファイルのみ対象
case "$FILE_PATH" in
  *.ts|*.tsx)
    cd "$CLAUDE_PROJECT_DIR"
    npx eslint "$FILE_PATH" --max-warnings 0 2>&1 || {
      echo "eslint failed on $FILE_PATH" >&2
      exit 1
    }
    ;;
esac
