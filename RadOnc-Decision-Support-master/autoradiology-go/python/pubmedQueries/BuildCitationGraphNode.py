import xmltodict
from collections import namedtuple
import requests
import sys
import json
import time
import random

FAIL_COUNT = 0


def build_node(pmid):
    cites = get_citations(pmid, 'pubmed_pubmed_refs')
    cited_by = get_citations(pmid, 'pubmed_pubmed_citedin')

    return {'cites': cites, 'cited_by': cited_by, 'pmid': pmid}


def get_citations(pmid, tool):
    base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?'
    db = 'pubmed'
    api_key = '5847230ac6a594b91a82278abb3e96420a08'
    r = f'{base}dbfrom={db}&linkname={tool}&id={pmid}&api_key={api_key}'

    output = requests.get(r)
    if not output.ok:
        global FAIL_COUNT
        sys.stderr.write(f'GET CITE FAILED {FAIL_COUNT}\n')
        FAIL_COUNT += 1
        if FAIL_COUNT > 10:
            return list()
        time.sleep(random.random() * random.randint(1, 3))
        return get_citations(pmid, tool)

    temp = xmltodict.parse(output.text)

    try:
        temp = temp['eLinkResult']['LinkSet']['LinkSetDb']['Link']
    except KeyError:
        return list()
    except TypeError:
        return list()

    cited_set = set()
    for item in temp:
        try:
            cited_set.add(item['Id'])
        except TypeError:
            cited_set.add(temp['Id'])

    return list(cited_set)


def main():
    if len(sys.argv) != 2:
        print(-1)
    else:
        node = build_node(sys.argv[1])
        print(json.dumps(node))
        return node


if __name__ == '__main__':
    main()
