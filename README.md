
Jalangi Berkeley
=======
### Introduction

Jalangi is a framework for writing heavy-weight dynamic analyses for JavaScript.  Jalangi incorporates two key techniques:
1) selective record-replay, a technique which enables to record and to faithfully replay a user-selected part of the program, and
2) shadow values and shadow execution, which enables easy implementation of heavy-weight dynamic analyses.  In the distribution
you will find several analyses:

  * concolic testing,
  * an analysis to track origins of nulls and undefined,
  * an analysis to infer likely types of objects fields and functions,
  * an analysis to profile object allocation and usage,
  * a simple form of taint analysis,
  * an experimental pure symbolic execution engine (currently undocumented)

An evaluation of Jalangi on the SunSpider benchmark suite and on five web applications shows that
Jalangi has an average slowdown of 26X during recording and 30X slowdown during replay and analysis. The slowdowns are comparable with slowdowns reported for similar
tools, such as PIN and Valgrind for x86 binaries.

A demo of Jalangi integrated with the Tizen IDE is available at http://srl.cs.berkeley.edu/~ksen/jalangi.html.  Note that the IDE plugin is not open-source.
Slides are available at http://srl.cs.berkeley.edu/~ksen/slides/jalangi-jstools13.pdf and
our paper on Jalangi is available at http://srl.cs.berkeley.edu/~ksen/papers/jalangi.pdf.


### Requirements

We tested Jalangi on Mac OS X 10.8 with Chromium browser.  Jalangi should work on Mac OS
10.7, Ubuntu 11.0 and higher and Windows 7 or higher. Jalangi will NOT work with Firefox
and IE.

  * Latest version of Node.js available at http://nodejs.org/.  We have tested Jalangi with Node v0.8.22 and v0.10.3.
  * Sun's JDK 1.6 or higher.  We have tested Jalangi with Java 1.6.0_43.
  * Command-line git.
  * libgmp (http://gmplib.org/) is required by cvc3.  Concolic testing uses cvc3 and automaton.jar for constraint solving. The installation script checks if cvc3 and automaton.jar are installed properly.
  * Chrome browser if you need to test web apps.
  * Python (http://python.org) version 2.7 or higher
  
On Windows you need the following extra dependencies:

  * Install Microsoft Visual Studio 2010 (Free express version is fine).
  * If on 64bit also install Windows 7 64-bit SDK.

If you have a fresh installation of Ubuntu, you can install all the requirements by invoking the following commands from a terminal.

    sudo apt-get update
    sudo apt-get install python-software-properties python g++ make
    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs
    sudo add-apt-repository ppa:webupd8team/java
    sudo apt-get update
    sudo apt-get install oracle-java7-installer
    sudo update-java-alternatives -s java-7-oracle
    sudo apt-get install git
    sudo apt-get install libgmp10
    sudo apt-get install chromium-browser

### Installation

In the root dir of the repository:

	node src/js/commands/install.js

If Installation succeeds, you should see the following message:

    ---> Installation successful.
    ---> run 'npm test' to make sure all tests pass

to run test, type:

  cd jalangi_home
  npm test

### Run Experiment

Command Usage:

	node src/js/commands/run_test.js <program to be instrumented> <analysis code>

All files paths should be relative path to the root directory of this repository

Examples:  
To run the object allocation experiment experiment:  
In the root dir of the repository:

	node src/js/commands/run_test.js jalangi_home/tests/octane/pdfjs.js jalangi_home/src/js/analyses/objectalloc/ObjectAllocationTrackerEngineIB

To run the jit-compiler inefficient code pattern experiment:  
In the root dir of the repository:

	node src/js/commands/run_test.js jalangi_home/tests/octane/pdfjs.js src/js/analyses/jitaware/JITAware.js


Project for doing research on top of Jalangi project.
