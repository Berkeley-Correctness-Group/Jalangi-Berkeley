// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');

    var obs = {
        isExplicit:function(obs) {
            return obs.kind === "explicit";
        },
        isNotExplicit:function(obs) {
            return obs.kind !== "explicit";
        },
        isCoercion:function(obs) {
            return isNotExplicit(obs) && m.obsToClassification !== "none";
        }
    };

    var strAndFreq = {
        notNone:function notNone(sf) {
            return sf.str !== "none";
        }
    };

    exports.obs = obs;
    exports.strAndFreq = strAndFreq;
})();