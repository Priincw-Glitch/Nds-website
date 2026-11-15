#!/usr/bin/env bash
# Backup produksi: dump MySQL, folder storage/, dan file .env
# ke deploy/backups/<timestamp>/. Hanya menyimpan 7 backup terakhir.
# Kredensial DB dibaca dari .env, bukan di-hardcode.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="$APP_DIR/deploy/backups"
ENV_FILE="$APP_DIR/.env"
KEEP=7

red='\033[0;31m'; green='\033[0;32m'; yellow='\033[0;33m'; nc='\033[0m'
info() { printf "${green}[backup]${nc} %s\n" "$1"; }
warn() { printf "${yellow}[backup]${nc} %s\n" "$1"; }
die()  { printf "${red}[backup] GAGAL:${nc} %s\n" "$1" >&2; exit 1; }

# Ambil nilai KEY dari .env, buang tanda kutip pembungkus
env_get() {
  local value
  value="$(grep -E "^${1}=" "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

[ -f "$ENV_FILE" ] || die "File .env tidak ditemukan di $ENV_FILE"

DB_NAME="$(env_get DB_DATABASE)"
DB_USER="$(env_get DB_USERNAME)"
DB_PASS="$(env_get DB_PASSWORD)"

[ -n "$DB_NAME" ] || die "DB_DATABASE tidak ada di .env"
[ -n "$DB_USER" ] || die "DB_USERNAME tidak ada di .env"

TS="$(date +%Y-%m-%d_%H%M%S)"
DEST="$BACKUP_ROOT/$TS"
mkdir -p "$DEST"

MYSQLDUMP_OPTS=(--single-transaction --quick --routines --triggers --events)
if [ -n "$DB_PASS" ]; then
  MYSQLDUMP_OPTS+=(-u"$DB_USER" -p"$DB_PASS")
else
  # .env tanpa password tetap valid (auth via socket/my.cnf)
  MYSQLDUMP_OPTS+=(-u"$DB_USER")
fi

info "Dump database: $DB_NAME"
mysqldump "${MYSQLDUMP_OPTS[@]}" "$DB_NAME" | gzip > "$DEST/database.sql.gz" \
  || die "mysqldump gagal. Periksa kredensial DB di .env atau izin akses MySQL."

info "Arsip folder storage/"
tar -czf "$DEST/storage.tar.gz" -C "$APP_DIR" storage \
  || die "Gagal mengarsip storage/"

info "Salin .env"
cp "$ENV_FILE" "$DEST/env"

# Hapus backup di luar KEEP terakhir (urut nama timestamp)
ls -1d "$BACKUP_ROOT"/20* 2>/dev/null | sort -r | tail -n +$((KEEP + 1)) | while read -r old; do
  warn "Hapus backup lama: $(basename "$old")"
  rm -rf "$old"
done

info "Selesai: $DEST"
