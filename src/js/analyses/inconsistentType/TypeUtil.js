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

    function getKind(type) {
        if (type === "undefined" || type === "null" || type === "object" || type === "function"
              || type === "string" || type === "number" || type === "boolean"
              || type.indexOf("global scope") === 0 || type.indexOf("native function") === 0)
            return type;
        else if (type.indexOf("object(") === 0)
            return "object";
        else if (type.indexOf("function(") === 0)
            return "function";
        else if (type.indexOf("frame(") === 0)
            return "frame";
        else if (type.indexOf("array(") === 0)
            return "array";
        util.assert(false, type);
    }

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$TypeUtil = {};
        module = window.$TypeUtil;
    }

    function importModule(moduleName) {
        if (typeof exports !== "undefined") {
            return require('./' + moduleName + ".js");
        } else {
            return window['$' + moduleName];
        }
    }

    // exports
    module.getKind = getKind;

})();