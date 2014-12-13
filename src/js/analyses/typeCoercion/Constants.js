// BEGIN Constants.js
// Author: Michael Pradel

(function() {

    var ExtraTypeInfoFlags = {
        NONE:0,
        TO_STRING:1,
        VALUE_OF:2,
        VALUE_OF_IS_BOOLEAN:4,
        VALUE_OF_IS_NUMBER:8,
        VALUE_OF_IS_STRING:16
    }

    function hasToString(extraTypeInfo) {
        return extraTypeInfo & ExtraTypeInfoFlags.TO_STRING;
    }

    function hasValueOf(extraTypeInfo) {
        return extraTypeInfo & ExtraTypeInfoFlags.VALUE_OF;
    }

    function typeOfValueOf(extraTypeInfo) {
        if (extraTypeInfo & ExtraTypeInfoFlags.VALUE_OF_IS_BOOLEAN) return "boolean";
        if (extraTypeInfo & ExtraTypeInfoFlags.VALUE_OF_IS_NUMBER) return "number";
        if (extraTypeInfo & ExtraTypeInfoFlags.VALUE_OF_IS_STRING) return "string";
    }

    function createExtraTypeInfo(toString, valueOf, typeOfValueOf) {
        return 0 | (toString ? ExtraTypeInfoFlags.TO_STRING : 0) | (valueOf ? ExtraTypeInfoFlags.VALUE_OF : 0) |
              (typeOfValueOf === "boolean" ? ExtraTypeInfoFlags.VALUE_OF_IS_BOOLEAN : 0) |
              (typeOfValueOf === "number" ? ExtraTypeInfoFlags.VALUE_OF_IS_NUMBER : 0) |
              (typeOfValueOf === "string" ? ExtraTypeInfoFlags.VALUE_OF_IS_STRING : 0);
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
    module.typeOfValueOf = typeOfValueOf;

})();

// END Constants.js
