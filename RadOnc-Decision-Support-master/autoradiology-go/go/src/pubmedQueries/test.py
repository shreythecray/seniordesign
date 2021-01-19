import requests
import json


#url = "http://34.74.246.237:8088/get-paper-data"
url = "http://0.0.0.0:8088/run-model"
# post_r = json.dumps({"pmids": ["20956828", ],
#                      "site": "test",
#                      "stage": "test",
#                      "max": 2000})

post_r = json.dumps({"site": "Breast", "site": "DCIS-LCIS"})
r = requests.post(url, post_r)
