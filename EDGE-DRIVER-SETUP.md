# Edge WebDriver Setup Guide

Your installed Edge version: **148.0.3967.96**

---

## Step 1 — Download the Matching WebDriver

Open this URL in your browser and download the driver for version **148**:

```
https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
```

- Look for version **148.0.3967.96** (or the closest 148.x match)
- Download the **Windows 64-bit** package
- Extract the ZIP → you get `msedgedriver.exe`

---

## Step 2 — Create a Dedicated Driver Folder

Run this once in PowerShell (no admin required):

```powershell
New-Item -ItemType Directory -Force "C:\WebDrivers"
```

Copy `msedgedriver.exe` into that folder:

```powershell
Copy-Item "C:\Users\$env:USERNAME\Downloads\msedgedriver.exe" "C:\WebDrivers\"
```

---

## Step 3 — Add C:\WebDrivers to Your PATH

### Option A — PowerShell (Permanent, current user)

```powershell
$current = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$current;C:\WebDrivers", "User")
```

Close and reopen PowerShell for the change to take effect.

---

### Option B — Windows GUI (no admin required)

1. Press **Win + S** → type **"Edit environment variables for your account"** → open it
2. In the top section **"User variables"**, select **Path** → click **Edit**
3. Click **New**
4. Type: `C:\WebDrivers`
5. Click **OK** → **OK**

---

## Step 4 — Verify

Open a **new** PowerShell window (important — existing windows won't see the new PATH):

```powershell
msedgedriver --version
```

Expected output:
```
MSEdgeDriver 148.0.3967.96 (...)
```

If you see **"command not found"** — close all PowerShell windows and open a new one, then retry.

---

## Step 5 — Confirm MCP Uses Edge

Your [.mcp.json](.mcp.json) is already configured for Edge:

```json
"SELENIUM_BROWSER": "edge"
```

In Roo Code, switch to **🔍 XPath Discovery** and say:
> "Open the browser and go to https://example.com"

Edge should open and load the page.

---

## When Edge Updates Automatically

Edge updates itself on Windows. When it does, you must update the driver too:

1. Check new version: `edge://settings/help`
2. Download new `msedgedriver.exe` from the link above
3. Replace `C:\WebDrivers\msedgedriver.exe` with the new file

**That's all** — no PATH change needed again.
