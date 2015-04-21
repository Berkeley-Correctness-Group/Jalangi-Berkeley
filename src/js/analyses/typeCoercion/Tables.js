// Author: Michael Pradel

(function() {

    var tablesDir = "./papers/type_coercions_ecoop2015/tables/";
    var fs = require('fs');

    function writeTable(headerRow, dataRows, fileName, options) {
        var dimensions = (options && options.alignment) ? options.alignment : guessTableDimensions(dataRows);
        var result = "\\begin{tabular}{" + dimensions + "}\n";
        result += "\\toprule";
        result += "  " + headerRow.join(" & ") + "\\\\\n";
        result += "\\midrule";
        for (var i = 0; i < dataRows.length; i++) {
            var row = dataRows[i];
            result += "  " + row.join(" & ") + "\\\\\n";
        }
        result += "\\bottomrule";
        result += "\\end{tabular}\n";
        fs.writeFileSync(tablesDir + fileName + ".tex", result);
    }

    function guessTableDimensions(dataRows) {
        var result = "";
        var row = dataRows[0];
        for (var i = 0; i < row.length; i++) {
            result += guessAlignment(row[i]);
        }
        return result;
    }

    function guessAlignment(value) {
        var asNumber = parseFloat(value);
        if (asNumber === asNumber) return "l";
        else return "r";
    }

    exports.writeTable = writeTable;

})();