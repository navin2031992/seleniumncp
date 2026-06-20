# Agent Test Prompts — Selenium MCP Automation

> **How to use this file:**
> Open VS Code in `c:\NewInitiatives\seleniummcp`. For each agent below:
> 1. Click the Roo Code mode selector at the bottom of VS Code
> 2. Switch to the named agent
> 3. Copy-paste the **Test Prompt** exactly as written
> 4. Observe the expected behaviour described under **What to Expect**

---

## Verification Status (run `node verify-setup.js` to regenerate)

| Check | Result |
|-------|--------|
| @angiejones/mcp-selenium v0.2.3 | ✅ PASS |
| selenium-webdriver v4.44.0 | ✅ PASS |
| selenium-manager (auto Edge driver) | ✅ PASS |
| .mcp.json — selenium only, no Jira | ✅ PASS |
| SELENIUM_BROWSER = edge | ✅ PASS |
| All 8 agents in .roomodes | ✅ PASS |
| All 8 rule files present | ✅ PASS |
| Edge browser launch | ✅ PASS |
| Navigate to URL | ✅ PASS |
| Find element on page | ✅ PASS |
| Get page title | ✅ PASS |
| Screenshot captured | ✅ PASS |
| Browser quit cleanly | ✅ PASS |

**Last verified:** 2026-06-03 — ALL 14 CHECKS PASSED

---

## Agent 1 — 🔬 Framework Analyzer

**Mode slug:** `framework-analyzer`

**What it does:** Scans any existing test project and writes `.roo/framework-profile.json` — the shared memory that all other agents rely on.

### Test Prompt A — scan a Java Maven project

```
Scan the test project at C:\SeleniumTest and identify the test framework, language, folder structure, run command, and naming conventions. Write the results to .roo/framework-profile.json.
```

### Test Prompt B — scan this project itself (no external test project needed)

```
Scan the project at c:\NewInitiatives\seleniummcp. Identify any test files, configuration patterns, and folder conventions. Write your findings to .roo/framework-profile.json even if this is a pure infrastructure project with no test code — note it as framework-type: "mcp-infrastructure".
```

### What to Expect

- Agent reads files in the target folder
- Writes (or updates) `.roo/framework-profile.json`
- Reports: language, testFramework, runCommand, folder structure, naming patterns
- If no tests are found, it says so clearly rather than guessing

---

## Agent 2 — 🔄 BDD Converter

**Mode slug:** `bdd-converter`

**What it does:** Reads the framework profile → scans all existing test files → converts every
test file to Gherkin `.feature` files + step definitions + Page Objects + updated config and
dependencies. Always runs AFTER Framework Analyzer. Never deletes originals.

---

### Prompt A — Convert full project to Playwright BDD (TypeScript)

Use when: your project is already JavaScript/TypeScript (plain Playwright, Jest, Mocha, Cypress)
and you want to migrate to Gherkin-style BDD using `playwright-bdd`.

```
I want to convert this entire project to Playwright BDD.

Read .roo/framework-profile.json first to understand the current framework and folder structure.

Target stack:
  - playwright-bdd (latest)
  - @playwright/test (latest)
  - @cucumber/cucumber 10.x
  - TypeScript

Conversion rules:
  - Each test file → one .feature file under features/{domain}/
  - describe() block → Feature:
  - it() / test() block → Scenario:
  - beforeEach() with navigation → Background:
  - Parameterised / data-driven tests → Scenario Outline: with Examples: table
  - Repeated step text across scenarios → extract to steps/common.steps.ts (one definition only)
  - All step definitions → steps/{feature}.steps.ts using createBdd(test)
  - All Page Objects → pages/{Page}Page.ts using Playwright page.fill / page.click / page.locator
  - Wire all Page Objects → fixtures/pages.fixture.ts using test.extend<{}>

Config files to write:
  - playwright.config.ts  (add defineBddConfig, set features + steps paths)
  - cucumber.config.ts    (tags, format: html + json + junit)
  - tsconfig.json         (update if needed for new paths)
  - package.json          (add scripts: bdd:gen, test, test:smoke, test:regression, test:headed)

After conversion:
  - Update .roo/framework-profile.json → bdd: true, bddDialect: cucumber,
    runCommand: "bddgen && playwright test",
    runSmoke: "bddgen && playwright test --grep @smoke",
    runRegression: "bddgen && playwright test --grep @regression"
  - Write full migration report → tests/reports/bdd-migration-report.md
  - Do NOT delete original test files

For any locator, check tests/locators/*.locators.json first.
If no locator file exists for a page, extract selectors from the source test and mark them ⚠️ unvalidated.
```

