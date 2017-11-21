const glob = require('glob')
const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const globalShortcut = electron.globalShortcut
const path = require('path')
const url = require('url')




// const autoUpdater = require('./auto-updater')

// const debug = /--debug/.test(process.argv[2])

// console.log(debug);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 680
    //titleBarStyle: 'hidden'
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './assets/html/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  //mainWindow.webContents.openDevTools({mode:"detach"});
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})


//快捷键调出chrome控制台
app.on('ready', function () {
  globalShortcut.register('CommandOrControl+Alt+I', function () {
    if(mainWindow.webContents.isDevToolsOpened()){
      mainWindow.webContents.closeDevTools();
    }else{
      mainWindow.webContents.openDevTools({mode:"detach"});
    }
  })
})


app.on('will-quit', function () {
  globalShortcut.unregisterAll()
})


const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;

ipc.on('get-app-path', function (event) {
  event.sender.send('got-app-path', app.getAppPath())
})

ipc.on('open-fold-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function (files) {
    if (files) event.sender.send('selected-directory', files)
  })
})


ipc.on('change-fold-dialog', function (event,path,order) {
  dialog.showOpenDialog({
    defaultPath : path ,
    properties: ['openDirectory']
  }, function (files) {
    if (files) event.sender.send('change-directory', files,order)
  })
})



// ipc.on('open-error-box', function (event) {
//   dialog.showErrorBox("错误标题", "错误内容")
// })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Require each JS file in the main-process dir
function loadDemos () {
  var files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files.forEach(function (file) {
    require(file)
  })
  // autoUpdater.updateMenu()
}

//loadDemos();


//右键菜单
//
// const Menu = electron.Menu;
// const MenuItem = electron.MenuItem;
// const menu = new Menu()
//
// menu.append(new MenuItem({ label: '删除项目',click(){
//   console.log("del click");
//   console.log($('#folder-ul li:active'))
// }}))
//
// app.on('browser-window-created', function (event, win) {
//   win.webContents.on('context-menu', function (e, params) {
//     menu.popup(win, params.x, params.y)
//   })
// })
//
// ipc.on('show-context-menu', function (event) {
//   const win = BrowserWindow.fromWebContents(event.sender)
//   menu.popup(win)
// })
