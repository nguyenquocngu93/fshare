import subprocess, re
FF=subprocess.run(["python3","-c","import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"],capture_output=True,text=True).stdout.strip()
FONTDIR="/usr/share/fonts/truetype/dejavu"
TEMPO=1.26
SEGS=[
 ("p1.jpg","a1.mp3","Vị vua này từng bắt tay với một cái cây, vì tưởng đó là vua nước Phổ."),
 ("p2.jpg","a2.mp3","George III của Anh trị vì gần 60 năm. Nhưng năm 1788, ông bắt đầu cư xử rất lạ."),
 ("p3.jpg","a3.mp3","Người hầu bắt gặp vua đang trồng một miếng bít tết xuống đất. Ông tin rằng nó sẽ mọc lên thành cây thịt bò."),
 ("p4.jpg","a4.mp3","Rồi trong khuôn viên lâu đài Windsor, ông bước tới một cây sồi, nắm lấy cành và bắt tay thật trịnh trọng."),
 ("p5.jpg","a5.mp3","Ông tưởng đó là vua Frederick Đại Đế của Phổ. Trớ trêu thay, vị vua kia đã qua đời từ 2 năm trước."),
 ("p6.jpg","a6.mp3","Ngày nay các nhà khoa học cho rằng ông mắc rối loạn lưỡng cực, hoặc bị nhiễm độc thạch tín từ chính thuốc chữa bệnh."),
 ("p7.jpg","a7.mp3","Theo dõi để xem tập tiếp theo của series Vua Kỳ Lạ nha!"),
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
def ts(x): return f"{int(x//3600)}:{int(x%3600//60):02d}:{x%60:05.2f}"
def esc(s): return s.replace("\\","\\\\").replace("{","(").replace("}",")")

durs=[]
for i,(img,aud,txt) in enumerate(SEGS,1):
    subprocess.run([FF,"-y","-i",aud,"-filter:a",f"atempo={TEMPO}","-c:a","libmp3lame","-q:a","3",f"f{i}.mp3","-loglevel","error"],check=True)
    durs.append(dur(f"f{i}.mp3"))

PAD=0.20
events=[];off=0.0;segd=[]
for (img,aud,txt),d in zip(SEGS,durs):
    tot=d+PAD; segd.append(tot)
    cs=chunks(txt); w=[len(c) for c in cs]; sw=sum(w)
    t=off+0.08; avail=d-0.08
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
Style: Title,DejaVu Sans,96,&H0000E8FF,&H000000FF,&H00101010,&HB0000000,-1,0,0,0,100,100,0,0,1,8,4,2,60,60,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
L=[f"Dialogue: 0,{ts(0)},{ts(4.0)},Title,,0,0,0,,{{\\an8\\pos(540,290)\\fad(180,200)}}VỊ VUA BẮT TAY\\NVỚI MỘT CÁI CÂY"]
for st,en,tx in events:
    L.append(f"Dialogue: 0,{ts(st)},{ts(en)},Sub,,0,0,0,,{{\\fad(70,70)}}{tx}")
open("subs.ass","w",encoding="utf-8").write(hdr+"\n".join(L)+"\n")
print("total",round(TOTAL,2),"s |",len(events),"caption")

for i,((img,aud,txt),sd) in enumerate(zip(SEGS,segd),1):
    fr=int(sd*30)+2
    z="min(zoom+0.0011,1.16)" if i%2 else "if(lte(zoom,1.0),1.16,max(1.001,zoom-0.0011))"
    vf=(f"scale=1350:2400:force_original_aspect_ratio=increase,crop=1350:2400,"
        f"zoompan=z='{z}':d={fr}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,"
        f"eq=contrast=1.08:saturation=1.05,format=yuv420p")
    subprocess.run([FF,"-y","-loop","1","-i",img,"-t",f"{sd:.3f}","-vf",vf,"-c:v","libx264","-crf","19","-r","30","-pix_fmt","yuv420p",f"v{i}.mp4","-loglevel","error"],check=True)
    subprocess.run([FF,"-y","-i",f"f{i}.mp3","-af",f"apad=whole_dur={sd:.3f},aresample=48000","-t",f"{sd:.3f}","-c:a","aac","-b:a","192k","-ar","48000","-ac","2",f"s{i}.m4a","-loglevel","error"],check=True)
    subprocess.run([FF,"-y","-i",f"v{i}.mp4","-i",f"s{i}.m4a","-c","copy","-shortest",f"c{i}.mp4","-loglevel","error"],check=True)
    print("clip",i,round(sd,2))
open("list.txt","w").write("\n".join(f"file 'c{i}.mp4'" for i in range(1,len(SEGS)+1))+"\n")
subprocess.run([FF,"-y","-f","concat","-safe","0","-i","list.txt","-c","copy","raw.mp4","-loglevel","error"],check=True)
subprocess.run([FF,"-y","-i","raw.mp4","-i","bgm.wav","-filter_complex",
 f"[1:a]atrim=0:{TOTAL+0.5},volume=0.20,afade=t=in:st=0:d=1.5,afade=t=out:st={TOTAL-2.2}:d=2.2,aresample=48000[m];"
 "[0:a]aresample=48000,asplit=2[vo][sc];"
 "[m][sc]sidechaincompress=threshold=0.03:ratio=10:attack=8:release=320[duck];"
 "[vo][duck]amix=inputs=2:duration=first:dropout_transition=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]",
 "-map","0:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000","-ac","2","mixed.mp4","-loglevel","error"],check=True)
subprocess.run([FF,"-y","-i","mixed.mp4","-vf",f"subtitles=subs.ass:fontsdir={FONTDIR}",
 "-c:v","libx264","-crf","20","-preset","medium","-pix_fmt","yuv420p","-c:a","copy",
 "-movflags","+faststart","../vua2_caycoi_YOUTUBE.mp4","-loglevel","error"],check=True)
print("DONE")
