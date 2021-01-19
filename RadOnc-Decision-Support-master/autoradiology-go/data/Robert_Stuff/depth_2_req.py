import requests
import json

url = "http://0.0.0.0:80/get-paper-data"
post_r = json.dumps({"pmids": ["21398619"], "label": 'breast',
                     "out_path": "./test", "cite_only": False, "big_query": 2, "max": 100000})
r = requests.post(url, post_r)
r = json.loads(r.content)
with open(f"out.json", "w+") as f:
    f.write(json.dumps(r))
