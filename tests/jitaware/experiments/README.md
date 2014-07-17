Jalangi
=======
### Introduction

This readme is for performing experiments on JITProf

### Requirements

Current the experiment only support Mac OS. All of the following commands are executed under Jalangi-Berkeley directory.

### Installation

Having Jalangi installed in the parent directory of the Jalangi-Berkeley repository (as introduced in the README.md file in the home directory)

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

Install Tomcat Server (see http://wolfpaulus.com/jounal/mac/tomcat7/)

### Modify the Benchmarks based on JITProf Feedbacks

First modify the benchmark programs according to the JITProf feedback. Modification should be made only to
directory ```tests/jitaware/experiments/benchmarks/sunspider2``` and files in ```tests/jitaware/experiments/benchmarks/octane/octane_files/XXX_2.js```.

Directory ```tests/jitaware/experiments/benchmarks/sunspider``` contains the original Sunspider benchmark programs.

Directory ```tests/jitaware/experiments/benchmarks/sunspider2``` contains the improved Sunspider benchmark programs.

Directory ```tests/jitaware/experiments/benchmarks/octane/octane_files/XXX.js``` is the original octane benchmark program.

Directory ```tests/jitaware/experiments/benchmarks/octane/octane_files/XXX_2.js``` is the improved octane benchmark program.

### Setup web server

First copy the benchmark programs into the server container directory:

```
sudo rm -rf /Library/Tomcat/webapps/octane
sudo rm -rf /Library/Tomcat/webapps/sunspider*
sudo cp -r tests/jitaware/experiments/benchmarks/* /Library/Tomcat/webapps/
```

Then start the Tomcat Server:

```
/Library/Tomcat/bin/shutdown.sh
/Library/Tomcat/bin/startup.sh
```

### Run Browser Experiments

Before running the experiment on Mac OS:
  * close your firefox and chrome instances
  * configure your firefox so that it will dump output to the native console:
    in the browser url input box type: ```about:config``` set the following configurations:
    ```
    browser.cache.disk.enable = FALSE 
	browser.cache.disk_cache_ssl = FALSE 
	browser.cache.memory.enable = FALSE 
	browser.cache.offline.capacity = 0 
	browser.cache.offline.enable = FALSE 
	media.cache_size = 0 
	network.http.use-cache = FALSE  
	brwoser.dom.window.dump.enabled = true 
	```
  * disable file caches on Chrome, see the article in the following url:
    http://stackoverflow.com/questions/5690269/disabling-chrome-cache-for-website-development

In the Jalangi-Berkeley directory type the following command:
```
node src/js/commands/benchmark_exp.js
```
finally after the experiment finished, open the file ```Jalangi-Berkeley/tests/jitaware/experiments/exp_output/result.csv``` using Excel.

### Automatically Collect Benchmark and Warning Statistics

To collect warning statistics from all analsis on SunSpider and Google Octane:

```
bash tests/jitaware/experiments/gather-data/experiment.sh
node tests/jitaware/experiments/gather-data/stat.js result.txt result.csv
````
Then open the ```result.csv``` to get the generated table.

