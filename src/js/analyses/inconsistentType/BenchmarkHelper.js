(function() {

    function urlToBenchmark(url) {
        if (url.indexOf("http://127.0.0.1:8000/tests/octane2/index_") !== -1) { // octane benchmark
            var b = url.slice("http://127.0.0.1:8000/tests/octane2/index_".length);
            b = b.slice(0, b.indexOf(".html"));
            return b;
        } else if (url.indexOf("/home/m/research/projects/jalangi/tests/sunspider1/") === 0) { // sunspider benchmark
            var b = url.slice("/home/m/research/projects/jalangi/tests/sunspider1/".length);
            b = b.slice(0, b.indexOf(".js_beliefs"));
            return b;
        } else if (url.indexOf("http://127.0.0.1:8000/tests/tizen_firefox/" === 0)) {
            var b = url.slice("http://127.0.0.1:8000/tests/tizen_firefox/".length);
            return b;
        } else if (url.indexOf("http://127.0.0.1/joomla" === 0)) {
            return "joomla";
        } else if (url.indexOf("http://127.0.0.1/moodle" === 0)) {
            return "moodle";
        } else if (url.indexOf("http://127.0.0.1/zurmo" === 0)) {
            return "zurmo";
        } else {
            return url;
        }
    }

    /**
     * @param {String} loc
     * @returns {String}
     */
    function locationToComponent(loc) {
        var c = "other";
        if (loc.indexOf("jquery") !== -1)
            c = "jquery";
        else if (loc.indexOf("mootools") !== -1)
            c = "mootools";
        else if (loc.indexOf("bootstrap.js") !== -1)
            c = "bootstrap";

        return c;
    }



    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$BenchmarkHelper = {};
        module = window.$BenchmarkHelper;
    }

    function importModule(moduleName) {
        if (typeof exports !== "undefined") {
            return require('./' + moduleName + ".js");
        } else {
            return window['$' + moduleName];
        }
    }
    module.locationToComponent = locationToComponent;
    module.urlToBenchmark = urlToBenchmark;

})();