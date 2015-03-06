JITProf
=======

**Note:** JITProf has [a new version](https://github.com/Berkeley-Correctness-Group/jalangi2analyses) which improves the runtime performance and supports checking JIT-unfriendly code on real-world websites. [Go and check out!](https://github.com/Berkeley-Correctness-Group/jalangi2analyses)

### Introduction

Most modern JavaScript engines use just-in-time (JIT) compilation to translate parts of JavaScript code into efficient machine code at runtime. Despite the overall success of JIT compilers, programmers may still write code that uses the dynamic features of JavaScript in a way that prohibits profitable optimizations. Unfortunately, there currently is no technique that helps developers to identify such JIT-unfriendly code. This paper presents JIT-Prof, a profiling framework to dynamically identify code locations that prohibit profitable JIT optimizations. The basic idea is to associate execution counters with potentially JIT-unfriendly code locations and to use these counters to report code locations that match code patterns known to prohibit optimizations. We instantiate the idea for six JIT-unfriendly code patterns that cause performance problems in the Firefox and Chrome browsers, and we apply the approach to popular benchmark programs. Our results show that refactoring these programs to avoid performance problems identified by JIT-Prof leads to performance improvements of up to 26.3% in 12 benchmarks.

### Authors
Liang Gong, Michael Pradel, Koushik Sen

A technical report is available at:

http://www.eecs.berkeley.edu/Pubs/TechRpts/2014/EECS-2014-144.html

### Download and Installation

First go to Jalangi-Berkeley page, download and install this project on your machine.
Instructions are in the following page:

https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley

### Use JITProf to Analyse JavaScript Code on Node.js

In the Jalangi-Berkeley project directory, type the following command to find JIT-unfriendly code using JITProf:
```
python ../jalangi/scripts/jalangi.py direct --analysis ../jalangi/src/js/analyses/ChainedAnalyses.js --analysis src/js/analyses/jitaware/chaining/utils/Utils.js --analysis src/js/analyses/jitaware/chaining/utils/RuntimeDB.js --analysis src/js/analyses/jitaware/chaining/TrackHiddenClass --analysis src/js/analyses/jitaware/chaining/AccessUndefArrayElem --analysis src/js/analyses/jitaware/chaining/SwitchArrayType --analysis src/js/analyses/jitaware/chaining/NonContiguousArray --analysis src/js/analyses/jitaware/chaining/BinaryOpOnUndef --analysis src/js/analyses/jitaware/chaining/PolymorphicFunCall --analysis src/js/analyses/jitaware/chaining/TypedArray tests/jitaware/JITAwareTest
```

Change the last parameter to the location of JavaScript program you want to analysis dynamically.

Two additional checkers:
```
--analysis src/js/analyses/jitaware/chaining/InitFieldOutsideConstructor --analysis src/js/analyses/jitaware/chaining/ArgumentsLeak
```

### Experiment on Micro-benchmark

Go to the following instruction page:

https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley/tree/master/tests/jitaware/experiments/benchmarks/microbench

### Experiment on Octane and SunSpider

Go to the following instruction page:

https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley/tree/master/tests/jitaware/experiments
