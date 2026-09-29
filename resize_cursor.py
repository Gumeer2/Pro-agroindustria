from PIL import Image
import os

source_path = r"C:\Users\juan.villegas\.gemini\antigravity\brain\db554fa8-e5c0-489c-a2e8-b5341143505d\media__1770997900716.png"
dest_path = r"c:\xampp\htdocs\vecode\public\images\cursor.png"

try:
    with Image.open(source_path) as img:
        # Resize to 32x32 using high-quality resampling
        img = img.resize((32, 32), Image.Resampling.LANCZOS)
        img.save(dest_path, "PNG")
        print(f"Successfully resized to 32x32 and saved to {dest_path}")
except Exception as e:
    print(f"Error resizing image: {e}")
