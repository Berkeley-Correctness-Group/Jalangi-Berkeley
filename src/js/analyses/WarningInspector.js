(function() {

    var fs = require('fs');
    var util = require('./CommonUtil.js');

    function readFile(fileName) {
        if (fs.existsSync(fileName)) {
            var data = fs.readFileSync(fileName);
            return JSON.parse(data);
        } else return [];
    }

    function InspectedId(id, comment) {
        this.id = id;
        this.comment = comment;
    }

    /**
     * @param {string} text
     * @param {string->true} ids
     * @param {number->true} warningNbs
     * @param {string} kindsSummary
     */
    function Warning(text, ids, warningNbs, kindsSummary) {
        this.text = text;
        this.ids = ids;
        this.warningNbs = warningNbs;
        this.kindsSummary = kindsSummary;
    }

    /**
     * @param {array of Warning} warningsToInspect
     * @param {string} knownWarningsFile
     * @param {object} resultSummary
     */
    function inspect(warningsToInspect, knownWarningsFile, resultSummary) {
        console.log("\n--------------------- WarningInspector -----------------");
        console.log("Warnings given to inspector: " + warningsToInspect.length);
        var knownWarnings = readFile(knownWarningsFile);
        console.log("Known warnings: " + knownWarnings.length);
        warningsToInspect.forEach(function(warning) {
            // if all ids of the warnings are known, no need to inspect it again
            var knownIds = 0;
            var commentsOfKnown = {};
            Object.keys(warning.ids).forEach(function(id) {
                var isKnown = false;
                knownWarnings.some(function(knownWarning) {
                    if (knownWarning.id === id) {
                        isKnown = true;
                        commentsOfKnown[knownWarning.comment] = true;
                        return true;
                    }
                });
                if (isKnown)
                    knownIds++;
            });
            if (Object.keys(warning.ids).length === knownIds) {
                console.log("Skipping known warning (" + Object.keys(warning.warningNbs) + "): " + Object.keys(commentsOfKnown) + " -- kinds: " + warning.kindsSummary);
//                console.log(warning.text);
                var isBug = Object.keys(commentsOfKnown).some(function(comment) {
                    return comment.indexOf("bug") === 0;
                });
                if (isBug) {
                    resultSummary.bugs++;
                }
            } else {
                console.log("===============================\n" + warning.text + "\n");
                var inspectedIdsTemplates = Object.keys(warning.ids).map(function(id) {
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