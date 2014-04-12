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

import org.openqa.jetty.log.LogStream.STDOUT;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxBinary;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

public class ExperimentRunner {

	final String firefoxBinary = "/home/m/javascript/mozilla-central/obj-x86_64-unknown-linux-gnu/dist/firefox/firefox";
	final String jalangiFFxpi = "/home/m/research/projects/Jalangi-Berkeley/browserExtensions/jalangiFF/jalangiff.xpi";

	final String firefoxLogFile = "/tmp/firefox.out";
	final String javascriptLogFile = "/tmp/firefox_javascript.out";

	String baseUrl = "http://127.0.0.1";
	WebDriver driver;

	public static void main(String[] args) throws Exception {
		new ExperimentRunner().runAll();
	}

	private void runAll() throws Exception {
		DesiredCapabilities desiredCapabilities = DesiredCapabilities.firefox();
		LoggingPreferences loggingPreferences = new LoggingPreferences();
		loggingPreferences.enable(LogType.BROWSER, Level.ALL);
		desiredCapabilities.setCapability(CapabilityType.LOGGING_PREFS,
				loggingPreferences);
		FirefoxBinary binary = new FirefoxBinary(new File(firefoxBinary));
		FirefoxProfile profile = new FirefoxProfile();
		System.setProperty("webdriver.firefox.logfile", firefoxLogFile);
		profile.setPreference("webdriver.log.file", javascriptLogFile);
		profile.setPreference("dom.max_script_run_time", 120);
		profile.addExtension(new File(jalangiFFxpi));
		driver = new FirefoxDriver(binary, profile, desiredCapabilities);
		driver.manage().timeouts().implicitlyWait(120, TimeUnit.SECONDS);

		// testToyExample();

		testJoomla();
		testJoomlaAdmin();
//		testCmsmadesimple();
//		testMediawiki();
//		testMoodle();
//		testDokuwiki();
//		testOsclass();
//		testPhpbb();
//		testWordpress();
//		testZurmo();
//		testProcesswire();

		// trigger beforeunload event after last benchmark
		driver.get("about:blank");

		driver.quit();

		System.out.println("Done :-)");
	}

	public void testToyExample() throws Exception {
		driver.get("http://127.0.0.1:8000/tests/inconsistentType/inconsistent8.html");
	}

	public void testCmsmadesimple() throws Exception {
		driver.get(baseUrl + "/cmsmadesimple/");
		driver.findElement(By.cssSelector("a.menuactive > span")).click();
		driver.findElement(By.cssSelector("a.menuparent > span")).click();
		driver.findElement(By.linkText("Pages and navigation")).click();
		driver.findElement(By.linkText("Content")).click();
		driver.findElement(By.xpath("//div[@id='menu_vert']/ul/li[3]/a/span"))
				.click();
		driver.findElement(By.linkText("Simplex Theme")).click();
		driver.findElement(By.linkText("Default Extensions")).click();
		driver.findElement(By.cssSelector("a > span")).click();
		driver.findElement(By.linkText("here")).click();
		driver.findElement(By.id("lbusername")).clear();
		driver.findElement(By.id("lbusername")).sendKeys("user");
		driver.findElement(By.id("lbpassword")).clear();
		driver.findElement(By.id("lbpassword")).sendKeys("password");
		driver.findElement(By.name("loginsubmit")).click();
		driver.findElement(By.xpath("(//a[contains(text(),'Content')])[3]"))
				.click();
		driver.findElement(
				By.xpath("(//a[contains(text(),'Image Manager')])[2]")).click();
		driver.findElement(By.linkText("Global Content Blocks")).click();
		driver.findElement(By.linkText("File Manager")).click();
		driver.findElement(By.linkText("News")).click();
		driver.findElement(By.linkText("Logout")).click();
	}

