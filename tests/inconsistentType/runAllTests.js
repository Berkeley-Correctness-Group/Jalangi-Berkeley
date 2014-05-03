(function() {

    var fs = require('fs');
    var child_process = require('child_process');
    var testDir = "./tests/inconsistentType/";
    var allFiles = fs.readdirSync(testDir);
    var executedAndAnalyzed = 0;
    var failedTotal = 0;
    var failedFalsePositive = 0;
    var failedFalseNegative = 0;
    var testRunning = false;
    var testsToAnalyze = allFiles.filter(function(file) {
        return (file.indexOf(".js") === file.length - 3 &&
              file.indexOf("_jalangi_") === -1 &&
              file.indexOf("_sourcemap") === -1 &&
              file.indexOf("runAllTests.js") === -1 &&
              (file.indexOf("inconsistent") === 0 || file.indexOf("consistent") === 0));
    });
    var testsToDo = testsToAnalyze.length;
    console.log("Tests to run: "+testsToDo);
    while (testsToAnalyze.length > 0) {
        var test = testsToAnalyze.pop();
        var expectWarning = test.indexOf("inconsistent") === 0;
        runTest(test, runAndAnalyzeTest.bind(null, test, expectWarning));
    }
    printResults();

    function runTest(file, continuation) {
        if (testRunning) {
            setTimeout(runTest.bind(null, file, continuation), 10);
            return;
        }
        testRunning = true;
        var cmd = "node " + testDir + file;
        child_process.exec(cmd,
              function(error, stdout, stderr) {
                  if (error) {
                      testsToDo--;
                      console.log("  "+file+ " crashes, will not analyze it.");
                  } else {
                      setTimeout(continuation, 0);
                  }
                  testRunning = false;
              });
    }

    function runAndAnalyzeTest(file, expectWarning) {
        if (testRunning) {
            setTimeout(runAndAnalyzeTest.bind(null, file, expectWarning), 10);
            return;
        }
        testRunning = true;
        var cmd = "python ../jalangi/scripts/jalangi.py direct -a src/js/analyses/inconsistentType/InconsistentTypeEngine.js " + testDir + file.replace(/.js$/, "");
        child_process.exec(cmd,
              function(error, stdout, stderr) {
                  if (!error) {
                      var hasWarning = stdout.indexOf("Warning") >= 0;
                      if (expectWarning && !hasWarning) {
                          console.log("  "+file + ": FAILED (didn't get expected warning)");
                          failedTotal++;
                          failedFalseNegative++;
                      } else if (!expectWarning && hasWarning) {
                          console.log("  "+file + ": FAILED (get unexpected warning)");
//                          console.log(stdout);
                          failedTotal++;
                          failedFalsePositive++;
                      } else {
                          console.log("  "+file + ": OK");
                      }
                  } else {
                      console.log("Error: Couldn't execute test!");
                      console.log(stderr);
                      failedTotal++;
                  }
                  executedAndAnalyzed++;
                  testsToDo--;
                  testRunning = false;
              });
    }

    function printResults() {
        if (testsToDo > 0) {
            setTimeout(printResults, 100);
            return;
        }
        console.log("Executed: " + executedAndAnalyzed + ", failed: " + failedTotal + " (" + failedFalsePositive + " false positives, " + failedFalseNegative + " false negatives)");
    }

}
)();