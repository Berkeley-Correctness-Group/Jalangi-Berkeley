/*
 * Copyright 2014 University of California, Berkeley.
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

// commonly used functions that can run in 
//   (i) the add-on context
//  (ii) the page context
// (iii) node.js

(function() {

    function assert(cond, msg) {
        if (!cond)
            throw new Error(msg);
    }

    // boilerplate to use this file both in add-on and in page context
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in add-on context
        module = exports;
    } else {
        // export to code running in page context
        unwrapObject(window).$jalangiFFCommonUtil = {};
        module = unwrapObject(window).$jalangiFFCommonUtil;
    }

    // exports
    module.assert = assert;

})();