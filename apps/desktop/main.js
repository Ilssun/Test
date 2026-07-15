const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

const WEB_DIR = path.join(__dirname, "web");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// Expo's static web export uses root-absolute asset paths (e.g. "/_expo/..."),
// which break under a file:// origin. Serving the export over a local HTTP
// server instead gives those paths a real origin to resolve against.
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const requestPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(WEB_DIR, requestPath);
      if (!filePath.startsWith(WEB_DIR)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          filePath = path.join(WEB_DIR, "index.html");
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: "#F1EEE3",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(async () => {
  const port = await startServer();
  createWindow(port);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