	// empty results -- unclear why
	public void testDrupal() throws Exception {
		driver.get(baseUrl + "/drupal/");
		driver.findElement(By.linkText("Home")).click();
		driver.findElement(By.linkText("Create new account")).click();
		driver.findElement(By.linkText("Home")).click();
		driver.findElement(By.id("edit-name")).clear();
		driver.findElement(By.id("edit-name")).sendKeys("user");
		driver.findElement(By.id("edit-pass")).clear();
		driver.findElement(By.id("edit-pass")).sendKeys("password");
		driver.findElement(By.id("edit-submit")).click();
		driver.findElement(
				By.cssSelector("div.content > ul.menu.clearfix > li.first.collapsed > a"))
				.click();
		driver.findElement(By.cssSelector("span.label")).click();
		driver.findElement(By.id("edit-title-0-value")).clear();
		driver.findElement(By.id("edit-title-0-value")).sendKeys("asasas");
		driver.findElement(By.id("edit-preview")).click();
		driver.findElement(By.linkText("Home")).click();
		driver.findElement(By.xpath("(//a[contains(text(),'Log out')])[2]"))
				.click();
	}

	public void testJoomla() throws Exception {
		driver.get(baseUrl + "/joomla/");
		driver.findElement(By.linkText("Home")).click();
		driver.findElement(By.linkText("Create an account")).click();
		driver.findElement(By.linkText("Cancel")).click();
		driver.findElement(By.linkText("Forgot your username?")).click();
		driver.findElement(By.linkText("Getting Started")).click();
		driver.findElement(By.id("modlgn-username")).clear();
		driver.findElement(By.id("modlgn-username")).sendKeys("user");
		driver.findElement(By.id("modlgn-passwd")).clear();
		driver.findElement(By.id("modlgn-passwd")).sendKeys("password");
		driver.findElement(By.name("Submit")).click();

	}

	public void testJoomlaAdmin() throws Exception {
		driver.get(baseUrl + "/joomla/administrator/");
		driver.findElement(By.id("mod-login-username")).clear();
		driver.findElement(By.id("mod-login-username")).sendKeys("user");
		driver.findElement(By.id("mod-login-password")).clear();
		driver.findElement(By.id("mod-login-password")).sendKeys("password");
		driver.findElement(
				By.xpath("//form[@id='form-login']/fieldset/div[4]/div/div/button"))
				.click();
		driver.findElement(By.cssSelector("span.icon-cog")).click();
		driver.findElement(By.linkText("Logout")).click();

	}

	public void testMediawiki() throws Exception {
		driver.get(baseUrl + "/mediawiki/index.php/Main_Page");
		driver.findElement(By.linkText("Main page")).click();
		driver.findElement(By.linkText("Recent changes")).click();
		driver.findElement(By.linkText("Random page")).click();
		driver.findElement(By.linkText("Main page")).click();
		driver.findElement(By.linkText("Log in")).click();
		driver.findElement(By.id("wpName1")).clear();
		driver.findElement(By.id("wpName1")).sendKeys("user");
		driver.findElement(By.id("wpPassword1")).clear();
		driver.findElement(By.id("wpPassword1")).sendKeys("password");
		driver.findElement(By.id("wpLoginAttempt")).click();
		driver.findElement(By.linkText("Edit")).click();
		driver.findElement(By.id("wpSave")).click();
		driver.findElement(By.linkText("Preferences")).click();
		driver.findElement(By.id("preftab-editing")).click();
		driver.findElement(By.id("preftab-rendering")).click();
		driver.findElement(By.linkText("Log out")).click();
	}

	public void testMoodle() throws Exception {
		driver.get(baseUrl + "/moodle/");
		driver.findElement(By.cssSelector("#page-footer > div.logininfo > a"))
				.click();
		driver.findElement(By.id("username")).click();
		driver.findElement(By.id("username")).clear();
		driver.findElement(By.id("username")).sendKeys("user");
		driver.findElement(By.id("password")).clear();
		driver.findElement(By.id("password")).sendKeys("password");
		driver.findElement(By.id("loginbtn")).click();
		driver.findElement(By.linkText("My home")).click();
		driver.findElement(By.linkText("My courses")).click();
		driver.findElement(By.linkText("Courses")).click();
		driver.findElement(By.cssSelector("input[type=\"submit\"]")).click();
		driver.findElement(By.linkText("Create new category")).click();
		driver.findElement(By.id("id_cancel")).click();
		driver.findElement(By.linkText("Log out")).click();
	}

