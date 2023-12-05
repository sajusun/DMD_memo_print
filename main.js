const { app, BrowserWindow, webContents, ipcMain, ipcRenderer } = require('electron');
const url = require('url')
const path = require('path')
var os = require('os-utils');
var mainWin;

function createWindow() {
    mainWin = new BrowserWindow({
        width: 800,
        height: 600,
        minHeight: 600,
        minWidth: 800,
        maxHeight: 600,
        maxWidth: 800,
        icon: __dirname + "/icon.gif",
        maximizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWin.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    //win.loadFile('index.html');
    // Open the DevTools.
    mainWin.webContents.openDevTools();
}

function memoWindow() {
    var win2 = new BrowserWindow({
        width: 800,
        height: 750,
        minHeight: 750,
        minWidth: 800,
        maxHeight: 750,
        maxWidth: 800,
        maximizable: false,
        minimizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win2.loadFile('./memo/index.html');
    // win2.webContents.openDevTools();
}

// Open memo window event
ipcMain.on('openMemo', function(event, mgs) {
    if (mgs === "memo") {
        memoWindow();
    }
});
ipcMain.on('osInfo', function(event, arg) {
    os.cpuUsage(function(v) {
        event.sender.send('cpu', v);
        event.sender.send('mem', os.freememPercentage());
        event.sender.send('total-mem', os.totalmem());
    });
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});