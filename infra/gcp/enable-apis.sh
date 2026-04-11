#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_LIST_FILE="${SCRIPT_DIR}/service-apis.txt"

PROJECT_ID=""
DRY_RUN=0

usage() {
  cat <<'EOF'
Enable required Google APIs for the Kharon stack.

Usage:
  bash infra/gcp/enable-apis.sh --project <gcp-project-id> [--dry-run]
  GOOGLE_CLOUD_PROJECT=<gcp-project-id> bash infra/gcp/enable-apis.sh

Options:
  --project, -p   Target GCP project id
  --dry-run       Print APIs without enabling
  --help, -h      Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project|-p)
      PROJECT_ID="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${PROJECT_ID}" ]]; then
  PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-}}"
fi

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Missing project id. Use --project or GOOGLE_CLOUD_PROJECT." >&2
  usage
  exit 1
fi

if [[ ! -f "${API_LIST_FILE}" ]]; then
  echo "API list file not found: ${API_LIST_FILE}" >&2
  exit 1
fi

if [[ "${DRY_RUN}" -eq 0 ]] && ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is required but not found in PATH." >&2
  exit 1
fi

mapfile -t APIS < <(grep -vE '^\s*($|#)' "${API_LIST_FILE}" | tr -d '\r')

if [[ "${#APIS[@]}" -eq 0 ]]; then
  echo "No APIs found in ${API_LIST_FILE}" >&2
  exit 1
fi

echo "Project: ${PROJECT_ID}"
echo "API count: ${#APIS[@]}"

FAILED=()

for API in "${APIS[@]}"; do
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    echo "[dry-run] ${API}"
    continue
  fi

  echo "Enabling ${API} ..."
  if gcloud services enable "${API}" --project="${PROJECT_ID}" --quiet >/dev/null; then
    echo "  ok"
  else
    echo "  failed"
    FAILED+=("${API}")
  fi
done

if [[ "${#FAILED[@]}" -gt 0 ]]; then
  echo
  echo "These APIs failed to enable:"
  for API in "${FAILED[@]}"; do
    echo "  - ${API}"
  done
  echo "Fix IAM or org-policy constraints, then rerun."
  exit 2
fi

if [[ "${DRY_RUN}" -eq 0 ]]; then
  echo
  echo "All APIs enabled for project ${PROJECT_ID}."
fi
