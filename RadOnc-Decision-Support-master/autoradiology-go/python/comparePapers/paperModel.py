# used for parsing JSON string + cmd args
import json
import argparse

# used for error reporting
import sys
import random

# used for array functions
import numpy as np

# used to store data
from collections import namedtuple, defaultdict

# scikit learn functions used in clustering
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import MiniBatchKMeans

# tuple containing information necessary for execution
Args = namedtuple(
    'Args', ['papers', 'num_recs', 'num_clusters']
)

# tuple containing relevant information about a paper
Paper = namedtuple(
    'Paper', ['title', 'pmid', 'abstract', 'pub_date',
              'authors', 'cited_by', 'cites', 'rating', 'keywords'])

def parse_json_args():
    """ parse json arguments (papers) from stdin

    Returns: 

        papers (list): a list of Paper namedtuples
    """
    papers = []

    # read json string line by line from stdin
    for paper in sys.stdin.readlines():
        #sys.stderr.write("reading a line\n")
        try:
            # encode as json object
            obj = json.loads(paper)
        except json.decoder.JSONDecodeError:
            sys.stderr.write(f"DECODE ERROR: {paper}")
            continue

        # write json object as Paper NamedTuple
        if not isinstance(obj, dict):
            sys.stderr.write(f"INSTANCE ERROR: {paper}")
        if 'title' not in obj:
            obj['title'] = "NA"
        if 'abstract' not in obj:
            obj['abstract'] = []
        if 'pub_date' not in obj:
            obj['pub_date'] = []
        if 'authors' not in obj:
            obj['authors'] = []
        if 'cited_by' not in obj:
            obj['cited_by'] = []
        if 'cites' not in obj:
            obj['cited_by'] = []

        # add paper to list
        papers.append(Paper(
            title=obj['title'],
            pmid=obj['pmid'],
            abstract=obj['abstract'],
            pub_date=obj['pub_date'],
            authors=obj['authors'],
            cited_by=obj['cited_by'],
            cites=obj['cites'],
            rating=obj['rank'],
            keywords=obj['keywords']
        ))
    return papers


def read_args():
    """read and process commandline+stdin arguments needed to run model

    Returns:

        args (Args): an Args namedtuple
    """
    # read and parse commandline args
    parser = argparse.ArgumentParser(usage=read_args.__doc__)
    # number of recommended papers to output
    parser.add_argument('num_recs', nargs=1, type=int)
    # deprecated argument, originally used in another iteration of model
    # can be ignored for now, can be changed to accomodate different args
    # in the future
    parser.add_argument('cutoff', nargs=1, type=float)

    # can be ignored, number of clusters is calculated dynamically elsewhere
    num_clusters = 5

    # read in command line args
    args = parser.parse_args()

    # read in papers from stdin
    papers = parse_json_args()

    # return an Args NamedTuple that contains information necessary
    # to make further calls
    return Args(papers=papers,
                num_recs=args.num_recs,
                num_clusters=num_clusters)


def build_dict(papers):
    """build a dictionary from a list of Paper namedtuples

    Parameters:

        papers (list): a list of Paper namedtuples

    Returns:

        paper_dict (dict): a dictionary of papers, indexed by pmid
    """
    paper_dict = {}

    # converts list into a dictionary indexed by pmid
    for p in papers:
        paper_dict[p.pmid] = p

    return paper_dict


def get_cluster_indices(cluster_index, labels):
    """ returns a list of paper indices belonging to a cluster

    Parameters:

        cluster_index (int): index of cluster

        labels (list): a list of cluster labels taken from a model

    Returns:

        papers (list): a list of paper indices from a cluster
    """
    # list of indices of which cluster each paper belongs to
    # first entry in indices corresponds to first paper
    indices = np.where(labels == cluster_index)[0]
    return indices

def get_cluster_avg_rating(cluster_index, labels, papers, verbose=False):
    """calculates the average rating of rated papers in a cluster

    Parameters: 

        cluster_index (int): index of a cluster

        labels (list): a list of cluster labels taken from a model

        papers (list): a list of Paper namedtuples

        verbose (bool): print ratings when verbose=True

    Returns:

        avg (float): returns average rating if ratings exist, 0 otherwise
    """
    # get indices for each paper
    objects = get_cluster_indices(cluster_index, labels)

    cluster_count = 0
    cluster_sum = 0

    # count number of rated papers in each cluster, sum total ratings
    for o in objects:
        if papers[o].rating != 0:
            cluster_sum += papers[o].rating
            cluster_count += 1
    
    # when no papers have been rated in the cluster
    if cluster_count == 0:
        if verbose:
            sys.stderr.write("no rated papers in " + str(cluster_index) + "\n")
        return 0
    if verbose:
        sys.stderr.write('average rating: ' + str(cluster_sum / cluster_count) 
                         + ' for ' + str(cluster_count) + ' rated papers\n')
    # average rating for rated paper in clusters
    return cluster_sum / cluster_count

