Output JSON format:

```json
{
    "title": [<list of string],
    "pub_date": <year as string>,
    "abstract": [<list of string>],
    "authors": [ <list of key:val pairs>
        {
            "surname": <string> 
            "given_name": <string
        }]
    "pmid": <string id>,
    "cited_by": [<list of pmid],
    "cites": [<list of pmid>],
    "doi": <string>,
    "rating": <int rating, -1 for unrated>,
```

Input JSON format:

```json
{
    "pmids": <string list of pmid to query>,
    "label": <string label to assign to output json>,
    "out_path": <directory to store ourput json>,
    "cite_graph_only": <boolean flag, when True skips paper data>,
    "big_query": <list of citation graph nodes, will query all pmids recursively>,
    "max": <int max number of queries to make>,
}
```