---

### Prompt B — Convert full project to Selenium BDD — Java / Cucumber-JVM

Use when: your project is a Java Selenium project using JUnit, TestNG, or plain WebDriver tests.

```
I want to convert this entire project to Selenium BDD using Cucumber-JVM.

Read .roo/framework-profile.json first.

Target stack:
  - Cucumber-JVM 7.x (cucumber-java + cucumber-testng)
  - cucumber-picocontainer (for dependency injection between step classes)
  - Selenium WebDriver (keep existing version)
  - TestNG (keep existing version)
  - Java (keep existing version)

Conversion rules:
  - Each *Test.java file → one .feature file under src/test/resources/features/
  - Each @Test method → Scenario:
  - @BeforeMethod / @Before with navigation → Background:
  - Parameterised @DataProvider tests → Scenario Outline: with Examples: table
  - Repeated Gherkin step text → single @Given/@When/@Then in CommonSteps.java
  - Step definitions → src/test/java/{basePackage}/steps/{Feature}Steps.java
  - Each Page Object → review existing, update constructor to accept WebDriver, keep @FindBy locators
  - Create CucumberRunner.java → src/test/java/{basePackage}/runners/CucumberRunner.java
    (use @CucumberOptions: features, glue, plugin = pretty + html + json + junit)
  - Create DriverManager.java → src/test/java/{basePackage}/utils/DriverManager.java
    (ThreadLocal<WebDriver> for parallel execution safety)

pom.xml additions:
  - io.cucumber:cucumber-java:7.14.0
  - io.cucumber:cucumber-testng:7.14.0
  - io.cucumber:cucumber-picocontainer:7.14.0
  - maven-surefire-plugin configured to run CucumberRunner

After conversion:
  - Update .roo/framework-profile.json → bdd: true, bddDialect: cucumber,
    runCommand: "mvn test",
    runSmoke: "mvn test -Dcucumber.filter.tags=@smoke",
    runRegression: "mvn test -Dcucumber.filter.tags=@regression"
  - Write migration report → tests/reports/bdd-migration-report.md
  - Do NOT delete original test files
```

---

### Prompt C — Convert full project to Selenium BDD — Python / behave

Use when: your project is a Python Selenium project using pytest or unittest.

```
I want to convert this entire project to Selenium BDD using behave.

Read .roo/framework-profile.json first.

Target stack:
  - behave 1.2.6
  - selenium 4.x (keep existing version)
  - webdriver-manager 4.x (auto driver download)
  - Python (keep existing version)

Conversion rules:
  - Each test_*.py / *_test.py file → one .feature file under features/
  - Each test function / pytest test → Scenario:
  - Shared setup (fixtures / conftest) → features/environment.py before_scenario hook
  - @pytest.mark.parametrize → Scenario Outline: with Examples: table
  - Repeated step text → single @given/@when/@then in features/steps/common_steps.py
  - Step definitions → features/steps/{feature}_steps.py
  - Page Objects → features/pages/{page}_page.py (update method signatures if needed)

Write features/environment.py:
  - before_scenario: create Edge WebDriver (headless if SELENIUM_HEADLESS=true env var)
  - after_scenario: driver.quit()
  - before_all: read config/environments.json for base_url

requirements.txt additions:
  - behave==1.2.6
  - selenium==4.20.0
  - webdriver-manager==4.0.1

After conversion:
  - Update .roo/framework-profile.json → bdd: true, bddDialect: behave,
    runCommand: "behave",
    runSmoke: "behave --tags=smoke",
    runRegression: "behave --tags=regression",
    runSingle: "behave features/{feature}.feature"
  - Write migration report → tests/reports/bdd-migration-report.md
  - Do NOT delete original test files
```

