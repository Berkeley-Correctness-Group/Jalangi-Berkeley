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
    
    function generic(x) {
        x;
    }
    
    var x1 = {a:true, b:{x:23, y:"aa"}, c:{r:"bb", s:23}};
    generic(x1);
    
    var x2 = {a:{r:"bb", s:23}, b:true, c:{x:23, y:"aa"}};
    generic(x2);
    
})();