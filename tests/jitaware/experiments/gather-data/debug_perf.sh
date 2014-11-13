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

# this script is created to analyse the performance slowdown 
# of a specific analysis module on a specific benchmark

# back up the preivous results
rm result-anatomy.bak.txt;
mv result-anatomy.txt result-anatomy.bak.txt;

# f arg1 arg2
# arg1 -> name of dataset
# arg2 -> location
# arg3 -> analysis to perform
runexp() {
    echo "$1"
    echo '[**name**]'"$1" >> result-anatomy.txt

    echo '[****]loc: '`wc -l $2".js"` >> result-anatomy.txt

	# run analysis on the benchmark code
	# ( python ../jalangi/scripts/jalangi.py direct --analysis ../jalangi/src/js/analyses/ChainedAnalyses.js --analysis src/js/analyses/jitaware/chaining/utils/Utils.js --analysis src/js/analyses/jitaware/chaining/utils/RuntimeDB.js --analysis src/js/analyses/jitaware/chaining/TrackHiddenClass --analysis src/js/analyses/jitaware/chaining/AccessUndefArrayElem --analysis src/js/analyses/jitaware/chaining/SwitchArrayType --analysis src/js/analyses/jitaware/chaining/NonContiguousArray --analysis src/js/analyses/jitaware/chaining/InitFieldOutsideConstructor --analysis src/js/analyses/jitaware/chaining/BinaryOpOnUndef --analysis src/js/analyses/jitaware/chaining/PolymorphicFunCall --analysis src/js/analyses/jitaware/chaining/ArgumentsLeak --analysis src/js/analyses/jitaware/chaining/TypedArray $2 ) >> result-anatomy.txt
	( python ../jalangi/scripts/jalangi.py direct --analysis ../jalangi/src/js/analyses/ChainedAnalyses.js --analysis src/js/analyses/jitaware/chaining/utils/Utils.js --analysis src/js/analyses/jitaware/chaining/utils/RuntimeDB.js `echo $3` $2 ) >> result-anatomy.txt
	# run the benchmark code without instrumentation and analysis
	( { time node "$2" | tee >(grep -Ei ".*" >> result-anatomy.txt); } 2>&1 ) | { grep -Ei "^(real|user|sys)" >> result-anatomy.txt; }
}

: <<'END'
END

# Google Octane
# runexp "Octane-Gbemu-empty" "../jalangi/tests/octane/gbemu" ""
# runexp "Octane-Crypto-empty" "../jalangi/tests/octane/crypto" ""

# Google Octane
runexp "Octane-Splay" "../jalangi/tests/octane/splay" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Richards" "../jalangi/tests/octane/richards" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-DeltaBlue" "../jalangi/tests/octane/deltablue" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Crypto" "../jalangi/tests/octane/crypto" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Box2d" "../jalangi/tests/octane/box2d" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Code-Load" "../jalangi/tests/octane/code-load" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Gbemu" "../jalangi/tests/octane/gbemu" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Earley-Boyer" "../jalangi/tests/octane/earley-boyer" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
# runexp "Octane-Mandreel" "../jalangi/tests/octane/mandreel" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Navier-Stokes" "../jalangi/tests/octane/navier-stokes" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Pdfjs" "../jalangi/tests/octane/pdfjs" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Raytrace" "../jalangi/tests/octane/raytrace" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Regexp" "../jalangi/tests/octane/regexp" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "Octane-Typescript" "../jalangi/tests/octane/typescript" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"

# SunSpider
runexp "SunSpider-3d-Cube" "../jalangi/tests/sunspider1/3d-cube" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-3d-Morph" "../jalangi/tests/sunspider1/3d-morph" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-3d-Raytrace" "../jalangi/tests/sunspider1/3d-raytrace" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Access-Binary-Trees" "../jalangi/tests/sunspider1/access-binary-trees" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Access-Fannkuch" "../jalangi/tests/sunspider1/access-fannkuch" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Access-Nbody" "../jalangi/tests/sunspider1/access-nbody" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Access-Nsieve" "../jalangi/tests/sunspider1/access-nsieve" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Bitops-3bit-Bits-in-Byte" "../jalangi/tests/sunspider1/bitops-3bit-bits-in-byte" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Bitops-Bits-in-Byte" "../jalangi/tests/sunspider1/bitops-bits-in-byte" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Bitops-Bitwise-And" "../jalangi/tests/sunspider1/bitops-bitwise-and" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Bitops-Nsieve-Bits" "../jalangi/tests/sunspider1/bitops-nsieve-bits" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Controlflow-Recursive" "../jalangi/tests/sunspider1/controlflow-recursive" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Crypto-AES" "../jalangi/tests/sunspider1/crypto-aes" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Crypto-MD5" "../jalangi/tests/sunspider1/crypto-md5" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Crypto-SHA1" "../jalangi/tests/sunspider1/crypto-sha1" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Date-Format-Tofte" "../jalangi/tests/sunspider1/date-format-tofte" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Date-Format-Xparb" "../jalangi/tests/sunspider1/date-format-xparb" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Math-Cordic" "../jalangi/tests/sunspider1/math-cordic" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Math-Partial-Sums" "../jalangi/tests/sunspider1/math-partial-sums" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Math-Spectral-Norm" "../jalangi/tests/sunspider1/math-spectral-norm" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-Regexp-DNA" "../jalangi/tests/sunspider1/regexp-dna" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-String-Base64" "../jalangi/tests/sunspider1/string-base64" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-String-Fasta" "../jalangi/tests/sunspider1/string-fasta" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-String-Tagcloud" "../jalangi/tests/sunspider1/string-tagcloud" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-String-Unpack-Code" "../jalangi/tests/sunspider1/string-unpack-code" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"
runexp "SunSpider-String-Validate-Input" "../jalangi/tests/sunspider1/string-validate-input" "--analysis src/js/analyses/jitaware/chaining/TrackHiddenClass"

echo '[*]exp-done' >> result-anatomy.txt