---

### Prompt D — Convert full project to Selenium BDD — JavaScript / cucumber-js

Use when: your project is Node.js using WebdriverIO, plain selenium-webdriver, or Mocha+Selenium.

```
I want to convert this entire project to Selenium BDD using cucumber-js and selenium-webdriver.

Read .roo/framework-profile.json first.

Target stack:
  - @cucumber/cucumber 10.x
  - selenium-webdriver 4.x
  - @types/selenium-webdriver (if TypeScript)
  - Node.js (keep existing version)

Conversion rules:
  - Each *.test.js / *.spec.js file → one .feature file under features/
  - describe() → Feature:, it() → Scenario:, before() with navigation → Background:
  - Data-driven tests (forEach / test.each) → Scenario Outline: with Examples: table
  - Shared steps → step-definitions/common.steps.js
  - Step definitions → step-definitions/{feature}.steps.js
  - Page Objects → pages/{Page}Page.js (update to use selenium-webdriver By / until)

Write cucumber.json:
  {
    "default": {
      "paths": ["features/**/*.feature"],
      "require": ["step-definitions/**/*.steps.js"],
      "format": ["progress-bar", "html:tests/reports/cucumber-report.html",
                 "json:tests/reports/cucumber-report.json"],
      "tags": "not @skip"
    }
  }

package.json script additions:
  "test":           "cucumber-js",
  "test:smoke":     "cucumber-js --tags @smoke",
  "test:regression":"cucumber-js --tags @regression",
  "test:dry":       "cucumber-js --dry-run"

package.json dependency additions:
  "@cucumber/cucumber": "^10.0.0",
  "selenium-webdriver": "^4.20.0"

After conversion:
  - Update .roo/framework-profile.json → bdd: true, bddDialect: cucumber,
    runCommand: "npx cucumber-js",
    runSmoke: "npx cucumber-js --tags @smoke",
    runRegression: "npx cucumber-js --tags @regression"
  - Write migration report → tests/reports/bdd-migration-report.md
  - Do NOT delete original test files
```

---

### Prompt E — Convert a SINGLE test file (quick demo / partial migration)

Use when: you want to test the conversion on one file before committing to the full project.

```
Convert only this single test file to Playwright BDD. Do not touch any other files.

Source file: tests/login.spec.ts

Steps:
  1. Read .roo/framework-profile.json
  2. Read the source file fully
  3. Convert to: features/login/Login.feature (Gherkin)
  4. Write step definitions: steps/login.steps.ts
  5. Write or update Page Object: pages/LoginPage.ts
  6. Add LoginPage to fixtures/pages.fixture.ts (create the file if it does not exist)
  7. Do NOT modify playwright.config.ts or package.json yet
  8. Show me a side-by-side summary:
       Original test | Equivalent Gherkin scenario
     for each it() / test() block
  9. Write migration note to tests/reports/login-migration-preview.md

Do NOT delete the original file.
```

---

### Prompt F — Convert FROM Cypress to Playwright BDD

Use when: migrating a Cypress project to Playwright BDD.

```
Convert this Cypress project to Playwright BDD.

Read .roo/framework-profile.json first (should show testFramework: cypress).

Cypress → Playwright BDD mapping to apply:
  - cy.visit('/path')                 → await page.goto('/path')          → Given I am on the {page} page
  - cy.get('selector')                → page.locator('selector')          → (used inside When/Then steps)
  - cy.get('sel').type('text')        → await page.fill('sel', 'text')    → When I enter "{text}" in the {field}
  - cy.get('sel').click()             → await page.click('sel')           → When I click the {element}
  - cy.get('sel').should('contain')   → expect(locator).toContainText()   → Then I see "{text}"
  - cy.intercept() / cy.wait()        → page.waitForResponse() / route()  → (handle in Background or Before hook)
  - cy.fixture('file')                → read from tests/fixtures/         → (pass via test data table)
  - Cypress.env('VAR')                → process.env.VAR                   → (update all env var refs)
  - beforeEach(() => cy.visit())      → Background: Given I am on the page
  - cy.screenshot()                   → await page.screenshot()           → (add to After hook for failures)

For each cypress/e2e/*.cy.ts file:
  1. Convert to features/{domain}/{Feature}.feature
  2. Write steps/{feature}.steps.ts
  3. Write pages/{Page}Page.ts (Playwright style)
  4. Handle cy.intercept → note as ⚠️ network mock — review manually

Write playwright.config.ts, cucumber.config.ts, package.json.
Remove cypress.config.ts reference from config only after user confirms.
Write migration report → tests/reports/bdd-migration-report.md.
```

