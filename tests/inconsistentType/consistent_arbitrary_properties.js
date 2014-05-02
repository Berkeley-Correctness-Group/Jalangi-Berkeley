/*
 * Copyright 2014 University of California, Berkeley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Michael Pradel

(function() {

    // false positive taken from sunspider's string-fasta.js
    // --> "table" can have arbitrary properties

    function makeCumulative(table) {
        var last = null;
        for (var c in table) {
            if (last)
                table[c] += table[last];
            last = c;
        }
    }

    var table1 = {
        a:0.27, c:0.12, g:0.12, t:0.27,
        B:0.02, D:0.02, H:0.02, K:0.02,
        M:0.02, N:0.02, R:0.02, S:0.02,
        V:0.02, W:0.02, Y:0.02
    };

    var table2 = {
        a:0.3029549426680,
        c:0.1979883004921,
        g:0.1975473066391,
        t:0.3015094502008
    };

    makeCumulative(table1);
    makeCumulative(table2);

})();