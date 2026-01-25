const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

// Enable Chrome's native print preview
app.commandLine.appendSwitch("enable-print-preview");

// Disable Autofill features to suppress DevTools warnings
app.commandLine.appendSwitch(
  "disable-features",
  "Autofill,AutofillServerCommunication,AutofillShowTypePredictions",
);

let mainWindow;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    title: "KES Billing Terminal",
    icon: path.join(__dirname, "../public/kes_logo.jpeg"),
    show: false, // Performance: show window only when content is ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
      enableRemoteModule: false,
      devTools: !app.isPackaged, // Disable devtools in production
    },
  });

  // Performance: show window only when content is ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Security: Prevent navigation to untrusted sites
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const parsedUrl = new URL(url);
    const allowedHosts = ["localhost"];
    const allowedProtocols = ["file:", "https:"];

    if (app.isPackaged) {
      // In production, only allow file protocol (local assets) or our backend
      if (
        parsedUrl.protocol !== "file:" &&
        !url.includes("kumaran-e-services.onrender.com")
      ) {
        event.preventDefault();
        shell.openExternal(url); // Open external links in default browser
      }
    } else {
      // In dev, allow localhost
      if (
        parsedUrl.hostname !== "localhost" &&
        parsedUrl.protocol !== "file:"
      ) {
        event.preventDefault();
        shell.openExternal(url);
      }
    }
  });

  // Security: Deny all new window requests, open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Cross-site cookie handling for production backend
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
      callback({ requestHeaders: details.requestHeaders });
    },
  );

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// IPC Handler for printing
ipcMain.handle("print", async (event, options) => {
  const { html, silent, printerName, color, pageSize, landscape } = options;

  if (!silent) {
    return { success: false, useBrowserPrint: true };
  }

  try {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    // Wait for content to render
    await new Promise((resolve) => setTimeout(resolve, 800)); // Slightly longer for production stability

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
    if (!mainWindow) return [];
    return await mainWindow.webContents.getPrintersAsync();
  } catch (error) {
    console.error("Error getting printers:", error);
    return [];
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Catch unhandled errors in main process
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
