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

## Agent 2 — 🎫 Jira Test Creator

**Mode slug:** `jira-test-creator`

**What it does:** Reads a Jira ticket (via corporate LLM Jira integration) → generates test cases in the project's existing style.

### Test Prompt A — single ticket

```
Generate tests for this ticket:

Ticket: DEMO-101
Summary: User Login — Email and Password
Type: Story | Priority: High

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
Generate tests for all Story and Bug tickets in Sprint 5 on Jira board DEMO. Read .roo/framework-profile.json first for the project style, then generate one test file per ticket.
```

### What to Expect

- Agent reads `.roo/framework-profile.json` (if it doesn't exist, it stops and asks you to run Framework Analyzer first)
- Generates a test file that matches the framework profile style exactly
- Covers: happy path, negative cases, empty fields, boundary values
- Each test is tagged with `@jira DEMO-101` for traceability
- Reports a summary: files created, test counts by priority

---

## Agent 3 — 🔍 XPath Discovery

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

## Agent 4 — ▶️ Test Runner

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

## Agent 5 — 🔧 Test Maintenance

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

## Agent 6 — 🔄 Pipeline Orchestrator

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

## Agent 7 — 📊 Test Gap Analyzer

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

## Agent 8 — 📦 Test Data Manager

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

Step 2 — switch to 🔍 XPath Discovery
         → "Discover locators for https://the-internet.herokuapp.com/login"
         (Edge should open and navigate)

Step 3 — switch to 🎫 Jira Test Creator
         → use Test Prompt A from Agent 2 above (paste the DEMO-101 ticket)

Step 4 — switch to ▶️ Test Runner
         → use Test Prompt B from Agent 4 (manual login run via Selenium MCP)

Step 5 — switch to 📦 Test Data Manager
         → use Test Prompt A from Agent 8 (extract the login fixture)
```

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
