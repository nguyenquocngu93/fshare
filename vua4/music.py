import numpy as np, wave
SR=44100; DUR=60.0
n=int(SR*DUR); t=np.arange(n)/SR
def note(f,start,dur,amp,decay=3.0,bell=False):
    s=np.zeros(n); i0=int(start*SR); i1=min(n,int((start+dur)*SR))
    if i0>=n or i1<=i0: return s
    tt=np.arange(i1-i0)/SR
    env=np.exp(-tt*decay)*(1-np.exp(-tt*60))
    if bell:
        w=np.sin(2*np.pi*f*tt)+0.5*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt*5)+0.25*np.sin(2*np.pi*f*5.4*tt)*np.exp(-tt*8)
    else:
        w=np.sin(2*np.pi*f*tt)+0.28*np.sin(4*np.pi*f*tt)+0.10*np.sin(6*np.pi*f*tt)
    s[i0:i1]=amp*env*w
    return s
# C major - bright cheerful
F3=174.61
C3,E3,G3,A3,C4,D4,E4,F4,G4,A4,B4,C5,D5,E5,G5 = 130.81,164.81,196.0,220.0,261.63,293.66,329.63,349.23,392.0,440.0,493.88,523.25,587.33,659.25,783.99
audio=np.zeros(n)
# soft bass pulse
for k,st in enumerate(np.arange(0,DUR,2.0)):
    audio+=note([C3,G3,A3,F3][k%4],st,1.9,0.10,decay=1.4)
# warm pad chords: C - G - Am - F
prog=[(C4,E4,G4),(G3,B4,D5),(A3,C4,E4),(F4,A4,C5)]
for k,st in enumerate(np.arange(0,DUR,4.0)):
    for f in prog[k%4]: audio+=note(f,st,4.2,0.055,decay=0.9)
# playful music-box melody
mel=[E5,G5,E5,D5,C5,D5,E5,G5,A4,C5,D5,E5,D5,C5,D5,E5,G5,E5,D5,C5]
for k,st in enumerate(np.arange(0,DUR,0.8)):
    if k%4==3: continue
    audio+=note(mel[k%len(mel)],st,0.75,0.050,decay=4.2,bell=True)
# gentle pizzicato offbeat
for k,st in enumerate(np.arange(0.4,DUR,1.6)):
    audio+=note([G4,C5,A4,F4][k%4],st,0.4,0.030,decay=9.0)
# sparkle shimmer
rng=np.random.default_rng(11)
for st in rng.uniform(0,DUR,90):
    audio+=note(rng.choice([C5,D5,E5,G5,783.99,1046.5]),st,0.35,0.016,decay=11.0,bell=True)
fi=int(1.5*SR); fo=int(2.5*SR)
audio[:fi]*=np.linspace(0,1,fi); audio[-fo:]*=np.linspace(1,0,fo)
audio=np.tanh(audio*1.4)*0.85
audio/=np.max(np.abs(audio))+1e-9
st2=np.stack([audio*0.96,audio],1)
pcm=(st2*0.72*32767).astype(np.int16)
w=wave.open("bgm.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print("cute bgm ok")
