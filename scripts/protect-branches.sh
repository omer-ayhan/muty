#!/usr/bin/env bash
# Turns on branch protection after this repository is public.
# GitHub refuses the API on a private personal repo without GitHub Pro.
# Run this only after the release workflow is on main:
#   scripts/protect-branches.sh --apply

set -euo pipefail

if [[ "${1:-}" != "--apply" ]]; then
  echo "Refusing to change GitHub. After the repository is public, run: scripts/protect-branches.sh --apply"
  exit 1
fi

private=$(gh repo view --json isPrivate,nameWithOwner --jq '.isPrivate')
repo=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
if [[ "$private" == "true" ]]; then
  echo "This repository is private. Make it public first. GitHub does not enforce branch protection here until then."
  exit 1
fi

upsert() {
  local name="$1"
  local file="$2"
  local id
  id=$(gh api "repos/${repo}/rulesets" --jq ".[] | select(.name==\"${name}\") | .id")
  if [[ -n "$id" ]]; then
    gh api --method PUT "repos/${repo}/rulesets/${id}" --input "$file" >/dev/null
  else
    gh api --method POST "repos/${repo}/rulesets" --input "$file" >/dev/null
  fi
  echo "Updated ${name}."
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cat >"${tmp}/main.json" <<'EOF'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "test" },
          { "context": "from-development" }
        ]
      }
    }
  ]
}
EOF

cat >"${tmp}/development.json" <<'EOF'
{
  "name": "development",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/development"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "test" }
        ]
      }
    }
  ]
}
EOF

upsert main "${tmp}/main.json"
upsert development "${tmp}/development.json"
