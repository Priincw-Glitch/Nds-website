#!/usr/bin/env bash
# Deploy produksi NDS portal (subfolder /portal/ pada domain utama).
# Step berjalan berurutan dan gagal cepat (fail fast); pada kegagalan
# mana pun ditampilkan panduan rollback lalu ringkasan PASS/FAIL.
# Tiap step bisa dilewati lewat variabel SKIP_*, contoh:
#   SKIP_MIGRATE=1 bash deploy.sh
# Jalankan sebagai root atau via sudo (butuh systemctl restart reverb).

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$APP_DIR/deploy"
LOG_DIR="$DEPLOY_DIR/logs"
ENV_FILE="$APP_DIR/.env"

RELEASE_TS="$(date +%Y-%m-%d_%H%M%S)"
LOG_FILE="$LOG_DIR/deploy_${RELEASE_TS}.log"
GIT_REV="$(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null || echo 'tanpa-git')"

# PHP harus sama dengan versi PHP-FPM di server (8.3)
PHP_BIN="${PHP_BIN:-/usr/bin/php8.3}"
# Versi Node utk build Vite. Cukup diubah di sini bila project naik versi.
NODE_VERSION="${NODE_VERSION:-22}"
# User web pemilik storage/ dan bootstrap/cache
WEB_USER="${WEB_USER:-www-data}"

# Flag skip (0 = jalankan, 1 = lewati)
SKIP_BACKUP="${SKIP_BACKUP:-0}"
SKIP_ENV_CHECK="${SKIP_ENV_CHECK:-0}"
SKIP_DB_CHECK="${SKIP_DB_CHECK:-0}"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"
SKIP_COMPOSER="${SKIP_COMPOSER:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_MANIFEST_CHECK="${SKIP_MANIFEST_CHECK:-0}"
SKIP_STORAGE_LINK="${SKIP_STORAGE_LINK:-0}"
SKIP_CACHE="${SKIP_CACHE:-0}"
SKIP_HTTP_CHECK="${SKIP_HTTP_CHECK:-0}"
SKIP_LOGIN_CHECK="${SKIP_LOGIN_CHECK:-0}"
SKIP_WS_CHECK="${SKIP_WS_CHECK:-0}"
SKIP_REVERB_RESTART="${SKIP_REVERB_RESTART:-0}"

# Akun uji untuk cek login (opsional)
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_TEST_PASSWORD="${ADMIN_TEST_PASSWORD:-}"

red='\033[0;31m'; green='\033[0;32m'; yellow='\033[0;33m'; cyan='\033[0;36m'; nc='\033[0m'

CURRENT_STEP="inisialisasi"
RESULTS=()
TOTAL=14

mkdir -p "$LOG_DIR"
# Semua output step ikut ke file log rilis ini
exec > >(tee -a "$LOG_FILE") 2>&1

header() { printf '\n%s== Step %s/%s: %s ==%s\n' "$cyan" "$1" "$TOTAL" "$3" "$nc"; CURRENT_STEP="$3"; }
pass()   { RESULTS+=("PASS  $CURRENT_STEP"); printf '%sPASS%s %s\n' "$green" "$nc" "$CURRENT_STEP"; }
skip()   { RESULTS+=("SKIP  $CURRENT_STEP"); printf '%sSKIP%s %s\n' "$yellow" "$nc" "$CURRENT_STEP"; }
info()   { printf '%s[deploy]%s %s\n' "$cyan" "$nc" "$1"; }
# return (bukan exit) agar ERR trap bisa mencatat step yang gagal
die()    { printf '%s[deploy] GAGAL:%s %s\n' "$red" "$nc" "$1" >&2; return 1; }

env_get() {
  local value
  value="$(grep -E "^${1}=" "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

print_summary() {
  printf '\n%s===== Ringkasan deploy %s (rev %s) =====%s\n' "$cyan" "$RELEASE_TS" "$GIT_REV" "$nc"
  # Pola ${RESULTS[@]+...} agar aman di bash lama saat array masih kosong
  for r in ${RESULTS[@]+"${RESULTS[@]}"}; do
    case "$r" in
      PASS*) printf '  %s%s%s\n' "$green" "$r" "$nc" ;;
      FAIL*) printf '  %s%s%s\n' "$red" "$r" "$nc" ;;
      *)     printf '  %s%s%s\n' "$yellow" "$r" "$nc" ;;
    esac
  done
}

