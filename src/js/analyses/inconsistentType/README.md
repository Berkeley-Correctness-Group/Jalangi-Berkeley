TypeDevil
=========

## Introduction

Dynamic languages, such as JavaScript, give programmers the freedom to ignore types, and enable them to write concise code in short time. Despite this freedom, many programs follow implicit type rules, for example, that a function has a particular signature or that a property has a particular type. Violations of such implicit type rules often correlate with problems in the program. We page is about TypeDevil, a mostly dynamic analysis that warns developers about inconsistent types. The key idea is to assign a set of observed types to each variable, property, and function, to merge types based in their structure, and to warn developers about variables, properties, and functions that have inconsistent types. To deal with the pervasiveness of polymorphic behavior in real-world JavaScript programs, we present a set of techniques to remove spurious warnings and to merge related warnings. Applying TypeDevil to widely used benchmark suites and real-world web applications reveals 15 problematic type inconsistencies, including correctness problems, performance problems, and dangerous coding practices.


A [paper on TypeDevil](http://mp.binaervarianz.de/icse2015.pdf) has been accepted at the International Conference on Software Engineering (ICSE) 2015. Authors: [Michael Pradel](http://mp.binaervarianz.de/), Parker Schuh, and [Koushik Sen](http://srl.cs.berkeley.edu/~ksen/).


## Download and Installation

1. Clone the Jalangi-Berkeley repository to your computer:
```
git clone https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley.git
```

2. Install Jalangi and Jalangi-Berkeley by following the [Jalangi-Berkeley installation instructions](https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley).


## Usage

All commands listed below assume that ```Jalangi-Berkeley``` is your current working directory. We tested TypeDevil on Ubuntu Linux with node.js v0.10.18. The analysis can be applied directly during the execution of a program (recommended for small examples) or be split into an online part and an offline part (recommended for larger programs). For the latter case, the online part writes intermediate results to the file system and the offline part summarizes the results.


### Analyze a Single JavaScript File

```
./scripts/inconsistent_type_analysis.sh your_file.js
```

For example, the following applies TypeDevil to the running example in our ICSE'15 paper:

```
./scripts/inconsistent_type_analysis.sh tests/inconsistentType/inconsistent_paper.js
```


### Analyze our Test Suite of Small Example Programs

The following applies TypeDevil to a test suite of small example programs:

```node tests/inconsistentType/runAllTests.js```


### Analyze the Sunspider and Octane Benchmarks

The following assumes that TypeDevil is used as an online + offline analysis. Therefore, edit ```src/js/analyses/inconsistentType/InconsistentTypeEngine.js``` and set the ```online``` variable to ```false```.

To apply TypeDevil to the Sunspider benchmarks:

```
./scripts/inconsistent_type_analysis_sunsider_online.sh
./scripts/inconsistent_type_analysis_sunsider_offline.sh
```


Similar, to apply TypeDevil to the Octane benchmarks:

```
./scripts/inconsistent_type_analysis_octane_online.sh
./scripts/inconsistent_type_analysis_octane_offline.sh
```


### Analyze Web Applications

There are different ways to apply TypeDevil to web applications. We are using ```instrumentFF```, a modified version of Firefox that intercepts and instruments all JavaScript code before executing it. Search for ```instrumentFF``` on [this page](https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley) for instructions on installing it.

