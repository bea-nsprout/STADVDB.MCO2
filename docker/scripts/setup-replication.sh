#!/bin/bash
# Script to setup logical replication from primary to reports database
# This should be run after both databases are fully initialized

set -e

echo "Waiting for primary database to be ready..."
until PGPASSWORD=trainpass123 psql -h db-primary -U trainadmin -d train_booking -c '\q' 2>/dev/null; do
  echo "Primary database is unavailable - sleeping"
  sleep 2
done

echo "Waiting for reports database to be ready..."
until PGPASSWORD=trainpass123 psql -h db-reports -U trainadmin -d train_reports -c '\q' 2>/dev/null; do
  echo "Reports database is unavailable - sleeping"
  sleep 2
done

echo "Both databases are ready!"

echo "Setting up logical replication subscription..."
PGPASSWORD=trainpass123 psql -h db-reports -U trainadmin -d train_reports <<-EOSQL
  DO \$\$
  BEGIN
    -- Check if subscription already exists
    IF NOT EXISTS (SELECT 1 FROM pg_subscription WHERE subname = 'reports_sub') THEN
      -- Create subscription to primary database
      CREATE SUBSCRIPTION reports_sub
      CONNECTION 'host=db-primary port=5432 dbname=train_booking user=trainadmin password=trainpass123'
      PUBLICATION reports_pub
      WITH (
        copy_data = false,  -- Don't copy initial data, we'll transform it
        create_slot = true,
        enabled = true,
        slot_name = 'reports_slot'
      );

      RAISE NOTICE 'Subscription reports_sub created successfully';
    ELSE
      RAISE NOTICE 'Subscription reports_sub already exists';
    END IF;
  END
  \$\$;
EOSQL

echo "Logical replication setup complete!"

# Verify subscription status
echo "Checking subscription status..."
PGPASSWORD=trainpass123 psql -h db-reports -U trainadmin -d train_reports -c "SELECT subname, subenabled, subslotname FROM pg_subscription;"

echo "Checking replication slots on primary..."
PGPASSWORD=trainpass123 psql -h db-primary -U trainadmin -d train_booking -c "SELECT slot_name, slot_type, active FROM pg_replication_slots;"

echo "Setup complete!"