on_err() {
  local code="$1" line="$2"
  printf '\n%sFAIL%s %s (exit %s, baris skrip %s)\n' "$red" "$nc" "$CURRENT_STEP" "$code" "$line"
  RESULTS+=("FAIL  $CURRENT_STEP")
  cat <<EOF

${red}Panduan pemulihan:${nc}
  1. Log lengkap rilis ini: $LOG_FILE
  2. Pulihkan DB + storage + .env dari backup terakhir:
       bash deploy/rollback.sh --force
     atau pilih timestamp tertentu:
       bash deploy/rollback.sh <timestamp>
  3. Perbaiki penyebabnya, lalu jalankan ulang deploy. Step yang aman
     boleh dilewati dengan flag SKIP_* (contoh: SKIP_MIGRATE=1).
  4. Terlarang di produksi: migrate:fresh dan db:seed.
EOF
  print_summary
  exit 1
}
trap 'on_err "$?" "$LINENO"' ERR

if [ ! -f "$ENV_FILE" ]; then
  die "File .env tidak ada di $ENV_FILE"
fi

# ---------- Step 1: backup ----------
header 1 "Backup (backup.sh)"
if [ "$SKIP_BACKUP" = "1" ]; then skip; else
  bash "$DEPLOY_DIR/backup.sh"
  pass
fi

# ---------- Step 2: verifikasi .env ----------
header 2 "Verifikasi .env produksi"
if [ "$SKIP_ENV_CHECK" = "1" ]; then skip; else
  missing=()
  [ "$(env_get APP_ENV)" = "production" ] || missing+=("APP_ENV harus 'production'")
  [ -n "$(env_get APP_KEY)" ] || missing+=("APP_KEY belum diisi")
  [ -n "$(env_get DB_DATABASE)" ] || missing+=("DB_DATABASE belum diisi")
  [ -n "$(env_get DB_USERNAME)" ] || missing+=("DB_USERNAME belum diisi")
  for key in REVERB_APP_ID REVERB_APP_KEY REVERB_APP_SECRET REVERB_SERVER_PORT \
             VITE_REVERB_HOST VITE_REVERB_PORT VITE_REVERB_SCHEME; do
    [ -n "$(env_get "$key")" ] || missing+=("$key belum diisi")
  done
  case "$(env_get VITE_REVERB_HOST)" in
    127.0.0.1|localhost)
      missing+=("VITE_REVERB_HOST masih 127.0.0.1/localhost; harus hostname publik agar browser bisa konek via wss")
      ;;
  esac
  if [ "${#missing[@]}" -gt 0 ]; then
    printf '%s.env belum siap produksi:%s\n' "$red" "$nc"
    printf '  - %s\n' "${missing[@]}"
    die "Lengkapi .env lalu jalankan ulang deploy."
  fi
  pass
fi

# ---------- Step 3: konektivitas DB ----------
header 3 "Cek konektivitas database"
if [ "$SKIP_DB_CHECK" = "1" ]; then skip; else
  if "$PHP_BIN" "$APP_DIR/artisan" list 2>/dev/null | grep -q 'db:check'; then
    "$PHP_BIN" "$APP_DIR/artisan" db:check
  else
    info "artisan db:check tidak tersedia, pakai migrate:status sebagai probe"
    "$PHP_BIN" "$APP_DIR/artisan" migrate:status >/dev/null
  fi
  pass
fi

# ---------- Step 4: migrasi ----------
header 4 "Migrasi database (migrate --force)"
if [ "$SKIP_MIGRATE" = "1" ]; then skip; else
  # Hanya migrate --force. Terlarang di sini: migrate:fresh, migrate:refresh, db:seed.
  "$PHP_BIN" "$APP_DIR/artisan" migrate --force
  pass
fi

# ---------- Step 5: composer ----------
header 5 "composer install (no-dev)"
if [ "$SKIP_COMPOSER" = "1" ]; then skip; else
  COMPOSER_BIN="$(command -v composer || true)"
  [ -n "$COMPOSER_BIN" ] || die "composer tidak ditemukan di PATH."
  # Dijalankan lewat PHP_BIN agar composer pakai PHP 8.3, sama dengan PHP-FPM
  "$PHP_BIN" "$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction
  pass