---

### Prompt G — Dry run / preview only (no files written)

Use when: you want to see the conversion plan and Gherkin output BEFORE any files are created.

```
Do a DRY RUN of the BDD conversion for this project. Do NOT write any files.

Read .roo/framework-profile.json.
Scan all test files.

For each test file, show me:
  1. The file path
  2. How many Scenarios it will produce
  3. The Feature name and all Scenario titles (as they will appear in the .feature file)
  4. Which Page Objects will be created or updated
  5. Which locator file (tests/locators/*.locators.json) will be used — or ⚠️ if none exists

At the end, show:
  - Total files to create
  - Total scenarios
  - Files with ⚠️ unvalidated locators (need XPath Discovery before migration)
  - Shared steps that will go into common.steps
  - Estimated new run command

Do NOT write any files. Show only the preview.
```

---

### Prompt H — Verify migration after conversion (run new BDD suite)

Use when: BDD conversion is complete and you want to confirm the new tests actually execute.

```
The BDD conversion is complete. Verify it works end to end.

Steps:
  1. Read .roo/framework-profile.json — confirm bdd: true and new runCommand
  2. Run: npm install   (or mvn install / pip install -r requirements.txt — match the language)
  3. For Playwright BDD: run bddgen first to generate test files from feature files
     Command: npx bddgen
     Confirm: .playwright-bdd/ folder is created with generated spec files
  4. Run smoke suite only first (faster feedback):
     Command: {profile.runSmoke}
  5. Report results:
     - How many scenarios ran
     - How many passed / failed
     - For failures: show the step that failed, the selector used, and a screenshot
  6. If all smoke tests pass → run full regression:
     Command: {profile.runRegression}
  7. Write verification report → tests/reports/bdd-verification-report.md

If any test fails due to a selector error → switch to 🔧 Test Maintenance to heal it.
If any test fails due to a missing step definition → show me the step text and I will implement it.
```

---

### Prompt I — Sprint-specific partial conversion (convert only tests for one sprint's tickets)

Use when: you want BDD only for new sprint tickets, keeping old tests as-is.

```
Convert ONLY the test files that belong to Sprint 5 tickets to Playwright BDD.
Leave all other existing test files unchanged.

Sprint 5 tickets:
  PROJ-101 | Login Feature        | test file: tests/login.spec.ts
  PROJ-102 | Cart Bug             | test file: tests/cart.spec.ts
  PROJ-103 | Profile Edit         | test file: tests/profile.spec.ts

For each of these three files ONLY:
  1. Convert to features/{domain}/{Feature}.feature
  2. Write steps/{feature}.steps.ts
  3. Write or update pages/{Page}Page.ts
  4. Add @jira PROJ-XXX tag to every Scenario in the feature file

Do NOT convert any other test files.
Do NOT modify playwright.config.ts or package.json yet — wait until I confirm these three pass.
Write a focused report → tests/reports/sprint5-bdd-preview.md showing only these conversions.
```

---

### Prompt J — Existing BDD project: dialect upgrade (Cucumber 4 → Cucumber 10)

Use when: the project already uses BDD but with an old Cucumber version.

