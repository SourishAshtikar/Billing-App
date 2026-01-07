FROM postgres:15-alpine

# Copy the initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Default environment variables (overridden by docker-compose)
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=billingappdb
ENV POSTGRES_DB=billing_db

EXPOSE 5432
