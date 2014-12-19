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
        var r = Object.create(s.__proto__);
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

    function valueArray(map) {
        var values = [];
        for (var k in map) {
            if (HOP(map, k)) {
                var v = map[k];
                if (values.indexOf(v) === -1)
                    values.push(v);
            }
        }
        return values;
    }

    function sameProps(o1, o2) {
        if (Object.keys(o1).length !== Object.keys(o2).length)
            return false;
        for (var p1 in o1) {
            if (HOP(o1, p1) && !HOP(o2, p1))
                return false;
        }
        return true;
    }

    function sameArrays(a1, a2) {
        if (a1.length !== a2.length)
            return false;
        for (var i = 0; i < a1.length; i++) {
            if (a1[i] !== a2[i])
                return false;
        }
        return true;
    }

    function stringToHash(str) {
        if (Object.prototype.toString.apply(str) !== "[object String]")
            throw "Should only call for strings, but passed: " + str;
        var hash = 0;
        if (!str)
            return hash;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    function hashInto(oldHash, x) {
        var result = ((oldHash << 5) - oldHash) + x;
        result = result & result;
        return result;
    }

    function intersect(set1, set2) {
        var result = {};
        var keys1 = Object.keys(set1);
        for (var i = 0; i < keys1.length; i++) {
            if (HOP(set2, keys1[i])) {
                result[keys1[i]] = true;
            }
        }
        return result;
    }

    function substractSets(set1, set2) {
        var result = {};
        var keys1 = Object.keys(set1);
        for (var i = 0; i < keys1.length; i++) {
            if (!HOP(set2, keys1[i])) {
                result[keys1[i]] = true;
            }
        }
        return result;
    }

    function arrayToSet(arr) {
        var set = {};
        for (var i = 0; i < arr.length; i++) {
            set[arr[i]] = true;
        }
        return set;
    }

    function randomSample(arr, nb) {
        if (arr.length < nb) throw "Cannot pick sample of size " + nb + " from " + arr.length + " values.";
        var result = [];
        var pickedIdxs = {};
        while (result.length < nb) {
            var randomIdx = Math.round(Math.random() * arr.length);
            if (!pickedIdxs.hasOwnProperty(randomIdx)) {
                pickedIdxs[randomIdx] = true;
                result.push(arr[randomIdx]);
            }
        }
        return result;
    }

    function printElapsedTime(startMilliSecs) {
        var elapsedMS = new Date().getTime() - startMilliSecs;
        console.log("Elapsed time: " + (Math.round(elapsedMS / 1000)) + " seconds = " + (Math.round(elapsedMS / 1000 / 60)) + " minutes");
    }

    function avgOfArray(arr) {
        if (arr.length === 0) return;
        var sum = 0;
        for (var i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        return sum / arr.length;
    }

    function roundPerc(perc) {
        return Math.round(perc * 100) / 100;
    }

    function mapToValues(m) {
        var result = [];
        var keys = Object.keys(m);
        for (var i = 0; i < keys.length; i++) {
            result.push(m[keys[i]]);
        }
        return result;
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
    module.valueArray = valueArray;
    module.sameProps = sameProps;
    module.sameArrays = sameArrays;
    module.stringToHash = stringToHash;
    module.hashInto = hashInto;
    module.intersect = intersect;
    module.substractSets = substractSets;
    module.arrayToSet = arrayToSet;
    module.randomSample = randomSample;
    module.printElapsedTime = printElapsedTime;
    module.avgOfArray = avgOfArray;
    module.roundPerc = roundPerc;
    module.mapToValues = mapToValues;

})();