```
This project already uses Cucumber BDD but is on an old version (check pom.xml or package.json).
Upgrade the entire BDD stack to the latest versions without changing any feature files.

Read .roo/framework-profile.json first.

Steps:
  1. Identify current Cucumber version from pom.xml / package.json
  2. List all breaking changes between the current version and Cucumber 10.x that affect this project
  3. Update dependency versions in pom.xml / package.json
  4. Update CucumberRunner / cucumber.json config syntax if it changed between versions
  5. Update any deprecated step definition annotations:
       Old @cucumber/cucumber 4-7: defineStep, Before, After (default imports)
       New @cucumber/cucumber 10+: same but check world type changes
  6. Check for any deprecated hook syntax and update
  7. Run: {profile.runSmoke} to verify upgrade did not break anything
  8. Write upgrade report → tests/reports/cucumber-upgrade-report.md

Do NOT change any .feature files or step definition logic — only versions and config.
```

---

### What to Expect from All Prompts

| Behaviour | Detail |
|-----------|--------|
| Framework profile read first | Always — stops with clear error if missing |
| Inventory shown before writing | Agent lists all files it will create before touching anything |
| One file at a time | You see each `.feature`, step def, and POM written sequentially |
| Gherkin mapping rule | `describe` → Feature, `it/test` → Scenario, `beforeEach` with nav → Background, parameterised → Scenario Outline |
| Common steps extracted | Any step text used in 2+ scenarios → single definition in `common.steps` |
| Locator source priority | `tests/locators/*.locators.json` first → then source test file → flag ⚠️ if neither |
| Config files updated | `playwright.config.ts` / `pom.xml` / `requirements.txt` / `package.json` as appropriate |
| `framework-profile.json` updated | `bdd: true` set at the end so Jira Test Creator generates BDD output from this point |
| Migration report written | `tests/reports/bdd-migration-report.md` — file inventory, ⚠️ warnings, next steps |
| Originals never deleted | You delete them manually after verifying the BDD suite passes |

### Troubleshooting Prompts

**If step definitions are not found at runtime:**
```
My BDD tests are failing with "Undefined step" errors. The step text in the feature file does
not match any step definition. Show me:
  1. The exact unmatched step text
  2. The closest existing step definition that almost matches
  3. Whether the mismatch is a wording issue or a missing step entirely
  4. The corrected step definition or the corrected Gherkin wording — whichever needs to change
```

**If bddgen produces no output files:**
```
Running "npx bddgen" produces no files in .playwright-bdd/. Diagnose:
  1. Read playwright.config.ts — confirm defineBddConfig paths for features and steps
  2. Check that features/*.feature files exist and are valid Gherkin
  3. Check that steps/*.steps.ts files export Given/When/Then from createBdd(test)
  4. Check that fixtures/pages.fixture.ts exports a test object that extends playwright-bdd base
  5. Show me exactly which config line is wrong and the corrected version
```

**If a scenario fails with "Element not found" after migration:**
```
This BDD scenario is failing: "{Scenario title}" in features/{Feature}.feature
Error: Element not found — selector: {selector}

The selector came from the original test file, not from a live browser validation.
Switch to 🔍 XPath Discovery and discover the correct selector for this element on:
  URL: {page URL}
Then update the Page Object method {PageName}.{methodName}() with the correct selector.
```

---

## Agent 3 — 🎫 Jira Test Creator  *(browser-driven)*

**Mode slug:** `jira-test-creator`

**What it does:** Reads a Jira ticket → opens Edge → walks through every scenario LIVE in the
browser → captures real validated selectors and real assertion text → THEN generates tests.
No selector is ever assumed or invented.

### Test Prompt A — single ticket (with URL)

```
Generate tests for this ticket:

Ticket: DEMO-101
Summary: User Login — Email and Password
Type: Story | Priority: High
URL: https://the-internet.herokuapp.com/login

Acceptance Criteria:
1. A registered user can log in with a valid email and password and is redirected to the dashboard
2. An unregistered email shows the error "Email not found"
3. A wrong password shows the error "Invalid password"
4. Both fields empty shows validation errors on each field
5. The login button is disabled while the form is submitting

Framework profile: JavaScript + Playwright. Test files in tests/specs/. Use describe/it blocks. Assertions use expect().
```

### Test Prompt B — sprint batch (uses Jira integration)

