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


    function A() {
        this.x = 23;
    }
    A.prototype.f = function() {
    };

    function B() {
        this.y = 42;
    }
    B.prototype.g = function() {
    };

    B.inheritsFrom(A);

    var x;
    x = new A();
    x.f();
    x = new B();
    x.f();
    x.g();


})();