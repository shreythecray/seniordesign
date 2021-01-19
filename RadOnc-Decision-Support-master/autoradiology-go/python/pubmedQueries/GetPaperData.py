import requests
import json
import xml.etree.ElementTree as ET
import sys
from dataclasses import dataclass
import time
import random
import re

import BuildCitationGraphNode

# Global variable used to count how many times a request has failed.
# Used to throttle the number of re-requests that are made.
FAIL_COUNT = 0


class GetPaperDataPM:
    """Makes queries to Pubmed's db to gather data for a specific paper.

    Creates an object with members for each datapoint required by the project.

    Args:
        pmid: A unique identifier used by pubmed to specify a paper in the
            pubmed db. Note that pubmed maintains several separate databases,
            this id works only with db=pubmed requests.
    """

    def __init__(self, pmid):
        self.pmid = pmid
        self.paper_data = dict()
        self._data_tree = None

        self.get_raw_data()

    def get_raw_data(self):
        base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml'
        tool = 'ucdavis_ecs193_autooncology'
        email = 'spreichelt@ucdavis.edu'
        api_key = '5847230ac6a594b91a82278abb3e96420a08'
        url = f'{base}&id={self.pmid}&tool={tool}&email={email}&api_key={api_key}'

        output = requests.get(url)
        if not output.ok:
            global FAIL_COUNT
            sys.stderr.write(f'GET PAPER DATA FAILED {FAIL_COUNT}\n')
            FAIL_COUNT += 1
            if FAIL_COUNT < 10:
                time.sleep(random.random() * random.randint(1, 3))
                return self.get_raw_data()
            return None

        output_tree = ET.fromstring(output.text)
        self._data_tree = output_tree

    def build_paper_data(self):
        self.get_raw_data()

        paper_data = dict()
        if self._data_tree != None:
            paper_data['pmid'] = self.pmid
            paper_data["title"] = self.get_title()
            paper_data["date"] = self.get_pub_date()
            paper_data["abstract"] = self.get_abstract()
            paper_data["authors"] = self.get_authors()
            paper_data["doi"] = self.get_doi()
            paper_data["keywords"] = self.get_keywords()

        if self._data_tree == None:
            sys.exit(1)

        return paper_data

    def get_title(self):
        for article in self._data_tree.iter('Article'):
            title = article.find('ArticleTitle')
            if title != None:
                return title.text.split(' ')

    def get_abstract(self):
        for article in self._data_tree.iter('Article'):
            abstract = article.find('Abstract')
            try:
                text = abstract.findall('AbstractText')
            except AttributeError:
                return None
            abstract_text = []
            for p in text:
                abstract_text.extend(p.text.split(' '))
            if abstract_text:
                return abstract_text

    def get_pub_date(self):
        for date in self._data_tree.iter('DateCompleted'):
            year = date.find('Year')
            if year != None:
                return year.text

    def get_authors(self):
        for article in self._data_tree.iter('Article'):
            authors = article.find('AuthorList')
            if authors == None:
                continue
            authors = authors.findall('Author')
            author_list = []
            for author in authors:
                l, i = author.find('LastName'), author.find('Initials')
                if l != None:
                    l = l.text
                if i != None:
                    i = i.text
                author_list.append(f'{l} {i}')
            if author_list:
                return author_list

    def get_doi(self):
        for pmd in self._data_tree.iter('PubmedData'):
            ids = pmd.find('ArticleIdList')
            ids = ids.findall('ArticleId')
            for a_id in ids:
                if a_id.attrib['IdType'] == 'doi':
                    return a_id.text

    def get_pmid(self):
        for pmd in self._data_tree.iter('PubmedData'):
            ids = pmd.find('ArticleIdList')
            ids = ids.findall('ArticleId')
            for a_id in ids:
                if a_id.attrib['IdType'] == 'pmid':
                    return a_id.text

    def get_keywords(self):
        keywords = set()
        for mesh in self._data_tree.iter('MeshHeading'):
            descriptor = mesh.findall('DescriptorName')
            qualifier = mesh.findall('QualifierName')
            if descriptor != None:
                terms = set()
                for d in descriptor:
                    tmp = re.findall(r'\s|,|[^,\s]+', d.text)
                    tmp = [t for t in tmp if t != " " and t != ","]
                    terms.update(tmp)
                descriptor = list(tmp)
            else:
                continue
            if qualifier == None:
                continue
            is_major = False
            for q in qualifier:
                if q.attrib['MajorTopicYN'] == 'Y':
                    is_major = True
                    break
            if is_major:
                keywords.update(descriptor)
        return list(keywords)


def main():
    """Receives a pmid arg and constructs a GetPaperDataPM object.

    Prints article data to stdout.
    """
    if len(sys.argv) != 2:
        print(-1)
    else:
        article_data = GetPaperDataPM(sys.argv[1])
        article_data = article_data.build_paper_data()
        print(json.dumps(article_data))
        return article_data


if __name__ == '__main__':
    main()
