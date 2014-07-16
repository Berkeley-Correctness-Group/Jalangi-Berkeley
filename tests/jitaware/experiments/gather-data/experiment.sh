#!/bin/bash

#
# Copyright (c) 2014, University of California, Berkeley
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
# list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright notice,
# this list of conditions and the following disclaimer in the documentation
# and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# The views and conclusions contained in the software and documentation are those
# of the authors and should not be interpreted as representing official policies,
# either expressed or implied, of the FreeBSD Project.
#

# author: Liang Gong

# set MERGE_ENABLED in PredValues.js to false to activate DSE.
# time python scripts/jalangi.py symbolic -a src/js/analyses/puresymbolic/Multiple -i 1 tests/compos/parser
# cd jalangi_tmp; node ../src/js/utils/StatCollector.js; cd ..

# back up the preivous results
rm result.bak.txt;
mv result.txt result.bak.txt;

# f arg1 arg2
# arg1 -> name of dataset
# arg2 -> location
runexp() {
    echo "$1"
    echo '[**name**]'"$1" >> result.txt

    echo '[****]loc: '`wc -l $2".js"` >> result.txt

	# run analysis on the benchmark code
	( python ../jalangi/scripts/jalangi.py direct --analysis ../jalangi/src/js/analyses/ChainedAnalyses.js --analysis src/js/analyses/jitaware/chaining/utils/Utils.js --analysis src/js/analyses/jitaware/chaining/utils/RuntimeDB.js --analysis src/js/analyses/jitaware/chaining/TrackHiddenClass --analysis src/js/analyses/jitaware/chaining/AccessUndefArrayElem --analysis src/js/analyses/jitaware/chaining/SwitchArrayType --analysis src/js/analyses/jitaware/chaining/NonContiguousArray --analysis src/js/analyses/jitaware/chaining/InitFieldOutsideConstructor --analysis src/js/analyses/jitaware/chaining/BinaryOpOnUndef --analysis src/js/analyses/jitaware/chaining/PolymorphicFunCall --analysis src/js/analyses/jitaware/chaining/ArgumentsLeak --analysis src/js/analyses/jitaware/chaining/TypedArray $2 ) >> result.txt
	# run the benchmark code without instrumentation and analysis
	( { time node "$2" | tee >(grep -Ei ".*" >> result.txt); } 2>&1 ) | { grep -Ei "^(real|user|sys)" >> result.txt; }
}



: <<'END'
END

# SunSpider
runexp "SunSpider-3d-Cube" "../jalangi/tests/sunspider1/3d-cube"





echo '[*]exp-done' >> result.txt