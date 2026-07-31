import numpy as np, wave
SR=44100; DUR=60.0
n=int(SR*DUR); t=np.arange(n)/SR
def note(f,start,dur,amp,wave_type="sine",decay=3.0):
    s=np.zeros(n); i0=int(start*SR); i1=min(n,int((start+dur)*SR))
    if i0>=n: return s
    tt=np.arange(i1-i0)/SR
    env=np.exp(-tt*decay)*(1-np.exp(-tt*40))
    if wave_type=="sine": w=np.sin(2*np.pi*f*tt)+0.35*np.sin(4*np.pi*f*tt)+0.12*np.sin(6*np.pi*f*tt)
    else: w=np.sin(2*np.pi*f*tt)
    s[i0:i1]=amp*env*w
    return s
# A minor / D minor - dark medieval feel
A2,C3,D3,E3,F3,G3,A3,C4,D4,E4,F4,G4,A4 = 110.0,130.81,146.83,164.81,174.61,196.0,220.0,261.63,293.66,329.63,349.23,392.0,440.0
audio=np.zeros(n)
# drone bass
for st in np.arange(0,DUR,4.0):
    audio+=note(A2,st,4.2,0.16,decay=0.5)
# chord pad every 4s: Am - F - C - G  (dark cycle)
prog=[(A3,C4,E4),(F3,A3,C4),(C3,E3,G3),(G3,C4,D4)]
for k,st in enumerate(np.arange(0,DUR,4.0)):
    ch=prog[k%4]
    for f in ch: audio+=note(f,st,4.5,0.075,decay=0.7)
# sparse melody - plucked harp-like
mel=[A4,G4,E4,F4,E4,D4,C4,D4,E4,C4,A3,C4,D4,E4,D4,C4]
for k,st in enumerate(np.arange(0,DUR,1.6)):
    f=mel[k%len(mel)]
    if k%3!=2: audio+=note(f,st,1.5,0.055,decay=2.6)
# low heartbeat pulse for tension
for st in np.arange(0,DUR,2.0):
    audio+=note(55.0,st,0.5,0.09,decay=8.0)
# gentle noise texture
rng=np.random.default_rng(7)
noise=rng.normal(0,1,n)
b=np.convolve(noise,np.ones(700)/700,mode='same')
audio+=b*0.006
# fade in/out
fi=int(2.0*SR); fo=int(3.0*SR)
audio[:fi]*=np.linspace(0,1,fi); audio[-fo:]*=np.linspace(1,0,fo)
audio=np.tanh(audio*1.5)*0.85
audio/=np.max(np.abs(audio))+1e-9
st=np.stack([audio*0.95,audio],1)
pcm=(st*0.75*32767).astype(np.int16)
w=wave.open("bgm.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print("bgm.wav ok")