fi

# ---------- Step 6: Node + build aset ----------
header 6 "Node $NODE_VERSION + build aset (npm ci, npm run build)"
if [ "$SKIP_BUILD" = "1" ]; then skip; else
  NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    die "nvm tidak ditemukan di $NVM_DIR. Install nvm dulu, atau set NVM_DIR=/jalur/ke/.nvm"
  fi
  # nvm.sh tidak tahan set -u, sehingga dimatikan sementara
  set +u
  . "$NVM_DIR/nvm.sh"
  set -u
  nvm install "$NODE_VERSION" >/dev/null 2>&1 || true
  nvm use "$NODE_VERSION" >/dev/null 2>&1
  hash -r
  NODE_MAJOR="$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1 || true)"
  [ -n "$NODE_MAJOR" ] || die "node tidak bisa dijalankan setelah sumber nvm."
  if [ "$NODE_MAJOR" != "$NODE_VERSION" ]; then
    die "Node aktif v$NODE_MAJOR, dibutuhkan major $NODE_VERSION. Jalankan: nvm install $NODE_VERSION && nvm use $NODE_VERSION, lalu ulangi deploy."
  fi
  info "Pakai node $(node -v), npm $(npm -v)"
  npm ci
  npm run build
  pass
fi

# ---------- Step 7: verifikasi manifest Vite ----------
header 7 "Verifikasi public/build/manifest.json"
if [ "$SKIP_MANIFEST_CHECK" = "1" ]; then skip; else
  [ -f "$APP_DIR/public/build/manifest.json" ] \
    || die "public/build/manifest.json tidak ada. Build Vite gagal atau belum dijalankan."
  cd "$APP_DIR"
  node -e '
    const fs = require("fs"), path = require("path");
    const m = JSON.parse(fs.readFileSync("public/build/manifest.json", "utf8"));
    const missing = [];
    const seen = new Set();
    const checkBuild = (f) => {
      if (!f || seen.has(f)) return;
      seen.add(f);
      if (!fs.existsSync(path.join("public/build", f))) missing.push("public/build/" + f);
    };
    for (const [key, val] of Object.entries(m)) {
      if (!fs.existsSync(key)) missing.push("file sumber hilang: " + key);
      checkBuild(val.file);
      (val.css || []).forEach(checkBuild);
      (val.imports || []).forEach((i) => {
        if (m[i]) checkBuild(m[i].file);
        else missing.push("import tak dikenal di manifest: " + i);
      });
    }
    if (missing.length) {
      console.error("Berkas hilang yang direferensikan manifest:");
      missing.forEach((f) => console.error("  - " + f));
      process.exit(1);
    }
    console.log("Manifest ok: " + Object.keys(m).length + " entri, semua berkas ada.");
  '
  pass
fi

# ---------- Step 8: storage link + izin tulis ----------
header 8 "storage:link + izin tulis storage/ dan bootstrap/cache"
if [ "$SKIP_STORAGE_LINK" = "1" ]; then skip; else
  # Idempoten: artisan hanya membuat link bila belum ada
  "$PHP_BIN" "$APP_DIR/artisan" storage:link
  [ -L "$APP_DIR/public/storage" ] || die "public/storage bukan symlink. Periksa manual: ls -la public/storage"
  [ -e "$APP_DIR/public/storage" ] || die "public/storage menunjuk target yang tidak ada."
  info "public/storage -> $(readlink "$APP_DIR/public/storage")"
  if [ "$(id -u)" = "0" ]; then
    sudo -u "$WEB_USER" test -w "$APP_DIR/storage" \
      || die "storage/ tidak bisa ditulis oleh $WEB_USER. Perbaiki: chown -R $WEB_USER: storage"
    sudo -u "$WEB_USER" test -w "$APP_DIR/bootstrap/cache" \
      || die "bootstrap/cache tidak bisa ditulis oleh $WEB_USER."
  else
    [ -w "$APP_DIR/storage" ] || die "storage/ tidak bisa ditulis user ini ($USER)."
    [ -w "$APP_DIR/bootstrap/cache" ] || die "bootstrap/cache tidak bisa ditulis user ini."
  fi
  pass
fi

