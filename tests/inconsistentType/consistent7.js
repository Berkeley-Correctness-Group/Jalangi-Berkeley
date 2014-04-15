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

    // simple version of a false positive from joomla/mootools
    // TODO: doesn't raise a warning for "clone = {}", but mootools does -- adapt simplified example
    
    function clone(object) {
        var clone = {};
        for (var key in object)
            clone[key] = cloneOf(object[key]);
        return clone;
    }

    function cloneOf(item) {
        if (typeof item === 'object') {
            return clone(item);
        } else {
            return item;
        }
    }
    
    var original1 = {a: 23};
    var clone1 = clone(original1);
    console.log(clone1.a);
    
    var original2 = {a: true};
    var clone2 = clone(original2);
    console.log(clone2.a);

})();