#!/bin/bash
# Claude Code pre-commit hook: lint + build を検証
# stdin から JSON を受け取るが、commit 判定には使わない (全体チェック)

set -euo pipefail
cd "$CLAUDE_PROJECT_DIR"

FAILED=""

# lint
if ! npm run lint --silent 2>&1; then
  FAILED="${FAILED}lint "
fi

# build
if ! npm run build --silent 2>&1; then
  FAILED="${FAILED}build "
fi

if [ -n "$FAILED" ]; then
  echo '{"decision":"block","reason":"Pre-commit check failed: '"$FAILED"'. Fix errors before committing."}' >&2
  exit 1
fi
