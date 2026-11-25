// Usage: node record.js <gameHtml> <outDir> <fps> <w> <h>
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [GAME,OUT,FPS0,W0,H0]=process.argv.slice(2);const FPS=+FPS0||24,W=+W0||1280,H=+H0||720;
fs.mkdirSync(OUT,{recursive:true});
let html=fs.readFileSync(GAME,'utf8');
// recording hooks, added to an in-memory copy only
html=html.replace('window.__wm={','window.__wm={gH:groundH,staffScene,VOLC:typeof VOLC!=="undefined"?VOLC:{x:1440,z:0},LIGHT:typeof LIGHT!=="undefined"?LIGHT:{x:-40,z:1410},KING:typeof KING!=="undefined"?KING:null,cleanup:()=>{for(const e of enemies)e.despawn=true;},');
html=html.replace('if(time>4&&!paused()){','if(false){');
html=html.replace('function storyCard(title,lines,btn){','function storyCard(title,lines,btn){return;'); // no story narration in the trailer
html=html.replace('function cutPlay(title,shots){','function cutPlay(title,shots){return;'); // no cutscenes in the trailer
html=html.replace('function updateBadge(e,show){','function updateBadge(e,show){if(window.__vt&&window.__vt.on){e.badge.visible=false;e.bar.bg.visible=e.bar.fill.visible=false;return;}'); // no badges or health bars in the trailer
html=html.replace('const g=FAIRY.g,show=!homeOpen','const g=FAIRY.g,show=!window.__vt.on&&!homeOpen'); // no fairy in the trailer
html=html.replace('function frame(now){\n  requestAnimationFrame(frame);','function frame(now){\n  requestAnimationFrame(frame);if(window.__vt.on){if(!window.__vt.go)return;now=window.__vt.t;window.__vt.go=false;setTimeout(window.__vt.res,0);}'); // the game only moves on when the recorder asks for the next frame
html=html.replace('const raw=(now-last)/1000;last=now;let dt=(homeOpen||','const raw=(now-last)/1000;last=now;let dt=(raw<=0||homeOpen||'); // keep full quality while frames take long to render
const css='<style>body{margin:0}[hidden]{display:none!important}#flash,#hurt,#vig{display:none!important}#tov{position:fixed;inset:0;z-index:999;pointer-events:none;width:100vw;height:100vh}#hud,#mute,#mini,#status,#feed,#tracker,#prompt,#cross,#fairy,#lvlup,#bar,#pause,#bossbar,#dmg,#joy,#jump,#strike,#bagbtn,#bookbtn,#broombtn,#hint,#spellname,#wave,#story,#narr,#ach,#combo,#riftbar{display:none!important}'+
 '#tr{position:fixed;inset:0;z-index:999;pointer-events:none;font-family:Cinzel,Georgia,serif}#tr .bar{position:absolute;left:0;right:0;height:11%;background:#000}#tr .t{top:0}#tr .b{bottom:0}'+
 '#tr .blk{position:absolute;inset:0;background:#000;opacity:0}#tr .cap{position:absolute;left:0;right:0;bottom:16%;text-align:center;color:#f6efdc;font-size:'+Math.round(H*0.05)+'px;letter-spacing:.08em;text-shadow:0 3px 18px rgba(0,0,0,.85);opacity:0}'+
 '#tr .logo{position:absolute;left:0;right:0;top:36%;text-align:center;color:#ffd98a;font-size:'+Math.round(H*0.13)+'px;font-weight:700;letter-spacing:.12em;text-shadow:0 6px 40px rgba(0,0,0,.9);opacity:0}'+
 '#tr .tag{position:absolute;left:0;right:0;top:56%;text-align:center;color:#f6efdc;font-size:'+Math.round(H*0.035)+'px;letter-spacing:.3em;opacity:0}</style>';
