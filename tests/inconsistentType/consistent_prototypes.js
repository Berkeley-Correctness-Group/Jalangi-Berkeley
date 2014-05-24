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

    // simplified version of false positive in octane's deltablue

    Object.defineProperty(Object.prototype, 'inheritsFrom', {
        value:function(shuper) {
            function Inheriter() {
            }
            Inheriter.prototype = shuper.prototype;
            this.prototype = new Inheriter();
            this.superConstructor = shuper;
        }
    });


    function A(x) {
        this.x = x;
    }

    function B(x,y) {
        B.superConstructor.call(this, x);
        this.y = y;
    }
    B.inheritsFrom(A);
    
    function B2(x,z) {
        B2.superConstructor.call(this, x);
        this.z = z;
    }
    B2.inheritsFrom(A);

    var o;
    o = new A(23);
    o = new B(23, 42);
    o = new B2(23, 5);
    
    
})();