#!/bin/sh
# pgAdmin copies a pgpass only while creating its config database.
# Write it on every start so an existing volume still connects.
umask 077
email="${PGADMIN_DEFAULT_EMAIL}"
dir="/var/lib/pgadmin/storage/${email//@/_}"
mkdir -p "$dir"
printf '%s\n' "postgres:5432:*:${DATABASE_USER}:${DATABASE_PASSWORD}" > "$dir/.pgpass"
chmod 600 "$dir/.pgpass"
if [ "$(id -u)" = 0 ]; then
  chown -R 5050:5050 "$dir"
fi
export PGPASS_FILE="$dir/.pgpass"
exec /entrypoint.sh
