#!/bin/sh
# Run only in an approved, stopped checkout of the external ainura-app.
# Usage: sh /path/to/apps/medusa-otp/install.sh /path/to/ainura-app [--apply]
set -eu
src=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
cd "${1:?target Medusa project required}"
git apply --check --unidiff-zero "$src/app-config.patch"
for path in src/phone-otp-config.ts src/modules/phone-otp/index.ts src/api/middlewares.ts; do
  if test -e "$path"; then printf 'Already exists; merge manually: %s\n' "$path" >&2; exit 1; fi
done
if [ "${2:-}" != '--apply' ]; then printf '%s\n' 'Preflight passed; no changes.'; exit 0; fi
mkdir -p src/modules/phone-otp src/api
cp "$src/src/modules/phone-otp/index.ts" src/modules/phone-otp/
cp "$src/src/phone-otp-config.ts" src/
cp "$src/src/api/middlewares.ts" src/api/
git apply --unidiff-zero "$src/app-config.patch"