	// empty results -- unclear why
	public void testOwncloud() throws Exception {
		driver.get(baseUrl + "/owncloud/");
		driver.findElement(By.id("user")).click();
		driver.findElement(By.id("user")).clear();
		driver.findElement(By.id("user")).sendKeys("user");
		driver.findElement(
				By.cssSelector("p.infield.groupbottom > label.infield"))
				.click();
		driver.findElement(By.id("password")).click();
		driver.findElement(By.id("password")).clear();
		driver.findElement(By.id("password")).sendKeys("password");
		driver.findElement(By.id("submit")).click();
		// ERROR: Caught exception [ERROR: Unsupported command [selectWindow |
		// name=dir | ]]
		driver.findElement(By.xpath("//ul[@id='apps']/div/li[2]/a/img"))
				.click();
		// ERROR: Caught exception [ERROR: Unsupported command [selectWindow |
		// name=dir | ]]
		driver.findElement(By.xpath("//ul[@id='apps']/div/li[3]/a/img"))
				.click();
		// ERROR: Caught exception [ERROR: Unsupported command [selectWindow |
		// name=dir | ]]
		driver.findElement(By.xpath("//ul[@id='apps']/div/li[4]/a/img"))
				.click();
		// ERROR: Caught exception [ERROR: Unsupported command [selectWindow |
		// name=dir | ]]
		driver.findElement(By.xpath("//ul[@id='apps']/div/li[5]/a/img"))
				.click();
		// ERROR: Caught exception [ERROR: Unsupported command [selectWindow |
		// name=dir | ]]
		driver.findElement(By.xpath("//ul[@id='apps']/div/li[6]/a/img"))
				.click();
		// ERROR: Caught exception [ERROR: Unsupported command [selectWindow |
		// name=dir | ]]
		driver.findElement(By.cssSelector("#expand > img.svg")).click();
		// ERROR: Caught exception [ERROR: Unsupported command [selectWindow |
		// name=dir | ]]
		// driver.findElement(By.id("logout")).click();
	}

	public void testDokuwiki() throws Exception {
		driver.get(baseUrl + "/dokuwiki/doku.php");
		driver.findElement(By.cssSelector("div.trace")).click();
		driver.findElement(By.cssSelector("img")).click();
		driver.findElement(By.linkText("Recent changes")).click();
		driver.findElement(By.linkText("Media Manager")).click();
		driver.findElement(By.linkText("Sitemap")).click();
		driver.findElement(By.linkText("Login")).click();
		driver.findElement(By.id("focus__this")).click();
		driver.findElement(By.id("focus__this")).clear();
		driver.findElement(By.id("focus__this")).sendKeys("user");
		driver.findElement(By.name("p")).clear();
		driver.findElement(By.name("p")).sendKeys("password");
		driver.findElement(By.cssSelector("fieldset > input.button")).click();
		driver.findElement(By.linkText("Update Profile")).click();
		driver.findElement(By.linkText("Admin")).click();
		driver.findElement(By.linkText("User Manager")).click();
		driver.findElement(By.linkText("Admin")).click();
		driver.findElement(By.linkText("Access Control List Management"))
				.click();
		driver.findElement(By.linkText("Admin")).click();
		driver.findElement(By.linkText("Manage Plugins")).click();
		driver.findElement(By.linkText("Admin")).click();
		driver.findElement(By.linkText("Configuration Settings")).click();
		driver.findElement(By.linkText("Admin")).click();
		driver.findElement(By.linkText("Logout")).click();
	}

	public void testOsclass() throws Exception {
		driver.get(baseUrl + "/osclass/");
		driver.findElement(By.cssSelector("img[alt=\"Sample Web Page\"]"))
				.click();
		driver.findElement(By.linkText("Animals")).click();
		driver.findElement(By.linkText("Example Ad")).click();
		driver.findElement(By.id("login_open")).click();
		driver.findElement(By.id("email")).clear();
		driver.findElement(By.id("email")).sendKeys("user");
		driver.findElement(By.id("password")).clear();
		driver.findElement(By.id("password")).sendKeys("password");
		driver.findElement(By.xpath("//button[@type='submit']")).click();
		driver.findElement(By.cssSelector("div.actions > a")).click();
	}

