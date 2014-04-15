(function() {

    var util = require('../CommonUtil.js');

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

})();