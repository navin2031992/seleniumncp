# Global Rules — Selenium MCP Automation

## How This Setup Works

```
YOUR EXISTING PROJECT (any language / any framework)
                │
                ▼
  ┌─────────────────────────┐
  │  🔬 Framework Analyzer  │  ──►  .roo/framework-profile.json
  │  Run FIRST, always      │       (shared memory for all agents)
  └─────────────────────────┘
                │
                ├──────────────────────────────────────────────────────────┐
                │  (OPTIONAL — run if migrating to BDD)                    │
                ▼                                                           │
  ┌──────────────────────────────────────────────────────┐                 │
  │  🔄 BDD Converter                                    │                 │
  │                                                      │                 │
  │  Asks: Playwright BDD or Selenium BDD?               │                 │
  │  Converts every test file to:                        │                 │
  │    • Gherkin .feature files                          │                 │
  │    • Step definition files (language-native)         │                 │
  │    • Page Objects (updated to BDD style)             │                 │
  │    • Config + dependency files                       │                 │
  │  Updates framework-profile.json → bdd: true          │                 │
  │  Originals kept until you confirm migration works    │                 │
  └──────────────────────────────────────────────────────┘                 │
                │                                                           │
                └───────────────────────────────────────────────────────────┘
                │
                ▼
  ┌──────────────────────────────────────────────────────┐
  │  🎫 Jira Test Creator  (browser-driven)              │
  │                                                      │
  │  1. Read Jira ticket → extract scenarios             │
  │  2. Open Edge → walk every scenario LIVE             │
  │  3. Capture validated selector at each step          │
  │  4. Capture real assertion text from the DOM         │
  │  5. Write tests/locators/{Page}.locators.json        │
  │  6. Generate test file using ONLY live selectors     │
  │     (in BDD style if framework-profile.json bdd:true)│
  └──────────────────────────────────────────────────────┘
                │
                ▼
        ┌──────────────┐
        │  ▶️ Test     │
        │  Runner      │
        └──────────────┘
                │
                ▼
        ┌──────────────┐
        │  🔧 Test     │
        │  Maintenance │
        └──────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │  🔄 Pipeline Orchestrator       │
  │  (runs all the above end-to-end)│
  └─────────────────────────────────┘

Also available (standalone):
  🔍 XPath Discovery  — standalone page mapping (use when no ticket exists yet)
  📊 Test Gap Analyzer   — which tickets/stories have no tests?
  📦 Test Data Manager   — manage test fixtures and data files
```

## Agent Execution Order (First Time)

| Step | Agent | What it does | Required? |
|------|-------|-------------|-----------|
| 1 | **🔬 Framework Analyzer** | Scans your project, writes `.roo/framework-profile.json` | Always |
| 2 | **🔄 BDD Converter** | Converts entire project to Playwright BDD or Selenium BDD | Only if migrating to BDD |
| 3 | **🎫 Jira Test Creator** | Reads ticket → walks scenarios live in Edge → captures real selectors → generates test | Always for new tickets |
| 4 | **▶️ Test Runner** | Runs the suite using your framework's run command | Always |
| 5 | **🔧 Test Maintenance** | Heals any remaining broken selectors, diagnoses failures | On failure |
| OR | **🔄 Pipeline Orchestrator** | Runs steps 1, 3–5 end-to-end automatically | Full automation |

> **BDD Converter runs only once per migration.** After conversion, all subsequent test generation
> (via Jira Test Creator) automatically produces BDD-style output because `framework-profile.json`
> is updated to `bdd: true`.

> **XPath Discovery** is no longer a mandatory pipeline step. The Jira Test Creator discovers
> selectors inline during the browser walkthrough. Use XPath Discovery only for standalone
> exploratory page mapping.

## The Framework Profile — Shared Memory

`.roo/framework-profile.json` is the single source of truth about this project.

**Every agent reads this file. It must exist before any other agent runs.**
**If it does not exist → run Framework Analyzer first.**

