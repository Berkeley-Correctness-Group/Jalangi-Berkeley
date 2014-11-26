// Author: Michael Pradel

(function() {

    var obsAndFreq = {
        addFreq:function(oldVal, sf) {
            return oldVal + sf.freq;
        }
    }

    exports.obsAndFreq = obsAndFreq;

})();