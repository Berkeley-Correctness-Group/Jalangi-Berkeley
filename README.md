Jalangi
=======
### Introduction

This repository is set up for doing researching on top of Jalangi, which is a dynamic analysis framework for JavaScript.

More more details please visit jalangi master branch:
https://github.com/SRA-SiliconValley/jalangi

Or visit the project website:
https://www.eecs.berkeley.edu/~gongliang13/jalangi_ff/

### Requirements

We tested Jalangi on Mac OS X 10.8 with the Chromium browser and on Ubuntu 12.04 with both the Chromium and the Firefox browsers.  Jalangi should work on Mac OS
10.7, Ubuntu 11.0 and higher and Windows 7 or higher. Jalangi will NOT work with IE.

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
```
node src/js/commands/install.js
```
if your current working dir is ```[parent-dir] / [cur-dir]``` then it will check and create a directory ```[parent-dir] / [jalangi]``` where the master branch of Jalangi will be cloned and installed.

If Installation succeeds, you should see the following message:
```
---> Installation successful.
---> run 'npm test' to make sure all tests pass
```
to run test, type:
```
cd ../jalangi
npm test
```
### Run Experiments
First make sure you have Jalangi Installed.

There are two ways to run an analysis on a target program:

(1) Use the ```jalangi.py``` in the Jalangi Project.

In the Jalangi-Berkeley directory:
```
python <Jalangi root path>/jalangi/scripts/jalangi.py direct -a <analysis code file> <program to be instrumented>
```
All files paths should be relative path to the root directory of this repository.

For example, to run the jit-compiler inefficient code pattern experiment:
```
python ../jalangi/scripts/jalangi.py direct -a src/js/analyses/jitaware/JITAware tests/jitaware/JITAwareTest
```
(2) Use ```transform_analyze.js``` in this repository.

In the Jalangi-Berkeley directory:
```
node src/js/commands/transform_analyze.js <jalangi home directory> <program to be instrumented> <analysis code file>
```
All files paths should be relative path to the root directory of this repository.

For example, to run an analysis to find inconsistent types:
```
node src/js/commands/transform_analyze.js ../jalangi tests/inconsistentType/inconsistent3.js src/js/analyses/inconsistentType/InconsistentTypeEngine
```

More Examples:

In the Jalangi-Berkeley directory:
```
node src/js/commands/transform_analyze.js ../jalangi ../jalangi/tests/octane/pdfjs.js ../jalangi/src/js/analyses/objectalloc/ObjectAllocationTrackerEngineIB
```

### Run Browser Experiments

For now, this experiment only supports Firefox and Chrome on Mac OS.
To automated the web testing, selenium is needed, to install selenium type the following command in the terminal:
```
npm install selenium-webdriver
npm install mocha selenium-webdriver
```
Currently ```install.js``` automatically installs for MacOS. So if you are using a non-Mac OS, you also need to download and install chromedriver by yourself at the following link:
```
https://code.google.com/p/selenium/wiki/ChromeDriver
```

Before running the experiment on Mac OS:
  * close your firefox and chrome instances
  * configure your firefox so that it will dump output to the native console:
    in the browser url input box type: ```about:config```
    search for: ```brwoser.dom.window.dump.enabled```, set it to ```true```

In the Jalangi-Berkeley directory type the following command:
```
node src/js/commands/benchmark_exp.js
```
finally after the experiment finished, open the file ```Jalangi-Berkeley/exp_output/result.csv``` using Excel.
