FROM postgres:15-alpine

# Copy the initialization script to the Docker entrypoint directory
# Scripts in /docker-entrypoint-initdb.d/ are executed in alphabetical order
COPY init.sql /docker-entrypoint-initdb.d/

# Set environment variables (can be overridden in docker-compose.yml)
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=billing_db

EXPOSE 5432
