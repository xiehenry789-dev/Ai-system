# Usage: python3 music.py cuts.json out.wav - a hype trailer score timed to the shot cuts
# quiet intro -> drums kick in with the action -> braam on every slam -> riser -> a beat of silence -> the drop on the title
import json,sys,wave,numpy as np
c=json.load(open(sys.argv[1]));shots=c['shots'];cuts=c['cuts'];T=c['total']+1.2;SR=44100;n=int(T*SR);t=np.arange(n)/SR;out=np.zeros((n,2));rng=np.random.default_rng(7)
def add(st,sig,pan=0.0,g=1.0):
    s=int(st*SR);sig=sig[:max(0,n-s)]*g;out[s:s+len(sig),0]+=sig*(1-pan);out[s:s+len(sig),1]+=sig*(1+pan)
def env(L,a,d):
    e=np.ones(L);a=int(a*SR);d=int(d*SR)
    if a:e[:a]=np.linspace(0,1,a)
    if d:e[-d:]*=np.linspace(1,0,min(d,L))
    return e
def kick(amp=1.0):
    L=int(0.45*SR);k=np.arange(L)/SR;f=45+120*np.exp(-k*28);ph=2*np.pi*np.cumsum(f)/SR;return np.sin(ph)*np.exp(-k*7)*amp
def snare(amp=0.6):
    L=int(0.3*SR);k=np.arange(L)/SR;return (rng.normal(0,1,L)*np.exp(-k*16)*0.8+np.sin(2*np.pi*190*k)*np.exp(-k*22))*amp
def hat(amp=0.15):
    L=int(0.06*SR);k=np.arange(L)/SR;x=rng.normal(0,1,L);x=np.diff(np.r_[0,x]);return x*np.exp(-k*60)*amp
def braam(dur=2.2,amp=0.8,root=36.71):
    L=int(dur*SR);k=np.arange(L)/SR;s=np.zeros(L)
    for m,a in [(1,1),(2,0.6),(3,0.35),(4,0.25),(1.5,0.4),(6,0.12)]:s+=a*np.sign(np.sin(2*np.pi*root*m*k+0.3*np.sin(2*np.pi*5*k)))*0.5+a*np.sin(2*np.pi*root*m*k)*0.5
    return s*env(L,0.02,dur*0.7)*np.exp(-k*0.6)*amp*0.35
def tone(f,dur,amp,a=0.05,d=0.6):
    L=int(dur*SR);k=np.arange(L)/SR;return (np.sin(2*np.pi*f*k)+0.4*np.sin(2*np.pi*2*f*k)+0.15*np.sin(2*np.pi*3*f*k))*amp*env(L,a,d)
def boom(st,amp):
    L=int(3.2*SR);k=np.arange(L)/SR;f=60*np.exp(-k*1.8)+28;ph=2*np.pi*np.cumsum(f)/SR
    add(st,(np.sin(ph)*np.exp(-k*1.1)+rng.normal(0,1,L)*np.exp(-k*7)*0.5)*amp)
idx=lambda pred:[i for i,s in enumerate(shots) if pred(s)]
logo=idx(lambda s:s.get('logo')==1);drop=cuts[logo[0]] if logo else T*0.85
blacks=[i for i in idx(lambda s:s.get('black') and not s.get('logo')) if cuts[i]>1];silence=cuts[blacks[-1]] if blacks else drop-0.8
action=cuts[3] if len(cuts)>3 else 3.0
# 1) intro: a low drone and a lonely high note
for f,a in [(36.71,0.18),(73.42,0.09)]:add(0,np.sin(2*np.pi*f*t[:int(silence*SR)])*a*np.clip(t[:int(silence*SR)]/2,0,1))
for st in cuts[1:3]:add(st,tone(587.3,2.6,0.05,a=0.4,d=1.5),pan=0.3)
# 2) drums from the first action shot to the silence, getting faster
p=action;beat=0.5;i=0
while p<silence-0.05:
    add(p,kick(1.0 if i%2==0 else 0.7));
    if i%2==1:add(p,snare(0.55))
    add(p+beat/2,hat(0.18),pan=0.4);add(p+beat/4,hat(0.08),pan=-0.4)
    p+=beat;i+=1;beat=max(0.25,beat*0.985)
# a bass ostinato under the drums
p=action;bn=[73.42,73.42,87.31,65.41]
while p<silence-0.2:
    for j,f in enumerate(bn):
        if p+j*0.25<silence-0.1:add(p+j*0.25,tone(f,0.24,0.22,a=0.005,d=0.15))
    p+=1.0
# 3) braam on every slam and flash cut
for i,s in enumerate(shots):
    if i==0 or cuts[i]>=silence:continue
    if s.get('slam'):add(cuts[i],braam(2.0,1.0));add(cuts[i],kick(1.3))
    elif s.get('flash'):add(cuts[i],braam(1.6,0.6,root=43.65))
# 4) riser into the silence
rs=max(action,silence-4.0);L=int((silence-rs)*SR);k=np.arange(L)/SR;fr=np.linspace(200,2400,L);nz=rng.normal(0,1,L)
riser=(np.sin(2*np.pi*np.cumsum(fr)/SR)*0.25+nz*np.linspace(0,0.5,L)*0.6)*np.linspace(0,1,L)**2;add(rs,riser,g=0.6)
# 5) silence, then the drop on the title
s0=int(silence*SR);s1=int(drop*SR);out[s0:s1]*=np.linspace(1,0,max(1,s1-s0))[:,None]**8
boom(drop,1.6);add(drop,braam(4.5,1.4));add(drop,kick(1.8))
for f in [73.42,146.8,220.0,293.7,440.0]:add(drop,tone(f,T-drop,0.08,a=0.02,d=2.5))
end=idx(lambda s:s.get('logo')==2)
if end:add(cuts[end[0]],braam(2.4,0.7,root=36.71));add(cuts[end[0]],kick(1.2))
# finish: soft limiter and fade out
out/=max(1e-6,np.percentile(np.abs(out),99.5));out=np.tanh(out*0.95)*0.95;fd=int(1.2*SR);out[-fd:]*=np.linspace(1,0,fd)[:,None]
w=wave.open(sys.argv[2],'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype('<i2').tobytes());w.close();print('music',sys.argv[2],round(T,1),'s')
