const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Enable Chrome's native print preview
app.commandLine.appendSwitch("enable-print-preview");

// Disable Autofill features to suppress DevTools warnings
app.commandLine.appendSwitch(
  "disable-features",
  "Autofill,AutofillServerCommunication,AutofillShowTypePredictions",
);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1500,
    title: "KES Billing Terminal",
    icon: path.join(__dirname, "../public/kes_logo.jpeg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Fix for cross-site cookies in Electron
  const filter = {
    urls: ["https://kumaran-e-services.onrender.com/*"],
  };

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    filter,
    (details, callback) => {
      if (details.responseHeaders["set-cookie"]) {
        details.responseHeaders["set-cookie"] = details.responseHeaders[
          "set-cookie"
        ].map((cookie) => {
          // Ensure SameSite=None and Secure for cross-origin tracking
          if (!cookie.includes("SameSite=None")) {
            cookie = cookie.replace(/SameSite=[^;]+/i, "SameSite=None");
            if (!cookie.includes("SameSite=")) cookie += "; SameSite=None";
          }
          if (!cookie.includes("Secure")) {
            cookie += "; Secure";
          }
          return cookie;
        });
      }
      callback({ responseHeaders: details.responseHeaders });
    },
  );

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    filter,
    (details, callback) => {
      // In some Electron versions, cross-origin cookies are stripped.
      // This ensures they are passed through.
      callback({ requestHeaders: details.requestHeaders });
    },
  );

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    // Keep devtools open for debugging production issues if needed
    // mainWindow.webContents.openDevTools();
  }
}

// IPC Handler for printing with preview support
// IPC Handler for printing
ipcMain.handle("print", async (event, options) => {
  const { html, silent, printerName, color, pageSize, landscape } = options;

  // We only handle SILENT printing in the main process.
  // Manual printing (preview) is handled by the renderer using window.print()
  if (!silent) {
    return { success: false, useBrowserPrint: true };
  }

  try {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    // Wait for content to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    const printOptions = {
      silent: true,
      printBackground: true,
      color: color !== false,
      pageSize: pageSize || "A4",
      landscape: landscape || false,
    };

    if (printerName) {
      printOptions.deviceName = printerName;
    }

    await printWindow.webContents.print(printOptions);
    printWindow.close();
    return { success: true };
  } catch (error) {
    console.error("Print error:", error);
    return { success: false, error: error.message };
  }
});

// IPC Handler for getting available printers
ipcMain.handle("get-printers", async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers;
  } catch (error) {
    console.error("Error getting printers:", error);
    return [];
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