```
Generate tests for all Story and Bug tickets in Sprint 5 on Jira board DEMO.
Read .roo/framework-profile.json first.
For each ticket: open Edge, walk through every scenario live, capture all selectors and
assertion text from the browser, then generate the test file. Do not invent any selectors.
```

### What to Expect

- Agent reads `.roo/framework-profile.json` first (stops if missing — run Framework Analyzer first)
- **Edge browser opens** for every ticket — you will see it navigate to the page
- Agent walks through each scenario step by step, interacting with the real UI
- Captures the real selector for every element it interacts with (validated live)
- Captures the real error/success text from the DOM (no guessing)
- Writes `tests/locators/{PageName}.locators.json` before generating any test code
- Generates test file using ONLY the validated selectors and real assertion strings
- Reports: browser walkthrough complete, N selectors captured, N assertions captured, files created

---

## Agent 4 — 🔍 XPath Discovery

**Mode slug:** `xpath-discovery`

**What it does:** Opens Edge, navigates to your app, discovers and validates element locators, writes `tests/locators/{PageName}.locators.json`.

### Test Prompt A — discover locators on a public page

```
Discover all interactive element locators on https://example.com. Navigate to the page using Selenium, find every clickable and form element, validate each selector, and save results to tests/locators/ExamplePage.locators.json.
```

### Test Prompt B — discover login page locators

```
Open Edge and navigate to https://the-internet.herokuapp.com/login. Discover all interactive elements on the page — username field, password field, login button, and any error messages. Validate each selector by finding it in the live DOM. Save to tests/locators/HerokuLoginPage.locators.json.
```

### What to Expect

- Edge browser opens visibly
- Agent navigates to the URL
- Finds all input, button, link, and form elements
- Tests each selector to confirm it's valid
- Flags any fragile selectors (dynamic IDs, position-based XPath)
- Writes `tests/locators/{PageName}.locators.json` with primary + fallback selectors
- Edge closes cleanly after discovery

---

## Agent 5 — ▶️ Test Runner

**Mode slug:** `test-runner`

**What it does:** Executes your test suite using the framework's run command, captures screenshots on failure, retries flaky tests, writes JSON/HTML reports.

### Test Prompt A — smoke run

```
Read .roo/framework-profile.json to get the run command, then run the smoke test suite on the dev environment. Capture a screenshot if any test fails. Write a JSON and HTML report to tests/reports/.
```

### Test Prompt B — run a specific test file via Selenium MCP

```
Open Edge using Selenium MCP and manually run through the login flow at https://the-internet.herokuapp.com/login:
1. Find the username field and type "tomsmith"
2. Find the password field and type "SuperSecretPassword!"
3. Click the login button
4. Verify the success message "You logged into a secure area!" is visible
5. Take a screenshot of the result
6. Report PASS or FAIL with the screenshot path

Save the execution report to tests/reports/manual-login-run.json.
```

### What to Expect

- Edge opens and performs each step
- Screenshots saved to `tests/screenshots/failures/` on failure, or captured per step if requested
- Execution report written with: step name, status, duration, screenshot path
- Browser closes after run
- Console output shows PASS/FAIL per step

---

## Agent 6 — 🔧 Test Maintenance

**Mode slug:** `test-maintenance`

**What it does:** Diagnoses broken tests, re-discovers changed elements on live pages via Selenium/Edge, patches test files in the project's style.

### Test Prompt A — heal a broken selector

```
The following test is failing because the selector is broken. Diagnose it using Selenium MCP (open Edge, navigate to the page, inspect the DOM), find the correct selector, and patch the locator registry.

Failing locator:
- Page: https://the-internet.herokuapp.com/login
- Element: loginButton
- Broken selector: css="#loginBtn"   ← element not found

Open the page in Edge, find the actual login button selector, validate it, and update tests/locators/HerokuLoginPage.locators.json.
```

### Test Prompt B — diagnose and log a UI change

```
The test for https://example.com is failing. The h1 text assertion expects "Example Domain" but the test is reporting the element is not found. 
Open Edge, navigate to the page, check whether the h1 element exists, get its actual text, and log the diagnosis to tests/maintenance-log.md.
```

