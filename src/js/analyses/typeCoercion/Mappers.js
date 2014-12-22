// Author: Michael Pradel

(function() {

    var util = require('./CommonUtil.js');
    var constants = require('./Constants.js');

    var MapModes = {
        STRING:"string",
        ABSTRACT:"abstract",
        ABSTRACT_ALL:"abstract_all",  // includes details about non-coercions (currently only for binary +)
        CLASSIFY:"classify",
        ABSTRACT_CLASSIFY:"abstract_classify",
        OPERATOR:"operator"
    };

    var Classification = {
        HARMFUL:"potentially harmful",
        HARMLESS:"harmless",
        NONE:"none"
    }

    function StringAndFreq(str, freq) {
        this.str = str;
        this.freq = freq;
    }

    function StringAndClassAndFreq(str, clss, freq) {
        this.str = str;
        this.clss = clss;
        this.freq = freq;
    }

    function isWrappedPrimitive(t) {
        return t === "[object Boolean]" || t === "[object Number]" || t === "[object String]";
    }

    function isQuasiBoolean(type, extraTypeInfo) {
        return type === "boolean" || (constants.hasValueOf(extraTypeInfo) && constants.typeOfValueOf(extraTypeInfo) === "boolean");
    }

    function isQuasiNumber(type, extraTypeInfo) {
        return type === "number" || (constants.hasValueOf(extraTypeInfo) && constants.typeOfValueOf(extraTypeInfo) === "number");
    }

    function isQuasiString(type, extraTypeInfo) {
        return type === "string" || (constants.hasValueOf(extraTypeInfo) && constants.typeOfValueOf(extraTypeInfo) === "string");
    }

    function isUndefinedOrNull(t) {
        return t === "undefined" || t === "null";
    }

    /*
     * Analyze the kind of coercion and
     *  - return a string representation (if mode is "string")
     *  - return an abstracted string representation (if mode is "abstract")
     *  - return a string representation of the operator of the coercion or "none" (if mode is "operator")
     *  - return "none", "potentially harmful" or "harmless (if mode is "classify")
     *  - return the concatenated string (if mode is "abstract_classify")
     */
    function coercionOfObs(obs, mode) {
        function abstractType(t) {
            if (t.indexOf("[object") === 0 && !(isWrappedPrimitive(t))) {
                return "object"
            } else return t;
        }

        function stronglyAbstractType(t) {
            if (t.indexOf("[object") === 0 || t === "function" || t === "array")
                return "object";
            else if (t === "number" || t === "boolean")
                return "primitive";
            else
                return t;
        }

        function ignoreOrder(left, op, right) {
            if (left < right) {
                return left + " " + op + " " + right;
            } else {
                return right + " " + op + " " + left;
            }
        }

        if (mode === MapModes.ABSTRACT_CLASSIFY) {
            return coercionOfObs(obs, MapModes.ABSTRACT) + " (" + coercionOfObs(obs, MapModes.CLASSIFY) + ")";
        }

        var op = obs.operation;
        if (obs.kind === "explicit") {
            return "none";
        }
        if (obs.kind === "conditional") {
            if (obs.type === "boolean") {
                return "none";
            } else {
                if (mode === MapModes.STRING) {
                    return obs.type + " in conditional";
                } else if (mode === MapModes.ABSTRACT) {
                    return abstractType(obs.type) + " in conditional";
                } else if (mode === MapModes.OPERATOR) {
                    return "conditional";
                } else if (mode === MapModes.CLASSIFY) {
                    if (isWrappedPrimitive(obs.type)) {
                        return Classification.HARMFUL;
                    } else {
                        return Classification.HARMLESS;
                    }
                }
            }
        } else if (obs.kind === "unary") {
            if (op === "+" || op === "-") {
                if (obs.type === "number") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return op + " " + obs.type;
                    } else if (mode === MapModes.ABSTRACT) {
                        return "+-~ " + abstractType(obs.type);
                    } else if (mode === MapModes.OPERATOR) {
                        return "+-~";
                    } else if (mode === MapModes.CLASSIFY) {
                        if (isQuasiNumber(obs.type, obs.extraTypeInfo)) return Classification.HARMLESS;
                        else return Classification.HARMFUL;
                    }
                }
            } else if (op === "~") {
                if (obs.type === "number") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return op + " " + obs.type;
                    } else if (mode === MapModes.ABSTRACT) {
                        return "+-~ " + abstractType(obs.type);
                    } else if (mode === MapModes.OPERATOR) {
                        return "+-~";
                    } else if (mode === MapModes.CLASSIFY) {
                        if (isQuasiNumber(obs.type, obs.extraTypeInfo)) return Classification.HARMLESS;
                        else return Classification.HARMFUL;
                    }
                }
            } else if (op === "!") {
                if (obs.type === "boolean") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return op + " " + obs.type;
                    } else if (mode === MapModes.ABSTRACT) {
                        return op + " " + abstractType(obs.type);
                    } else if (mode === MapModes.OPERATOR) {
                        return op;
                    } else if (mode === MapModes.CLASSIFY) {
                        if (isWrappedPrimitive(obs.type)) {
                            return Classification.HARMFUL;
                        } else {
                            return Classification.HARMLESS;
                        }
                    }
                }
            }
        } else if (obs.kind === "binary") {
            if (op === "-" || op === "*" || op === "/" || op === "%" ||
                  op === "<<" || op === ">>" || op === ">>>") {
                if (obs.leftType === "number" && obs.rightType === "number") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        return ignoreOrder(abstractType(obs.leftType), "ARITHM", abstractType(obs.rightType));
                    } else if (mode === MapModes.OPERATOR) {
                        return "ARITHM";
                    } else if (mode === MapModes.CLASSIFY) {
                        if (isQuasiNumber(obs.leftType, obs.leftExtraTypeInfo) &&
                              isQuasiNumber(obs.rightType, obs.rightExtraTypeInfo)) return Classification.HARMLESS;
                        else return Classification.HARMFUL;
                    }
                }
            } else if (op === "+") {
                if ((obs.leftType === "number" && obs.rightType === "number") ||
                      (obs.leftType === "string" && obs.rightType === "string")) {
                    if (mode === MapModes.ABSTRACT_ALL) {
                        return ignoreOrder(abstractType(obs.leftType), "+", abstractType(obs.rightType));
                    } else {
                        return "none";
                    }
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT || mode === MapModes.ABSTRACT_ALL) {
                        return ignoreOrder(abstractType(obs.leftType), "+", abstractType(obs.rightType));
                    } else if (mode === MapModes.OPERATOR) {
                        return "+";
                    } else if (mode === MapModes.CLASSIFY) {
                        var leftIsQuasiString = isQuasiString(obs.leftType, obs.leftExtraTypeInfo);
                        var rightIsQuasiString = isQuasiString(obs.rightType, obs.rightExtraTypeInfo);
                        if (leftIsQuasiString || rightIsQuasiString) {
                            var otherType = leftIsQuasiString ? obs.rightType : obs.leftType;
                            if (isUndefinedOrNull(otherType)) {
                                return Classification.HARMFUL;
                            } else {
                                return Classification.HARMLESS;
                            }
                        } else {
                            return Classification.HARMFUL;
                        }
                    }
                }
            } else if (op === "<" || op === ">" || op === "<=" || op === ">=") {
                if ((obs.leftType === "number" && obs.rightType === "number") ||
                      (obs.leftType === "string" && obs.rightType === "string")) {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        return ignoreOrder(abstractType(obs.leftType), "REL", abstractType(obs.rightType));
                    } else if (mode === MapModes.OPERATOR) {
                        return "REL";
                    } else if (mode === MapModes.CLASSIFY) {
                        if ((isQuasiNumber(obs.leftType, obs.leftExtraTypeInfo) && isQuasiNumber(obs.rightType, obs.rightExtraTypeInfo))
                              || (isQuasiString(obs.leftType, obs.leftExtraTypeInfo) && isQuasiString(obs.rightType, obs.rightExtraTypeInfo)))
                            return Classification.HARMLESS
                        else return Classification.HARMFUL;
                    }
                }
            } else if (op === "===" || op === "!==") {
                return "none";
            } else if (op === "==" || op === "!=") {
                if (obs.leftType === obs.rightType) {
                    return "none";
                } else if ((obs.leftType === "null" && obs.rightType === "undefined") ||
                      (obs.leftType === "undefined" && obs.rightType === "null")) {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        var leftType = stronglyAbstractType(obs.leftType);
                        var rightType = stronglyAbstractType(obs.rightType);
                        return ignoreOrder(stronglyAbstractType(obs.leftType), "EQ", stronglyAbstractType(obs.rightType));
                    } else if (mode === MapModes.OPERATOR) {
                        return "EQ";
                    } else if (mode === MapModes.CLASSIFY) {
                        if (isUndefinedOrNull(obs.leftType) || isUndefinedOrNull(obs.rightType)) return Classification.HARMLESS;
                        else return Classification.HARMFUL;
                    }
                }
            } else if (op === "&" || op === "^" || op === "|") {
                if (obs.leftType === "number" && obs.rightType === "number") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        return ignoreOrder(abstractType(obs.leftType), "BIT", abstractType(obs.rightType));
                    } else if (mode === MapModes.OPERATOR) {
                        return "BIT";
                    } else if (mode === MapModes.CLASSIFY) {
                        if (isQuasiNumber(obs.leftType, obs.leftExtraTypeInfo) &&
                              isQuasiNumber(obs.rightType, obs.rightExtraTypeInfo)) {
                            return Classification.HARMLESS;
                        } else if (op === "|" && obs.leftType === "undefined" &&
                              obs.rightType === "number" && obs.rightValue === 0) {
                            return Classification.HARMLESS;
                        } else {
                            return Classification.HARMFUL;
                        }
                    }
                }
            } else if (op === "&&" || op === "||") {
                if (obs.leftType === "boolean" && obs.rightType === "boolean") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        return ignoreOrder(abstractType(obs.leftType), "BOOL", abstractType(obs.rightType));
                    } else if (mode === MapModes.OPERATOR) {
                        return "BOOL";
                    } else if (mode === MapModes.CLASSIFY) {
                        if (isWrappedPrimitive(obs.leftType) || isWrappedPrimitive(obs.rightType)) {
                            return Classification.HARMFUL;
                        } else {
                            return Classification.HARMLESS;
                        }
                    }
                }
            }
        }
        throw "Unexpected operation-type combination: " + JSON.stringify(obs);
    }

    function obsToStatic(obs) {
        var newObs = util.shallowClone(obs);
        newObs.frequency = obs.frequency > 0 ? 1 : 0;
        return newObs;
    }

    function obsToTypeSummary(obs) {
        if (obs.kind === "conditional" || obs.kind === "unary") {
            return obs.type;
        } else if (obs.kind === "binary") {
            return [obs.leftType, obs.rightType].sort().join(" and ");
        } else if (obs.kind === "explicit") {
            return obs.inputType;
        } else throw "Unexpected kind of observation: " + obs.kind;
    }

    function obsToAbstractStringAndTypeSummaryString(obs) {
        return coercionOfObs(obs, MapModes.ABSTRACT) + "@@@" + obsToTypeSummary(obs);
    }

    function shorten(classification) {
        if (classification === Classification.HARMFUL) return "harmf.";
        if (classification === Classification.HARMLESS) return "harml.";
        return classification;
    }

    var obs = {
        toStringAndFreq:function(obs) {
            return new StringAndFreq(coercionOfObs(obs, MapModes.STRING), obs.frequency);
        },
        toAbstractStringAndFreq:function(obs) {
            return new StringAndFreq(coercionOfObs(obs, MapModes.ABSTRACT), obs.frequency);
        },
        toClassificationAndFreq:function(obs) {
            return new StringAndFreq(coercionOfObs(obs, MapModes.CLASSIFY), obs.frequency);
        },
        toClassification:function(obs) {
            return coercionOfObs(obs, MapModes.CLASSIFY);
        },
        toAbstractStringAndClassificationAndFreq:function(obs) {
            return new StringAndClassAndFreq(coercionOfObs(obs, MapModes.ABSTRACT), coercionOfObs(obs, MapModes.CLASSIFY), obs.frequency);
        },
        toAbstractAllStringAndClassificationAndFreq:function(obs) {
            return new StringAndClassAndFreq(coercionOfObs(obs, MapModes.ABSTRACT_ALL), shorten(coercionOfObs(obs, MapModes.CLASSIFY)), obs.frequency);
        },
        toStatic:obsToStatic,
        toIID:function(obs) {
            return obs.iid;
        },
        toTypeSummary:obsToTypeSummary,
        toOperator:function(obs) {
            return coercionOfObs(obs, MapModes.OPERATOR);
        },
        toUniqueLocation:function(obs) {
            return obs.benchmarkGroup+"@"+obs.benchmark+"@"+obs.iid;
        }
    };

    var strAndFreq = {
        toFreq:function(sf) {
            return sf.freq;
        },
        toStatic:function(sf) {
            return new StringAndFreq(sf.str, sf.freq > 0 ? 1 : 0);
        }
    }

    var strAndClassAndFreq = {
        toStrAndFreq:function(scf) {
            return new StringAndFreq(scf.str, scf.freq);
        },
        toStatic:function(scf) {
            return new StringAndClassAndFreq(scf.str, scf.clss, scf.freq > 0 ? 1 : 0);
        },
        toStr:function(scf) {
            return scf.str;
        },
        toStrClssAndFreq:function(scf) {
            return new StringAndFreq(scf.str + " (" + scf.clss + ")", scf.freq);
        }
    }

    var xy = {
        toY:function(xy) {
            return xy.y;
        }
    }

    exports.obs = obs;
    exports.strAndFreq = strAndFreq;
    exports.strAndClassAndFreq = strAndClassAndFreq;
    exports.Classication = Classification;
    exports.xy = xy;

})();