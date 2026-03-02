#!/bin/bash
# Auto-push dashboard changes to GitHub
# Usage: ./scripts/auto-push.sh "commit message"

cd "$(dirname "$0")/.."

MSG="${1:-🔄 Dashboard update}"

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
  echo "✅ No changes to push"
  exit 0
fi

git add -A
git commit -m "$MSG"
git push origin main

echo "✅ Pushed to GitHub → auto-deploy will trigger in ~30s"
echo "🌐 https://zw-g.github.io/trading-arena-dashboard/"
