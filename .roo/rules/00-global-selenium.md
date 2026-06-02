# Global Rules — Selenium MCP Automation

## How This Setup Works

```
YOUR EXISTING PROJECT (any language / any framework)
                │
                ▼
  ┌─────────────────────────┐
  │  🔬 Framework Analyzer  │  ──►  .roo/framework-profile.json
  │  Run FIRST, one time    │       (shared memory for all agents)
  └─────────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
  ┌─────────────┐  ┌──────────────────┐
  │  🔍 XPath   │  │  🎫 Jira Test    │
  │  Discovery  │  │  Creator         │
  │  (optional) │  │  Give ticket ID  │
  └─────────────┘  └──────────────────┘
        │                │
        └───────┬─────────┘
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

Also available:
  📊 Test Gap Analyzer   — which Jira tickets have no tests?
  📦 Test Data Manager   — manage test fixtures and data files
```

## Agent Execution Order (First Time)

| Step | Agent | What it does |
|------|-------|-------------|
| 1 | **🔬 Framework Analyzer** | Scans your project, writes `.roo/framework-profile.json` |
| 2 | **🔍 XPath Discovery** *(optional)* | Navigates live app pages, maps all element selectors |
| 3 | **🎫 Jira Test Creator** | Give it a ticket ID → generates tests in your project's exact style |
| 4 | **▶️ Test Runner** | Runs the suite using your framework's run command |
| 5 | **🔧 Test Maintenance** | Heals broken selectors, diagnoses failures |
| OR | **🔄 Pipeline Orchestrator** | Runs steps 1–5 end-to-end automatically |

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

## Jira MCP Tools Quick Reference

| Tool | Purpose |
|------|---------|
| `jira_get_issue` | Fetch single ticket: `jira_get_issue(issueKey: "PROJ-123")` |
| `jira_search_issues` | JQL search: `jira_search_issues(jql: "sprint = 42 AND type = Story")` |
| `jira_get_issue_comments` | Get comments on a ticket (QA notes often here) |
| `jira_list_sprints` | List sprints: `jira_list_sprints(boardId: 1)` |

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
