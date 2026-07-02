import yt_dlp
import os
import re

def clean_youtube_id(url_or_id: str) -> str:
    """Extract video/playlist ID from a YouTube URL or return it directly."""
    url_or_id = url_or_id.strip()
    
    # Playlist ID check (list=...)
    playlist_match = re.search(r"[?&]list=([^#\&\?]+)", url_or_id)
    if playlist_match:
        return playlist_match.group(1)
        
    # Video ID check (v=... or watch/ or embed/ or youtu.be/)
    video_match = re.search(r"(?:v=|\/embed\/|\/watch\?v=|\/\d{1,}\/|\/vi\/|youtu\.be\/|shorts\/)([^#\&\?]+)", url_or_id)
    if video_match:
        return video_match.group(1)
        
    # Return directly if alphanumeric-like ID (e.g. PL... or standard video ID)
    return url_or_id

def extract_metadata(url_or_id: str):
    """
    Extract course details (playlist or video) using yt-dlp.
    Returns:
        dict: {
            "name": str,
            "videos": list of {title, youtube_id, duration, thumbnail_url}
        }
    """
    clean_id = clean_youtube_id(url_or_id)
    
    # Check if it looks like a playlist
    is_playlist = len(clean_id) > 12 or clean_id.startswith("PL") or "list=" in url_or_id
    
    if is_playlist:
        url = f"https://www.youtube.com/playlist?list={clean_id}"
    else:
        url = f"https://www.youtube.com/watch?v={clean_id}"
        
    ydl_opts = {
        'extract_flat': True,
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
        except Exception as e:
            raise Exception(f"Failed to fetch YouTube details: {str(e)}")
            
    if not info:
        raise Exception("No information returned from YouTube")
        
    videos = []
    course_name = info.get("title", "New Course")
    
    # If it is a playlist (contains entries)
    if "entries" in info:
        entries = list(info["entries"])
        for idx, entry in enumerate(entries):
            if not entry:
                continue
            
            # Extract video ID
            video_id = entry.get("id") or entry.get("url")
            if not video_id:
                continue
                
            # Handle cases where the ID is in URL format
            if "youtube.com" in video_id or "youtu.be" in video_id:
                video_id = clean_youtube_id(video_id)
                
            title = entry.get("title") or f"Video {idx + 1}"
            duration = int(entry.get("duration") or 0)
            
            # Find best thumbnail
            thumbnail = entry.get("thumbnail")
            if not thumbnail and entry.get("thumbnails"):
                thumbnail = entry.get("thumbnails")[0].get("url")
            if not thumbnail:
                thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                
            videos.append({
                "title": title,
                "youtube_id": video_id,
                "duration": duration,
                "thumbnail_url": thumbnail
            })
    else:
        # It's a single video
        video_id = info.get("id") or clean_id
        title = info.get("title") or "Untitled Video"
        duration = int(info.get("duration") or 0)
        thumbnail = info.get("thumbnail")
        if not thumbnail and info.get("thumbnails"):
            thumbnail = info.get("thumbnails")[0].get("url")
        if not thumbnail:
            thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            
        videos.append({
            "title": title,
            "youtube_id": video_id,
            "duration": duration,
            "thumbnail_url": thumbnail
        })
        
    return {
        "name": course_name,
        "videos": videos
    }

def download_video(video_id: str, db_video_id: int, save_dir: str, progress_callback):
    """
    Downloads a single YouTube video for offline playback.
    Saves it as save_dir/video_id.mp4.
    Calls progress_callback(progress_percentage) during download.
    """
    os.makedirs(save_dir, exist_ok=True)
    outtmpl = os.path.join(save_dir, f"{video_id}.%(ext)s")
    
    # Hook to report download progress
    def ytdl_hook(d):
        if d['status'] == 'downloading':
            total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate') or 1
            downloaded_bytes = d.get('downloaded_bytes', 0)
            percentage = int((downloaded_bytes / total_bytes) * 100)
            # Clip between 0 and 99 so we only hit 100 when fully written
            percentage = max(0, min(99, percentage))
            progress_callback(percentage)
        elif d['status'] == 'finished':
            progress_callback(100)
            
    # Options tailored to download a pre-merged mp4 (h264+aac) 
    # to avoid needing external ffmpeg dependency for merging.
    # We cap at 720p or less to conserve user disk space and bandwidth.
    ydl_opts = {
        'format': 'best[ext=mp4][height<=720]/best[ext=mp4]/best',
        'outtmpl': outtmpl,
        'progress_hooks': [ytdl_hook],
        'quiet': True,
        'no_warnings': True,
    }
    
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        # Find the path of the downloaded file
        filename = ydl.prepare_filename(info)
        
        # Verify the file exists and return it
        if os.path.exists(filename):
            return filename
            
        # Fallback search if extension changed (e.g. .m4a or similar if best was different)
        base_path = os.path.join(save_dir, video_id)
        for ext in ['.mp4', '.mkv', '.webm', '.3gp']:
            test_path = f"{base_path}{ext}"
            if os.path.exists(test_path):
                return test_path
                
        raise FileNotFoundError("Downloaded video file could not be found.")

XOR_SIZE = 1024
XOR_KEY = 0x5A

def scramble_file(file_path: str):
    """
    XOR scrambles the first 1024 bytes of the video file to corrupt the header.
    This protects the content and prevents standard media players from playing it.
    """
    if not os.path.exists(file_path):
        return
    try:
        with open(file_path, "r+b") as f:
            data = f.read(XOR_SIZE)
            scrambled = bytes([b ^ XOR_KEY for b in data])
            f.seek(0)
            f.write(scrambled)
    except Exception as e:
        print(f"Error scrambling file {file_path}: {e}")
