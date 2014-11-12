#!/bin/bash

echo "compiling..."
javac -cp src/java/jitaware/thirdparty/selenium-server-standalone-2.41.0.jar `pwd`/src/java/jitaware/ExperimentRunner.java

# start running experiment in the browser
java -cp src/java/jitaware/thirdparty/selenium-server-standalone-2.41.0.jar:src/java/jitaware ExperimentRunner