# used while debugging, display values of clusters
def print_papers_in_cluster(cluster_index, labels, papers):
    """print out information about papers inside of a cluster. no return value

    Parameters:

        cluster_index (int): index of cluster to be printed

        labels (list): list of mapping of papers to clusters

        papers (list): list of Paper namedtuples
    """
    # get papers inside cluster
    objects = get_cluster_indices(cluster_index, labels)
    sys.stderr.write('CLUSTER ' + str(cluster_index) + ': len=' + 
                     str(len(objects)) + '\n')
    cluster_sum = 0
    cluster_count = 0
    # print out papers
    for o in objects:
        # unrated papers are rated as 0
        if papers[o].rating == 0:
            sys.stderr.write(str(cluster_index) + '  UNRATED: ' +
                             ' '.join(papers[o].title) + '\n')
        else:
            sys.stderr.write(str(cluster_index) + '  RATED: ')
            sys.stderr.write(' '.join(papers[o].title) + ' ')
            sys.stderr.write(str(papers[o].rating) + '\n')
            
            cluster_sum += papers[o].rating
            cluster_count += 1
    # print average if there are more than one paper
    if cluster_count > 1:
        sys.stderr.write('average rating: ' + str(cluster_sum / cluster_count) 
                        + ' for ' + str(cluster_count) + ' rated papers\n')

# used as heuristic evaluation for individual papers
def get_avg_keyword_rating_dict(papers, verbose=False):
    """ calculate average rating of papers containing each keyword

    Parameters:

        papers (list): a list of Paper namedtuples

        verbose (bool): print ratings for each keyword if verbose == True

    Returns: 

        ratings (dict): a dictionary of (keyword, rating) tuples
    """
    k = {}

    # sum and count all keyword ratings
    for p in papers:
        if p.rating != 0:
            for kw in p.keywords:
                if kw not in k:
                    k[kw] = {"sum": 0.0, "count": 0}
                k[kw]["sum"] += p.rating
                k[kw]["count"] += 1

    # calculate average for each keyword
    for kw in k:
        avg = k[kw]["sum"] / k[kw]["count"]
        if verbose:
            sys.stderr.write(str(kw) +  " avg: " + str(avg) + " count: " + 
                             str(k[kw]["count"]) + '\n')

    return k

# heuristic evaluation, used to sort recommendations within a cluster
# higher aux score = more recommendable paper
def get_aux_score(paper, kw_ratings, verbose=False):
    """ calculate the auxiliary score for a paper
    
    used to sort papers within a cluster for recommendation

    Parameters:

        paper (Paper): a Paper namedtuple

        kw_ratings (dict): a dict of keyword ratings

        verbose (bool): print out title/rating when verbose = True

    Returns:

        aux_score (float): a score calculated from multiple heuristics
    """
    # add other heuristics here
    aux_score = get_keyword_score(paper, kw_ratings)
    if verbose:
        sys.stderr.write(' '.join(paper.title) + " score: " +str(aux_score))
        sys.stderr.write('\n')
    return aux_score

# calculate keyword score associated with a single paper
def get_keyword_score(paper, ratings):
    """ return the keyword score associated with a paper

    based on the average rating associated with each keyword. 
    
    Score is average of the mean keyword of ratings and max keyword rating 
    for a paper

    Parameters:

        paper (Paper): a Paper namedtuple

        ratings (dict): dictionary of keyword ratings keyed by keyword strings

    Returns:

        score (float): average of mean keyword rating and max keyword rating
    """
    ratings = []
    # get average rating for each keyword
    if paper.keywords:
        for kw in paper.keywords:
            if kw in ratings:
                ratings.append(ratings[kw]["sum"] / ratings[kw]["count"])
    if not ratings:
        return 0
    else:
        # get average of mean rating and max keyword rating 
        score = max(ratings) / 2 + (sum(ratings) / len(ratings)) / 2
        return score

def sort_clusters(num_clusters, labels, papers):
    """ Sort a series of clusters based on average rated paper rating

    Parameters:

        num_clusters (int): number of clusters in model

        labels (list): a list mapping paper indices to clusters
       
        papers (list): a list of paper objects

    Returns:

        ordered (list): a list of tuples of (cluster_index, avg_rating)
    """
    ratings = []

    # sort by avg rating
    for i in range(num_clusters):
        ratings.append((i,get_cluster_avg_rating(i, labels, papers)))
    descending = sorted(ratings, key=lambda x: x[1], reverse=True)

    good = list(filter(lambda x: x[1] > 5, descending)) # rating > 5
    unk = list(filter(lambda x: x[1] == 0, descending)) # rating unknown
    # remove bad to not include 'bad' clusters in recommendations
    # bad = list(filter(lambda x: x[1] <= 5 and x[1] > 0, descending)) # rating < 5
    
    ordered = good
    ordered = ordered + unk
    
    return ordered

# sort clusters by rating, sort papers inside cluster by aux score
def build_rec_list(sorted_clusters, labels, papers):
    """builds list of recommendations from list of sorted clusters

    Parameters:

        sorted_clusters (list): a list of (cluster_index, rating) tuples

        labels (list): a list of int cluster indices

        papers (list): a list of Paper namedtuples

    Returns:

        recs (list): a sorted list of string PMIDs
    """
    recs = []

    for (c_i,_) in sorted_clusters:
        recs = recs + sort_papers_in_cluster(c_i, labels, papers)

    pmids = [i[0] for i in recs]
    return pmids

