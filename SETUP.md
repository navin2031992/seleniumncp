# Selenium MCP Automation — Complete Setup & Usage Guide

> **What this project is:** A plug-and-play AI automation layer that sits on top of **any existing test project** (Java, Python, JavaScript, C#, Ruby — any framework). It uses Roo Code AI agents to generate test cases in your project's exact style, discover element locators on live pages via **Microsoft Edge**, execute tests, fix broken ones, and report results. No new test framework is imposed — the agents adapt to whatever you already have.

---

## Table of Contents

1. [Prerequisites — CRITICAL: Do These First](#1-prerequisites--critical-do-these-first)
2. [Configuration Files](#2-configuration-files)
3. [Environment Variables (.env)](#3-environment-variables-env)
4. [MCP Server (.mcp.json)](#4-mcp-server-mcpjson)
5. [Agents — What Each One Does](#5-agents--what-each-one-does)
6. [First-Time Setup Walkthrough](#6-first-time-setup-walkthrough)
7. [Common Workflows](#7-common-workflows)
8. [Project Folder Structure](#8-project-folder-structure)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites — CRITICAL: Do These First

All three items below must be completed before any agent will work.

---

### 1.1 — Node.js 18+ and @angiejones/mcp-selenium

**Status: ✅ Node.js 24 installed. ✅ `npm install` already run.**

`@angiejones/mcp-selenium` (v0.2.3) is installed in `node_modules/`. The Selenium MCP server is ready.

If you ever need to reinstall (e.g., after cloning to a new machine):

```powershell
cd c:\NewInitiatives\seleniummcp
npm install
```

---

### 1.2 — Edge WebDriver (auto-managed — no manual install needed)

Your installed Edge version is **148.0.3967.96**.

**Good news:** `selenium-webdriver 4.x` (installed via `npm install`) includes **selenium-manager**, which automatically downloads and caches the correct `msedgedriver` for your Edge version on the first browser session. No manual driver download is needed.

> ℹ️ **If you see a driver version mismatch error** (e.g., from an old `msedgedriver.exe` at `C:\SeleniumTest\edgedriver_win64\`), simply remove or rename the old driver so selenium-manager takes over:
>
> ```powershell
> Rename-Item "C:\SeleniumTest\edgedriver_win64\msedgedriver.exe" "msedgedriver.exe.133.bak"
> ```
>
> selenium-manager will then download msedgedriver 148 automatically on next run and cache it at:
> `C:\Users\{you}\.cache\selenium\msedgedriver\win64\148.x.x.x\`

---

### 1.3 — Roo Code Extension in VS Code

- Open VS Code → Extensions (`Ctrl+Shift+X`) → search **"Roo Code"** → Install
- Open this folder: `code c:\NewInitiatives\seleniummcp`
- The 8 agent modes appear in the Roo Code mode selector at the bottom of VS Code

---

## 2. Configuration Files

### `config/environments.json` — Test Environment URLs

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

Replace the example URLs with your real application URLs. Agents read `TEST_ENV` (default: `dev`) to pick the right URL.

---

### `config/selenium.config.json` — Browser & Execution Settings

```json
{
  "browser": {
    "default": "edge",
    "options": {
      "headless":          false,
      "windowSize":        "1920,1080",
      "disableGpu":        true,
      "noSandbox":         true
    }
  },
  "timeouts": {
    "implicit":  10000,
    "explicit":  15000,
    "pageLoad":  30000,
    "script":    10000
  },
  "retries": {
    "onFailure":   3,
    "retryDelay":  2000
  },
  "screenshots": {
    "onFailure":  true,
    "onEveryStep": false,
    "outputDir":  "tests/screenshots"
  },
  "reporting": {
    "outputDir":   "tests/reports",
    "htmlReport":  true,
    "jsonReport":  true,
    "junitReport": true
  },
  "qualityGate": {
    "minPassRate":  90,
    "maxFlakiness":  5
  }
}
```

Set `headless: true` for CI/CD pipelines.

---

## 3. Environment Variables (.env)

```powershell
Copy-Item .env.example .env
```

Open `.env` and set:

```bash
TEST_ENV=dev               # dev | staging | prod
SELENIUM_BROWSER=edge      # edge only (Edge + msedgedriver required)
SELENIUM_HEADLESS=false    # true for CI/CD
```

> `.env` is in `.gitignore` — never committed.

---

## 4. MCP Server (.mcp.json)

Only the Selenium MCP server is configured. It starts automatically when Roo Code loads.

```json
{
  "mcpServers": {
    "selenium": {
      "command": "npx",
      "args": ["-y", "@angiejones/mcp-selenium"],
      "env": {
        "SELENIUM_BROWSER": "edge",
        "SELENIUM_HEADLESS": "false"
      }
    }
  }
}
```

**Verify it works:** Switch to any agent in Roo Code and ask:
> "What MCP tools are available?"

You should see `selenium_start_session`, `selenium_navigate`, `selenium_click`, etc.

---

## 5. Agents — What Each One Does

All 8 agents are in `.roomodes`. Switch between them via the Roo Code mode selector.

---

### 🔬 Framework Analyzer (`framework-analyzer`)

Scans your existing test project → writes `.roo/framework-profile.json`.

**Run first** on any new project. Supports Java, Python, JS/TS, C#, Ruby — any framework.

```
Switch to: 🔬 Framework Analyzer
Say: "Scan my test project at {path/to/your/tests}"
```

---

### 🎫 Jira Test Creator (`jira-test-creator`)

Reads a Jira ticket (via corporate LLM Jira integration) → generates test cases in your project's exact style. Just give it the ticket number:

```
Switch to: 🎫 Jira Test Creator
Say: "Generate tests for PROJ-123"
```

Or for a sprint batch:
```
Say: "Generate tests for all tickets in Sprint 42 on board PROJ"
```

---

### 🔍 XPath Discovery (`xpath-discovery`)

Opens Edge, navigates your app, discovers and validates element locators, writes `tests/locators/{Page}.locators.json`.

```
Switch to: 🔍 XPath Discovery
Say: "Discover locators for https://your-app.com/login"
```

---

### ▶️ Test Runner (`test-runner`)

Runs your test suite, captures screenshots on failure, retries flaky tests, writes HTML/JSON reports to `tests/reports/`.

```
Switch to: ▶️ Test Runner
Say: "Run smoke tests on staging"
```

---

### 🔧 Test Maintenance (`test-maintenance`)

Fixes broken tests. Opens Edge to re-discover changed elements, patches test files in your framework's style, verifies the fix live.

```
Switch to: 🔧 Test Maintenance
Say: "Fix all failing tests from today's run"
```

---

### 🔄 Pipeline Orchestrator (`pipeline-orchestrator`)

Runs the full pipeline end-to-end. Since there is no Jira MCP, it asks you to paste the ticket list at Stage 1.

```
Switch to: 🔄 Pipeline Orchestrator
Say: "Run full pipeline for Sprint 42"
(It will ask you to paste the ticket list)
```

---

### 📊 Test Gap Analyzer (`test-gap-analyzer`)

Fetches all tickets from Jira (via corporate LLM integration), scans test files, and reports which tickets have no tests, partial coverage, or orphaned tests.

```
Switch to: 📊 Test Gap Analyzer
Say: "What tickets have no tests in Sprint 42 on board PROJ?"
```

---

### 📦 Test Data Manager (`test-data-manager`)

Scans test files for hardcoded values → extracts to `tests/fixtures/*.json` → replaces inline values with fixture references.

```
Switch to: 📦 Test Data Manager
Say: "Extract all hardcoded test data from my test files"
```

---

## 6. First-Time Setup Walkthrough

### Step 1 — Install prerequisites (Section 1 above)
- Node.js 18+ installed and `npm install` run in this folder
- msedgedriver **148** in PATH
- Roo Code extension installed in VS Code

### Step 2 — Configure environment

```powershell
Copy-Item .env.example .env
```

Edit `.env`: set `TEST_ENV`, confirm `SELENIUM_BROWSER=edge`.

Update `config/environments.json` with your real app URLs.

### Step 3 — Verify MCP server starts

Open Roo Code → switch to **🔍 XPath Discovery** → ask: `"What selenium tools are available?"`

You should see: `selenium_start_session`, `selenium_navigate`, `selenium_find_element`, etc.

If not, see [Troubleshooting](#9-troubleshooting).

### Step 4 — Run Framework Analyzer

```
Switch to: 🔬 Framework Analyzer
Say: "Scan my test project at {path to your test folder}"
```

Confirm `.roo/framework-profile.json` is created and looks correct.

### Step 5 — Discover locators (optional)

```
Switch to: 🔍 XPath Discovery
Say: "Discover all element locators for https://your-app.com/login"
```

Edge opens, maps all elements, writes `tests/locators/LoginPage.locators.json`.

### Step 6 — Generate your first test

```
Switch to: 🎫 Jira Test Creator
Say: "Generate tests for this ticket: PROJ-123 — {paste ticket summary and ACs}"
```

### Step 7 — Run the tests

```
Switch to: ▶️ Test Runner
Say: "Run smoke tests"
```

Edge opens, runs the tests, saves report to `tests/reports/`.

---

## 7. Common Workflows

### Generate test from a ticket

```
Switch to: 🎫 Jira Test Creator
Say: "Generate tests for PROJ-456 — {paste ticket details}"
```

### Run regression suite on staging before release

```powershell
$env:TEST_ENV = "staging"
```
```
Switch to: ▶️ Test Runner
Say: "Run full regression suite on staging"
```

### Fix broken tests after a UI deployment

```
Switch to: 🔧 Test Maintenance
Say: "Fix all failing tests from today's regression run"
```

### Check test coverage

```
Switch to: 📊 Test Gap Analyzer
Say: "What tickets have no tests?
     PROJ-123 | Story | High | User Login
     PROJ-124 | Bug   | P0   | Cart bug
     ..."
```

### Re-discover locators after UI redesign

```
Switch to: 🔍 XPath Discovery
Say: "Re-map all locators for https://your-app.com — the UI was redesigned"
```

### Run headless for CI/CD

Set in `.env`: `SELENIUM_HEADLESS=true`

Or in `.mcp.json`: `"SELENIUM_HEADLESS": "true"`

---

## 8. Project Folder Structure

```
seleniummcp/
│
├── .mcp.json                    ← Selenium MCP server config (Edge only)
├── .roomodes                    ← All 8 Roo Code agent definitions
├── package.json                 ← npm deps (@angiejones/mcp-selenium)
├── .env.example                 ← Template for your .env file
├── .env                         ← Your settings (NOT in git)
├── .gitignore
│
├── SETUP.md                     ← This file
├── EDGE-DRIVER-SETUP.md         ← Step-by-step Edge driver install
│
├── config/
│   ├── environments.json        ← App URLs per environment
│   └── selenium.config.json     ← Browser, timeouts, retries, quality gate
│
├── .roo/
│   ├── framework-profile.json          ← Written by Framework Analyzer (shared)
│   ├── framework-profile.example.json  ← Schema reference
│   ├── rules/
│   │   └── 00-global-selenium.md       ← Global rules for all agents
│   ├── rules-framework-analyzer/01-agent.md
│   ├── rules-jira-test-creator/01-agent.md
│   ├── rules-xpath-discovery/01-agent.md
│   ├── rules-test-runner/01-agent.md
│   ├── rules-test-maintenance/01-agent.md
│   ├── rules-pipeline-orchestrator/01-agent.md
│   ├── rules-test-gap-analyzer/01-agent.md
│   └── rules-test-data-manager/01-agent.md
│
└── tests/
    ├── locators/                 ← Selector registries (XPath Discovery output)
    ├── fixtures/                 ← Test data files (Test Data Manager output)
    ├── screenshots/failures/     ← Captured on test failure
    ├── screenshots/baseline/     ← Visual baselines
    ├── reports/                  ← Execution reports (not tracked in git)
    ├── pipeline-state.json       ← Pipeline run state
    └── maintenance-log.md        ← History of all test fixes
```

---

## 9. Troubleshooting

### MCP tools not showing in Roo Code

1. Verify Node.js: `node --version` (must be 18+)
2. Run `npm install` in `c:\NewInitiatives\seleniummcp`
3. Check `.mcp.json` is in the project root and valid JSON
4. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
5. Open Roo Code output panel → look for errors starting with `[MCP]`

---

### Edge browser doesn't open / "msedgedriver not found"

1. Verify driver in PATH: open a **new** PowerShell → `msedgedriver --version`
2. If missing, the driver at `C:\SeleniumTest\edgedriver_win64\` may not be in PATH — add it:
   ```powershell
   $p = [Environment]::GetEnvironmentVariable("Path","User")
   [Environment]::SetEnvironmentVariable("Path","$p;C:\SeleniumTest\edgedriver_win64","User")
   ```
   Then open a **new** PowerShell window.

---

### Edge version mismatch error

```
SessionNotCreatedException: This version of msedgedriver only supports MSEdge version 133
```

An old `msedgedriver.exe` at `C:\SeleniumTest\edgedriver_win64\` (version 133) is being picked up before selenium-manager can use the correct one. Fix:

```powershell
# Rename the old driver so it's no longer found in PATH
Rename-Item "C:\SeleniumTest\edgedriver_win64\msedgedriver.exe" "msedgedriver.exe.133.bak"
```

On next run, selenium-manager will auto-download msedgedriver 148 and cache it. No manual download needed.

---

### Framework Analyzer can't find test files

Tell it explicitly: `"Scan my project at src/test/java/"` or whichever path your tests live in.

---

### Tests pass locally but fail in CI

1. Set `SELENIUM_HEADLESS=true` in CI environment variables
2. Ensure msedgedriver matching the CI Edge version is installed on the CI machine

---

## Quick Reference Card

| Task | Agent | What to say |
|------|-------|------------|
| First time setup | 🔬 Framework Analyzer | `"Scan my test project at {path}"` |
| Generate tests from ticket | 🎫 Jira Test Creator | `"Generate tests for PROJ-123"` |
| Discover page locators | 🔍 XPath Discovery | `"Discover locators for {url}"` |
| Run tests | ▶️ Test Runner | `"Run regression suite on staging"` |
| Fix broken tests | 🔧 Test Maintenance | `"Fix all failing tests"` |
| Full sprint pipeline | 🔄 Pipeline Orchestrator | `"Run full pipeline for Sprint 42"` |
| Coverage report | 📊 Test Gap Analyzer | `"What tickets have no tests in Sprint 42?"` |
| Manage test data | 📦 Test Data Manager | `"Extract hardcoded data to fixtures"` |
