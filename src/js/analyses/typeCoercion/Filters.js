// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');

    function sameTypeForDoubleEquality(type1, type2) {
        if (type1 === type2) return true;
        if (type1 === "undefined" || type2 === "undefined") return true;
        if (type1 === "null" || type2 === "null") return true;
        return false;
    }

    function sameTypeForTripleEquality(type1, type2) {
        if (type1 === type2) return true;
        if (type1 === "undefined" || type2 === "undefined") return true;
        if ((type1 === "null" && isPrimititveType(type2)) || (type2 === "null" || isPrimititveType(type1))) return true;
        return false;
    }

    function isPrimititveType(t) {
        return t === "number" || t === "string" || t === "boolean";
    }

    function isBinDoubleEq(op) {
        return op === "==" || op === "!=";
    }

    function isBinTripleEq(op) {
        return op === "===" || op === "!==";
    }

    var obs = {
        isExplicit:function(obs) {
            return obs.kind === "explicit";
        },
        isNotExplicit:function(obs) {
            return obs.kind !== "explicit";
        },
        isDoubleEquality:function(obs) {
            return obs.kind === "binary" && (obs.operation === "!=" || obs.operation === "==");
        },
        isTripleEquality:function(obs) {
            return obs.kind === "binary" && (obs.operation === "!==" || obs.operation === "===");
        },
        isEquality:function(obs) {
            return obs.kind === "binary" && (obs.operation === "!==" || obs.operation === "===" || obs.operation === "!=" || obs.operation === "==");
        }
    };

    var doubleEqObs = {
        sameTypes:function(obs) {
            return sameTypeForDoubleEquality(obs.leftType, obs.rightType);
        },
        diffTypes:function(obs) {
            return !sameTypeForDoubleEquality(obs.leftType, obs.rightType);
        }
    }

    var tripleEqObs = {
        sameTypes:function(obs) {
            return sameTypeForTripleEquality(obs.leftType, obs.rightType);
        },
        diffTypes:function(obs) {
            return !sameTypeForTripleEquality(obs.leftType, obs.rightType);
        }
    }

    var strAndFreq = {
        notNone:function(sf) {
            return sf.str !== "none";
        },
        isHarmful:function(sf) {
            return sf.str === m.Classication.HARMFUL;
        }
    };

    var strAndClassAndFreq = {
        isHarmful:function(scf) {
            return scf.clss === m.Classication.HARMFUL;
        }
    };

    exports.obs = obs;
    exports.doubleEqObs = doubleEqObs;
    exports.tripleEqObs = tripleEqObs;
    exports.strAndFreq = strAndFreq;
    exports.strAndClassAndFreq = strAndClassAndFreq;
})();