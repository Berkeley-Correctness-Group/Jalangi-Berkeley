// Author: Michael Pradel

(function() {

    var generatedResultsDir = "./type_coercions_paper/generated_results/";
    var fs = require('fs');

    function writeMacro(name, value) {
        var macro = "\\newcommand{\\" + name + "}{" + value + "}";
        fs.writeFileSync(generatedResultsDir + name + ".tex", macro);
    }

    exports.writeMacro = writeMacro;

})();