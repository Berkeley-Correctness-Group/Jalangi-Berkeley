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
    
    // taken from sunspider's 3d-cube benchmark
    // -- not a bug, but bad style (the result of CalcCross should be stored in a fresh variable)
    // -- filtered because type of CalcCross' return value is a structural subtype of A's prior type
    
    function CalcNormal(V0, V1, V2) {
        var A = new Array();
        var B = new Array();
        for (var i = 0; i < 3; i++) {
            A[i] = V0[i] - V1[i];
            B[i] = V2[i] - V1[i];
        }
        A = CalcCross(A, B);
        var Length = Math.sqrt(A[0] * A[0] + A[1] * A[1] + A[2] * A[2]);
        for (var i = 0; i < 3; i++)
            A[i] = A[i] / Length;
        A[3] = 1;
        return A;
    }

    function CalcCross(V0, V1) {
        var Cross = new Array();
        Cross[0] = V0[1] * V1[2] - V0[2] * V1[1];
        Cross[1] = V0[2] * V1[0] - V0[0] * V1[2];
        Cross[2] = V0[0] * V1[1] - V0[1] * V1[0];
        return Cross;
    }


    var v = [1, 2, 3, 4];
    CalcNormal(v, v, v);
    
})();