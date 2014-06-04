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

function addWrapped(x, y) {
    if (y) {
        return x.p + y.p;
    } else {
        return x.p;
    }
}

function Wrapper(p) {
    this.p = p;
}

var n = "18";
var s1 = addWrapped({p:23});
var s2 = addWrapped(new Wrapper(23));
var s3 = addWrapped({p: n}, new Wrapper(5));
console.log(s1 + ", " + s2 + ", " + s3);