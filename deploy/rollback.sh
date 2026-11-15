#!/usr/bin/env bash
# Rollback produksi: pulihkan dump DB, backup storage/, dan .env
# dari deploy/backups/<timestamp>/. Tanpa argumen memakai backup terakhir.
# Tanpa --force akan diminta konfirmasi manual.
#   bash deploy/rollback.sh              -> backup terbaru
#   bash deploy/rollback.sh 2026-11-14_153000
#   bash deploy/rollback.sh --force      -> tanpa konfirmasi

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="$APP_DIR/deploy/backups"
ENV_FILE="$APP_DIR/.env"
PHP_BIN="${PHP_BIN:-/usr/bin/php8.3}"

red='\033[0;31m'; green='\033[0;32m'; yellow='\033[0;33m'; nc='\033[0m'
info() { printf "${green}[rollback]${nc} %s\n" "$1"; }
warn() { printf "${yellow}[rollback]${nc} %s\n" "$1"; }
die()  { printf "${red}[rollback] GAGAL:${nc} %s\n" "$1" >&2; exit 1; }

FORCE=0
TARGET=""
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    *) TARGET="$arg" ;;
  esac
done

[ -d "$BACKUP_ROOT" ] || die "Folder backup tidak ada: $BACKUP_ROOT"

if [ -z "$TARGET" ]; then
  TARGET="$(ls -1d "$BACKUP_ROOT"/20* 2>/dev/null | sort | tail -n1 || true)"
  [ -n "$TARGET" ] || die "Belum ada backup di $BACKUP_ROOT."
  info "Memakai backup terakhir: $(basename "$TARGET")"
else
  TARGET="$BACKUP_ROOT/$TARGET"
fi

[ -d "$TARGET" ] || die "Folder backup tidak ada: $TARGET"
[ -f "$TARGET/database.sql.gz" ] || die "Dump DB tidak ada di $TARGET."
[ -f "$TARGET/storage.tar.gz" ] || die "Backup storage tidak ada di $TARGET."
[ -f "$TARGET/env" ] || die "Backup .env tidak ada di $TARGET (file: env)."

# Kredensial diambil dari .env cadangan karena dump berasal dari DB itu
env_get() {
  local value
  value="$(grep -E "^${1}=" "$TARGET/env" | tail -n1 | cut -d= -f2- || true)"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}
DB_NAME="$(env_get DB_DATABASE)"
DB_USER="$(env_get DB_USERNAME)"
DB_PASS="$(env_get DB_PASSWORD)"
[ -n "$DB_NAME" ] || die "DB_DATABASE tidak ada di backup .env."

if [ -n "$DB_PASS" ]; then
  MYSQL_OPTS=(-u"$DB_USER" -p"$DB_PASS")
else
  MYSQL_OPTS=(-u"$DB_USER")
fi

cat <<EOF

Rollback akan:
  1. Menimpa database '$DB_NAME' dengan dump dari $(basename "$TARGET")
  2. Mengganti folder storage/ dengan backup $(basename "$TARGET")
     (kondisi storage sekarang dipindah ke storage.pre-rollback-*)
  3. Menimpa .env dengan cadangan dari backup yang sama
     (.env sekarang dipindah ke .env.pre-rollback-*)

EOF

if [ "$FORCE" != "1" ]; then
  if [ ! -t 0 ]; then
    die "Bukan sesi interaktif sehingga konfirmasi tidak bisa diminta. Ulangi dengan --force."
  fi
  read -r -p "Ketik YA untuk melanjutkan: " answer
  [ "$answer" = "YA" ] || die "Dibatalkan."
fi

RB_TS="$(date +%Y%m%d%H%M%S)"

info "Restore database $DB_NAME"
gunzip -c "$TARGET/database.sql.gz" | mysql "${MYSQL_OPTS[@]}" "$DB_NAME" \
  || die "mysql gagal. Periksa kredensial dan status MySQL."

warn "Ganti storage/ (kondisi lama disimpan: storage.pre-rollback-$RB_TS)"
mv "$APP_DIR/storage" "$APP_DIR/storage.pre-rollback-$RB_TS"
tar -xzf "$TARGET/storage.tar.gz" -C "$APP_DIR"

warn "Ganti .env (kondisi lama disimpan: .env.pre-rollback-$RB_TS)"
cp "$ENV_FILE" "$ENV_FILE.pre-rollback-$RB_TS"
cp "$TARGET/env" "$ENV_FILE"

info "Rebuild cache (config, route, view)"
"$PHP_BIN" "$APP_DIR/artisan" config:cache
"$PHP_BIN" "$APP_DIR/artisan" route:cache
"$PHP_BIN" "$APP_DIR/artisan" view:cache

info "Rollback selesai dari $(basename "$TARGET")."
cat <<'EOF'

Langkah manual yang mungkin masih perlu:
  1. Bila kode aplikasi ikut bermasalah, deploy ulang rilis sebelumnya:
     git checkout <tag/commit sebelumnya>  (atau ekstrak arsip rilis lama)
  2. Restart layanan: systemctl restart reverb
     Reload PHP-FPM bila versi/opsi PHP berubah: systemctl reload php8.3-fpm
  3. Verifikasi hasil: bash deploy/health-check.sh
EOF