### What to Expect

- Edge opens and navigates to the failing page
- Agent inspects DOM to find the element (or confirm it's gone)
- Identifies the correct selector
- Updates the locator registry JSON
- Logs: old selector, new selector, root cause, timestamp → `tests/maintenance-log.md`
- Verifies the fix with a live browser check before marking resolved

---

## Agent 7 — 🔄 Pipeline Orchestrator

**Mode slug:** `pipeline-orchestrator`

**What it does:** Runs the full end-to-end quality pipeline: framework analysis → ticket intake → locator discovery → test generation → execution → maintenance → report.

### Test Prompt A — mini pipeline (no real test project needed)

```
Run a mini pipeline for these 2 demo tickets:

Tickets:
  DEMO-101 | Story | High | User Login with email and password
  DEMO-102 | Bug   | P0   | Cart total shows wrong currency symbol

Target URL for locator discovery: https://the-internet.herokuapp.com/login

Steps to run:
  Stage 0: Check if .roo/framework-profile.json exists (skip Framework Analyzer — profile already written)
  Stage 2: Discover locators for https://the-internet.herokuapp.com/login → tests/locators/HerokuLoginPage.locators.json
  Stage 3: Generate test stubs for DEMO-101 and DEMO-102 (JavaScript + describe/it style)
  Stage 6: Write pipeline summary to tests/reports/demo-pipeline-summary.md

Skip Stage 4 (execution) and Stage 5 (maintenance) for this demo run.
```

### Test Prompt B — full sprint pipeline (uses Jira)

```
Run the full pipeline for Sprint 5 on Jira board DEMO:
- Stage 0: Check framework profile
- Stage 1: Fetch all Story and Bug tickets from Sprint 5
- Stage 2: Discover locators for all pages referenced in tickets
- Stage 3: Generate tests for each ticket
- Stage 4: Execute smoke suite
- Stage 5: Heal any failures
- Stage 6: Write executive summary to tests/reports/sprint-5-pipeline-summary.md
```

### What to Expect

- Agent tracks state in `tests/pipeline-state.json` — each stage updates to "in_progress" then "completed"
- Edge opens during Stage 2 (locator discovery) and Stage 4 (execution)
- If a stage fails it logs the error and can resume from that stage
- Final output: `tests/reports/{date}/pipeline-summary.md` with pass rate, files created, quality gate result

---

## Agent 8 — 📊 Test Gap Analyzer

**Mode slug:** `test-gap-analyzer`

**What it does:** Cross-references your Jira tickets against existing test files, produces a prioritized gap report.

### Test Prompt A — gap analysis on a demo ticket list

```
Analyze test coverage for these tickets. Check if any test files in the tests/ folder reference each ticket key via @jira or TICKET-ID comments.

Tickets to check:
  DEMO-101 | Story | High   | User Login
  DEMO-102 | Bug   | P0     | Cart total currency bug
  DEMO-103 | Story | Medium | User Profile Edit
  DEMO-104 | Bug   | High   | Password reset email not sent
  DEMO-105 | Task  | Low    | Update footer links

Scan tests/ recursively for @jira DEMO-xxx references.
Write gap report to tests/reports/test-gap-analysis-demo.md and tests/reports/test-gap-analysis-demo.json.
```

### Test Prompt B — sprint gap analysis (uses Jira)

```
Fetch all Story and Bug tickets from Sprint 5 on Jira board DEMO. Scan test files in the project for @jira references. Report:
- Which tickets have no tests (sorted by priority)
- Which tickets have partial coverage (fewer tests than acceptance criteria)
- Which bugs have no regression test
- Any orphaned test files with no matching ticket

Write the gap report to tests/reports/test-gap-analysis-sprint5.md.
```

### What to Expect

- Agent scans test files for `@jira TICKET-ID` patterns
- Builds a coverage map: ticket → test files
- Categories: no-test, partial-coverage, orphaned-test, bug-no-regression
- Sorts by risk: P0 gaps first
- Writes readable `.md` + machine-readable `.json` report
- Recommends which agent to run next (usually Jira Test Creator)

---

## Agent 9 — 📦 Test Data Manager

**Mode slug:** `test-data-manager`

**What it does:** Scans test files for hardcoded values → extracts to `tests/fixtures/*.json` → replaces inline values with fixture references.

### Test Prompt A — extract hardcoded data from a demo test snippet

```
The following test file has hardcoded test data. Extract all hardcoded values to tests/fixtures/login-fixtures.json and show me how the test file should be updated to use fixture references.

Test snippet (JavaScript Playwright style):

describe('Login', () => {
  it('logs in with valid credentials', async ({ page }) => {
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('#login');
    await expect(page.locator('.flash.success')).toContainText('You logged into a secure area!');
  });

  it('shows error for wrong password', async ({ page }) => {
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'wrongpassword');
    await page.click('#login');
    await expect(page.locator('.flash.error')).toContainText('Your password is invalid!');
  });
});

Extract: usernames, passwords, expected messages, selectors that might change. Write tests/fixtures/login-fixtures.json, then show the updated test with fixture imports.
```

### Test Prompt B — audit for security risks

```
Scan all files under tests/ recursively. Flag any hardcoded passwords, API keys, email addresses, or PII you find. For each finding, report:
- File path and line number
- What was found (e.g., "password: 'admin123'")
- Risk level: HIGH (real-looking credentials) / MEDIUM (generic test data) / LOW (obviously fake)

Write the security audit to tests/reports/security-audit.md.
```

### What to Expect

- Agent reads test files and finds hardcoded strings
- Extracts them into structured JSON in `tests/fixtures/`
- Shows the before/after diff of the test file
- Flags any real-looking credentials as HIGH risk
- Creates environment-aware fixtures if values differ between dev/staging/prod

---

## Quick-Start Verification Sequence

Run these prompts in order to confirm the entire system works end-to-end:

```
Step 1 — switch to 🔬 Framework Analyzer
         → "Scan the project at c:\NewInitiatives\seleniummcp"
         Expected: .roo/framework-profile.json created

Step 2 — switch to 🎫 Jira Test Creator
         → use Test Prompt A from Agent 2 above (the DEMO-101 ticket with URL)
         Expected:
           • Edge opens automatically
           • Agent navigates to the login page
           • Walks through each scenario step by step in the live browser
           • You see real clicks and types in the Edge window
           • tests/locators/LoginPage.locators.json written (with validated selectors)
           • Test file generated using only those validated selectors
           • Agent reports: "N selectors captured, N assertions captured from DOM"

Step 3 — switch to ▶️ Test Runner
         → use Test Prompt B from Agent 4 (manual login run via Selenium MCP)
         Expected: tests run using the validated selectors from Step 2

Step 4 — switch to 📦 Test Data Manager
         → use Test Prompt A from Agent 8 (extract the login fixture)
         Expected: hardcoded test values moved to tests/fixtures/login-fixtures.json
```

> **Note on XPath Discovery (Agent 3):** You no longer need to run this separately before
> creating tests. The Jira Test Creator now handles locator discovery inline. Use XPath Discovery
> only when you want to map a page that has no Jira ticket yet, or to audit/refresh an entire
> page's locator registry independently.

If all 5 steps produce the expected output, every agent is working correctly.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "MCP tools not available" in any agent | Reload VS Code window (`Ctrl+Shift+P` → Reload Window) |
| Edge driver mismatch error (133 vs 148) | `Rename-Item C:\SeleniumTest\edgedriver_win64\msedgedriver.exe msedgedriver.exe.133.bak` — selenium-manager downloads 148 automatically |
| "framework-profile.json not found" | Switch to 🔬 Framework Analyzer and scan your project first |
| Agent not visible in Roo Code mode selector | Check `.roomodes` is in project root and valid JSON — run `node -e "JSON.parse(require('fs').readFileSync('.roomodes','utf8'))"` |
| Screenshot not captured | Check `tests/screenshots/failures/` directory exists (auto-created by verify-setup.js) |