	public void testPhpbb() throws Exception {
		driver.get(baseUrl + "/phpbb/");
		driver.findElement(By.linkText("FAQ")).click();
		driver.findElement(By.linkText("Why do I need to register at all?"))
				.click();
		driver.findElement(By.xpath("(//a[contains(text(),'Top')])[2]"))
				.click();
		driver.findElement(By.cssSelector("img")).click();
		driver.findElement(By.linkText("Your first forum")).click();
		driver.findElement(By.linkText("Welcome to phpBB3")).click();
		driver.findElement(By.cssSelector("dt > a.username-coloured")).click();
		driver.findElement(By.linkText("Login")).click();
		driver.findElement(By.id("username")).clear();
		driver.findElement(By.id("username")).sendKeys("user");
		driver.findElement(By.id("password")).clear();
		driver.findElement(By.id("password")).sendKeys("password");
		driver.findElement(By.name("login")).click();
		driver.findElement(By.linkText("View your posts")).click();
		driver.findElement(By.linkText("Logout [ user ]")).click();
	}

	public void testWordpress() throws Exception {
		driver.get(baseUrl + "/wordpress/");
		driver.findElement(By.linkText("Hello world!")).click();
		driver.findElement(By.linkText("Log in")).click();
		driver.findElement(By.id("user_login")).clear();
		driver.findElement(By.id("user_login")).sendKeys("user");
		driver.findElement(By.id("user_pass")).clear();
		driver.findElement(By.id("user_pass")).sendKeys("password");
		driver.findElement(By.id("wp-submit")).click();
		driver.findElement(
				By.cssSelector("#wp-admin-bar-new-content > a.ab-item > span.ab-label"))
				.click();
		driver.findElement(By.linkText("Howdy, user")).click();
	}

	// triggers some Jalangi bug
	public void testRoundcube() throws Exception {
		driver.get(baseUrl + "/roundcube/?_task=logout");
		driver.findElement(By.id("rcmloginuser")).clear();
		driver.findElement(By.id("rcmloginuser")).sendKeys("reelnaheemji");
		driver.findElement(By.id("rcmloginpwd")).clear();
		driver.findElement(By.id("rcmloginpwd")).sendKeys("ijmeehanleer");
		driver.findElement(By.cssSelector("input.button.mainaction")).click();
		driver.findElement(By.cssSelector("span.button-inner")).click();
		driver.findElement(By.cssSelector("#rcmbtn103 > span.button-inner"))
				.click();
		driver.findElement(By.id("rcmbtn101")).click();
	}

	public void testZurmo() throws Exception {
		driver.get(baseUrl + "/zurmo/app/index.php/zurmo/default/login");
		driver.findElement(By.id("LoginForm_username")).clear();
		driver.findElement(By.id("LoginForm_username")).sendKeys("user");
		driver.findElement(By.id("LoginForm_password")).clear();
		driver.findElement(By.id("LoginForm_password")).sendKeys("password");
		// remainder doesn't work with Jalangi-instrumented page -- unclear why
		// driver.findElement(By.cssSelector(".z-label")).click();
		// driver.findElement(By.xpath("//li[@id='mashableInbox']/a/span[2]"))
		// .click();
		// driver.findElement(By.xpath("//li[@id='accounts']/a/span[2]")).click();
		// driver.findElement(By.xpath("//li[@id='leads']/a/span[2]")).click();
		// driver.findElement(By.xpath("//li[@id='contacts']/a/span[2]")).click();
		// driver.findElement(By.xpath("//li[@id='opportunities']/a/span[2]"))
		// .click();
		// driver.findElement(By.linkText("user")).click();
		// driver.findElement(By.linkText("Sign out")).click();
	}

	public void testProcesswire() throws Exception {
		driver.get(baseUrl + "/processwire/");
		driver.get(baseUrl + "/processwire/about/");
		driver.get(baseUrl + "/processwire/templates/");
		driver.get(baseUrl + "/processwire/site-map/");
	}
}
