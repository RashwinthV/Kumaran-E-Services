const { app, BrowserWindow } = require("electron");
const path = require("path");

// Disable Autofill features to suppress DevTools warnings
app.commandLine.appendSwitch(
  "disable-features",
  "Autofill,AutofillServerCommunication",
);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "KES Admin",
    icon: path.join(__dirname, "../public/kes_logo.jpeg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Remove menu bar
  win.setMenuBarVisibility(false);

  // Fix for cross-site cookies in Electron
  const filter = {
    urls: ["https://kumaran-e-services.onrender.com/*"],
  };

  win.webContents.session.webRequest.onHeadersReceived(
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

  win.webContents.session.webRequest.onBeforeSendHeaders(
    filter,
    (details, callback) => {
      // In some Electron versions, cross-origin cookies are stripped.
      // This ensures they are passed through.
      callback({ requestHeaders: details.requestHeaders });
    },
  );

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
    // Keep devtools open for debugging production issues if needed
    win.webContents.openDevTools();
  }
}

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
