// Author: Michael Pradel

(function() {

    console.log("jalangiFF: page script running");

    function logResult(json, append) {
        console.log("Receiving results from page script");
        self.port.emit("logResult", json, append);
    };

    exportFunction(logResult, unsafeWindow, {defineAs: "logResult"});

})();
