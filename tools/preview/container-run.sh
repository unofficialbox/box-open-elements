#!/usr/bin/env bash
#
# Runs a command inside the pinned Playwright container so screenshot capture
# uses the exact Chromium + FreeType build (and therefore the exact glyph
# antialiasing) that CI uses. Baselines regenerated here are pixel-comparable
# to what the `visual-regression` CI job produces, which is what makes the
# strict `--pixel` gate reliable — see docs/workshop/docs-site.md.
#
# The container ships Node + the Playwright browsers but not Bun. If a host
# Bun binary is available it is mounted in (same linux-x64 target, no download);
# otherwise Bun is installed from bun.sh on first use. The repo is bind-mounted,
# so captures written under docs/screenshots/ land directly on the host.
#
# A corporate/sandbox HTTPS proxy and CA bundle are forwarded into the container
# when present on the host (harmless no-ops in a plain Docker + internet setup).
#
# Usage:
#   tools/preview/container-run.sh "bun run build && bun tools/preview/capture.ts"
#   tools/preview/container-run.sh "bun run test:regression -- --pixel"
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.61.1-noble"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CMD="${*:?usage: container-run.sh <command>}"

docker_args=(
  --rm --init
  -v "$REPO_ROOT:/work"
  -v boe-bun-cache:/root/.bun
  -w /work
  -e HOME=/root
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
  -e BOE_CMD="$CMD"
)

# Reuse the host Bun binary when present — avoids downloading it (and works even
# when the sandbox proxy blocks bun.sh).
HOST_BUN="$(command -v bun || true)"
if [[ -n "$HOST_BUN" ]]; then
  docker_args+=(-v "$HOST_BUN:/usr/local/bin/bun:ro")
fi

# Forward a sandbox/corporate proxy + CA bundle if the host has them. --network
# host lets the container reach a proxy bound to host loopback.
CA_BUNDLE="${SSL_CERT_FILE:-${CURL_CA_BUNDLE:-}}"
if [[ -n "${HTTPS_PROXY:-}" ]]; then
  docker_args+=(--network host)
  docker_args+=(-e HTTPS_PROXY="$HTTPS_PROXY" -e https_proxy="$HTTPS_PROXY")
  [[ -n "${NO_PROXY:-}" ]] && docker_args+=(-e NO_PROXY="$NO_PROXY" -e no_proxy="$NO_PROXY")
fi
if [[ -n "$CA_BUNDLE" && -f "$CA_BUNDLE" ]]; then
  docker_args+=(-v "$CA_BUNDLE:/etc/ssl/boe-ca.crt:ro")
  docker_args+=(-e SSL_CERT_FILE=/etc/ssl/boe-ca.crt)
  docker_args+=(-e NODE_EXTRA_CA_CERTS=/etc/ssl/boe-ca.crt)
  docker_args+=(-e CURL_CA_BUNDLE=/etc/ssl/boe-ca.crt)
fi

exec docker run "${docker_args[@]}" "$IMAGE" bash -euc '
  export BUN_INSTALL=/root/.bun
  export PATH="/usr/local/bin:/root/.bun/bin:$PATH"
  command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash >/dev/null
  bun install --frozen-lockfile
  eval "$BOE_CMD"
'
