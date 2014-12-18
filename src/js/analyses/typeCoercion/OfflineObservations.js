// Author: Michael Pradel

(function() {
    var typeSummaryToNb = {}; // for memory-efficient storage
    var nbToTypeSummary = {};
    var nextTypeSummaryNb = 1;

    function getOrCreateTypeSummaryNb(typeSummary) {
        var nb = typeSummaryToNb[typeSummary];
        if (nb === undefined) {
            nb = nextTypeSummaryNb++;
            typeSummaryToNb[typeSummary] = nb;
            nbToTypeSummary[nb] = typeSummary;
        }
        if (nextTypeSummaryNb === Number.MAX_VALUE) throw "Too many type summary numbers";
        return nb;
    }

    function OfflineUnaryObservation(iid, benchmark, benchmarkGroup, callIDs, frequency, operation, type, extraTypeInfo, value, resultType, resultValue) {
        var summary = {
            type:type,
            extraTypeInfo:extraTypeInfo,
            value:value,
            resultType:resultType,
            resultValue:resultValue
        };
        var summaryStr = JSON.stringify(summary);

        this.iid = iid;
        this.operation = operation;
        this.benchmark = benchmark;
        this.benchmarkGroup = benchmarkGroup;
        this.callIDs = callIDs;
        this.frequency = frequency;
        this.summaryNb = getOrCreateTypeSummaryNb(summaryStr);
    }

    OfflineUnaryObservation.prototype = {
        get kind() {
            return this.operation === "conditional" ? "conditional" : "unary";
        }
    };
    ["type", "extraTypeInfo", "value", "resultType", "resultValue"].forEach(function(propName) {
        Object.defineProperty(OfflineUnaryObservation.prototype, propName, {
            get:function() {
                return JSON.parse(nbToTypeSummary[this.summaryNb])[propName];
            }
        });
    });

    function OfflineBinaryObservation(iid, benchmark, benchmarkGroup, callIDs, frequency, operation, leftType, leftExtraTypeInfo, leftValue, rightType, rightExtraTypeInfo, rightValue, resultType, resultValue) {
        var summary = {
            leftType:leftType,
            leftExtraTypeInfo:leftExtraTypeInfo,
            leftValue:leftValue,
            rightType:rightType,
            rightExtraTypeInfo:rightExtraTypeInfo,
            rightValue:rightValue,
            resultType:resultType,
            resultValue:resultValue
        };
        var summaryStr = JSON.stringify(summary);

        this.iid = iid;
        this.operation = operation;
        this.benchmark = benchmark;
        this.benchmarkGroup = benchmarkGroup;
        this.callIDs = callIDs;
        this.frequency = frequency;
        this.summaryNb = getOrCreateTypeSummaryNb(summaryStr);
    }

    OfflineBinaryObservation.prototype = {
        get kind() {
            return "binary";
        }
    };
    ["leftType", "leftExtraTypeInfo", "leftValue", "rightType", "rightExtraTypeInfo", "rightValue", "resultType", "resultValue"].forEach(function(propName) {
        Object.defineProperty(OfflineBinaryObservation.prototype, propName, {
            get:function() {
                return JSON.parse(nbToTypeSummary[this.summaryNb])[propName];
            }
        });
    });

    function OfflineExplicitObservation(iid, benchmark, benchmarkGroup, callIDs, frequency, operation, inputType, inputExtraTypeInfo, inputValue, outputType, outputValue) {
        var summary = {
            inputType:inputType,
            inputExtraTypeInfo:inputExtraTypeInfo,
            inputValue:inputValue,
            outputType:outputType,
            outputValue:outputValue
        };
        var summaryStr = JSON.stringify(summary);

        this.iid = iid;
        this.operation = operation;
        this.benchmark = benchmark;
        this.benchmarkGroup = benchmarkGroup;
        this.callIDs = callIDs;
        this.frequency = frequency;
        this.summaryNb = getOrCreateTypeSummaryNb(summaryStr);
    }

    OfflineExplicitObservation.prototype = {
        get kind() {
            return "explicit";
        }
    };
    ["inputType", "inputExtraTypeInfo", "inputValue", "outputType", "outputValue"].forEach(function(propName) {
        Object.defineProperty(OfflineExplicitObservation.prototype, propName, {
            get:function() {
                return JSON.parse(nbToTypeSummary[this.summaryNb])[propName];
            }
        });
    });

    function toOfflineObservation(obs) {
        if (obs.kind === "unary" || obs.kind === "conditional") {
            return new OfflineUnaryObservation(obs.iid, obs.benchmark, obs.benchmarkGroup, obs.callIDs, obs.frequency, obs.operation,
                  obs.type, obs.extraTypeInfo, obs.value, obs.resultType, obs.resultValue);
        } else if (obs.kind === "binary") {
            return new OfflineBinaryObservation(obs.iid, obs.benchmark, obs.benchmarkGroup, obs.callIDs, obs.frequency, obs.operation,
                  obs.leftType, obs.leftExtraTypeInfo, obs.leftValue, obs.rightType, obs.rightExtraTypeInfo, obs.rightValue, obs.resultType, obs.resultValue);
        } else if (obs.kind === "explicit") {
            return new OfflineExplicitObservation(obs.iid, obs.benchmark, obs.benchmarkGroup, obs.callIDs, obs.frequency, obs.operation,
                  obs.inputType, obs.extraTypeInfo, obs.inputValue, obs.outputType, obs.outputValue);
        } else throw "Unexpected kind of observation: " + obs.kind;
    }

    exports.toOfflineObservation = toOfflineObservation;

})();