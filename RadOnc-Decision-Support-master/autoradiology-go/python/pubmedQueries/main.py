import argparse
from collections import namedtuple
import os
import json
import random
import sys
import tqdm

from pubmedQueries import BuildCitationGraphNode
from pubmedQueries import GetPaperData

Args = namedtuple(
    'Args', ['pmids', 'label', 'outpath', 'cite_only',
             'big_query', 'max'])


def main(args):
    pmids = set()
    if not args.pmids:
        sys.stderr.write('ERROR: No PMIDS')
        return
    pmids.update(args.pmids)

    nodes = set()
    for _ in range(args.big_query):
        if len(pmids) > args.max:
            break
        nodes = process_citations(pmids)
        for node in nodes.values():
            pmids.update(node['cites'])
            pmids.update(node['cited_by'])
            if len(pmids) > args.max:
                break

    if args.max > 0:
        max_q = min(args.max, len(pmids))
        pmids = random.sample(pmids, max_q)

    data = [query_pubmed(pmid, nodes, args.label) for pmid in pmids]

    print(json.dumps(data))


def query_pubmed(pmid, nodes, label):

    if pmid not in nodes:
        node = BuildCitationGraphNode.build_node(pmid)
    else:
        node = nodes[pmid]

    data = GetPaperData.GetPaperDataPM(pmid)
    paper_data = data.build_paper_data()
    paper_data['cited_by'] = node['cited_by']
    paper_data['cites'] = node['cites']
    paper_data['label'] = args.label

    return paper_data


def write_json(dump, path):
    with open(path, 'w+') as f:
        f.write(dump)


def read_json(path):
    with open(path, 'r') as f:
        dump = f.read()
    return json.loads(dump)


def process_citations(pmids):
    nodes = dict()
    for pmid in pmids:
        node = BuildCitationGraphNode.build_node(pmid)
        nodes[pmid] = node

    return nodes


def parse_json_args(json_in):
    json_in = str(json_in).strip("'<>() ").replace('\'', '\"')
    json_in = json.loads(json_in)
    return Args(
        pmids=json_in['pmids'],
        label=json_in['label'],
        outpath=json_in['out_path'],
        cite_only=json_in['cite_only'],
        big_query=json_in['big_query'],
        max=json_in['max'],
    )


def get_args():
    """CLI for getting pubmed data.
    Args:
        --pmids: A space seperated list of pub med ids to query
        --label: Label to encode for data
        --out_path: Path to directory results should be stored
        --cite_graph_only: Flag, when set only citation graph data is gathered
        --big_query: Accepts a list of citation graph node json files, queries
            all pmids in all nodes.
        --max: Integer representing the maximum number of queries to
            to make.
        --json_in: JSON string encoding of CLI args

        Stores results in --out_path/citation_graph and --out_path/paper_data
        as files named {pmid}.json. If the process discovers a file already
        exists it will not preform a query/processing for that file.

        Example:

        python3 main.py --pmids 2943780 3253821 --label breast --out_path ~/Desktop --cite_graph_only --big_query ./citation_graph/1.json ./citation_graph/2.json
    """

    parser = argparse.ArgumentParser(usage=get_args.__doc__)

    parser.add_argument('--pmids', nargs='+', type=str, required=False)
    parser.add_argument('--label', type=str, required=False)
    parser.add_argument('--out_path', type=str, required=False)
    parser.add_argument('--cite_graph_only',
                        action='store_true', required=False)
    parser.add_argument('--big_query', nargs=1,
                        required=False, type=int, default=0)
    parser.add_argument('--max', type=int, required=False, default=-1)
    parser.add_argument('--json_in', type=str, required=False)

    args = parser.parse_args()
    if args.json_in != None:
        parsed_args = parse_json_args(args.json_in)
    else:
        parsed_args = Args(
            pmids=args.pmids,
            label=args.label,
            outpath=args.out_path,
            cite_only=args.cite_graph_only,
            big_query=args.big_query,
            max=args.max,
        )

    return parsed_args


if __name__ == '__main__':
    args = get_args()
    main(args)
    sys.stdout.flush()
