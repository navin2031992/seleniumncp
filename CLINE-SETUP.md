# Selenium MCP — Cline Plugin Setup Guide

> This guide is for using the **Cline** VS Code extension.
> If you use **Roo Code**, see [SETUP.md](SETUP.md) instead — it has native agent mode switching.

---

## Roo Code vs Cline — Key Difference

| | Roo Code | Cline |
|-|----------|-------|
| Agent switching | UI dropdown (`.roomodes`) | `.\switch-agent.ps1 {name}` |
| Per-agent rules | Auto-loaded from `.roo/rules-{slug}/` | `.clinerules` file (swapped by script) |
| MCP servers | `.mcp.json` (project root) | `.mcp.json` (same file — works identically) |
| Jira integration | Corporate LLM | Corporate LLM |
| Selenium tools | `selenium_*` MCP tools | `selenium_*` MCP tools |

**Same power, different UX.** The underlying capabilities are identical.

---

## Prerequisites

All the same as SETUP.md — Node.js 24, `npm install` already run, Edge 148.
See [SETUP.md § 1](SETUP.md#1-prerequisites--critical-do-these-first) if not done.

---

## Step 1 — Install Cline

Open VS Code → Extensions (`Ctrl+Shift+X`) → search **"Cline"** → Install.

---

## Step 2 — Configure MCP Server in Cline

Cline reads `.mcp.json` from the project root (same file as Roo Code).
The Selenium MCP server is already configured — no extra setup needed.

To verify: open Cline → look for the MCP tools icon → you should see `selenium_*` tools listed.

> If Cline does not pick up `.mcp.json` automatically (older versions):
> Open Cline settings → MCP Servers → add manually:
> ```json
> {
>   "selenium": {
>     "command": "npx",
>     "args": ["-y", "@angiejones/mcp-selenium"],
>     "env": { "SELENIUM_BROWSER": "edge", "SELENIUM_HEADLESS": "false" }
>   }
> }
> ```

---

## Step 3 — Switch to Your Agent

Run the switch script in PowerShell from the project root:

```powershell
cd c:\NewInitiatives\seleniummcp
.\switch-agent.ps1
```

This shows an interactive menu:

```
  [1] 🔬 Framework Analyzer    Scan project → write framework-profile.json
  [2] 🎫 Jira Test Creator     Jira ticket → generate tests in project style
  [3] 🔍 XPath Discovery       Open Edge → discover + validate element locators
  [4] ▶️  Test Runner           Execute suite, capture screenshots, write report
  [5] 🔧 Test Maintenance      Diagnose failures, heal broken selectors
  [6] 🔄 Pipeline Orchestrator Full end-to-end pipeline (all stages)
  [7] 📊 Test Gap Analyzer     Which Jira tickets have no tests?
  [8] 📦 Test Data Manager     Extract hardcoded data → fixture JSON files

  Enter number (1-8):
```

Or pass the slug directly:

```powershell
.\switch-agent.ps1 xpath-discovery
.\switch-agent.ps1 test-runner
.\switch-agent.ps1 jira-test-creator
```

---

## Step 4 — Start a New Cline Task

After switching, **start a new Cline task** (click the `+` button or type `/reset`).
Cline reloads `.clinerules` at the start of each new task.

---

## The 8 Agents

### 1 — 🔬 Framework Analyzer
**Switch:** `.\switch-agent.ps1 framework-analyzer`

**Test prompt:**
```
Scan the test project at C:\SeleniumTest and identify the test framework, language, folder structure, run command, and naming conventions. Write results to .roo/framework-profile.json.
```

---

### 2 — 🎫 Jira Test Creator
**Switch:** `.\switch-agent.ps1 jira-test-creator`

**Test prompt (with ticket paste):**
```
Generate tests for this ticket:
DEMO-101 | Story | High | User Login

Acceptance Criteria:
1. Valid credentials → redirect to dashboard
2. Wrong password → "Invalid password" error
3. Empty fields → validation errors

Framework: JavaScript Playwright, tests in tests/specs/, use describe/it, assertions use expect().
```

**Test prompt (with Jira integration):**
```
Generate tests for ticket PROJ-123 from Jira.
```

---

### 3 — 🔍 XPath Discovery
**Switch:** `.\switch-agent.ps1 xpath-discovery`

**Test prompt:**
```
Discover all interactive element locators on https://the-internet.herokuapp.com/login using Selenium MCP (Edge browser). Validate every selector on the live page. Save results to tests/locators/HerokuLoginPage.locators.json.
```

**What to observe:** Edge browser opens automatically.

---

### 4 — ▶️ Test Runner
**Switch:** `.\switch-agent.ps1 test-runner`

**Test prompt:**
```
Open Edge using Selenium MCP and run this manual test:
1. Navigate to https://the-internet.herokuapp.com/login
2. Type "tomsmith" into the username field
3. Type "SuperSecretPassword!" into the password field
4. Click the login button
5. Verify the success message "You logged into a secure area!" is visible
6. Take a screenshot
7. Report PASS or FAIL

Save report to tests/reports/manual-login-run.json.
```

---

### 5 — 🔧 Test Maintenance
**Switch:** `.\switch-agent.ps1 test-maintenance`

**Test prompt:**
```
The login button selector "#loginBtn" on https://the-internet.herokuapp.com/login is broken (element not found). Open Edge, navigate to the page, find the correct selector for the login button, validate it, and update tests/locators/HerokuLoginPage.locators.json. Log the fix to tests/maintenance-log.md.
```

---

### 6 — 🔄 Pipeline Orchestrator
**Switch:** `.\switch-agent.ps1 pipeline-orchestrator`

**Test prompt:**
```
Run a mini pipeline:
Stage 0: Check .roo/framework-profile.json (skip if exists)
Stage 2: Discover locators for https://the-internet.herokuapp.com/login
Stage 3: Generate test stubs for these tickets:
  DEMO-101 | Story | High | User Login
  DEMO-102 | Bug   | P0   | Cart total bug
Stage 6: Write pipeline summary to tests/reports/demo-pipeline-summary.md

Skip Stage 4 (execution) and Stage 5 (maintenance) for this demo.
```

---

### 7 — 📊 Test Gap Analyzer
**Switch:** `.\switch-agent.ps1 test-gap-analyzer`

**Test prompt:**
```
Analyze coverage for these tickets. Scan the tests/ folder for @jira references and report which tickets have no tests:

DEMO-101 | Story | High   | User Login
DEMO-102 | Bug   | P0     | Cart total bug
DEMO-103 | Story | Medium | Profile Edit
DEMO-104 | Bug   | High   | Password reset not sent
DEMO-105 | Task  | Low    | Footer links update

Write gap report to tests/reports/test-gap-analysis-demo.md and tests/reports/test-gap-analysis-demo.json.
```

---

### 8 — 📦 Test Data Manager
**Switch:** `.\switch-agent.ps1 test-data-manager`

**Test prompt:**
```
Extract all hardcoded values from this test snippet to tests/fixtures/login-fixtures.json:

describe('Login', () => {
  it('logs in with valid credentials', async ({ page }) => {
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('#login');
    await expect(page.locator('.flash.success')).toContainText('You logged into a secure area!');
  });
});

Show the updated test with fixture imports.
```

---

## File Structure Added for Cline

```
seleniummcp/
├── .clinerules               ← Active agent rules (loaded by Cline each session)
├── switch-agent.ps1          ← Swap active agent
├── CLINE-SETUP.md            ← This file
│
└── .cline/
    ├── rules-framework-analyzer.md
    ├── rules-jira-test-creator.md
    ├── rules-xpath-discovery.md
    ├── rules-test-runner.md
    ├── rules-test-maintenance.md
    ├── rules-pipeline-orchestrator.md
    ├── rules-test-gap-analyzer.md
    └── rules-test-data-manager.md
```

---

## Quick Reference

```powershell
# Switch to any agent:
.\switch-agent.ps1 framework-analyzer
.\switch-agent.ps1 jira-test-creator
.\switch-agent.ps1 xpath-discovery
.\switch-agent.ps1 test-runner
.\switch-agent.ps1 test-maintenance
.\switch-agent.ps1 pipeline-orchestrator
.\switch-agent.ps1 test-gap-analyzer
.\switch-agent.ps1 test-data-manager

# Verify full setup (Edge browser, MCP, agents):
node verify-setup.js
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Cline doesn't see MCP tools | Open Cline settings → MCP tab → verify selenium server is listed and green |
| `.clinerules` not loaded | Cline loads rules at task start — start a NEW task after switching |
| Wrong agent behaviour | Check which rules are in `.clinerules` — run `Get-Content .clinerules -TotalCount 2` |
| Edge doesn't open | Run `node verify-setup.js` to diagnose — check driver path |
| switch-agent.ps1 not found | Run from project root: `cd c:\NewInitiatives\seleniummcp` first |
