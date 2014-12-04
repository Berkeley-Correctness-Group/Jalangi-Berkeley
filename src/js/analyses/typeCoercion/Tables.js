// Author: Michael Pradel

(function() {

    var tablesDir = "/home/m/research/papers/ecoop15/tables/";
    var fs = require('fs');

    function writeTable(headerRow, dataRows, fileName) {
        var result = "\\begin{table}{" + guessTableDimensions(dataRows) + "}\n";
        result += "  " + headerRow.join(" & ") + "\\\\\n";
        for (var i = 0; i < dataRows.length; i++) {
            var row = dataRows[i];
            result += "  " + row.join(" & ") + "\\\\\n";
        }
        result += "\\end{table}\n";
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