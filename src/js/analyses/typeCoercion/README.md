# The Good, the Bad, and the Ugly: An Empirical Study of Implicit Type Conversions in JavaScript

## Abstract
Most popular programming languages support situations where a value of one type is converted
into a value of another type without any explicit cast. Such implicit type conversions, or type
coercions, are a highly controversial language feature. Proponents argue that type coercions
enable writing concise code. Opponents argue that type coercions are error-prone and that
they reduce the understandability of programs. This paper studies the use of type coercions in
JavaScript, a language notorious for its widespread use of coercions. We dynamically analyze
hundreds of programs, including real-world web applications and popular benchmark programs.
We find that coercions are widely used (in 80.42% of all function executions) and that most
coercions are likely to be harmless (98.85%). Furthermore, we identify a set of rarely occurring
and potentially harmful coercions that safer subsets of JavaScript or future language designs
may want to disallow. Our results suggest that type coercions are significantly less evil than
commonly assumed and that analyses targeted at real-world JavaScript programs must consider
coercions.

## Experimental Data and Instructions for Reproducing the Study

Download Jalangi-Berkeley:

    git clone https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley.git

Install requirements:

    cd Jalangi-Berkeley/
    npm install numbers

Download the raw data that we extracted from web sites as of December 13, 2014:

    wget XXXXXXXXXXXX
    tar -xzf type_coercions_results_ecoop2015.tar.gz

Analyze the raw data and produce the results of the study:

    ./scripts/type_coercions_offline.sh

Crunching the data takes several minutes. Eventually, the results are written into the `papers/type_coercions_ecoop2015` directory. It contains:
 * All numbers and tables given in the paper.
 * All figures given in the paper. To generate .pdf, install *gnuplot* and *epstopdf*, and execute `./generate.sh` from the `papers/type_coercions_ecoop2015/graphs` directory.

The above steps execute the study on the raw data we use in the ECOOP'15 paper. To obtain the raw data from web sites or benchmarks programs, see the following scripts:

    ./scripts/type_coercions_sunspider.sh
    ./scripts/type_coercions_octane.sh
    ./scripts/type_coercions_websites.sh

Executing these scripts requires to fully install Jalangi-Berkeley, including a modified version of the Firefox browser called instrumentFF. See [here](https://github.com/Berkeley-Correctness-Group/Jalangi-Berkeley) for detailed instructions.

For any questions, do not hesitate to email [Michael Pradel](http://mp.binaervarianz.de).
