import json
import requests

ds = json.dumps({'label': "test.garbage"})
url = "http://0.0.0.0:80/run-model"

#requests.post(url, 'KILL')
requests.post(url, ds)
