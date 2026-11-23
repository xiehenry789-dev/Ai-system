// Shot list for the trailer. Runs inside the game page; `W` is window.__wm (plus recorder hooks).
// Each shot: dur (s), title (calm caption) or slam (big punchy word), flash (white flash on the cut), black, logo (1 title, 2 end card),
// setup(), cam(u) -> {x,z,y,yaw,pitch[,shake]}, act(u,f).
(()=>{const W=window.__wm,gH=W.gH,P=W.player,lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t),look=(x,z,tx,tz)=>Math.atan2(-(tx-x),-(tz-z));
const V=n=>W.VILLAGES.find(v=>v.name===n)||W.VILLAGES[0],K=W.KING;
const spell=re=>{const i=W.SPELLS.findIndex(s=>re.test(s.name));return i<0?0:i;};
const SP={meteor:spell(/^meteor/i),bolt:spell(/^lightning$/i),tornado:spell(/fire tornado/i),frost:spell(/blizzard/i),fire:0,comet:spell(/glacial comet/i)};
const orbit=(cx,cz,r,a0,a1,h,dip)=>u=>{const a=lerp(a0,a1,u),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;return {x,z,y:h,yaw:look(x,z,cx,cz),pitch:dip};};
const dolly=(x0,z0,y0,x1,z1,y1,tx,tz,p0,p1)=>u=>{const e=ease(u),x=lerp(x0,x1,e),z=lerp(z0,z1,e);return {x,z,y:lerp(y0,y1,e),yaw:look(x,z,tx,tz),pitch:lerp(p0,p1,e)};};
const hv=V('Highwatch'),bh=V('Brookhollow');
// an open patch of desert: no trees or grass between the camera and the monsters
const AX=60,AZ=360,AY=()=>gH(AX,AZ);
const arena=()=>{W.cleanup();MOBS.length=0;P.max=P.hp=1e7;W.COMBAT.on=true;};
const MOBS=[];const mob=(t,dx,dz,o)=>{const e=W.spawn(t,AX+dx,AZ+dz);e.aggro=true;Object.assign(e,o||{});e.yaw=e.yawT=Math.PI;e.pin=[AX+dx,AZ+dz];MOBS.push(e);return e;};
// keep hero monsters on their marks, facing the camera, still animating (walking, flapping) as if charging
const pin=()=>{for(const e of MOBS){if(e.state==='dead'||!e.pin)continue;e.x=e.pin[0];e.z=e.pin[1];e.vx=0;e.vz=-0.0001;e.yawT=Math.PI;e.phase+=0.35;}};
// hero shot: camera low in front of the monster, slowly pushing in and tilting up
const hero=(dist0,dist1,h0,h1,p0,p1)=>u=>{const e=ease(u),d=lerp(dist0,dist1,e);return {x:AX,z:AZ-d,y:AY()+lerp(h0,h1,e),yaw:look(AX,AZ-d,AX,AZ),pitch:lerp(p0,p1,e),shake:0};};
const spellCut=(sp,ox,oz,slam)=>({dur:1.7,slam,flash:1,setup(){for(let i=0;i<100;i++)W.SKILL.rank[i]=Math.max(W.SKILL.rank[i],4);},
  cam:dolly(bh.x+26,bh.z+30,gH(bh.x,bh.z)+5,bh.x+20,bh.z+24,gH(bh.x,bh.z)+4.5,bh.x,bh.z,-0.02,-0.05),
  act(u,f){if(f===2)W.cast2(sp,bh.x+ox,bh.z+oz,null);}});
return [
 {dur:2.2,black:1,title:'This season',cam:u=>({x:1,z:31,y:gH(1,31)+1.7,yaw:0,pitch:0})},
 {dur:3.2,title:'One wizard.',cam:dolly(4,40,gH(4,40)+1.6,2,32,gH(2,32)+8,-11,-15,0.02,-0.1)},
 {dur:2.8,title:'A world of wild magic.',flash:1,cam:dolly(hv.x-50,hv.z+25,gH(hv.x,hv.z)+20,hv.x+25,hv.z-20,gH(hv.x,hv.z)+15,hv.x,hv.z,-0.3,-0.36)},
 spellCut(SP.meteor,4,-3,'100 SPELLS'),
 spellCut(SP.bolt,-6,4,''),
 spellCut(SP.tornado,5,6,''),
 {...spellCut(SP.frost,-3,-5,'UNLEASH THEM'),dur:2.2},
 {dur:2.0,slam:'TREANTS',flash:1,setup(){arena();mob('oakheart',0,0);},cam:hero(13,10,1.6,1.8,0.1,0.13),act:pin},
 {dur:2.0,slam:'WYRMS',flash:1,setup(){arena();mob('ashwyrm',0,0,{state:'exposed',under:false,sink:0,t:0});},cam:hero(13,10.5,1.6,1.8,0.12,0.15),act(u,f){pin();const e=W.enemies.find(e=>e.type==='ashwyrm');if(e){e.state='exposed';e.t=0.5;e.under=false;e.sink=0;}}},
 {dur:2.0,slam:'GRIFFINS',flash:1,setup(){arena();mob('griffin',0,0);mob('griffin',-3.5,3);mob('griffin',3.5,3.5);},cam:hero(10,7.5,1.3,1.4,0.02,0.04),act:pin},
 {dur:3.2,slam:'50+ MONSTERS',flash:1,setup(){arena();mob('oakheart',-4,6);mob('ashwyrm',5,7,{state:'exposed',under:false,sink:0,t:0});mob('griffin',1,3);mob('greenslime',-2,1);mob('greenslime',2,0.5);mob('emberelem',-6,4);mob('shellback',6,3);mob('lavahound',0,5);},
  cam:u=>{const e=ease(u),d=lerp(15,12,e);return {x:AX,z:AZ-d,y:AY()+lerp(1.8,2.2,e),yaw:look(AX,AZ-d,AX,AZ),pitch:lerp(0.06,0.04,e),shake:u>0.62?(1-u)*0.06:0};},
  act(u,f){if(u<0.45)pin();if(f===Math.round(0.45*this.frames))W.cast2(SP.meteor,AX,AZ+5,null);}},
 {dur:2.6,slam:'12 LANDS',flash:1,setup(){W.cleanup();},cam:orbit(W.VOLC.x,W.VOLC.z,330,2.7,3.2,gH(W.VOLC.x,W.VOLC.z)+70,-0.12)},
 {dur:4.4,title:'And a kingdom above the clouds.',flash:1,cam:u=>{const e=ease(u),x=K.x-60+e*20,z=K.z-120+e*30;return {x,z,y:lerp(K.y-40,K.y+40,e),yaw:look(x,z,K.cx,K.cz),pitch:lerp(0.35,-0.3,e)};}},
 {dur:0.9,black:1,cam:u=>({x:1,z:31,y:gH(1,31)+1.7,yaw:0,pitch:0})},
 {dur:5,logo:1,flash:1,cam:u=>{const a=0.6+u*0.35,x=Math.cos(a)*70+1,z=Math.sin(a)*70+20;return {x,z,y:gH(x,z)+38,yaw:look(x,z,-11,-15),pitch:-0.3,shake:u<0.15?(0.15-u)*0.12:0};}},
 {dur:2.4,black:1,logo:2,cam:u=>({x:1,z:31,y:gH(1,31)+1.7,yaw:0,pitch:0})}
];})()
