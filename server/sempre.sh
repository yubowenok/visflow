#!/bin/bash

# Script to launch the Sempre server with CoreNLP pre-loaded.

cd smartflow/sempre

screen java -cp libsempre/*:lib/* -ea edu.stanford.nlp.sempre.Main\
     -languageAnalyzer corenlp.CoreNLPAnalyzer\
     -Grammar.inPaths ../main.grammar\
     -FeatureExtractor.featureDomains rule\
     -Learner.maxTrainIters 3\
     -server true\
     -Dataset.inPaths\
       train:../data/plot.examples

# Press Ctrl+A-D to detach the screen.
# Now the server should be able to run http://localhost:8400/sempre
# Use curl/wget to send the queries to the server via query parameter, e.g.
#
# http://localhost:8400/sempre?q=hello+world
#
# Note that spaces must be replaced by '+' signs.
