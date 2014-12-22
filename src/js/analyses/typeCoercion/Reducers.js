// Author: Michael Pradel

(function() {

    var obsAndFreq = {
        addFreq:function(oldVal, sf) {
            return oldVal + sf.freq;
        }
    }

    var strAndClassAndFreq = {
        addFreq:function(oldVal, scf) {
            return oldVal + scf.freq;
        }
    }

    var xy = {
        addY:function(oldVal, xy) {
            return oldVal + xy.y;
        }
    }

    var number = {
        add:function(oldVal, v) {
            return oldVal + v;
        }
    }

    var obs = {
        addFreq:function(oldVal, obs) {
            return oldVal + obs.frequency;
        }
    }

    exports.obsAndFreq = obsAndFreq;
    exports.strAndClassAndFreq = strAndClassAndFreq;
    exports.xy = xy;
    exports.number = number;
    exports.obs = obs;

})();