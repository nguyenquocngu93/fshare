import subprocess, os, math
FF="/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
FONTDIR="/usr/share/fonts/truetype/dejavu"

SEGS=[
 ("p1.jpg","a1.mp3","Vì sao con ong lại chết sau khi chích người? Câu trả lời nằm ở chiếc ngòi của nó."),
 ("p2.jpg","a2.mp3","Ngòi của ong mật không hề trơn nhẵn. Nó có hàng chục chiếc ngạnh nhỏ quay ngược về phía sau, giống hệt một lưỡi câu."),
 ("p3.jpg","a3.mp3","Khi chích côn trùng khác, lớp vỏ mỏng nên ong rút ngòi ra rất dễ. Nhưng da người thì dày và đàn hồi."),
 ("p4.jpg","a4.mp3","Ngạnh cắm chặt vào da. Ong càng cố bay đi thì ngòi càng mắc kẹt, và cuối cùng nó bị đứt lìa khỏi cơ thể ong."),
 ("p5.jpg","a5.mp3","Vết thương đó quá lớn, và chỉ vài phút sau, con ong không thể sống sót."),
 ("p6.jpg","a6.mp3","Điều thú vị là chỉ ong mật thợ mới bị như vậy. Ong vò vẽ và ong bắp cày có ngòi trơn, nên chúng chích được nhiều lần mà chẳng hề hấn gì."),
 ("p7.jpg","a7.mp3","Nói cách khác, chích người là hành động hy sinh của con ong để bảo vệ cả đàn. Nó đánh đổi mạng sống của mình cho tổ ong an toàn."),
]

def dur(f):
    o=subprocess.run([FF,"-i",f],capture_output=True,text=True).stderr
    import re
    m=re.search(r"Duration: (\d+):(\d+):([\d.]+)",o)
    return int(m.group(1))*3600+int(m.group(2))*60+float(m.group(3))

def chunks(text, maxw=4):
    words=text.split()
    out=[];cur=[]
    for w in words:
        cur.append(w)
        end = w.endswith((',','.','?','!'))
        if len(cur)>=maxw or (end and len(cur)>=2):
            out.append(" ".join(cur)); cur=[]
    if cur:
        if out and len(cur)==1: out[-1]+=" "+cur[0]
        else: out.append(" ".join(cur))
    return out

def ts(t):
    h=int(t//3600); m=int(t%3600//60); s=t%60
    return f"{h}:{m:02d}:{s:05.2f}"

def esc(s): return s.replace("\\","\\\\").replace("{","(").replace("}",")")

# ---- build subtitle file ----
events=[]
offset=0.0
PAD=0.35
seg_durs=[]
for img,aud,txt in SEGS:
    d=dur(aud)
    total=d+PAD
    seg_durs.append(total)
    cs=chunks(txt)
    weights=[len(c) for c in cs]
    tot=sum(weights)
    t=offset+0.12
    speech_end=offset+d
    avail=d-0.12
    for i,c in enumerate(cs):
        cd=avail*weights[i]/tot
        st=t; en=t+cd
        if i==len(cs)-1: en=speech_end+PAD*0.6
        events.append((st,en,esc(c)))
        t=en
    offset+=total

TOTAL=offset
header=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,DejaVu Sans,86,&H00FFFFFF,&H000000FF,&H00101010,&HB0000000,-1,0,0,0,100,100,0,0,1,7,4,2,70,70,300,1
Style: Title,DejaVu Sans,104,&H0000E8FF,&H000000FF,&H00101010,&HB0000000,-1,0,0,0,100,100,0,0,1,8,4,2,60,60,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines=[]
for st,en,tx in events:
    lines.append(f"Dialogue: 0,{ts(st)},{ts(en)},Sub,,0,0,0,,{{\\fad(90,90)}}{tx}")
# hook title top
lines.insert(0,f"Dialogue: 0,{ts(0)},{ts(4.6)},Title,,0,0,0,,{{\\an8\\pos(540,300)\\fad(200,200)}}VÌ SAO ONG CHẾT\\NSAU KHI CHÍCH NGƯỜI?")
open("subs.ass","w",encoding="utf-8").write(header+"\n".join(lines)+"\n")
print("subs ok, total",round(TOTAL,2),"s, events",len(events))

# ---- clips ----
for i,((img,aud,txt),sd) in enumerate(zip(SEGS,seg_durs),1):
    frames=int(sd*30)+2
    zdir = "min(zoom+0.0009,1.15)" if i%2 else "if(lte(zoom,1.0),1.15,max(1.001,zoom-0.0009))"
    vf=(f"scale=1350:2400:force_original_aspect_ratio=increase,crop=1350:2400,"
        f"zoompan=z='{zdir}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,"
        f"eq=contrast=1.06:saturation=1.12,format=yuv420p")
    subprocess.run([FF,"-y","-loop","1","-i",img,"-t",f"{sd:.3f}","-vf",vf,
        "-c:v","libx264","-crf","19","-r","30","-pix_fmt","yuv420p",f"v{i}.mp4","-loglevel","error"],check=True)
    subprocess.run([FF,"-y","-i",aud,"-af",f"apad=whole_dur={sd:.3f},aresample=48000","-t",f"{sd:.3f}",
        "-c:a","aac","-b:a","192k","-ar","48000","-ac","2",f"s{i}.m4a","-loglevel","error"],check=True)
    subprocess.run([FF,"-y","-i",f"v{i}.mp4","-i",f"s{i}.m4a","-c","copy","-shortest",f"c{i}.mp4","-loglevel","error"],check=True)
    print("clip",i,round(sd,2))

open("list.txt","w").write("\n".join(f"file 'c{i}.mp4'" for i in range(1,len(SEGS)+1))+"\n")
subprocess.run([FF,"-y","-f","concat","-safe","0","-i","list.txt","-c","copy","raw.mp4","-loglevel","error"],check=True)
subprocess.run([FF,"-y","-i","raw.mp4","-vf",f"subtitles=subs.ass:fontsdir={FONTDIR}",
   "-c:v","libx264","-crf","20","-preset","medium","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k",
   "-movflags","+faststart","../vi_sao_ong_chet.mp4","-loglevel","error"],check=True)
print("DONE")
