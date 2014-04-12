(function() {

    var fs = require('fs');

    var jalangiWorkingDir = "/tmp/jalangiWorkingDir/";
    var sourceMapSuffix = "_sourcemap.json";

    function loadIIDs(benchmarkOpt) {
        var allIIDs = {};
        var sourceMapCtr = 0;
        fs.readdirSync(jalangiWorkingDir).forEach(function(file) {
            if (file.indexOf(sourceMapSuffix) === file.length - sourceMapSuffix.length) {
                if (!benchmarkOpt || file.indexOf(benchmarkOpt) !== -1) {
                    var json = fs.readFileSync(jalangiWorkingDir+file);
                    sourceMapCtr++;
                    var iids = JSON.parse(json)[0];
                    Object.keys(iids).forEach(function(iid) {
                        allIIDs[iid] = iids[iid];
                    });
                }
            }
        });
        console.log(Object.keys(allIIDs).length+" IIDs in "+sourceMapCtr+" sourcemaps");
        return allIIDs;
    }

    exports.loadIIDs = loadIIDs;

})();