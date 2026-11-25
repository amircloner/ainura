#!/bin/sh
# Requires the built workspace, Docker, a local postgres:16-alpine image. No SMS.
set -eu
cd "$(dirname "$0")"
export LOG_LEVEL=error OTP_DISPOSABLE_TEST=1 DB_HOST=localhost DB_USERNAME=otp_disposable
export DB_PASSWORD="$(node -p "require('node:crypto').randomBytes(24).toString('hex')")"
export OTP_ASSERTION_SECRET="$(node -p "require('node:crypto').randomBytes(32).toString('hex')")"
export JWT_SECRET="$(node -p "require('node:crypto').randomBytes(32).toString('hex')")"
export COOKIE_SECRET="$(node -p "require('node:crypto').randomBytes(32).toString('hex')")"
id=$(docker run --pull=never -d --rm --tmpfs /var/lib/postgresql/data -p 127.0.0.1::5432 -e POSTGRES_USER="$DB_USERNAME" -e POSTGRES_PASSWORD="$DB_PASSWORD" postgres:16-alpine)
trap 'docker stop "$id" >/dev/null' EXIT
port=$(docker port "$id" 5432/tcp)
export DB_PORT=${port##*:}
for n in 1 2 3 4 5 6 7 8 9 10; do
  if docker exec "$id" pg_isready -h localhost -U "$DB_USERNAME" >/dev/null; then break; fi
  sleep 1
done
NODE_OPTIONS=--experimental-vm-modules ../../node_modules/.bin/jest --config jest.config.js --runInBand --forceExit --silent otp.spec.ts
