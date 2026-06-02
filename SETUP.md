# Selenium MCP Automation — Complete Setup & Usage Guide

> **What this project is:** A plug-and-play AI automation layer that sits on top of **any existing test project** (Java, Python, JavaScript, C#, Ruby — any framework). It uses Roo Code AI agents to read Jira tickets and generate test cases in your project's exact style, discover element locators on live pages, execute tests, fix broken ones, and report results. No new test framework is imposed — the agents adapt to whatever you already have.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Configuration Files](#3-configuration-files)
4. [Environment Variables (.env)](#4-environment-variables-env)
5. [MCP Servers (.mcp.json)](#5-mcp-servers-mcpjson)
6. [Agents — What Each One Does](#6-agents--what-each-one-does)
7. [First-Time Setup Walkthrough](#7-first-time-setup-walkthrough)
8. [Common Workflows](#8-common-workflows)
9. [Project Folder Structure](#9-project-folder-structure)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Purpose | Download |
|----------|---------|---------|
| **VS Code** | Editor that hosts Roo Code | https://code.visualstudio.com |
| **Roo Code extension** | Runs the AI agents | VS Code → Extensions → search "Roo Code" |
| **Node.js 18+** | Runs the MCP servers (Selenium + Jira) | https://nodejs.org |
| **Microsoft Edge** | The test browser | Pre-installed on Windows |
| **msedgedriver 148** | Connects automation to Edge | See Section 1.1 below |

### 1.1 — Install Edge WebDriver

Your Edge version is **148.0.3967.96**. Run these commands in PowerShell once:

```powershell
# 1. Create a dedicated driver folder
New-Item -ItemType Directory -Force "C:\WebDrivers"

# 2. Download msedgedriver 148 from this URL, extract, then copy:
#    https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
Copy-Item "C:\Users\$env:USERNAME\Downloads\msedgedriver.exe" "C:\WebDrivers\"

# 3. Add to PATH permanently (no admin required)
$current = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$current;C:\WebDrivers", "User")
```

Open a **new** PowerShell window, then verify:
```powershell
msedgedriver --version
# Expected: MSEdgeDriver 148.0.3967.96 (...)
```

> Full guide with screenshots: [EDGE-DRIVER-SETUP.md](EDGE-DRIVER-SETUP.md)

### 1.2 — Jira API Token

The Jira agent needs an API token to read your tickets:

1. Go to: **https://id.atlassian.com/manage-profile/security/api-tokens**
2. Click **Create API token** → give it a name → copy the token
3. You will add it to `.env` in Section 4

---

## 2. Installation

### Step 1 — Clone / open this folder in VS Code

```powershell
cd c:\NewInitiatives\seleniummcp
code .
```

### Step 2 — Verify Node.js is installed

```powershell
node --version    # must be 18 or higher
npx --version     # comes with Node.js
```

### Step 3 — Create your `.env` file

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in your values (see Section 4).

### Step 4 — Verify MCP servers start correctly

In Roo Code, open any agent (e.g., XPath Discovery) and ask:
> "What MCP tools are available?"

You should see `selenium_*` and `jira_*` tools listed. If not, see [Troubleshooting](#10-troubleshooting).

### Step 5 — Point to your existing test project

This setup folder (`c:\NewInitiatives\seleniummcp`) is the AI layer. Your actual test code stays wherever it already is. You can either:

- **Option A:** Open your test project folder in VS Code alongside this folder
- **Option B:** Copy this `.roo/`, `config/`, `tests/`, `.mcp.json`, `.roomodes` into your existing test project root

> **Recommendation:** Option B — merge into your existing project root so agents can directly read and edit your test files.

---

## 3. Configuration Files

### `config/environments.json` — Test Environment URLs

Defines the base URL for each environment. Tests read this file to know where to run.

```json
{
  "dev": {
    "baseUrl": "http://localhost:3000",
    "apiUrl":  "http://localhost:8080/api",
    "label":   "Local Development"
  },
  "staging": {
    "baseUrl": "https://staging.example.com",
    "apiUrl":  "https://api-staging.example.com",
    "label":   "Staging"
  },
  "prod": {
    "baseUrl": "https://example.com",
    "apiUrl":  "https://api.example.com",
    "label":   "Production (read-only tests only)"
  }
}
```

**How to configure:** Replace the example URLs with your actual application URLs.

**How it's used:** Agents read this and use `TEST_ENV` environment variable (default: `dev`) to select which URL to test against.

---

### `config/jira.config.json` — Jira Connection Settings

Controls how the Jira agent connects to your Atlassian instance and maps priorities.

```json
{
  "baseUrl":         "${JIRA_BASE_URL}",    ← from .env
  "email":           "${JIRA_EMAIL}",       ← from .env
  "apiToken":        "${JIRA_API_TOKEN}",   ← from .env
  "projectKey":      "PROJ",               ← CHANGE THIS to your Jira project key
  "testLabelPrefix": "automated",
  "priorityMapping": {
    "Blocker":  "P0",
    "Critical": "P0",
    "High":     "P1",
    "Medium":   "P2",
    "Low":      "P3"
  },
  "issueTypeMapping": {
    "Story":    "E2E",
    "Bug":      "Regression",
    "Task":     "Functional",
    "Sub-task": "Unit",
    "Epic":     "Suite"
  }
}
```

**What to change:**
- `projectKey` — set to your actual Jira project key (e.g. `"APP"`, `"QA"`, `"WEB"`)
- `priorityMapping` — adjust if your Jira uses different priority names
- Credentials stay in `.env` — never in this file

---

### `config/selenium.config.json` — Browser & Execution Settings

Controls browser options, timeouts, retries, screenshots, and quality gate.

```json
{
  "browser": {
    "default": "edge",              ← browser to use (edge / chrome / firefox)
    "options": {
      "headless":          false,   ← true for CI/CD pipelines
      "windowSize":        "1920,1080",
      "disableGpu":        true,
      "noSandbox":         true,
      "disableDevShmUsage": true
    }
  },
  "timeouts": {
    "implicit":  10000,   ← ms to wait for elements (implicit)
    "explicit":  15000,   ← ms for explicit waits (recommended)
    "pageLoad":  30000,   ← ms max for page loads
    "script":    10000    ← ms max for JavaScript execution
  },
  "retries": {
    "onFailure":   3,      ← retry transient failures up to 3 times
    "retryDelay":  2000    ← ms between retries (doubles each attempt)
  },
  "screenshots": {
    "onFailure":  true,                    ← always capture on test fail
    "onEveryStep": false,                  ← verbose; enable only for debugging
    "outputDir":  "tests/screenshots"
  },
  "reporting": {
    "outputDir":   "tests/reports",
    "htmlReport":  true,
    "jsonReport":  true,
    "junitReport": true                    ← for CI/CD systems
  },
  "webhookUrl": "",                        ← optional: POST results to Slack/Teams
  "qualityGate": {
    "minPassRate":  90,    ← pipeline warns/fails if pass rate drops below this
    "maxFlakiness":  5     ← flag tests that retry more than this % of runs
  }
}
```

**Common changes:**
- Set `headless: true` for CI/CD pipelines
- Set `webhookUrl` to a Slack/Teams webhook to get results posted automatically
- Adjust `minPassRate` to match your team's standards

---

## 4. Environment Variables (.env)

Create `.env` by copying `.env.example`, then fill in your values:

```bash
# Test environment to run against
TEST_ENV=dev                      # dev | staging | prod

# Jira — get token from: https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_BASE_URL=https://your-org.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token-here

# Browser
SELENIUM_BROWSER=edge             # edge | chrome | firefox
SELENIUM_HEADLESS=false           # true for CI/CD

# Optional: webhook to receive pipeline results
WEBHOOK_URL=
```

> **Security:** `.env` is in `.gitignore` — it will never be committed. Never put real credentials anywhere else.

**How to find your Jira base URL:**
- Cloud Jira: `https://your-company.atlassian.net`
- Example: if you access Jira at `https://acme.atlassian.net/jira`, your base URL is `https://acme.atlassian.net`

---

## 5. MCP Servers (.mcp.json)

This file tells Roo Code which MCP (Model Context Protocol) servers to start. These servers give the AI agents their tools.

```json
{
  "mcpServers": {
    "selenium": {
      "command": "npx",
      "args":    ["-y", "@angiejones/mcp-selenium"],
      "env": {
        "SELENIUM_BROWSER":  "edge",    ← matches your installed browser
        "SELENIUM_HEADLESS": "false"    ← set "true" for headless
      }
    },
    "jira": {
      "command": "npx",
      "args":    ["-y", "@sooperset/mcp-atlassian"],
      "env": {
        "JIRA_BASE_URL":   "${JIRA_BASE_URL}",    ← loaded from .env
        "JIRA_EMAIL":      "${JIRA_EMAIL}",
        "JIRA_API_TOKEN":  "${JIRA_API_TOKEN}"
      }
    }
  }
}
```

**What these servers provide:**

| Server | Package | Tools it adds |
|--------|---------|--------------|
| `selenium` | `@angiejones/mcp-selenium` | `selenium_start_session`, `selenium_navigate`, `selenium_click`, `selenium_type`, `selenium_find_element`, `selenium_screenshot`, and 10+ more browser tools |
| `jira` | `@sooperset/mcp-atlassian` | `jira_get_issue`, `jira_search_issues`, `jira_get_issue_comments`, `jira_list_sprints` |

**Switching browsers:**
```json
"SELENIUM_BROWSER": "edge"      ← Microsoft Edge   (requires msedgedriver)
"SELENIUM_BROWSER": "chrome"    ← Google Chrome    (requires chromedriver)
"SELENIUM_BROWSER": "firefox"   ← Mozilla Firefox  (requires geckodriver)
```

> The MCP servers are downloaded automatically via `npx` the first time they run. No manual install needed.

---

## 6. Agents — What Each One Does

All agents are defined in `.roomodes` and accessed via the **Roo Code mode selector** (bottom of VS Code editor). Each agent has detailed instructions in `.roo/rules-{slug}/01-agent.md`.

---

### 🔬 Framework Analyzer (`framework-analyzer`)

**Purpose:** Understands your existing test project.

**What it does:**
- Scans your project files to detect language, test framework, assertion library, folder structure, naming conventions, and locator patterns
- Reads 3+ existing test files as style examples
- Writes everything it learns to `.roo/framework-profile.json`

**Supported frameworks:** Java (Selenium+TestNG, Cucumber, JUnit), Python (pytest, behave, Robot Framework, Playwright), JavaScript/TypeScript (Playwright, Cypress, WebdriverIO, Jest), C# (NUnit, SpecFlow, MSTest), Ruby (Capybara, RSpec)

**When to use:**
- First time you use this setup on a project
- When you change test frameworks
- When you add a new sub-project with a different framework

**How to use:**
1. Switch to 🔬 Framework Analyzer in Roo Code
2. Say: `"Scan my test project at {path/to/your/tests}"`
3. It writes `.roo/framework-profile.json` — done

**Output:** `.roo/framework-profile.json` — read by ALL other agents

---

### 🎫 Jira Test Creator (`jira-test-creator`)

**Purpose:** Reads a Jira ticket → generates test cases in your project's exact style.

**What it does:**
- Reads `.roo/framework-profile.json` to understand your coding style
- Fetches the Jira ticket (story, bug, task)
- Extracts acceptance criteria and derives: happy paths, negative tests, edge cases, boundary tests, security sanity checks
- Generates test files that look exactly like your hand-written tests — same imports, same assertions, same naming, same folder

**When to use:**
- Any time a developer finishes a Jira story and it needs tests
- When a bug is fixed and needs a regression test
- During sprint planning to pre-generate test skeletons

**How to use:**
1. Make sure `.roo/framework-profile.json` exists (run Framework Analyzer first if not)
2. Switch to 🎫 Jira Test Creator
3. Say: `"Generate tests for PROJ-123"` or `"Generate tests for all tickets in Sprint 42"`

**Output:** Test files written directly into your project's test folder (path determined by framework profile)

---

### 🔍 XPath Discovery (`xpath-discovery`)

**Purpose:** Discovers and validates element locators on live web pages.

**What it does:**
- Opens your application in Edge (via Selenium MCP)
- Analyzes the DOM of each page
- Discovers the most stable selector for every interactive element (ID > data-testid > name > aria-label > CSS > XPath)
- Validates each selector by actually finding the element
- Writes a locator registry JSON file per page

**When to use:**
- Before writing tests for a new page
- When locators need to be updated after a UI change
- To audit how stable your selectors are

**How to use:**
1. Switch to 🔍 XPath Discovery
2. Say: `"Discover locators for https://your-app.com/login"` or `"Map all elements on the checkout page"`

**Output:** `tests/locators/{PageName}.locators.json` — validated selector registry

---

### ▶️ Test Runner (`test-runner`)

**Purpose:** Executes your test suite and reports results.

**What it does:**
- Reads `.roo/framework-profile.json` to get the correct run command for your framework
- Runs smoke, regression, or full suite
- Captures screenshots when tests fail
- Retries flaky tests (up to 3× with exponential backoff)
- Generates JSON and HTML execution reports
- Provides per-failure root cause analysis

**When to use:**
- After generating new tests (verify they pass)
- Regular regression runs
- Pre-release validation

**How to use:**
1. Switch to ▶️ Test Runner
2. Say: `"Run smoke tests on staging"`, `"Run regression suite"`, or `"Run tests for PROJ-123"`

**Output:** `tests/reports/{date}/execution-report.json` + `execution-report.html`

---

### 🔧 Test Maintenance (`test-maintenance`)

**Purpose:** Fixes broken tests — especially after UI changes.

**What it does:**
- Reads the failure report to understand what broke
- Opens the live page in Edge to re-discover changed elements
- Updates the locator registry with new selectors
- Patches the test file in your framework's style
- Verifies the fix with a live browser run
- Logs every change with timestamp and root cause

**Failure types it handles automatically:**
- Selector no longer finds element (UI refactor)
- Text assertion fails (copy/label change)
- Navigation fails (URL route changed)
- Timing issues (element loads slowly)

**When to use:**
- After a sprint deployment breaks existing tests
- Regular maintenance to keep suite healthy
- After a major UI redesign

**How to use:**
1. Switch to 🔧 Test Maintenance
2. Say: `"Fix failing tests from today's regression run"` or `"Heal the broken login tests"`

**Output:** Updated test files + `tests/maintenance-log.md`

---

### 🔄 Pipeline Orchestrator (`pipeline-orchestrator`)

**Purpose:** Runs the full end-to-end automation pipeline in one command.

**What it does:**

```
Stage 0: Check framework profile (run Framework Analyzer if missing)
Stage 1: Fetch Jira sprint tickets
Stage 2: XPath Discovery on affected pages
Stage 3: Jira Test Creator generates tests for all tickets
Stage 4: Test Runner executes the full suite
Stage 5: Test Maintenance heals any failures
Stage 6: Executive summary report + webhook notification
```

Manages pipeline state in `tests/pipeline-state.json` — if it crashes mid-run, it can resume from where it stopped.

**When to use:**
- Start of each sprint — generate and run all new tests in one go
- Pre-release gate — full regression with report for stakeholders
- CI/CD pipeline trigger

**How to use:**
1. Switch to 🔄 Pipeline Orchestrator
2. Say: `"Run full pipeline for Sprint 42"` or `"Full pipeline for PROJ-123"`

**Output:** `tests/reports/{date}/pipeline-summary.md` — executive report

---

### 📊 Test Gap Analyzer (`test-gap-analyzer`)

**Purpose:** Tells you which Jira tickets have no tests.

**What it does:**
- Fetches all tickets from your Jira board/sprint
- Scans all test files for `@jira TICKET-ID` references
- Cross-references both lists
- Reports: tickets with no tests, partial coverage, bugs with no regression, orphaned tests
- Prioritizes gaps by ticket priority (P0 gaps first)
- Suggests which tickets to test next

**When to use:**
- Sprint planning — see what has no test coverage before the sprint starts
- QA audits — measure overall coverage percentage
- After a bug batch — ensure all fixed bugs have regression tests

**How to use:**
1. Switch to 📊 Test Gap Analyzer
2. Say: `"What tickets have no tests?"`, `"Coverage report for Sprint 42"`, or `"Which fixed bugs have no regression tests?"`

**Output:**
- `tests/reports/test-gap-analysis-{date}.md` — human-readable report
- `tests/reports/test-gap-analysis-{date}.json` — machine-readable (used by Pipeline Orchestrator)

---

### 📦 Test Data Manager (`test-data-manager`)

**Purpose:** Manages test data — keeps it organised, safe, and environment-aware.

**What it does:**
- Scans test files for hardcoded values (emails, passwords, expected messages, magic strings)
- Extracts them into structured JSON files in `tests/fixtures/`
- Replaces inline values with fixture references (in your framework's style)
- Flags security risks: real passwords, API keys, or PII in source code
- Creates new fixture data when Jira tickets introduce new test scenarios
- Supports environment-specific data (`tests/fixtures/environments/staging.json`)

**When to use:**
- First time setup — extract hardcoded values from existing tests
- When a Jira ticket requires new test accounts or data
- Security audit — ensure no credentials are in source code

**How to use:**
1. Switch to 📦 Test Data Manager
2. Say: `"Extract all hardcoded test data from my test files"`, `"Create fixtures for PROJ-123 acceptance criteria"`, or `"Audit my tests for hardcoded passwords"`

**Output:** `tests/fixtures/*.json` + updated test files with fixture references

---

## 7. First-Time Setup Walkthrough

Follow these steps the first time you use this on an existing project:

### Step 1 — Configure your environment

```bash
# Copy and fill in .env
Copy-Item .env.example .env
# Edit .env: set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, TEST_ENV
```

Update `config/environments.json` with your real application URLs.
Update `config/jira.config.json` — set `projectKey` to your Jira project key.

---

### Step 2 — Install Edge WebDriver (if not done)

```powershell
# Check your Edge version
(Get-Item "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe").VersionInfo.FileVersion

# Download matching msedgedriver from:
# https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
# Then:
New-Item -ItemType Directory -Force "C:\WebDrivers"
Copy-Item "C:\Users\$env:USERNAME\Downloads\msedgedriver.exe" "C:\WebDrivers\"
$p = [Environment]::GetEnvironmentVariable("Path","User")
[Environment]::SetEnvironmentVariable("Path","$p;C:\WebDrivers","User")
# Open NEW PowerShell → verify: msedgedriver --version
```

---

### Step 3 — Run Framework Analyzer

In Roo Code:
1. Click the mode selector at the bottom → select **🔬 Framework Analyzer**
2. Type: `"Scan my test project at {path to your test folder}"`
3. Wait — it reads your files and writes `.roo/framework-profile.json`
4. Confirm the output looks correct (language, framework, run command)

---

### Step 4 — Discover Locators (optional but recommended)

1. Switch to **🔍 XPath Discovery**
2. Type: `"Discover all element locators for {your-app-url}"`
3. It opens Edge, visits each page, maps all elements, writes `tests/locators/*.locators.json`

---

### Step 5 — Generate Your First Test from Jira

1. Switch to **🎫 Jira Test Creator**
2. Type: `"Generate tests for PROJ-123"` (use a real ticket number)
3. It fetches the ticket, reads your framework profile, writes a test file in your exact style
4. Review the generated file — it should look like your own code

---

### Step 6 — Run the Tests

1. Switch to **▶️ Test Runner**
2. Type: `"Run smoke tests"` or `"Run the tests for PROJ-123"`
3. Edge opens, runs the tests, captures results
4. Check `tests/reports/` for the HTML report

---

## 8. Common Workflows

### Generate tests for a whole sprint

```
Switch to: 🔄 Pipeline Orchestrator
Say: "Run full pipeline for Sprint 42 on board PROJ"
```

This automatically: analyzes framework → fetches tickets → discovers locators → generates tests → runs them → fixes failures → produces report.

---

### Generate test for a single ticket

```
Switch to: 🎫 Jira Test Creator
Say: "Generate tests for PROJ-456"
```

---

### Check test coverage before sprint planning

```
Switch to: 📊 Test Gap Analyzer
Say: "Show coverage gaps for Sprint 43 — what has no tests?"
```

---

### Run regression suite on staging before release

```
Switch to: ▶️ Test Runner
Say: "Run full regression suite on staging"
```

Or with environment variable:
```powershell
$env:TEST_ENV = "staging"
```

---

### Fix broken tests after a UI deployment

```
Switch to: 🔧 Test Maintenance
Say: "Fix all failing tests from today's regression run"
```

---

### Clean up hardcoded test data

```
Switch to: 📦 Test Data Manager
Say: "Scan all test files and extract hardcoded data to fixtures"
```

---

### Rediscover locators after a UI redesign

```
Switch to: 🔍 XPath Discovery
Say: "Re-map all locators for https://your-app.com — the UI was redesigned"
```

---

### Run headless for CI/CD

Set in `.env`:
```
SELENIUM_HEADLESS=true
```

Or in `.mcp.json`:
```json
"SELENIUM_HEADLESS": "true"
```

---

## 9. Project Folder Structure

```
seleniummcp/
│
├── .mcp.json                    ← MCP server config (Selenium + Jira)
├── .roomodes                    ← All 8 Roo Code agent definitions
├── .env.example                 ← Template for your .env file
├── .env                         ← Your credentials (NOT in git)
├── .gitignore                   ← Excludes .env, reports, screenshots
│
├── SETUP.md                     ← This file
├── EDGE-DRIVER-SETUP.md         ← Step-by-step Edge driver install
│
├── config/
│   ├── environments.json        ← App URLs per environment
│   ├── jira.config.json         ← Jira project key and mappings
│   └── selenium.config.json     ← Browser, timeouts, retries, quality gate
│
├── .roo/
│   ├── framework-profile.json          ← Written by Framework Analyzer (shared memory)
│   ├── framework-profile.example.json  ← Schema reference
│   ├── rules/
│   │   └── 00-global-selenium.md       ← Global rules loaded for all agents
│   ├── rules-framework-analyzer/
│   │   └── 01-agent.md                 ← Framework Analyzer instructions
│   ├── rules-jira-test-creator/
│   │   └── 01-agent.md                 ← Jira Test Creator instructions
│   ├── rules-xpath-discovery/
│   │   └── 01-agent.md                 ← XPath Discovery instructions
│   ├── rules-test-runner/
│   │   └── 01-agent.md                 ← Test Runner instructions
│   ├── rules-test-maintenance/
│   │   └── 01-agent.md                 ← Test Maintenance instructions
│   ├── rules-pipeline-orchestrator/
│   │   └── 01-agent.md                 ← Pipeline Orchestrator instructions
│   ├── rules-test-gap-analyzer/
│   │   └── 01-agent.md                 ← Test Gap Analyzer instructions
│   └── rules-test-data-manager/
│       └── 01-agent.md                 ← Test Data Manager instructions
│
└── tests/                       ← Shared infrastructure (not your test code)
    ├── locators/                 ← Selector registries (XPath Discovery output)
    ├── fixtures/                 ← Test data files (Test Data Manager output)
    ├── screenshots/
    │   ├── failures/             ← Captured on test failure
    │   └── baseline/             ← Visual baselines (tracked in git)
    ├── reports/                  ← Execution reports (not tracked in git)
    ├── pipeline-state.json       ← Pipeline run state
    └── maintenance-log.md        ← History of all test fixes
```

> **Your actual test code** stays in your existing project structure. The agents read the `framework-profile.json` to know exactly where it is and write new test files directly there.

---

## 10. Troubleshooting

### MCP tools not showing in Roo Code

1. Check Node.js is installed: `node --version` (must be 18+)
2. Check `.mcp.json` is in the project root and valid JSON
3. Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"
4. Open Roo Code output panel and look for errors starting with `[MCP]`

---

### Edge browser doesn't open / "msedgedriver not found"

1. Verify driver is installed: `msedgedriver --version` in a new PowerShell
2. If not found, check `C:\WebDrivers\` exists and contains `msedgedriver.exe`
3. Check PATH includes `C:\WebDrivers`:
   ```powershell
   $env:Path -split ";" | Where-Object { $_ -like "*WebDriver*" }
   ```
4. Re-run the PATH setup from Section 1.1 and open a **new** PowerShell

---

### Edge version mismatch error

```
SessionNotCreatedException: This version of msedgedriver only supports MSEdge version 125
```

Your Edge auto-updated. Download the new matching driver:
1. Check version: `edge://settings/help`
2. Download new driver from the Microsoft link
3. Replace `C:\WebDrivers\msedgedriver.exe`

---

### Jira authentication fails

```
401 Unauthorized
```

1. Check `.env` has `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` all set
2. Verify your API token is valid: regenerate at `https://id.atlassian.com/manage-profile/security/api-tokens`
3. Confirm `JIRA_BASE_URL` format: `https://your-org.atlassian.net` (no trailing slash)
4. Try the Jira API in your browser: `{JIRA_BASE_URL}/rest/api/3/myself`

---

### Framework Analyzer can't find test files

```
"No test files found"
```

1. Tell it explicitly where your tests are: `"Scan my project at src/test/java/"`
2. Check the project you opened in VS Code contains test files
3. If tests are in a different repo, open that folder in VS Code too

---

### Jira Test Creator generates wrong language/style

The framework profile may be stale. Re-run:
```
Switch to: 🔬 Framework Analyzer
Say: "Re-scan the project — the framework has changed"
```

---

### Tests pass locally but fail in CI

1. Set `SELENIUM_HEADLESS=true` in CI environment variables
2. Ensure `msedgedriver` is installed on the CI machine (or use Docker with pre-installed driver)
3. Check `config/environments.json` — CI may need a different `baseUrl`

---

### Pipeline Orchestrator stops mid-run

Read the state file to see which stage failed:
```
tests/pipeline-state.json
```

Resume from the failed stage:
```
Switch to: 🔄 Pipeline Orchestrator
Say: "Resume pipeline from stage {stageName}"
```

---

## Quick Reference Card

| Task | Agent | What to say |
|------|-------|------------|
| First time setup | 🔬 Framework Analyzer | `"Scan my test project at {path}"` |
| Generate tests from Jira | 🎫 Jira Test Creator | `"Generate tests for PROJ-123"` |
| Generate tests for a sprint | 🎫 Jira Test Creator | `"Generate tests for all tickets in Sprint 42"` |
| Discover page locators | 🔍 XPath Discovery | `"Discover locators for {url}"` |
| Run tests | ▶️ Test Runner | `"Run regression suite on staging"` |
| Fix broken tests | 🔧 Test Maintenance | `"Fix all failing tests"` |
| Full sprint pipeline | 🔄 Pipeline Orchestrator | `"Run full pipeline for Sprint 42"` |
| Coverage report | 📊 Test Gap Analyzer | `"What tickets have no tests?"` |
| Manage test data | 📦 Test Data Manager | `"Extract hardcoded data to fixtures"` |
