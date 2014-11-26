// Author: Michael Pradel

(function() {

    var MapModes = {
        STRING:"string",
        ABSTRACT:"abstract",
        CLASSIFY:"classify",
        ABSTRACT_CLASSIFY:"abstract_classify"
    };

    function StringAndFreq(str, freq) {
        this.str = str;
        this.freq = freq;
    }

    /*
     * Analyze the kind of coercion and
     *  - return a string representation (if mode is "string")
     *  - return an abstracted string representation (if mode is "abstract")
     *  - return "none", "potentially harmful" or "harmless (if mode is "classify")
     *  - return the concatenated string (if mode is "abstract_classify")
     */
    function coercionOfObs(obs, mode) {
        function abstractType(t) {
            return t.indexOf("[object") === 0 ? "object" : t;
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
                } else if (mode === MapModes.CLASSIFY) {
                    if (obs.type === "function") {
                        return "potentially harmful";
                    } else {
                        return "harmless";
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
                    } else if (mode === MapModes.CLASSIFY) {
                        return "potentially harmful";
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
                    } else if (mode === MapModes.CLASSIFY) {
                        return "potentially harmful";
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
                    } else if (mode === MapModes.CLASSIFY) {
                        if (obs.type === "function") {
                            return "potentially harmful";
                        } else {
                            return "harmless";
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
                        return ignoreOrder(abstractType(obs.leftType), "ARITHM_OP", abstractType(obs.rightType));
                    } else if (mode === MapModes.CLASSIFY) {
                        return "potentially harmful";
                    }
                }
            } else if (op === "+") {
                if ((obs.leftType === "number" && obs.rightType === "number") ||
                      (obs.leftType === "string" && obs.rightType === "string")) {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        return ignoreOrder(abstractType(obs.leftType), "+", abstractType(obs.rightType));
                    } else if (mode === MapModes.CLASSIFY) {
                        if (obs.leftType === "string" || obs.rightType === "string") {
                            var otherType = obs.leftType === "string" ? obs.rightType : obs.leftType;
                            if (otherType === "undefined" || otherType === "null") {
                                return "potentially harmful";
                            } else {
                                return "harmless";
                            }
                        } else {
                            return "potentially harmful";
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
                        return ignoreOrder(abstractType(obs.leftType), "REL_OP", abstractType(obs.rightType));
                    } else if (mode === MapModes.CLASSIFY) {
                        return "potentially harmful";
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
                        return ignoreOrder(stronglyAbstractType(obs.leftType), "EQ_OP", stronglyAbstractType(obs.rightType));
                    } else if (mode === MapModes.CLASSIFY) {
                        return "potentially harmful";
                    }
                }
            } else if (op === "&" || op === "^" || op === "|") {
                if (obs.leftType === "number" && obs.rightType === "number") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        return ignoreOrder(abstractType(obs.leftType), "BIT_OP", abstractType(obs.rightType));
                    } else if (mode === MapModes.CLASSIFY) {
                        return "potentially harmful";
                    }
                }
            } else if (op === "&&" || op === "||") {
                if (obs.leftType === "boolean" && obs.rightType === "boolean") {
                    return "none";
                } else {
                    if (mode === MapModes.STRING) {
                        return obs.leftType + " " + op + " " + obs.rightType;
                    } else if (mode === MapModes.ABSTRACT) {
                        return ignoreOrder(abstractType(obs.leftType), "BOOL_OP", abstractType(obs.rightType));
                    } else if (mode === MapModes.CLASSIFY) {
                        return "harmless";
                    }
                }
            }
        }
        throw "Unexpected operation-type combination: " + JSON.stringify(obs);
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
        toAbstractStringAndClassificationAndFreq:function(obs) {
            return new StringAndFreq(coercionOfObs(obs, MapModes.ABSTRACT_CLASSIFY), obs.frequency);
        }
    };

    var strAndFreq = {
        toFreq:function(sf) {
            return sf.freq;
        }
    }

    exports.obs = obs;
    exports.strAndFreq = strAndFreq;

})();