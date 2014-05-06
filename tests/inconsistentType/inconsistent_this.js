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
    

    function C(b) {
        if (b)
            this.x = 23;
        else 
            this.x = false;
    }
    
    C.prototype.f = function() {
        this.x;
    };
    
    var c1 = new C(true);
    c1.f();
    var c2 = new C(false);
    c2.f();
    
})();