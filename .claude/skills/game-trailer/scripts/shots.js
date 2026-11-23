// Shot list for the trailer. Runs inside the game page; `W` is window.__wm (plus recorder hooks).
(()=>{const W=window.__wm,gH=W.gH,P=W.player,lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t),look=(x,z,tx,tz)=>Math.atan2(-(tx-x),-(tz-z));
const V=n=>W.VILLAGES.find(v=>v.name===n)||W.VILLAGES[0],K=W.KING;
const spell=re=>{const i=W.SPELLS.findIndex(s=>re.test(s.name));return i<0?0:i;};
const SP={meteor:spell(/meteor/i),bolt:spell(/lightning|thunder|chain/i),tornado:spell(/fire tornado/i),frost:spell(/blizzard/i),quake:spell(/quake|earth/i),fire:0};
const orbit=(cx,cz,r,a0,a1,h,dip)=>u=>{const a=lerp(a0,a1,u),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;return {x,z,y:h,yaw:look(x,z,cx,cz),pitch:dip};};
const dolly=(x0,z0,y0,x1,z1,y1,tx,tz,p0,p1)=>u=>{const e=ease(u),x=lerp(x0,x1,e),z=lerp(z0,z1,e);return {x,z,y:lerp(y0,y1,e),yaw:look(x,z,tx,tz),pitch:lerp(p0,p1,e)};};
const hv=V('Highwatch'),sw=V('Sporewick'),bh=V('Brookhollow');
return [
 {dur:3.2,black:1,title:'Long ago, magic slept beneath Meadowvale',cam:u=>({x:1,z:31,y:gH(1,31)+1.7,yaw:0,pitch:0})},
 {dur:5,sub:'Now it wakes.',cam:dolly(4,40,gH(4,40)+1.6,2,30,gH(2,30)+10,-11,-15,0.02,-0.12)},
 {dur:4.2,title:'A world of wild magic',cam:dolly(hv.x-60,hv.z+30,gH(hv.x,hv.z)+22,hv.x+30,hv.z-25,gH(hv.x,hv.z)+16,hv.x,hv.z,-0.32,-0.38)},
 {dur:6,title:'Master 100 spells',setup(){for(let i=0;i<100;i++)W.SKILL.rank[i]=Math.max(W.SKILL.rank[i],3);},
  cam:dolly(bh.x+30,bh.z+34,gH(bh.x,bh.z)+6,bh.x+18,bh.z+22,gH(bh.x,bh.z)+5,bh.x,bh.z,-0.05,-0.08),
  act(u,f){const tx=bh.x,tz=bh.z,cs=[[0.05,SP.fire,0,0],[0.2,SP.bolt,-6,4],[0.38,SP.meteor,6,-4],[0.58,SP.frost,-4,-6],[0.75,SP.tornado,3,5]];for(const c of cs)if(f===Math.round(c[0]*this.frames))W.cast2(c[1],tx+c[2],tz+c[3],null);}},
 {dur:5.5,title:'Face over 50 monsters',setup(){const x=-40,z=-150,y=gH(x,z);P.max=P.hp=1e6;W.COMBAT.on=true;
   const sp=(t,dx,dz,o)=>{const e=W.spawn(t,x+dx,z+dz);e.aggro=true;Object.assign(e,o||{});return e;};
   sp('oakheart',0,-10);sp('ashwyrm',-6,-7,{state:'exposed',under:false,sink:0,t:0});sp('griffin',5,-6);sp('greenslime',-2,-4);sp('greenslime',2,-3);sp('emberelem',-8,-12);sp('shellback',7,-11);this.c=[x,z,y];},
  cam(u){const [x,z,y]=this.c,e=ease(u);return {x:x+lerp(-3,1,e),z:z+lerp(6,2,e),y:y+lerp(2.2,1.7,e),yaw:look(0,0,0,-1)+lerp(0.15,-0.1,e),pitch:lerp(0.12,0.05,e)};},
  act(u,f){if(f===Math.round(0.8*this.frames)){const [x,z]=this.c;W.cast2(SP.meteor,x,z-8,null);}}},
 {dur:4.5,title:'Fly where no road goes',setup(){W.cleanup();},cam:orbit(W.VOLC.x,W.VOLC.z,330,2.7,3.6,gH(W.VOLC.x,W.VOLC.z)+70,-0.12)},
 {dur:3.6,cam:dolly(W.LIGHT.x-70,W.LIGHT.z-40,10,W.LIGHT.x-20,W.LIGHT.z-12,8,W.LIGHT.x,W.LIGHT.z,0.05,0.12)},
 {dur:3.8,sub:'Twelve lands to explore',cam:dolly(sw.x+40,sw.z+40,gH(sw.x,sw.z)+12,sw.x+14,sw.z+16,gH(sw.x,sw.z)+7,sw.x,sw.z,-0.2,-0.22)},
 {dur:6.5,title:'And a kingdom above the clouds',cam:u=>{const e=ease(u),x=K.x-60+e*20,z=K.z-120+e*30;return {x,z,y:lerp(K.y-40,K.y+40,e),yaw:look(x,z,K.cx,K.cz),pitch:lerp(0.35,-0.3,e)};}},
 {dur:6,logo:1,cam:u=>{const a=0.6+u*0.4,x=Math.cos(a)*70+1,z=Math.sin(a)*70+20;return {x,z,y:gH(x,z)+38,yaw:look(x,z,-11,-15),pitch:-0.3};}},
 {dur:2.6,black:1,logo:2,cam:u=>({x:1,z:31,y:gH(1,31)+1.7,yaw:0,pitch:0})}
];})()
