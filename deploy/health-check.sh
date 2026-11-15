#!/usr/bin/env bash
# Pemeriksaan pasca-deploy yang berdiri sendiri (tanpa fail-fast):
# semua cek dijalankan, hasil ditampilkan sebagai tabel PASS/FAIL/SKIP.
# Exit code 1 bila ada FAIL, 0 bila semua lulus.
#   bash deploy/health-check.sh
# Variabel yang bisa dioverride: BASE_URL, ADMIN_EMAIL, ADMIN_TEST_PASSWORD

set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"
PHP_BIN="${PHP_BIN:-/usr/bin/php8.3}"

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_TEST_PASSWORD="${ADMIN_TEST_PASSWORD:-}"

red='\033[0;31m'; green='\033[0;32m'; yellow='\033[0;33m'; cyan='\033[0;36m'; nc='\033[0m'
info() { printf '%s[health]%s %s\n' "$cyan" "$nc" "$1"; }

env_get() {
  local value
  value="$(grep -E "^${1}=" "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

BASE_URL="${BASE_URL:-$(env_get APP_URL)}"
BASE_URL="${BASE_URL%/}"

overall=0

record() {
  # $1 = nomor, $2 = nama cek, $3 = status, $4 = keterangan
  local color="$green"
  case "$3" in
    FAIL) color="$red"; overall=1 ;;
    SKIP) color="$yellow" ;;
  esac
  printf '%s  %-2s  %-40s %-6s%s %s\n' "$color" "$1" "$2" "$3" "$nc" "$4"
}

[ -f "$ENV_FILE" ] || { printf 'File .env tidak ada di %s\n' "$ENV_FILE" >&2; exit 1; }
if [ -z "$BASE_URL" ]; then
  printf 'BASE_URL kosong: isi APP_URL di .env atau set BASE_URL.\n' >&2
  exit 1
fi

info "Target: $BASE_URL"
printf '\n  %-2s  %-40s %-6s %s\n' 'NO' 'CEK' 'STATUS' 'KETERANGAN'

# Cek 1: HTTP homepage
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL" || true)"
if [ "$code" = "200" ]; then
  record 1 "Homepage" PASS "HTTP 200"
else
  record 1 "Homepage" FAIL "HTTP ${code:-tidak ada respons}"
fi

# Cek 2: health endpoint /up
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL/up" || true)"
if [ "$code" = "200" ]; then
  record 2 "Health /up" PASS "HTTP 200"
else
  record 2 "Health /up" FAIL "HTTP ${code:-tidak ada respons}"
fi

# Cek 3: contoh aset storage lewat /storage/<file>
# File pertama di storage/app/public dipakai sebagai sampel
sample="$(find "$APP_DIR/storage/app/public" -type f 2>/dev/null | head -n1 || true)"
if [ -z "$sample" ]; then
  record 3 "Aset storage" SKIP "tidak ada file di storage/app/public"
else
  rel="${sample#$APP_DIR/storage/app/public/}"
  # --globoff agar karakter khusus di nama file tidak dianggap pola curl
  code="$(curl -g -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL/storage/$rel" || true)"
  if [ "$code" = "200" ]; then
    record 3 "Aset storage" PASS "/storage/$rel"
  else
    record 3 "Aset storage" FAIL "HTTP ${code:-tidak ada respons} (/storage/$rel)"
  fi
fi

# Cek 4: login POST (butuh ADMIN_EMAIL + ADMIN_TEST_PASSWORD)
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_TEST_PASSWORD" ]; then
  record 4 "Login POST" SKIP "ADMIN_EMAIL/ADMIN_TEST_PASSWORD tidak diset"
else
  jar="$(mktemp)"
  login_page="$(curl -fsS -c "$jar" --max-time 20 "$BASE_URL/login" || true)"
  token="$(printf '%s\n' "$login_page" | grep -oP 'name="_token" value="\K[^"]+' | head -n1 || true)"
  if [ -z "$token" ]; then
    record 4 "Login POST" FAIL "token CSRF tidak ketemu di /login"
  else
    status="$(curl -sS -o /dev/null -w '%{http_code}' -b "$jar" -c "$jar" --max-time 20 \
      --data-urlencode "_token=$token" \
      --data-urlencode "email=$ADMIN_EMAIL" \
      --data-urlencode "password=$ADMIN_TEST_PASSWORD" \
      "$BASE_URL/login" || true)"
    case "$status" in
      302|200) record 4 "Login POST" PASS "HTTP $status (login jalan)" ;;
      *)       record 4 "Login POST" FAIL "HTTP ${status:-tidak ada respons}" ;;
    esac
  fi
  rm -f "$jar"
fi

# Cek 5: WebSocket Reverb di internal port 8081
reverb_key="$(env_get REVERB_APP_KEY)"
if [ -z "$reverb_key" ]; then
  record 5 "Reverb 127.0.0.1:8081" FAIL "REVERB_APP_KEY tidak ada di .env"
else
  ws_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 \
    "http://127.0.0.1:8081/app/${reverb_key}" || true)"
  if [ "$ws_code" != "000" ] && [ -n "$ws_code" ]; then
    record 5 "Reverb 127.0.0.1:8081" PASS "HTTP $ws_code (server merespons)"
  else
    record 5 "Reverb 127.0.0.1:8081" FAIL "connection refused / tidak ada respons"
  fi
fi

# Cek 6: queue worker (queue:failed harus bisa dijalankan)
if qout="$("$PHP_BIN" "$APP_DIR/artisan" queue:failed 2>&1)"; then
  info "queue:failed: $(printf '%s\n' "$qout" | sed -n '3p')"
  record 6 "Queue artisan" PASS "queue:failed ok"
else
  record 6 "Queue artisan" FAIL "queue:failed gagal: $(printf '%s\n' "$qout" | head -n1)"
fi

# Cek 7: versi PHP CLI sama dengan PHP-FPM (8.3)
phpver="$("$PHP_BIN" -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;' 2>/dev/null || true)"
if [ "$phpver" = "8.3" ]; then
  record 7 "PHP CLI" PASS "$phpver (PHP_BIN=$PHP_BIN)"
else
  record 7 "PHP CLI" FAIL "terdeteksi ${phpver:-tidak diketahui}, bukan 8.3"
fi

printf '\n'
if [ "$overall" = "0" ]; then
  printf '%sSEMUA CEK LULUS%s\n' "$green" "$nc"
  exit 0
else
  printf '%sADA CEK YANG GAGAL%s, periksa baris FAIL di atas.\n' "$red" "$nc"
  exit 1
fi
