// Author: Michael Pradel

(function() {

    var generatedResultsDir = "./papers/type_coercions_ecoop2015/generated_results/";
    var fs = require('fs');

    function writeMacro(name, value) {
        var macro = "\\newcommand{\\" + name + "}{" + value + "}";
        fs.writeFileSync(generatedResultsDir + name + ".tex", macro);
    }

    exports.writeMacro = writeMacro;

})();