# Paper Recommendation Model

The paper recommendation model is called from the `autorad-go` server.

## Inputs/Output

`paperModel.py` functions very similarly to a typical python process, as it
takes its input from commandline arguments + stdin, and writes it's output to
stdout and stderr.

### Commandline Arguments

Commandline arguments are parsed using the argparse library. The current 
arguments specified are `num_recs`, which is an integer specifying the number
of papers the model is expected to return, and `cutoff`, which is a
deprecated argument that was used in a previous iteration of the model.
`cutoff` could be changed to support other parameters or hyperparameters
for future versions of the paper recommendation model.

### JSON String Arguments

The go server will pass both rated and unrated papers to the recommendation 
model. Each paper is passed as a JSON string, which can be converted into a 
JSON object using the json library. Each JSON object is stored on one line
of standard input, seperated by newlines.

## Outputs

The model has two general types of output: recommendations and errors/logging.

### Recommendation Output

Recommendations should be printed to stdout as a series of PMIDs separated by
newline characters. PMIDs should be printed in order of recommendability,
with the most recommendable paper being printed first.

Recommended papers will be inserted into the database as new recommendations.
Papers that have
already been rated should not be recommended. 

If fewer papers are
returned than requested, the go server will query pubmed for additional papers
and try to generate a new series of recommendations.

## Recommendation Process

The paper ranking process can be broken down into several smaller steps:
1) converting papers into tf-idf vectors
1) clustering papers based on tf-idf distance
1) sorting clusters by average rating
1) identifying clusters as being "good", "bad" or "unknown"
1) select papers from good and unknown clusters
1) calculate score for each paper (currently based keyword ratings)
1) sort papers based off of heuristic scores, recommend in order

This model was selected partially due to how quickly it can adjust to new
ratings. This is particularly useful for getting valuable recommendations
without having a large number of ratings.
In the future, this model could be combined with another model that is more
fine-tuned for providing accurate recommendations once a significant amount of
ratings have been made