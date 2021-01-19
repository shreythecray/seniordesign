FROM postgres:11

COPY autorad.sql .

RUN cp autorad.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
