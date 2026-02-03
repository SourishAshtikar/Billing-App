FROM postgres:18-alpine


# Copy the initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Copy the seed data (backup) to be executed after init.sql
# Files are executed in alphabetical order, so prefix with 'z_' just in case, 
# although 's' (seed) comes after 'i' (init) anyway.
COPY seed_data.sql /docker-entrypoint-initdb.d/seed_data.sql

# Default environment variables (overridden by docker-compose)
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=billingappdb
ENV POSTGRES_DB=billing_db

EXPOSE 5432
