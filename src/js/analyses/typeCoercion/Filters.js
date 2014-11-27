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
    exports.strAndFreq = strAndFreq;
    exports.strAndClassAndFreq = strAndClassAndFreq;
})();