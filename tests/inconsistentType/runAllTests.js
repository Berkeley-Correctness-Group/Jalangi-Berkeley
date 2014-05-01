(function() {

    var fs = require('fs');
    var child_process = require('child_process');

    var allFiles = fs.readdirSync("./tests/inconsistentType/");
    var invoked = 0;
    var executed = 0;
    var failedTotal = 0;
    var failedFalsePositive = 0;
    var failedFalseNegative = 0;
    var testRunning = false;
    var tests = allFiles.filter(function(file) {
        return (file.indexOf(".js") === file.length - 3 &&
              file.indexOf("_jalangi_") === -1 &&
              file.indexOf("_sourcemap") === -1 &&
              file.indexOf("runAllTests.js") === -1);
    });
    tests.forEach(function(test) {
        if (test.indexOf("consistent") === 0) {
            runTest(test, false);
        } else if (test.indexOf("inconsistent") === 0) {
            runTest(test, true);
        }
    });
    printResults();

    function runTest(file, expectWarning) {
        if (testRunning) {
            setTimeout(runTest.bind(null, file, expectWarning), 0);
            return;
        }
        testRunning = true;
        invoked++;
        var cmd = "python ../jalangi/scripts/jalangi.py direct -a src/js/analyses/inconsistentType/InconsistentTypeEngine.js tests/inconsistentType/" + file.replace(/.js$/, "");
        child_process.exec(cmd,
              function(error, stdout, stderr) {
                  if (!error) {
                      var hasWarning = stdout.indexOf("Warning") >= 0;
                      if (expectWarning && !hasWarning) {
                          console.log(file + ": FAILED (didn't get expected warning)");
                          failedTotal++;
                          failedFalseNegative++;
                      } else if (!expectWarning && hasWarning) {
                          console.log(file + ": FAILED (get unexpected warning)");
//                          console.log(stdout);
                          failedTotal++;
                          failedFalsePositive++;
                      } else {
                          console.log(file + ": OK");
                      }
                  } else {
                      console.log("Error: Couldn't execute test!");
                      console.log(stderr);
                      failedTotal++;
                  }
                  executed++;
                  testRunning = false;
              });
    }

    function printResults() {
        if (executed !== tests.length) {
            setTimeout(printResults, 100);
            return;
        }
        console.log("Executed: " + executed + ", failed: " + failedTotal + " (" + failedFalsePositive + " false positives, " + failedFalseNegative + " false negatives)");
    }

})();