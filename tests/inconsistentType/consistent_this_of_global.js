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

function C() {    
    this.x=23;
}

C.prototype.f = function() {
    return this.x;
};

function D() {    
    this.y="aa";
}

D.prototype.g = function() {
    return this.y;
};

var c1 = new C();
var c2 = new C();
c1.f();
c2.f();

var d = new D();
d.g();
