# Usage: python3 music.py cuts.json out.wav  - a synthesised trailer score timed to the shot cuts
import json,sys,wave,numpy as np
c=json.load(open(sys.argv[1]));T=c['total']+1.0;SR=44100;n=int(T*SR);t=np.arange(n)/SR;out=np.zeros((n,2))
def env(a,d,length):
    e=np.ones(length);a=int(a*SR);d=int(d*SR)
    if a:e[:a]=np.linspace(0,1,a)
    if d:e[-d:]*=np.linspace(1,0,d)
    return e
def add(start,sig,pan=0.0):
    s=int(start*SR);sig=sig[:max(0,n-s)];out[s:s+len(sig),0]+=sig*(1-pan)*0.5*2;out[s:s+len(sig),1]+=sig*(1+pan)*0.5*2
def tone(f,dur,amp,a=0.02,d=0.5,harm=(1,0.5,0.25)):
    k=np.arange(int(dur*SR))/SR;s=sum(h*np.sin(2*np.pi*f*(i+1)*k) for i,h in enumerate(harm));return s*amp*env(a,d,len(k))
cuts=c['cuts'];logo=[i for i,s in enumerate(c['shots']) if s.get('logo')]
endbuild=cuts[logo[0]] if logo else T*0.85
# drone pad in D minor that swells toward the title
for f,a in [(36.71,0.16),(55.0,0.1),(73.42,0.08),(87.31,0.05)]:
    sw=0.5+0.5*np.clip(t/endbuild,0,1);out[:,0]+=a*np.sin(2*np.pi*f*t+np.sin(t*0.3))*sw;out[:,1]+=a*np.sin(2*np.pi*f*1.003*t)*sw
# chord swells per shot: Dm Bb F C
chords=[[146.8,174.6,220.0],[116.5,146.8,174.6],[174.6,220.0,261.6],[130.8,164.8,196.0]]
for i,st in enumerate(cuts[1:-1]):
    dur=(cuts[i+2] if i+2<len(cuts) else T)-st
    for k,f in enumerate(chords[i%4]):add(st,tone(f,dur+0.3,0.06,a=0.6,d=0.8,harm=(1,0.3,0.15)),pan=(k-1)*0.4)
# rising pulse that speeds up into the title
p=cuts[1] if len(cuts)>1 else 0;bt=0.5
while p<endbuild-0.2:
    add(p,tone(73.42,0.22,0.35,a=0.003,d=0.18,harm=(1,0.6,0.2)));p+=bt;bt=max(0.18,bt*0.975)
# impact hits on each cut and a big boom on the title
def boom(st,amp):
    L=int(2.5*SR);k=np.arange(L)/SR;f=55*np.exp(-k*2)+30;ph=2*np.pi*np.cumsum(f)/SR
    s=(np.sin(ph)*np.exp(-k*1.6)+np.random.default_rng(int(st*100)).normal(0,1,L)*np.exp(-k*9)*0.4)*amp;add(st,s)
for st in cuts[2:]:boom(st,0.45)
if logo:boom(cuts[logo[0]],0.9)
# final sustained chord
if logo:
    for f in [73.42,146.8,220.0,293.7]:add(cuts[logo[0]],tone(f,T-cuts[logo[0]],0.07,a=0.05,d=2.0))
out/=max(1e-6,np.percentile(np.abs(out),99.5));out=np.tanh(out*0.9)*0.95; # soft limiter: full body, booms still punch
fade=int(1.5*SR);out[-fade:]*=np.linspace(1,0,fade)[:,None]
w=wave.open(sys.argv[2],'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype('<i2').tobytes());w.close();print('music',sys.argv[2],round(T,1),'s')