```json
{
  "language": "java",
  "testFramework": "cucumber-testng",
  "runCommand": "mvn test",
  "runSmoke": "mvn test -Psmoke",
  "structure": {
    "testRoot": "src/test/java/com/example",
    "featureFiles": "src/test/resources/features"
  },
  "codeTemplate": "...verbatim content of an existing test file..."
}
```

See `.roo/framework-profile.example.json` for the complete schema.

## Browser Configuration

Default browser: **Microsoft Edge** (system-installed)

To change browser, set `SELENIUM_BROWSER` in `.env`:
```
SELENIUM_BROWSER=edge      # Microsoft Edge (default)
SELENIUM_BROWSER=chrome    # Google Chrome
SELENIUM_BROWSER=firefox   # Mozilla Firefox
```

For headless CI runs:
```
SELENIUM_HEADLESS=true
```

See `EDGE-DRIVER-SETUP.md` for Edge WebDriver installation steps.

## Jira Integration

Jira is accessible via the **corporate LLM's built-in integration** — no separate Jira MCP package is configured in `.mcp.json`. Use the LLM's built-in ability to search and read Jira tickets directly.

Common Jira operations:
- Fetch a ticket: retrieve issue `PROJ-123` with its summary, description, and acceptance criteria
- Search by sprint: find all Stories/Bugs/Tasks in `Sprint 42`
- Filter by status: find open tickets for a project

## MCP Selenium Tools Quick Reference

| Tool | Purpose |
|------|---------|
| `selenium_start_session` | Open browser (`browser: "edge"/"chrome"/"firefox"`) |
| `selenium_navigate` | Navigate to URL |
| `selenium_find_element` | Find element (`strategy: "id"/"css"/"xpath"/"name"`) |
| `selenium_click` | Click an element |
| `selenium_type` | Type text into an input |
| `selenium_get_text` | Get visible text of element |
| `selenium_get_attribute` | Get attribute value |
| `selenium_screenshot` | Capture full-page screenshot |
| `selenium_wait_for_element` | Wait until element is visible/present |
| `selenium_execute_script` | Run JavaScript in browser context |
| `selenium_select_option` | Choose an option from a dropdown |
| `selenium_hover` | Hover over an element |
| `selenium_get_page_source` | Get full HTML of current page |
| `selenium_close_session` | Close browser and end session |

## Locator Registry Format

`tests/locators/{PageName}.locators.json` — written by XPath Discovery, read by all agents:

```json
{
  "page": "LoginPage",
  "url": "/login",
  "discoveredAt": "2024-01-15T10:30:00Z",
  "elements": {
    "usernameField": {
      "primary":  { "strategy": "id",  "value": "username",           "validated": true },
      "fallback": { "strategy": "css", "value": "input[name='username']", "validated": true },
      "stable": true
    },
    "loginButton": {
      "primary":  { "strategy": "css",   "value": "[data-testid='login-btn']", "validated": true },
      "fallback": { "strategy": "xpath", "value": "//button[normalize-space()='Login']", "validated": true },
      "stable": true
    }
  }
}
```

## Shared Folder Structure

These folders are shared infrastructure used by all agents:

```
tests/
  locators/               ← selector registries (XPath Discovery)
  screenshots/
    failures/             ← captured on test failure (Test Runner)
    baseline/             ← visual baselines
  reports/                ← execution reports (Test Runner, Pipeline)
  fixtures/               ← test data files (Test Data Manager)
  maintenance-log.md      ← log of all fixes (Test Maintenance)
  pipeline-state.json     ← pipeline run state (Pipeline Orchestrator)

.roo/
  framework-profile.json         ← project understanding (Framework Analyzer)
  framework-profile.example.json ← schema reference
  rules/                         ← these global rules
  rules-{agent-slug}/            ← per-agent detailed instructions

config/
  environments.json    ← URLs per environment (dev/staging/prod)
  jira.config.json     ← Jira connection settings
  selenium.config.json ← browser/timeout/retry settings
```

Your actual test code lives inside your **existing project structure** — exactly where it already is. These folders are additive infrastructure, not replacements.
