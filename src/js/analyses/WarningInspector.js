(function() {

    var fs = require('fs');

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function InspectedId(id, comment) {
        this.id = id;
        this.comment = comment;
    }

    function Warning(text, ids) {
        this.text = text;
        this.ids = ids;
    }

    /**
     * @param {array of Warning} warningsToInspect
     * @param {string} knownWarningsFile
     */
    function inspect(warningsToInspect, knownWarningsFile) {
        console.log("Warnings to inspect: " + warningsToInspect.length);
        var knownWarnings = readFile(knownWarningsFile);
        console.log("Known warnings: " + knownWarnings.length);
        warningsToInspect.forEach(function(warning) {
            // if all ids of the warnings are known, no need to inspect it again
            var knownIds = 0;
            warning.ids.forEach(function(id) {
                var isKnown = false;
                knownWarnings.some(function(knownWarning) {
                    if (knownWarning.id === id) {
                        isKnown = true;
                        return true;
                    }
                });
                if (isKnown)
                    knownIds++;
            });
            if (warning.ids.length === knownIds) {
                warning.ids.forEach(function(id) {
                    console.log("Skipping known warning: " + id);
                });

            } else {
                console.log("===============================\n" + warning.text + "\n");
                var inspectedIdsTemplates = warning.ids.map(function(id) {
                    return new InspectedId(id, "TEMPLATE");
                });
                console.log(JSON.stringify(inspectedIdsTemplates, 0, 2));
                console.log("----------------------------------------");
            }
        });
    }

    exports.inspect = inspect;
    exports.Warning = Warning;

})();