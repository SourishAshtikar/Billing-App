# Database Restoration Guide

This guide explains how to restore the database using the backup file (`seed_data.sql`) which has been integrated into the Docker setup.

The backup file contains data for the following tables:
- `BillingReport`
- `Leave`
- `Project`
- `ProjectResource`
- `User`

## Method 1: Fresh Restore (Recommended)
This method wipes the existing database volume and starts fresh with the schema from `init.sql` and data from `seed_data.sql`.

**WARNING: This will delete all current data in the database.**

1.  **Stop containers and remove volumes**:
    ```bash
    docker-compose down -v
    ```
    *The `-v` flag is crucial as it removes the `billing_db_data` volume, triggering the initialization scripts on the next start.*

2.  **Rebuild and Start**:
    For a fully automated clean install, you can run the helper script:
    ```bash
    chmod +x fresh_install.sh
    ./fresh_install.sh
    ```
    
    Or manually:
    ```bash
    docker compose down -v
    docker compose up --build -d
    ```

3.  **Verify**:
    Check the logs to see if the restoration happened:
    ```bash
    docker compose logs db
    ```
    You should see output indicating that `init.sql` and `seed_data.sql` were executed.

## Method 2: Manual Restore (On existing container)
If you want to restore the data without destroying the container (or if the container is already running), you can execute the seed script manually.

**Note**: Since the backup contains `COPY` commands with specific IDs, you might encounter uniqueness constraint violations if the data already exists. It is recommended to truncate tables before importing if you want a clean state.

1.  **Ensure the container is running**:
    ```bash
    docker compose up -d db
    ```

2.  **Run the restore command**:
    ```bash
    cat database/seed_data.sql | docker exec -i billing-db psql -U postgres -d billing_db
    ```
    *(On Windows PowerShell, use `Get-Content database/seed_data.sql | docker exec -i billing-db psql -U postgres -d billing_db`)*

### Troubleshooting
- **Permission Denied**: Ensure the user running the command has permissions to read the sql file.
- **Duplicate Key Errors**: If you see errors about duplicate keys, it means data with the same IDs already exists. You may need to clear the specific tables first:
    ```bash
    docker exec -i billing-db psql -U postgres -d billing_db -c "TRUNCATE TABLE \"User\", \"Project\", \"Leave\" CASCADE;"
    ```
