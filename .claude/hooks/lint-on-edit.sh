#!/bin/bash
# Claude Code post-edit hook: 編集されたファイルに lint + typecheck を実行
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

    # lint
    npx eslint "$FILE_PATH" --max-warnings 0 2>&1 || {
      echo "eslint failed on $FILE_PATH" >&2
      exit 1
    }

    # typecheck（エラー上位10行のみ表示して高速フィードバック）
    if echo "$FILE_PATH" | grep -q "^client/\|^server/"; then
      if echo "$FILE_PATH" | grep -q "^client/"; then
        npx tsc --noEmit 2>&1 | head -20 || {
          echo "typecheck failed (client)" >&2
          exit 1
        }
      elif echo "$FILE_PATH" | grep -q "^server/"; then
        npx tsc --noEmit --project server/tsconfig.json 2>&1 | head -20 || {
          echo "typecheck failed (server)" >&2
          exit 1
        }
      fi
    fi
    ;;
esac
