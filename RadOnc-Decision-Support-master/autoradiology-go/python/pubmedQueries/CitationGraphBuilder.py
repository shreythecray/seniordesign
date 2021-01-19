import requests
import json
import xmltodict
import xml.etree.ElementTree as ET

from collections import namedtuple

CitationNode = namedtuple(
    'CitationNode', ['cites', 'cited_by', 'pmcid'])

ArticleData = namedtuple(
    'ArticleData', ['title', 'pub_date', 'abstract', 'authors', 'id'])


class CitationGraphBuilder():
    def __init__(self, initial_pmcid_set, depth, label):
        self.initial_pmcids = initial_pmcid_set
        self.depth = depth
        self.label = label

    def build_graph(self):
        """Builds a citation graph returning


        Returns:
            A dictionary of nodes indexed by the source paper pmcid, and a set
            of pmcids that are in the use specified depth for the class. The
            citation graph will include papers outside of this set.
        """
        nodes = dict()
        pmcids = set(self.initial_pmcids)

        for i in range(self.depth):
            new_pmcids = set()
            for pmcid in pmcids:
                node = self.build_node(pmcid)
                nodes[pmcid] = node
                new_pmcids.update(node.cites)
                new_pmcids.update(node.cited_by)
            pmcids.update(new_pmcids)
        for pmcid in pmcids:
            node = self.build_node(pmcid)
            nodes[pmcid] = node

        return nodes, pmcids

    def build_node(self, pmcid):
        """Build a single node in the citation graph.

        Node has fields cites and cited_by to store its in/out edges and a field
        storing the nodes pmcid.

        Args:
            pmcid: A unique id used by the pubmed API.
        Returns:
            A CitationNode object.

        """
        cites = self.get_cites(pmcid, False)
        cited_by = self.get_cites(pmcid, True)

        node = CitationNode(
            cites=cites,
            cited_by=cited_by,
            pmcid=pmcid
        )

        return node

    def get_cites(self, pmcid, cited_by=False):
        base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?'
        db = 'pubmed'
        if not cited_by:
            tool = 'pubmed_pmc_refs'
        else:
            tool = 'pmc_pmc_cites'
        r = f'{base}dbfrom={db}&linkname={tool}&id={pmcid}'

        output = requests.get(r)
        if not output.ok:
            print(f'{pmcid} bad return from eutils get citations')
            return None

        temp = xmltodict.parse(output.text)

        try:
            temp = temp['eLinkResult']['LinkSet']['LinkSetDb']['Link']
        except KeyError:
            return list()

        cited_set = set()
        for item in temp:
            try:
                cited_set.add(item['Id'])
            except TypeError:
                cited_set.add(temp['Id'])

        return cited_set

    def pmci_to_doi(self, pmcid):
        base = 'https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?'
        email = 'spreichelt@ucdavis.edu'
        tool_name = 'ucdavis_ecs193_autooncology'
        r = f'{base}tool={tool_name}&email={email}&ids={pmcid}'

        output = requests.get(r)
        if not output.ok:
            print(f'{pmcid} bad return from ncbi id conversion api')
            return None

        temp = xmltodict.parse(output.text)
        temp = json.loads(json.dumps(temp))

        try:
            doi = temp['pmcids']['record']['doi']
        except KeyError:
            doi = 'UNKNOWN'

        return doi

    def get_raw_data(self, pmid):
        base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc'
        tool = 'ucdavis_ecs193_autooncology'
        email = 'spreichelt@ucdavis.edu'
        url = f'{base}&id={pmid}&tool={tool}&email={email}'

        output = requests.get(url)
        if not output.ok:
            print(f'{pmid} bad return from full text api')
            return

        output_tree = ET.fromstring(output.text)

        return output_tree

    def get_title(self, tree):
        for title in tree.iter('title-group'):
            article_title = title.find('article-title')
            if article_title != None:
                return article_title.text.split(' ')

    def get_authors(self, tree):
        paper_authors = list()
        for contrib in tree.iter('contrib'):
            if contrib.attrib['contrib-type'] != 'author':
                continue
            authors = contrib.findall('name')
            for author in authors:
                s, g = author.find('surname'), author.find('given-names')
                if s != None:
                    s = s.text
                if g != None:
                    g = g.text
                paper_authors.append({'surname': s, 'given_name': g})

        return paper_authors

    def get_abstract(self, tree):
        abstract_text = []
        for data in tree.iter('abstract'):
            for text in data.iter('p'):
                if text.text:
                    abstract_text.extend(text.text.split(' '))

        return abstract_text

    def get_pub_date(self, tree):
        for pub_date in tree.iter('pub-date'):
            return pub_date.find('year').text

    def get_paper_data(self, pmid):
        ArticleData = namedtuple(
            'ArticleData', ['title', 'pub_date', 'abstract', 'authors', 'id'])

        tree = self.get_raw_data(pmid)
        article_data = ArticleData(
            title=self.get_title(tree),
            pub_date=self.get_pub_date(tree),
            abstract=self.get_abstract(tree),
            authors=self.get_authors(tree),
            id=pmid,
        )

        return article_data

    def build_set(self):
        cite_graph, citations = self.build_graph()

        json_dumps = list()
        citations_checked = set()
        for pmid in citations:
            if pmid in citations_checked:
                continue
            article_data = self.get_paper_data(pmid)
            node = None
            if pmid in cite_graph:
                node = cite_graph[pmid]
            json_dump = self.write_paper_data(article_data, node)
            json_dumps.append(json_dump)
            citations_checked.add(pmid)

        return cite_graph, citations, json_dumps

    def write_paper_data(self, article_data, cite_node):
        if cite_node.cites:
            cites = list(cite_node.cites)
        else:
            cites = None
        if cite_node.cited_by:
            cited_by = list(cite_node.cited_by)
        else:
            cited_by = None
        json_dict = {
            'pmid': article_data.id,
            'authors': article_data.authors,
            'abstract': article_data.abstract,
            'pub_year': article_data.pub_date,
            'label': self.label,
            'cites': cites,
            'cited_by': cited_by,
        }

        return json.dumps(json_dict)
