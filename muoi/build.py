import subprocess, re
FF="/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
FONTDIR="/usr/share/fonts/truetype/dejavu"
TEMPO=1.15
SEGS=[
 ("p1.jpg","a1.mp3","Cùng ngồi một chỗ, có người bị muỗi đốt chi chít, người kia thì không con nào. Vì sao vậy?"),
 ("p2.jpg","a2.mp3","Muỗi tìm bạn từ xa 15 mét, bằng khí CO2 trong hơi thở. Ai thở ra nhiều hơn sẽ bị phát hiện trước."),
 ("p3.jpg","a3.mp3","Nên người to con, phụ nữ mang thai hay ai vừa tập thể dục xong đều là mục tiêu số một."),
 ("p4.jpg","a4.mp3","Lại gần hơn, muỗi ngửi mùi da bạn. Vi khuẩn trên da tạo ra axit lactic và amoniac, và mỗi người có một mùi riêng."),
 ("p5.jpg","a5.mp3","Nghiên cứu còn cho thấy người nhóm máu O bị đốt nhiều gấp đôi nhóm máu A."),
 ("p6.jpg","a6.mp3","Và muỗi cực thích màu tối như đen, đỏ, xanh dương. Mặc áo sáng màu, bạn sẽ ít bị đốt hơn hẳn."),
 ("p7.jpg","a7.mp3","Tóm lại, không phải máu bạn ngọt hơn. Đó là hơi thở, mùi da và màu áo. Bạn thuộc nhóm hay bị đốt chứ?"),
]
def dur(f):
    o=subprocess.run([FF,"-i",f],capture_output=True,text=True).stderr
    m=re.search(r"Duration: (\d+):(\d+):([\d.]+)",o)
    return int(m.group(1))*3600+int(m.group(2))*60+float(m.group(3))
def chunks(t,maxw=4):
    ws=t.split();out=[];cur=[]
    for w in ws:
        cur.append(w)
        if len(cur)>=maxw or (w.endswith((',','.','?','!')) and len(cur)>=2):
            out.append(" ".join(cur));cur=[]
    if cur:
        if out and len(cur)==1: out[-1]+=" "+cur[0]
        else: out.append(" ".join(cur))
    return out
def ts(t):
    return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"
def esc(s): return s.replace("\\","\\\\").replace("{","(").replace("}",")")

# speed up audio
durs=[]
for i,(img,aud,txt) in enumerate(SEGS,1):
    subprocess.run([FF,"-y","-i",aud,"-filter:a",f"atempo={TEMPO}","-c:a","libmp3lame","-q:a","3",f"f{i}.mp3","-loglevel","error"],check=True)
    durs.append(dur(f"f{i}.mp3"))

PAD=0.28
events=[];off=0.0;segd=[]
for (img,aud,txt),d in zip(SEGS,durs):
    tot=d+PAD; segd.append(tot)
    cs=chunks(txt); w=[len(c) for c in cs]; sw=sum(w)
    t=off+0.10; avail=d-0.10
    for i,c in enumerate(cs):
        cd=avail*w[i]/sw; st=t; en=t+cd
        if i==len(cs)-1: en=off+d+PAD*0.6
        events.append((st,en,esc(c))); t=en
    off+=tot
TOTAL=off
hdr="""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,DejaVu Sans,100,&H00FFFFFF,&H000000FF,&H00101010,&HB0000000,-1,0,0,0,100,100,0,0,1,7,4,2,60,60,470,1
Style: Title,DejaVu Sans,100,&H0000E8FF,&H000000FF,&H00101010,&HB0000000,-1,0,0,0,100,100,0,0,1,8,4,2,60,60,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
L=[f"Dialogue: 0,{ts(0)},{ts(4.2)},Title,,0,0,0,,{{\\an8\\pos(540,290)\\fad(180,200)}}VÌ SAO MUỖI CHỈ\\NĐỐT MỘT SỐ NGƯỜI?"]
for st,en,tx in events:
    L.append(f"Dialogue: 0,{ts(st)},{ts(en)},Sub,,0,0,0,,{{\\fad(80,80)}}{tx}")
open("subs.ass","w",encoding="utf-8").write(hdr+"\n".join(L)+"\n")
print("total",round(TOTAL,2),"s |",len(events),"caption")

for i,((img,aud,txt),sd) in enumerate(zip(SEGS,segd),1):
    fr=int(sd*30)+2
    z="min(zoom+0.0010,1.16)" if i%2 else "if(lte(zoom,1.0),1.16,max(1.001,zoom-0.0010))"
    vf=(f"scale=1350:2400:force_original_aspect_ratio=increase,crop=1350:2400,"
        f"zoompan=z='{z}':d={fr}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,"
        f"eq=contrast=1.06:saturation=1.12,format=yuv420p")
    subprocess.run([FF,"-y","-loop","1","-i",img,"-t",f"{sd:.3f}","-vf",vf,"-c:v","libx264","-crf","19","-r","30","-pix_fmt","yuv420p",f"v{i}.mp4","-loglevel","error"],check=True)
    subprocess.run([FF,"-y","-i",f"f{i}.mp3","-af",f"apad=whole_dur={sd:.3f},aresample=48000","-t",f"{sd:.3f}","-c:a","aac","-b:a","192k","-ar","48000","-ac","2",f"s{i}.m4a","-loglevel","error"],check=True)
    subprocess.run([FF,"-y","-i",f"v{i}.mp4","-i",f"s{i}.m4a","-c","copy","-shortest",f"c{i}.mp4","-loglevel","error"],check=True)
    print("clip",i,round(sd,2))
open("list.txt","w").write("\n".join(f"file 'c{i}.mp4'" for i in range(1,8))+"\n")
subprocess.run([FF,"-y","-f","concat","-safe","0","-i","list.txt","-c","copy","raw.mp4","-loglevel","error"],check=True)
subprocess.run([FF,"-y","-i","raw.mp4","-vf",f"subtitles=subs.ass:fontsdir={FONTDIR}",
 "-af","loudnorm=I=-14:TP=-1.5:LRA=11",
 "-c:v","libx264","-crf","20","-preset","medium","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-ar","48000","-ac","2",
 "-movflags","+faststart","../muoi_YOUTUBE.mp4","-loglevel","error"],check=True)
print("DONE")
