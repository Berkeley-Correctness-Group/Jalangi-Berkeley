// Author: Michael Pradel

(function() {

    var obsAndFreq = {
        addFreq:function(oldVal, sf) {
            return oldVal + sf.freq;
        }
    }

    var xy = {
        addY:function(oldVal, xy) {
            return oldVal + xy.y;
        }
    }

    exports.obsAndFreq = obsAndFreq;
    exports.xy = xy;

})();