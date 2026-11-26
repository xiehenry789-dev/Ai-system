// Wizard Meadow as a desktop app: one window that runs the game file, with saves kept by the app.
const {app,BrowserWindow,shell,Menu}=require('electron');
const path=require('path');
Menu.setApplicationMenu(null);
function open(){
  const win=new BrowserWindow({width:1280,height:800,minWidth:800,minHeight:500,show:false,backgroundColor:'#1c1e46',
    title:'Wizard Meadow',icon:path.join(__dirname,'icon.png'),autoHideMenuBar:true,
    webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  win.loadFile(path.join(__dirname,'game.html'));
  win.once('ready-to-show',()=>{win.maximize();win.show();});
  // F11 for fullscreen; links leave the game and open in the browser
  win.webContents.on('before-input-event',(e,i)=>{if(i.type==='keyDown'&&i.key==='F11'){win.setFullScreen(!win.isFullScreen());e.preventDefault();}});
  win.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return {action:'deny'};});
  win.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:')){e.preventDefault();shell.openExternal(url);}});
}
app.whenReady().then(open);
app.on('window-all-closed',()=>app.quit());
