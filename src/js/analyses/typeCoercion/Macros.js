// Author: Michael Pradel

(function() {

    var generatedResultsDir = "/home/m/research/papers/ecoop15/generated_results/";
    var fs = require('fs');

    function writeMacro(name, value) {
        var macro = "\\newcommand{\\" + name + "}{" + value + "}";
        fs.writeFileSync(generatedResultsDir + name + ".tex", macro);
    }

    exports.writeMacro = writeMacro;

})();