/**
 * verify-setup.js  — run with: node verify-setup.js
 * Verifies the full Selenium MCP + Edge setup end-to-end.
 */

import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

function log(icon, msg) { console.log(`${icon} ${msg}`); }

const results = { timestamp: new Date().toISOString(), checks: [] };

function pass(name, detail = '') {
  results.checks.push({ name, status: 'PASS', detail });
  log('✅', `PASS  ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.checks.push({ name, status: 'FAIL', detail });
  log('❌', `FAIL  ${name}${detail ? ' — ' + detail : ''}`);
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

log('🔍', 'Starting Selenium MCP + Edge setup verification...\n');

// ── Check 1: @angiejones/mcp-selenium installed ───────────────────────────
const mcpPkgPath = 'node_modules/@angiejones/mcp-selenium/package.json';
if (existsSync(mcpPkgPath)) {
  const v = readJsonFile(mcpPkgPath).version;
  pass('@angiejones/mcp-selenium installed', `v${v}`);
} else {
  fail('@angiejones/mcp-selenium installed', 'not found — run: npm install');
}

// ── Check 2: selenium-webdriver installed ─────────────────────────────────
const sdPkgPath = 'node_modules/selenium-webdriver/package.json';
if (existsSync(sdPkgPath)) {
  const v = readJsonFile(sdPkgPath).version;
  pass('selenium-webdriver installed', `v${v}`);
} else {
  fail('selenium-webdriver installed', 'not found');
}

// ── Check 3: selenium-manager present ────────────────────────────────────
const smPath = 'node_modules/selenium-webdriver/bin/windows/selenium-manager.exe';
if (existsSync(smPath)) {
  pass('selenium-manager (auto-driver)', smPath);
} else {
  fail('selenium-manager (auto-driver)', 'binary not found');
}

// ── Check 4: .mcp.json valid and Jira-free ───────────────────────────────
try {
  const mcp = readJsonFile('.mcp.json');
  const servers = Object.keys(mcp.mcpServers);
  const hasSelenium = servers.includes('selenium');
  const hasJira = servers.includes('jira');
  if (hasSelenium && !hasJira) {
    pass('.mcp.json config', `servers: [${servers.join(', ')}] — Jira correctly absent`);
  } else if (!hasSelenium) {
    fail('.mcp.json config', 'missing selenium server');
  } else {
    fail('.mcp.json config', `unexpected jira server present`);
  }
  const seleniumBrowser = mcp.mcpServers.selenium?.env?.SELENIUM_BROWSER;
  if (seleniumBrowser === 'edge') {
    pass('.mcp.json browser', 'SELENIUM_BROWSER=edge');
  } else {
    fail('.mcp.json browser', `SELENIUM_BROWSER=${seleniumBrowser} (expected "edge")`);
  }
} catch (e) {
  fail('.mcp.json config', e.message);
}

// ── Check 5: .roomodes has all 8 agents ──────────────────────────────────
try {
  const modes = readJsonFile('.roomodes');
  const slugs = modes.customModes.map(m => m.slug);
  const required = [
    'framework-analyzer','jira-test-creator','xpath-discovery',
    'test-runner','test-maintenance','pipeline-orchestrator',
    'test-gap-analyzer','test-data-manager'
  ];
  const missing = required.filter(s => !slugs.includes(s));
  if (missing.length === 0) {
    pass('.roomodes agents (8/8)', slugs.map(s => s).join(', '));
  } else {
    fail('.roomodes agents', `missing: ${missing.join(', ')}`);
  }
} catch (e) {
  fail('.roomodes agents', e.message);
}

// ── Check 6: rule files present for each agent ───────────────────────────
const agentSlugs = [
  'framework-analyzer','jira-test-creator','xpath-discovery',
  'test-runner','test-maintenance','pipeline-orchestrator',
  'test-gap-analyzer','test-data-manager'
];
const missingRules = agentSlugs.filter(
  s => !existsSync(`.roo/rules-${s}/01-agent.md`)
);
if (missingRules.length === 0) {
  pass('Agent rule files (8/8)', 'all .roo/rules-{slug}/01-agent.md present');
} else {
  fail('Agent rule files', `missing rules for: ${missingRules.join(', ')}`);
}

// ── Check 7: Global rules present ────────────────────────────────────────
if (existsSync('.roo/rules/00-global-selenium.md')) {
  pass('Global rules file', '.roo/rules/00-global-selenium.md');
} else {
  fail('Global rules file', 'not found');
}

// ── Check 8: Edge browser launch ─────────────────────────────────────────
log('\n🌐', 'Launching Edge browser (will open visibly)...');
let driver = null;
try {
  const opts = new edge.Options();
  driver = await new Builder()
    .forBrowser('MicrosoftEdge')
    .setEdgeOptions(opts)
    .build();
  pass('Edge browser launch', 'browser window opened');
} catch (e) {
  const msg = e.message.split('\n')[0];
  fail('Edge browser launch', msg);
  log('💡', 'Tip: if driver mismatch, rename C:\\SeleniumTest\\edgedriver_win64\\msedgedriver.exe → msedgedriver.exe.133.bak');
  summarize();
  process.exit(1);
}

// ── Check 9: Navigate to URL ─────────────────────────────────────────────
try {
  await driver.get('https://example.com');
  pass('Navigate to URL', 'https://example.com loaded');
} catch (e) {
  fail('Navigate to URL', e.message.split('\n')[0]);
}

// ── Check 10: Find element ───────────────────────────────────────────────
try {
  const h1 = await driver.wait(until.elementLocated(By.css('h1')), 8000);
  const text = await h1.getText();
  pass('Find element (css: h1)', `text="${text}"`);
} catch (e) {
  fail('Find element (css: h1)', e.message.split('\n')[0]);
}

// ── Check 11: Get page title ─────────────────────────────────────────────
try {
  const title = await driver.getTitle();
  pass('Get page title', `"${title}"`);
} catch (e) {
  fail('Get page title', e.message.split('\n')[0]);
}

// ── Check 12: Take screenshot ────────────────────────────────────────────
try {
  mkdirSync('tests/screenshots/failures', { recursive: true });
  const png = await driver.takeScreenshot();
  const dest = 'tests/screenshots/failures/verify-setup-edge.png';
  writeFileSync(dest, Buffer.from(png, 'base64'));
  pass('Screenshot capture', dest);
} catch (e) {
  fail('Screenshot capture', e.message.split('\n')[0]);
}

// ── Check 13: Close browser ──────────────────────────────────────────────
try {
  await driver.quit();
  pass('Browser quit cleanly', 'session ended');
} catch (e) {
  fail('Browser quit', e.message.split('\n')[0]);
}

summarize();

// ── Helpers ──────────────────────────────────────────────────────────────
function summarize() {
  const passed = results.checks.filter(c => c.status === 'PASS').length;
  const failed = results.checks.filter(c => c.status === 'FAIL').length;
  results.summary = failed === 0
    ? `ALL ${passed} checks PASSED`
    : `${failed} FAILED, ${passed} passed`;

  console.log('\n' + '═'.repeat(58));
  if (failed === 0) {
    console.log(`✅  ALL ${passed} CHECKS PASSED — Selenium MCP + Edge is ready`);
  } else {
    console.log(`❌  ${failed} CHECK(S) FAILED  |  ${passed} passed`);
  }
  console.log('═'.repeat(58) + '\n');

  mkdirSync('tests/reports', { recursive: true });
  const outPath = 'tests/reports/verify-setup-results.json';
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  log('📄', `Full results: ${outPath}`);
}