let three=null;try{three=fs.readFileSync(require.resolve('three/build/three.min.js',{paths:[process.env.THREE_DIR||__dirname,process.cwd()]}));}catch(e){} // else it loads from the CDN
(async()=>{
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});const pg=await ctx.newPage();
  pg.on('pageerror',e=>console.log('[pageerror]',e.message));
  await pg.addInitScript(()=>{try{localStorage.setItem('wizard-meadow-gfx',process.env.TRAILER_GFX||'fast');localStorage.setItem('wizard-meadow-settings',JSON.stringify({fairy:false,sound:false,vol:0,cycle:false,weather:false}));localStorage.removeItem('wizard-meadow-save-1');}catch(e){}
    const rp=performance.now.bind(performance);window.__vt={on:false,t:0,go:false,res:null};performance.now=()=>window.__vt.on?window.__vt.t:rp();
    window.__vtStart=()=>{window.__vt.t=rp();window.__vt.on=true;};});
  await pg.route('**/*',r=>{const u=r.request().url();if(u.includes('three.min.js'))return three?r.fulfill({body:three,contentType:'application/javascript'}):r.continue();
    if(u.startsWith('http://game/'))return r.fulfill({body:'<!doctype html><html><head><meta charset="utf-8">'+css+'</head><body>'+html,contentType:'text/html'});return r.abort();});
  await pg.goto('http://game/');await pg.waitForFunction(()=>window.__wm&&document.getElementById('hmnew'),null,{timeout:180000});await pg.waitForTimeout(3000);
  await pg.evaluate(()=>{document.getElementById('hmnew').click();});await pg.waitForTimeout(8000);
  const shots=await pg.evaluate(fs.readFileSync(path.join(__dirname,'shots.js'),'utf8').replace(/^\/\/.*\n/,'').replace(/^/,'window.__SHOTS=').concat(';window.__SHOTS.map(s=>({dur:s.dur,title:s.title||"",sub:s.sub||"",black:!!s.black,logo:s.logo||0}))'));
  await pg.evaluate(()=>{const w=window.__wm;w.SKILL.tut=99;w.SKILL.up.broom=1;if(!w.BROOM.on)w.toggleBroom();w.staffScene.visible=false;w.COMBAT.on=true;
    const cv=document.createElement('canvas');cv.id='tov';cv.width=innerWidth;cv.height=innerHeight;document.body.appendChild(cv);window.__vtStart();});
  // frames arrive through the browser's screencast as soon as each one is drawn
  const cdp=await ctx.newCDPSession(pg);let lastFrame=null,waiter=null;
  cdp.on('Page.screencastFrame',ev=>{cdp.send('Page.screencastFrameAck',{sessionId:ev.sessionId}).catch(()=>{});lastFrame=ev.data;if(waiter){const w=waiter;waiter=null;w();}});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:W,maxHeight:H,everyNthFrame:1});
  const nextFrame=(ms)=>new Promise(r=>{waiter=r;setTimeout(()=>{if(waiter===r){waiter=null;r();}},ms||60000);});let idCache={d:null,v:-1};
  // frame numbers are read by a small Python helper (decoding frames inside the browser leaks memory)
  const py=require('child_process').spawn('python3',[path.join(__dirname,'stampread.py'),String(H)],{stdio:['pipe','pipe','inherit']});let pyBuf='',pyQ=[];
  py.stdout.on('data',d=>{pyBuf+=d;let i;while((i=pyBuf.indexOf('\n'))>=0){const v=+pyBuf.slice(0,i);pyBuf=pyBuf.slice(i+1);const r=pyQ.shift();if(r)r(v);}});
  const readStamp=d=>new Promise(r=>{pyQ.push(r);py.stdin.write(d+'\n');});
  const cuts=[];let n=0,t=0;
  const only=process.env.TRAILER_ONLY?process.env.TRAILER_ONLY.split(',').map(Number):null; // e.g. TRAILER_ONLY=3,8 to test a few shots
  for(const s of shots){cuts.push(+t.toFixed(3));t+=Math.round(s.dur*FPS)/FPS;} // timings of the whole trailer, whichever shots this run records
  for(let si=0;si<shots.length;si++){if(only&&!only.includes(si))continue;const s=shots[si],frames=Math.round(s.dur*FPS);let k=0;
    await pg.evaluate(([si,frames])=>{const S=window.__SHOTS[si];S.frames=frames;if(S.setup)S.setup();},[si,frames]);
    for(let f=-8;f<frames;f++){ // 8 warm-up frames before each shot settle the scenery

      await pg.evaluate(([si,f,frames,dt,W,H])=>{const S=window.__SHOTS[si],w=window.__wm,p=w.player,u=Math.max(0,f)/Math.max(1,frames-1),c=S.cam.call(S,u);
        const sk=c.shake||0;p.x=c.x;p.z=c.z;p.feet=c.y;p.vx=p.vy=p.vz=0;p.yaw=c.yaw+(sk?(Math.random()-0.5)*sk:0);p.pitch=c.pitch+(sk?(Math.random()-0.5)*sk:0);p.hp=Math.max(p.hp,p.max*0.5);
        if(S.act&&f>=0)S.act.call(S,u,f);
        const cv=document.getElementById('tov'),x=cv.getContext('2d'),fade=(a,b)=>Math.min(1,Math.max(0,(u-a)/b));x.clearRect(0,0,W,H);
        const blk=S.black?1:Math.max(0,1-Math.max(0,f)/4);if(blk>0){x.fillStyle='rgba(0,0,0,'+blk+')';x.fillRect(0,0,W,H);}
        x.fillStyle='#000';const bh=Math.round(H*0.11);x.fillRect(0,0,W,bh);x.fillRect(0,H-bh,W,bh);
        if(S.flash&&f>=0&&f<3){x.fillStyle='rgba(255,250,235,'+(1-f/3)*0.9+')';x.fillRect(0,0,W,H);}
        x.textAlign='center';x.textBaseline='middle';const txt=S.title||S.sub;
        if(S.slam&&f>=0){const k=Math.min(1,f/5),sc=1.5-0.5*(1-Math.pow(1-k,3)),al=Math.min(k*1.5,1)*(1-Math.max(0,(u-0.88)/0.12));x.save();x.translate(W/2,H*0.5);x.scale(sc,sc);
          x.globalAlpha=al;x.font='900 '+Math.round(H*0.13)+'px Impact, "Arial Black", "Helvetica Neue", sans-serif';x.lineWidth=H*0.012;x.strokeStyle='rgba(0,0,0,0.75)';x.strokeText(S.slam,0,0);
          x.shadowColor='rgba(255,170,40,0.8)';x.shadowBlur=H*0.05;x.fillStyle='#fff3d0';x.fillText(S.slam,0,0);x.restore();x.globalAlpha=1;x.shadowBlur=0;}
        const sh=(t,y,size,col,al,wt)=>{if(al<=0||!t)return;x.globalAlpha=al;x.font=(wt||'600')+' '+size+'px Cinzel, Georgia, "Times New Roman", serif';x.shadowColor='rgba(0,0,0,0.85)';x.shadowBlur=size*0.5;x.fillStyle=col;x.fillText(t,W/2,y);x.shadowBlur=0;x.globalAlpha=1;};
        sh(txt?txt.toUpperCase():'',H*0.8,Math.round(H*0.045),'#f6efdc',Math.min(fade(0.06,0.18),1-fade(0.82,0.16)));
        if(S.logo){sh('WIZARD MEADOW',H*0.42,Math.round(H*0.12),'#ffd98a',fade(0.12,0.3),'700');sh('P L A Y   N O W',H*0.58,Math.round(H*0.035),'#f6efdc',S.logo===2?fade(0.1,0.3):fade(0.6,0.25));}
        window.__stamp=(window.__stamp||0)+1;x.globalAlpha=1;x.shadowBlur=0;for(let b=0;b<12;b++){x.fillStyle=(window.__stamp>>b)&1?'#fff':'#000';x.fillRect(8+b*10,H-12,8,8);} // frame number for the capture to check
        return new Promise(r=>{window.__vt.t+=dt*1000;window.__vt.res=r;window.__vt.go=true;});},[si,f,frames,1/FPS,W,H]);
      if(f>=0){const want=await pg.evaluate(()=>window.__stamp&4095);let got=null; // use the screencast frame that carries this frame's number
        for(let tries=0;tries<30&&!got;tries++){const cand=lastFrame;
          if(cand){const id=cand===idCache.d?idCache.v:await readStamp(cand);
            idCache={d:cand,v:id};if(id===want){got=cand;break;}}
          await nextFrame(4000);}
        if(!got)console.log('warning: frame',si,f,'was not matched');lastFrame=got||lastFrame;
        if(lastFrame){fs.writeFileSync(path.join(OUT,'s'+String(si).padStart(2,'0')+'_'+String(k++).padStart(5,'0')+'.jpg'),Buffer.from(lastFrame,'base64'));n++;if(n%50===0)console.log('frame',n);}}}
    }
  fs.writeFileSync(path.join(OUT,process.env.TRAILER_ONLY?'cuts-'+process.env.TRAILER_ONLY.replace(/,/g,'-')+'.json':'cuts.json'),JSON.stringify({cuts,total:+t.toFixed(3),fps:FPS,shots}));py.stdin.end();console.log('recorded',n,'frames,',t.toFixed(1),'s');await b.close();})();
