(function() {

    var util = require('../CommonUtil.js');

    function urlToBenchmark(url) {
        if (url.indexOf("http://127.0.0.1/") !== -1) { // web app
            var urlSuffix = url.slice("http://127.0.0.1/".length);
            return urlSuffix.slice(0, urlSuffix.indexOf("/"));
        } else if (url.indexOf("../jalangi/tests") !== -1) { // node.js benchmark
            return url.slice("../jalangi/tests/".length);
        } else {
            return url;
        }
    }

    /**
     * @param {String} loc
     * @returns {String}
     */
    function locationToComponent(loc) {
        util.assert(typeof loc === "string", typeof loc);
        var c = "other";
        if (loc.indexOf("jquery") !== -1)
            c = "jquery";
        else if (loc.indexOf("mootools") !== -1)
            c = "mootools";
        else if (loc.indexOf("bootstrap.js") !== -1)
            c = "bootstrap";

        return c;
    }
    
    

    exports.locationToComponent = locationToComponent;
    exports.urlToBenchmark = urlToBenchmark;

})();