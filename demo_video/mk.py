from PIL import Image, ImageDraw, ImageFont, ImageFilter
F="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
W,H=1920,1080
slides=[("img1.jpg","FSHARE","Chia sẻ file tốc độ cao"),
        ("img2.jpg","TỰ ĐỘNG HOÁ","Hình ảnh · Giọng đọc · Dựng phim"),
        ("img3.jpg","BẠN NGHĨ — MÌNH LÀM","Cứ nói ý tưởng, phần còn lại để mình lo")]
for i,(f,t1,t2) in enumerate(slides,1):
    im=Image.open(f).convert("RGB").resize((W,H),Image.LANCZOS)
    ov=Image.new("RGBA",(W,H),(0,0,0,0))
    d=ImageDraw.Draw(ov)
    d.rectangle([0,H//2-220,W,H//2+220],fill=(0,0,0,120))
    f1=ImageFont.truetype(F,120); f2=ImageFont.truetype(FR,52)
    for txt,fo,dy,col in [(t1,f1,-60,(255,255,255,255)),(t2,f2,90,(120,230,255,255))]:
        bb=d.textbbox((0,0),txt,font=fo)
        x=(W-(bb[2]-bb[0]))//2; y=H//2+dy-(bb[3]-bb[1])//2
        d.text((x+4,y+4),txt,font=fo,fill=(0,0,0,160))
        d.text((x,y),txt,font=fo,fill=col)
    out=Image.alpha_composite(im.convert("RGBA"),ov).convert("RGB")
    out.save(f"s{i}.png")
print("ok")