def sort_papers_in_cluster(cluster_index, labels, papers, verbose=False):
    """ returns a sorted list of unrated papers in a cluster

    Parameters:

        cluster_index (int): cluster index

        labels (list): labels from kmeans model

        papers (list): list of Paper namedtuples

    Returns:

        descending (list): sorted list of (paper_index, rating) tuples
    """
    kw_ratings = get_avg_keyword_rating_dict(papers)

    paper_indices = get_cluster_indices(cluster_index, labels)

    results = []

    for i in paper_indices:
        if papers[i].rating == 0: # only add unrated papers
            r = get_aux_score(papers[i], kw_ratings) 
            results.append((i, r))
    
    descending = sorted(results, key=lambda x:x[1], reverse=True)

    if verbose:
        sys.stderr.write('Cluster ' + str(cluster_index) + 'sotred papers: \n')
        for (i, s) in descending:
            sys.stderr.write(' '.join(papers[i].title) + " " + str(s) +'\n')

    return descending

def get_recommendations(papers, num_clusters):
    """returns a list of papers, sorted by recommendability

    Parameters:

        papers (list):

        num_clusters (int):

    Returns:

        recs (list): a list of string PMIDs, most recommendable first

    """
    n_feats = 1000

    abstracts = []
    for p in papers:
        abstracts.append(' '.join(p.abstract))

    vectorizer = TfidfVectorizer(max_df=0.5, max_features=n_feats,
                                 min_df=2, stop_words='english',
                                 strip_accents='unicode', lowercase=True,
                                 use_idf=True) # does some preprocessing
    X = vectorizer.fit_transform(abstracts) # vectorize abstracts

    km = MiniBatchKMeans(n_clusters=num_clusters, init='k-means++', n_init=1,
                        init_size=1000, batch_size=1000)
    km.fit(X) # cluster abstracts

    avg_ratings = [] # list of tuples, (cluster_index, avg_rating)
    for i in range(num_clusters):
        avg_ratings.append((i,get_cluster_avg_rating(i, km.labels_, papers)))
    descending_clusters = sorted(avg_ratings, key=lambda x: x[1], reverse=True)
    # for d in descending_clusters:
    #     sys.stderr.write(str(d) + ', ')  
    # sys.stderr.write('\n')
    descending_clusters = sort_clusters(num_clusters, km.labels_, papers)
    
    recs = build_rec_list(descending_clusters, km.labels_, papers)
    return recs

# debugging function, used to display information about number of papers
# that contain a keyword
def print_keyword_count(papers, kword):
    """prints the number of papers that have a certain keyword

    Parameters:

        papers (list): a list of Paper namedtuples

        kword (str): a keyword
    """
    count = 0
    for p in papers:
        if p.keywords:
            for k in p.keywords:
                if k == kword:
                    count += 1
    sys.stderr.write(str(count) + ' total mentions of ' + kword + '\n')

# calculate the number of clusters to use in the model, based on num of papers
# this function can be changed to support different ratios of papers per cluster
# as well as number of unrated papers to rated papers
# modifying this funciton should not affect the rest of the model
def calc_num_clusters(papers):
    """calculate a good value of clusters for the papers passed to the model

    Parameters:

        papers (list): a list of Paper namedtuples

    Returns:
    
        num_clusters (int): number of clusters to use in model
    """

    num_papers = len(papers)
    #num_rated_papers = len(list(filter(lambda x: x.rating != 0,papers)))

    if num_papers < 5:
        return num_papers
    elif num_papers > 500:
        return int(num_papers / 50)
    elif num_papers > 300:
        return int(num_papers / 30)
    elif num_papers > 100:
        return int(num_papers / 20)
    else:
        return 5

# run model
def main():
    """run the model on a set of papers, printing out a list recommended pmids

    if the model doesn't have enough papers to produce confident recommendations
    it will print a random list of num_recs - 1 pmids, which will trigger the
    model to gather more papers
    """
    args = read_args() 

    num_clusters = calc_num_clusters(args.papers)

    sys.stderr.write('number of clusters: ' + str(num_clusters) + '\n')

    # can change model by changing this function call
    # model should be interchangeable as long it conforms to the
    # INPUT: JSON string of papers
    # OUTPUT: PMIDS ordered from most recommendable to least recommendable
    # return a number of recommendations less than the requested amount
    # if you want the go model to crawl for more papers
    recs = get_recommendations(args.papers, num_clusters)

    sys.stderr.write('number of recommendations: ' + str(len(recs)) + '\n')
    # only print the number required
    if len(recs) >= args.num_recs[0]:
        for p in recs[:args.num_recs[0]]:
            print(args.papers[p].pmid)
            #sys.stderr.write(' '.join(args.papers[p].title))
    else: # if too few recs are generated, return random papers
        for p in recs:
            print(args.papers[p].pmid)

# only run program if called; not if 
if __name__ == "__main__":
    main()