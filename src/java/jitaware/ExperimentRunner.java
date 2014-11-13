/*
 * Copyright 2014 University of California, Berkeley.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Liang Gong

/*
Compile command:
javac -cp src/java/jitaware/thirdparty/selenium-server-standalone-2.41.0.jar `pwd`/src/java/jitaware/ExperimentRunner.java
*/

import java.io.File;
import java.io.PrintWriter;
import java.io.FileNotFoundException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.Hashtable;
import java.util.ArrayList;

import org.junit.Test;
//import org.openqa.jetty.log.LogStream.STDOUT;
import org.openqa.selenium.By;
import org.openqa.selenium.Platform;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.safari.SafariDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxBinary;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

public class ExperimentRunner {

	private int rounds = 30;
	private WebDriver driver = null;
	private int maxWaitTime = 10 * 60;

	public static void main(String[] args) throws Exception {
		if(!isSupportedPlatform()) {
			System.out.println("only supports Windows and Mac OS");
		}
		ExperimentRunner runner = new ExperimentRunner();
		//runner.run("Safari");
		runner.run("Firefox");
		runner.run("Chrome");
	}

	private static boolean isSupportedPlatform() {
        Platform current = Platform.getCurrent();
        return Platform.MAC.is(current) || Platform.WINDOWS.is(current);
    }

    final String firefoxBinary = //"/Applications/Firefox.app/Contents/MacOS/firefox-bin";
    							 "/Applications/Nightly.app/Contents/MacOS/firefox-bin";

    private void setupFirefox() throws Exception {
		DesiredCapabilities desiredCapabilities = DesiredCapabilities.firefox();
		FirefoxBinary binary = new FirefoxBinary(new File(firefoxBinary));
		FirefoxProfile profile = new FirefoxProfile();
		profile.setPreference("browser.cache.disk.enable", false);
		profile.setPreference("browser.cache.disk_cache_ssl", false);
		profile.setPreference("browser.cache.memory.enable", false);
		profile.setPreference("browser.cache.offline.capacity", 0);
		profile.setPreference("browser.cache.offline.enable", false);
		profile.setPreference("media.cache_size", 0);
		profile.setPreference("network.http.use-cache", false);
		//profile.setPreference("brwoser.dom.window.dump.enabled", true);
		driver = new FirefoxDriver(binary, profile, desiredCapabilities);
		driver.manage().timeouts().implicitlyWait(120, TimeUnit.SECONDS);
	}

    protected void createDriver(String browser) throws Exception {
    	if(browser.equals("Safari")) {
    		driver = new SafariDriver();
    	} else if (browser.equals("Firefox")) {
    		setupFirefox();
    		//driver = new FirefoxDriver();
    	} else if (browser.equals("Chrome")) {
    		driver = new ChromeDriver();
    	} else {
    		System.out.println("unknown browser: " + browser);
    		System.exit(0);
    	}
	}

	protected void quitDriver() {
    	driver.quit();
  	}

	private Hashtable<String, ArrayList<String> > octaneOrigResult = new Hashtable<String, ArrayList<String> >();
	private Hashtable<String, ArrayList<String> > octaneModifiedResult = new Hashtable<String, ArrayList<String> >();

	private Hashtable<String, ArrayList<String> > sunspiderOrigResult = new Hashtable<String, ArrayList<String> >();
	private Hashtable<String, ArrayList<String> > sunspiderModifiedResult = new Hashtable<String, ArrayList<String> >();
	

	protected void resetResult() {
		octaneOrigResult.clear();
		octaneModifiedResult.clear();
		sunspiderOrigResult.clear();
		sunspiderModifiedResult.clear();
	}

    protected void run(String browser) {
    	try {
	    	createDriver(browser);
	    	resetResult();
	    	String filename = browser + "-result.csv";
	    	for(int i=0;i<rounds;i++) {
	    		System.out.println("--------- Round " + i + " ----------");
		    	runExperiment("http://127.0.0.1:8080/octane/octane.html", octaneOrigResult);
		    	runExperiment("http://127.0.0.1:8080/octane/octane_modified.html", octaneModifiedResult);
		    	runExperiment("http://127.0.0.1:8080/sunspider/driver.html", sunspiderOrigResult);
		    	runExperiment("http://127.0.0.1:8080/sunspider2/driver.html", sunspiderModifiedResult);
		    	generateCSV(browser);
		    }
	    	quitDriver();
    	} catch (Exception ex) {
    		System.out.println("running experiment on browser " + browser + " got exception:");
    		System.out.println("\t" + ex.toString());
    	}
    }

