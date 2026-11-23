# Reads base64 JPEG frames (one per line) on stdin and prints the frame number stamped in the bottom-left letterbox bar.
import sys,base64,io
from PIL import Image
H=int(sys.argv[1])
for line in sys.stdin:
    try:
        im=Image.open(io.BytesIO(base64.b64decode(line.strip()))).convert('L');k=im.height/H;v=0
        for b in range(12):
            if im.getpixel((round((12+b*10)*k),round((H-8)*k)))>128:v|=1<<b
        print(v,flush=True)
    except Exception:print(-1,flush=True)
