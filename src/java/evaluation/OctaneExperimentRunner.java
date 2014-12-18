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

// Author: Michael Pradel

package evaluation;

import java.io.File;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxBinary;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class OctaneExperimentRunner {

	final String firefoxBinary = "/home/m/javascript/instrumenting_firefox_20141212_off-thread_comp_disabled/firefox";
	final String jalangiFFxpi = "thirdparty/jalangiFF.xpi";
	
	final String firefoxLogFile = "/tmp/firefox.out";
	final String javascriptLogFile = "/tmp/firefox_javascript.out";

	String baseUrl = "http://127.0.0.1:8000/tests/octane2/";
	WebDriver driver;
	int maxWaitTime = 30*60;

	public static void main(String[] args) throws Exception {
		assert(args.length == 1);
		new OctaneExperimentRunner().run(args[0]);
	}

	private void run(String benchmark) throws Exception {
		DesiredCapabilities desiredCapabilities = DesiredCapabilities.firefox();
		LoggingPreferences loggingPreferences = new LoggingPreferences();
		loggingPreferences.enable(LogType.BROWSER, Level.ALL);
		desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS,
				loggingPreferences);
		FirefoxBinary binary = new FirefoxBinary(new File(firefoxBinary));
		FirefoxProfile profile = new FirefoxProfile();
		System.setProperty("webdriver.firefox.logfile", firefoxLogFile);
		profile.setPreference("webdriver.log.file", javascriptLogFile);
		profile.setPreference("dom.max_script_run_time", maxWaitTime);
		profile.setPreference("extensions.sdk.console.logLevel", "info");
		profile.addExtension(new File(jalangiFFxpi));
		driver = new FirefoxDriver(binary, profile, desiredCapabilities);
		driver.manage().timeouts().implicitlyWait(120, TimeUnit.SECONDS);

		testBenchmark(benchmark);

		driver.quit();
		System.out.println("Done :-)");
	}

	private String endExecCode = "if (J$ && J$.analysis) J$.analysis.endExecution();";
	
	public void testBenchmark(String benchmark) throws Exception {
		driver.get(baseUrl+"index_"+benchmark+".html?auto=1");
		(new WebDriverWait(driver, maxWaitTime)).until(ExpectedConditions.textToBePresentInElementLocated(By.id("main-banner"), "Score"));

		System.out.println("Ending execution...");
		JavascriptExecutor jse = (JavascriptExecutor) driver;
		try {
			jse.executeScript(endExecCode, "");
		} catch (Exception ex) {
			System.out.println("!!!exception occurred, analysis.json file is not generated.");
			System.out.println(ex);
		}

		System.out.println("Will sleep a bit..");
		try {
			Thread.sleep(5000);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}

	}
	
}
