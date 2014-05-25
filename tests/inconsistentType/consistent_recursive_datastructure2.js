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
    
    function LinkedList(value, next) {
        this.value = value;
        this.next = next;
    }
    
    LinkedList.prototype.length = function() {
        var l = 1;
        var next = this.next;
        while (next !== null) {
            l++;
            next = next.next;
        }
        return l;
    };
    
    var l = new LinkedList(1, new LinkedList(2, null));
    console.log(l.length());
    
})();