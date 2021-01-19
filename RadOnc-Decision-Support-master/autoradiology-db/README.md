# ROLRS Database Container

`autorad-db` is the database container for ROLRS. It is a PostgreSQL database running on the default port 5432.

## Accessing

Since the container is not externally accessible, if you need direct access to the database then you can open a bash shell via Docker then use psql:
```
docker-compose exec autorad-db bash
psql -h localhost -U postgres -d postgres
```

In order to access the database programatically you'll need to create a new Docker container and include it in the `docker-compose.yml` for new services, or use one of the existing containers. The connection details are as follows:
```
host: autorad-db
port: 5432 (this is the default port)
user: postgres
database: postgres
```

## Backups

The directory contains two backups. `autorad_seed.sql` is a barebones backup with only the seed papers. It is used when you need to reset the database. `autorad.sql` is a normal backup of the most recent data. 

Backups must be done manually (although it is possible to automate them with `cron`) via the following commands:
```
docker-compose exec autorad-db bash
pg_dump -h localhost -U postgres postgres > autorad.sql
exit
docker cp <container-hash-from-docker ps>:/autorad.sql - >autorad.sql
```

## Resetting

If you need to reset the database for any reason to seed papers only follow these instructions:
```
cp autorad_seed.sql autorad.sql
docker-compose up -d --build autorad-db
```

## Database Tables
papers2: stores the paper information

Column        | Description
--------------|-------------
id            | auto generated paper id used for keying in other tables
title         | paper title
pub_date      | year of paper publication
abstract      | paper abstract
authors       | paper's authors
pmid          | Pubmed ID of paper
doi           | paper's DOI
cited_by      | json formatted list of PMIDs that the paper is cited by
cites         | json formatted list of PMIDs that the paper cites
site_stage_id | id from site_stage table of site and stage that paper is associated with
keywords      | json formatted list of MeSH terms for paper

site_stage: stores the site and stage combinations

Column | Description
-------|-------------
id     | auto generated site stage id used for keying in other tables
site   | disease site
stage  | stage associated with disease site

treatments2: stores the treatment recommendations

Column        | Description
--------------|-------------
site_stage_id | id from site_stage table of site and stage that recommendation is associated with
treatment     | the treatment recommendation associated with site/stage

favorites: stores which papers a user has saved

Column        | Description
--------------|-------------
paper_id      | id from papers2 table of paper saved
site_stage_id | id from site_stage table of site and stage that paper is associated with
user_id       | id from users table of user that saved the paper

recommendations: stores which papers are recommended by the model

Column        | Description
--------------|-------------
paper_id      | id from papers2 table of paper being recommended
site_stage_id | id from site_stage table of site and stage that paper is associated with
rank          | rank amongst papers recommended, lower rank means higher recommended

ratings2: stores user ratings of papers

Column        | Description
--------------|-------------
paper_id      | id from papers2 table of paper being rated
user_id       | id from users table of user that rated the paper
site_stage_id | id from site_stage table of site and stage that paper is associated with
rating        | rating from 1 to 10

users: stores the user info

Column   | Description
---------|-------------
email    | the user's email
password | the bcrypt hash of the user's password
id       | auto generated user id used for keying in other tables

pw_resets: stores the password reset tokens

Column     | Description
-----------|-------------
email      | the user's email
token      | the token generated in backend
expiration | unix timestamp of when the token expires