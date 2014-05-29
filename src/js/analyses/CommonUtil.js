(function() {

    function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    function sizeOfMap(obj) {
        var count = 0;
        for (var i in obj) {
            if (HOP(obj, i)) {
                count++;
            }
        }
        return count;
    }

    function assert(cond, msg) {
        if (!cond)
            throw new Error(msg);
    }

    function shallowClone(s) {
        var r = {};
        for (var p in s) {
            if (HOP(s, p))
                r[p] = s[p];
        }
        return r;
    }
    
    function mergeToLeft(left, right) {
        var rt = typeof right;
        if (rt === 'boolean' || rt === 'string' || rt === 'number') {
            return right;
        }
        Object.keys(right).forEach(function(rKey) {
            if (HOP(left, rKey)) {
                left[rKey] = mergeToLeft(left[rKey], right[rKey]);
            } else {
                left[rKey] = right[rKey];
            }
        });
        return left;
    }
    
    function nbOfValues(map) {
        var values = {};
        for (var k in map) {
            if (HOP(map, k)) {
                values[map[k]] = true;
            }
        }
        return Object.keys(values).length;
    }

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$CommonUtil = {};
        module = window.$CommonUtil;
    }

    // exports
    module.HOP = HOP;
    module.sizeOfMap = sizeOfMap;
    module.assert = assert;
    module.shallowClone = shallowClone;
    module.mergeToLeft = mergeToLeft;
    module.nbOfValues = nbOfValues;

})();
