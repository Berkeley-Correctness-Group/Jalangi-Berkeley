// BEGIN Constants.js
// Author: Michael Pradel

(function() {

    var ExtraTypeInfoFlags = {
        NONE:0,
        TO_STRING:2,
        VALUE_OF:2
    }

    function hasToString(extraTypeInfo) {
        return extraTypeInfo & ExtraTypeInfoFlags.TO_STRING;
    }

    function hasValueOf(extraTypeInfo) {
        return extraTypeInfo & ExtraTypeInfoFlags.VALUE_OF;
    }

    function createExtraTypeInfo(toString, valueOf) {
        return 0 | (toString ? ExtraTypeInfoFlags.TO_STRING : 0) | (valueOf ? ExtraTypeInfoFlags.VALUE_OF : 0);
    }

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$Constants = {};
        module = window.$Constants;
    }

    // exports
    module.hasToString = hasToString;
    module.hasValueOf = hasValueOf;
    module.createExtraTypeInfo = createExtraTypeInfo;

})();

// END Constants.js
