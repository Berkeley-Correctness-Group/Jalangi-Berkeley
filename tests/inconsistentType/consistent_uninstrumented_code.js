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
    
    // minimal version of code from crypto-aes (sunspider)
    // (has caused false positive due to incorrect handling of objects created in uninstrumented code)
    
    var a1 = [1,2];
    var a2 = [1].concat([2]);
    
    function foo(x) {}
    
    foo(a1);
    foo(a2);
        
    
})();