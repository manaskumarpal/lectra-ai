import os
import tempfile

def save_uploaded_audio(uploaded_file):
    temp_dir = os.path.join(os.path.dirname(__file__), "temp_audio")
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, uploaded_file.name)
    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    return file_path