    protected void runExperiment(String url, Hashtable<String, ArrayList<String> > store) {
    	driver.get(url);
    	// for octane, if an element with id="jit_final_result" contains text "===experiment done==="
    	new WebDriverWait(driver, maxWaitTime).until(ExpectedConditions.textToBePresentInElementLocated(By.id("jit_final_result"), "===experiment done==="));
    	System.out.println("text found in element");
    	String expResult = driver.findElement(By.id("jit_final_result")).getAttribute("innerHTML");
    	System.out.println(expResult);
    	processRecordConsoleOutput(expResult, store);
    }

    protected void processRecordConsoleOutput(String content, Hashtable<String, ArrayList<String> > store) {
	    System.out.println("start processing console output:");
	    System.out.println(content);
	    Hashtable<String, String> result = new Hashtable<String, String>();
	    if(content.indexOf("===sunspider===")>=0 || content.indexOf("===octane===")>=0) {
	        String[] lines = content.split("\n");
	        for(int i=0;i<lines.length;i++){
	            String[] cols = lines[i].split(",");
	            if(cols.length==4){
	                String bench_name = cols[0];
	                String avg_time = cols[2];
	                result.put(bench_name, avg_time);
	            }
	        }
	    } else {
	        System.out.println("!!! unknown format of console.txt");
	    }

	    addResultToStore(result, store);
	}

	protected void addResultToStore(Hashtable<String, String> result, Hashtable<String, ArrayList<String> > store) {
		for (String bench_name : result.keySet()) {
			String avg_time = result.get(bench_name);
			System.out.println("benchmark name: " + bench_name);
			System.out.println("average time: " + avg_time);
			ArrayList<String> numbers = store.get(bench_name);
			if(numbers == null) {
				numbers = new ArrayList<String>();
			}
			numbers.add(avg_time);
			store.put(bench_name, numbers);
		}
	}

	protected void generateCSV(String browser) {
		String csvContent = "";
		/*
		for (String bench_name : octaneOrigResult.keySet()) {
			ArrayList<String> orig = octaneOrigResult.get(bench_name);
			csvContent += "octane-" + browser + "-" + bench_name + ",";
			for(int i=0;i<orig.size();i++){
				csvContent += orig.get(i) + ",";
			}
			csvContent += "\r\n";
			ArrayList<String> modified = octaneModifiedResult.get(bench_name);
			csvContent += "octane-" + browser + "-" + bench_name + "-2,";
			for(int i=0;i<modified.size();i++){
				csvContent += modified.get(i) + ",";
			}
			csvContent += "\r\n";
		}
		*/

		for (String bench_name : sunspiderOrigResult.keySet()) {
			ArrayList<String> orig = sunspiderOrigResult.get(bench_name);
			csvContent += "sunspider-" + browser + "-" + bench_name + ",";
			for(int i=0;i<orig.size();i++){
				csvContent += orig.get(i) + ",";
			}
			csvContent += "\r\n";
			ArrayList<String> modified = sunspiderModifiedResult.get(bench_name + "(*)");
			csvContent += "sunspider-" + browser + "-" + bench_name + "-2,";
			for(int i=0;i<modified.size();i++){
				csvContent += modified.get(i) + ",";
			}
			csvContent += "\r\n";
		}

		PrintWriter writer = null;
		try {
			System.out.println(csvContent);
			writer = new PrintWriter("tests/jitaware/experiments/exp_output/" + browser + "-result.csv", "UTF-8");
			writer.println("result:");
			writer.println(csvContent);
		} catch (Exception exp) {
			System.out.println(exp.toString());
		} finally {
			if(writer != null) {
				writer.close();
			}
		}
	}
}
