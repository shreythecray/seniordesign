import pandas
from dataclasses import dataclass
import typing
import requests
import json
import os
import sys


@dataclass
class DataPoint:
    doi: str = None
    pmid: str = None
    site: str = None
    stage: str = None


# def get_pmid(doi):
#     url = "http://0.0.0.0:80/get-id"
#     post_r = json.dumps({'pmid': None, 'doi': doi})
#     r = requests.post(url, post_r)
#     r = json.loads(r.content)
#     print(f"DOI: {doi}, PMID: {r['pmid']}")
#     return r["pmid"]

def get_pmid(doi):
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed"
    url = f'{base}&term="{doi}"&retmode=json'
    r = requests.get(url)
    r = json.loads(r.content)
    ret = None
    try:
        ret = r["esearchresult"]["idlist"][0]
    except IndexError:
        print(doi)
        return None
    print(ret)
    return ret


def get_paper(data_point, fn):
    url = "http://0.0.0.0:80/get-paper-data"
    label = f"{data_point.site}_{data_point.stage}"
    post_r = json.dumps({"pmids": [data_point.pmid], "label": label,
                         "out_path": "./test", "cite_only": False, "big_query": 0, "max": 1})
    r = requests.post(url, post_r)
    r = json.loads(r.content)
    if not os.path.exists(data_point.site):
        os.makedirs(data_point.site)
    with open(f"{data_point.site}/{fn}.json", "w+") as f:
        f.write(json.dumps(r))


if __name__ == "__main__":
    csv_path = "refs.csv"
    df = pandas.read_csv(csv_path)

    data = []
    for row in df.iterrows():
        data.append(DataPoint(
            doi=row[1].doi,
            site=row[1].site,
            stage=row[1].stage,
            pmid=get_pmid(row[1].doi),
        ))

    for i, item in enumerate(data):
        get_paper(item, i)
