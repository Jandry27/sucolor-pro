#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="jqcjemhabtmfasuilbcd"
STAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
BACKUP_ROOT=".backups/supabase"
BACKUP_DIR="$BACKUP_ROOT/$STAMP"
ARCHIVE="$BACKUP_ROOT/sucolor-$STAMP.tar.gz"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: Supabase CLI no está instalado."
  echo "Instálalo y vuelve a ejecutar este script."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_ROOT" "$BACKUP_DIR" 2>/dev/null || true

echo "Creando respaldo de SuColor ($PROJECT_REF)..."
echo "Destino local: $BACKUP_DIR"

supabase db dump --linked -f "$BACKUP_DIR/roles.sql" --role-only
supabase db dump --linked -f "$BACKUP_DIR/schema.sql"
supabase db dump --linked -f "$BACKUP_DIR/data.sql" --use-copy --data-only

(
  cd "$BACKUP_DIR"
  shasum -a 256 roles.sql schema.sql data.sql > SHA256SUMS
)

tar -czf "$ARCHIVE" -C "$BACKUP_DIR" .

echo
echo "Backup terminado:"
echo "  $ARCHIVE"
echo
echo "IMPORTANTE:"
echo "1. Esta carpeta está ignorada por Git porque contiene datos reales."
echo "2. Copia el archivo .tar.gz a una ubicación externa y cifrada."
echo "3. Este backup cubre la base de datos; no descarga archivos de Cloudinary."
