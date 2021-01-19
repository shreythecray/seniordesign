# ROLRS Data Pipeline

`autorad-go` contains a go package, `pubmedQueries`, which acts as a data
managing server. This package contains 4 modules for managing the database,
running python scripts, implementing a REST API, and housing various types
needed by the package.

## The entrypoints module

This module implements an API to turn the pubmedQueries package into a service
available when the ROLRS system is deployed. The API can be accessed over port
8088 when the system is deployed. There are 2 primary entrypoints in
the API, and 3 secondary ones.

### Primary Entrypoints/ROLRS REST API

`/get-paper-data` handles post requests that specify parameters
used to crawl pubmed. The entrypoint can be used by a developer directly, but
currently the concept is for other services to use this entrypoint when more
papers are needed. The service relies on a python script that handles querying
pubmed for a single paper. The implementation attempts to call this script
concurrently with a semaphore that attempts to maximize our use of pubmed's API
without exceeding their rate limit.

`/run-model` handles post requests that specify a site and stage by running
the machine learning model which calculates paper similarity. The service
loads all paper data for the specified site/stage and passes it to a python
script implementing this model. The service then reads the output of this
script and updates the database with the model's reccomendations.

### Secondary Entrypoints

`/get-id` implements a wrapper for a pubmed api that converts between varius
paper identifiers (doi, pmid, pmcid, etc).

`/update-paper-data` is a niche service that can be used to update the entire
database easily if in the future additional datapoints are wanted for each paper.
Giving this entrypoint a site/stage will collect all pmids for that site/stage, 
query pubmed for data using the python script, and overwrite the row in the
database associated with that pmid. If a data field is added to the underlying
python script, and the PubmedData interface, this would automatically add that
column to the database.

`/query-running` is an entrypoint used by the front end to determine if the model
is already running for a specific site/stage. Because a user has a button available
for running the model manually, this entrypoint is used to enforce a lock on that
button preventing redundant queries.

## The dbAccess module

This module houses all functions used to read/write in the database.

## The goPython module

This module contains a general purpose wrapper function for running python
scripts. The module allows for stdin/stdout/stderr redirection, and can
be used to run all of the scripts in the ROLRS system.

## The types module

This module contains all of the interfaces required by other modules. These
are predominantly structs that map to JSON interfaces used to communicate
between the model and the database.

### The PubmedLogger Type

The PubmedLogger type is an error logging object which will write all errors
encountered to a log in the autorad-go docker container. To access this log
you need to attach to the running container.