# ---------- Step 9: rebuild cache ----------
header 9 "Rebuild cache (config, event, route, view)"
if [ "$SKIP_CACHE" = "1" ]; then skip; else
  # artisan menerima satu perintah per panggilan, jadi dijalankan berurutan
  "$PHP_BIN" "$APP_DIR/artisan" config:cache
  "$PHP_BIN" "$APP_DIR/artisan" event:cache
  "$PHP_BIN" "$APP_DIR/artisan" route:cache
  "$PHP_BIN" "$APP_DIR/artisan" view:cache
  pass
fi

# ---------- Step 10: cek HTTP ----------
header 10 "Cek HTTP (health /up dan homepage)"
if [ "$SKIP_HTTP_CHECK" = "1" ]; then skip; else
  BASE_URL="${BASE_URL:-$(env_get APP_URL)}"
  BASE_URL="${BASE_URL%/}"
  [ -n "$BASE_URL" ] || die "APP_URL kosong di .env dan BASE_URL tidak diset."
  for path in "/up" ""; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL$path")"
    [ "$code" = "200" ] || die "$BASE_URL$path => HTTP $code (harap 200). Cek Apache, rewrite, dan APP_URL."
    info "$BASE_URL$path -> 200"
  done
  pass
fi

# ---------- Step 11: cek login ----------
header 11 "Cek login (POST /login)"
if [ "$SKIP_LOGIN_CHECK" = "1" ]; then skip
elif [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_TEST_PASSWORD" ]; then
  info "ADMIN_EMAIL / ADMIN_TEST_PASSWORD kosong, cek login dilewati."
  skip
else
  jar="$LOG_DIR/login_cookies_${RELEASE_TS}.jar"
  login_page="$(curl -fsS -c "$jar" --max-time 20 "$BASE_URL/login" || true)"
  # Field _token diambil dari halaman login (CSRF Laravel)
  token="$(printf '%s\n' "$login_page" | grep -oP 'name="_token" value="\K[^"]+' | head -n1 || true)"
  [ -n "$token" ] || die "Token CSRF tidak ketemu di $BASE_URL/login. Bila form login memakai nama field lain, sesuaikan step ini."
  status="$(curl -sS -o /dev/null -w '%{http_code}' -b "$jar" -c "$jar" --max-time 20 \
    --data-urlencode "_token=$token" \
    --data-urlencode "email=$ADMIN_EMAIL" \
    --data-urlencode "password=$ADMIN_TEST_PASSWORD" \
    "$BASE_URL/login" || true)"
  rm -f "$jar"
  case "$status" in
    302|200) info "POST /login -> $status (login jalan)"; pass ;;
    419)     die "POST /login -> 419: CSRF token tidak cocok. Cek konfigurasi session/cookie." ;;
    *)       die "POST /login -> $status (harap 302/200). Periksa kredensial uji atau nama field form (email/password)." ;;
  esac
fi

# ---------- Step 12: cek WebSocket Reverb ----------
header 12 "Cek WebSocket Reverb (127.0.0.1:8081)"
if [ "$SKIP_WS_CHECK" = "1" ]; then skip; else
  reverb_key="$(env_get REVERB_APP_KEY)"
  [ -n "$reverb_key" ] || die "REVERB_APP_KEY tidak ada di .env."
  # Respon HTTP apa pun (200/400/426) berarti server Reverb hidup;
  # yang gagal adalah connection refused (tidak ada respons sama sekali).
  ws_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 \
    "http://127.0.0.1:8081/app/${reverb_key}" || true)"
  [ "$ws_code" != "000" ] || die "Tidak ada respons dari 127.0.0.1:8081 (connection refused). Reverb belum jalan atau salah port."
  info "Reverb merespons HTTP $ws_code di 127.0.0.1:8081/app/$reverb_key"
  pass
fi

# ---------- Step 13: restart layanan Reverb ----------
header 13 "Restart layanan Reverb"
if [ "$SKIP_REVERB_RESTART" = "1" ]; then skip
elif ! command -v systemctl >/dev/null 2>&1; then
  info "systemctl tidak tersedia di mesin ini, restart Reverb manual bila perlu."
  skip
else
  systemctl restart reverb
  info "Reverb direstart. Pastikan autostart aktif: systemctl enable reverb"
  pass
fi

# ---------- Step 14: ringkasan ----------
header 14 "Ringkasan"
print_summary
printf 'Log deploy: %s\n' "$LOG_FILE"
