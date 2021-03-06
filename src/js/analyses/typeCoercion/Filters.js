// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');

    function sameTypeForDoubleEquality(type1, type2) {
        if (type1 === type2) return true;
        if (type1 === "undefined" || type2 === "undefined") return true;
        if (type1 === "null" || type2 === "null") return true;
        return false;
    }

    function sameTypeWithUndefinedOrNullForDoubleEquality(type1, type2) {
        if (type1 === "undefined" || type2 === "undefined") return true;
        if (type1 === "null" || type2 === "null") return true;
        return false;
    }

    function sameTypeForTripleEquality(type1, type2) {
        if (type1 === type2) return true;
        if (type1 === "undefined" || type2 === "undefined") return true;
        if ((type1 === "null" && !isPrimitiveType(type2)) || (type2 === "null" || !isPrimitiveType(type1))) return true;
        return false;
    }

    function isPrimitiveType(t) {
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
        },
        isCoercion:function(obs) {
            return m.obs.toStringAndFreq(obs).str !== "none";
        },
        isBinaryPlus:function(obs) {
            return obs.kind === "binary" && obs.operation === "+";
        },
        isHarmful:function(obs) {
            return m.obs.toClassification(obs) === m.Classication.HARMFUL;
        },
        isHarmless:function(obs) {
            return m.obs.toClassification(obs) === m.Classication.HARMLESS;
        }
    };

    var doubleEqObs = {
        sameTypes:function(obs) {
            return sameTypeForDoubleEquality(obs.leftType, obs.rightType);
        },
        diffTypes:function(obs) {
            return !sameTypeForDoubleEquality(obs.leftType, obs.rightType);
        },
        sameTypesWithUndefinedOrNull:function(obs) {
            return sameTypeWithUndefinedOrNullForDoubleEquality(obs.leftType, obs.rightType);
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
        },
        isHarmless:function(scf) {
            return scf.clss === m.Classication.HARMLESS;
        },
        isNonCoercionBinaryPlus:function(scf) {
            return scf.str === "number+number" || scf.str === "string+string";
        }
    };

    var arr = {
        moreThanOne:function(arr) {
            return arr.length > 1;
        }
    }

    var str = {
        isConditionalRelated:function(str) {
            return (str.indexOf("!") === 0) || (str.indexOf(" in conditional") !== -1) || (str.indexOf(" BOOL ") !== -1);
        }
    }

    exports.obs = obs;
    exports.doubleEqObs = doubleEqObs;
    exports.tripleEqObs = tripleEqObs;
    exports.strAndFreq = strAndFreq;
    exports.strAndClassAndFreq = strAndClassAndFreq;
    exports.arr = arr;
    exports.str = str;
})();