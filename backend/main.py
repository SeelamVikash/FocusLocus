from fastapi import FastAPI, BackgroundTasks, HTTPException, Body, Request, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
import re
import os
from typing import List, Optional
from pydantic import BaseModel

from .database import (
    init_db,
    create_user,
    get_all_users,
    get_user_by_id,
    verify_user_pin,
    recover_user_pin,
    update_user_profile,
    delete_user_profile,
    create_course,
    add_video,
    get_all_courses,
    get_course_details,
    delete_course,
    set_video_completed_status,
    update_video_download_status,
    get_video_by_id,
    save_video_note,
    get_video_note,
    get_user_statistics,
    update_study_stats
)
from .youtube import extract_metadata, download_video, scramble_file

app = FastAPI(title="FocusLocus API")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Tracks video IDs currently downloading
active_downloads = set()

# Initialize DB on Startup
@app.on_event("startup")
def startup_event():
    init_db()

# Models
class UserCreateRequest(BaseModel):
    name: str
    pin: str
    security_question: str
    security_answer: str

class UserLoginRequest(BaseModel):
    user_id: int
    pin: str

class UserRecoverRequest(BaseModel):
    user_id: int
    security_answer: str

class UserUpdateRequest(BaseModel):
    name: str
    pin: str
    security_question: str
    security_answer: str

class UserDeleteRequest(BaseModel):
    pin: str
    security_answer: str

class CourseCreateRequest(BaseModel):
    name: str
    youtube_url: str
    videos: Optional[List[dict]] = None

class IndividualCourseCreateRequest(BaseModel):
    name: str
    video_urls: List[str]

class NoteSaveRequest(BaseModel):
    content: str

# ----------------------------------------------------
# User Authentication API Routes
# ----------------------------------------------------

@app.get("/api/users")
def list_users():
    return get_all_users()

@app.get("/api/users/{user_id}/question")
def get_user_question(user_id: int):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"security_question": user["security_question"]}

@app.post("/api/users")
def register_user(req: UserCreateRequest):
    name = req.name.strip()
    pin = req.pin.strip()
    question = req.security_question.strip()
    answer = req.security_answer.strip()
    
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if not pin.isdigit() or len(pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")
    if not question or not answer:
        raise HTTPException(status_code=400, detail="Security question and answer are required")
        
    try:
        user_id = create_user(name, pin, question, answer)
        return {"success": True, "user_id": user_id, "name": name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/users/login")
def login_user(req: UserLoginRequest):
    is_valid = verify_user_pin(req.user_id, req.pin)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    return {"success": True}

@app.post("/api/users/recover")
def recover_pin(req: UserRecoverRequest):
    pin = recover_user_pin(req.user_id, req.security_answer)
    if not pin:
        raise HTTPException(status_code=400, detail="Incorrect security answer. PIN recovery failed.")
    return {"success": True, "pin": pin}

@app.post("/api/users/update")
def update_user(req: UserUpdateRequest, x_user_id: int = Header(..., alias="X-User-Id")):
    name = req.name.strip()
    pin = req.pin.strip()
    question = req.security_question.strip()
    answer = req.security_answer.strip()
    
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if not pin.isdigit() or len(pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")
    if not question or not answer:
        raise HTTPException(status_code=400, detail="Security question and answer are required")
        
    success = update_user_profile(x_user_id, name, pin, question, answer)
    return {"success": success, "name": name}

@app.post("/api/users/delete")
def delete_user(req: UserDeleteRequest, x_user_id: int = Header(..., alias="X-User-Id")):
    pin = req.pin.strip()
    answer = req.security_answer.strip()
    
    # 1. Double verify PIN
    is_pin_valid = verify_user_pin(x_user_id, pin)
    if not is_pin_valid:
        raise HTTPException(status_code=400, detail="Invalid PIN. Deletion aborted.")
        
    # 2. Double verify Security Answer
    recovered_pin = recover_user_pin(x_user_id, answer)
    if not recovered_pin:
        raise HTTPException(status_code=400, detail="Incorrect security answer. Deletion aborted.")
        
    # 3. Securely delete the user profile and all database cascades/offline files
    success = delete_user_profile(x_user_id)
    return {"success": success}

# ----------------------------------------------------
# Scoped Learning Modules API Routes
# ----------------------------------------------------

@app.get("/api/courses")
def list_courses(x_user_id: int = Header(..., alias="X-User-Id")):
    return get_all_courses(x_user_id)

@app.post("/api/courses/import-playlist")
def import_playlist(req: CourseCreateRequest, x_user_id: int = Header(..., alias="X-User-Id")):
    try:
        metadata = extract_metadata(req.youtube_url)
        course_name = req.name if req.name.strip() else metadata["name"]
        
        course_id = create_course(x_user_id, course_name)
        for idx, video in enumerate(metadata["videos"]):
            add_video(
                course_id=course_id,
                title=video["title"],
                youtube_id=video["youtube_id"],
                duration=video["duration"],
                thumbnail_url=video["thumbnail_url"],
                order_index=idx
            )
            
        return {"success": True, "course_id": course_id, "name": course_name, "video_count": len(metadata["videos"])}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/courses/import-individual")
def import_individual(req: IndividualCourseCreateRequest, x_user_id: int = Header(..., alias="X-User-Id")):
    if not req.video_urls:
        raise HTTPException(status_code=400, detail="No video URLs provided")
        
    try:
        course_id = create_course(x_user_id, req.name)
        added_count = 0
        
        for idx, url in enumerate(req.video_urls):
            if not url.strip():
                continue
            try:
                metadata = extract_metadata(url)
                if metadata["videos"]:
                    video = metadata["videos"][0]
                    add_video(
                        course_id=course_id,
                        title=video["title"],
                        youtube_id=video["youtube_id"],
                        duration=video["duration"],
                        thumbnail_url=video["thumbnail_url"],
                        order_index=idx
                    )
                    added_count += 1
            except Exception as vid_err:
                print(f"Skipping invalid video URL {url}: {vid_err}")
                
        if added_count == 0:
            delete_course(x_user_id, course_id)
            raise HTTPException(status_code=400, detail="None of the video URLs could be parsed successfully")
            
        return {"success": True, "course_id": course_id, "name": req.name, "video_count": added_count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/courses/{course_id}")
def get_course(course_id: int, x_user_id: int = Header(..., alias="X-User-Id")):
    course = get_course_details(x_user_id, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    return course

@app.delete("/api/courses/{course_id}")
def delete_course_endpoint(course_id: int, x_user_id: int = Header(..., alias="X-User-Id")):
    success = delete_course(x_user_id, course_id)
    return {"success": success}

# Video Management
@app.post("/api/videos/{video_id}/toggle-complete")
def toggle_complete(video_id: int, completed: bool = Body(embed=True), x_user_id: int = Header(..., alias="X-User-Id")):
    success = set_video_completed_status(x_user_id, video_id, completed)
    return {"success": success}

# Note Management (unique globally by video_id, but validated by course ownership)
@app.get("/api/videos/{video_id}/note")
def get_note(video_id: int, x_user_id: int = Header(..., alias="X-User-Id")):
    video = get_video_by_id(video_id)
    if not video:
         raise HTTPException(status_code=404, detail="Video not found")
    course = get_course_details(x_user_id, video["course_id"])
    if not course:
        raise HTTPException(status_code=403, detail="Access denied")
        
    content = get_video_note(video_id)
    return {"content": content}

@app.post("/api/videos/{video_id}/note")
def save_note(video_id: int, req: NoteSaveRequest, x_user_id: int = Header(..., alias="X-User-Id")):
    video = get_video_by_id(video_id)
    if not video:
         raise HTTPException(status_code=404, detail="Video not found")
    course = get_course_details(x_user_id, video["course_id"])
    if not course:
        raise HTTPException(status_code=403, detail="Access denied")
        
    success = save_video_note(video_id, req.content)
    return {"success": success}

# Stats Management
@app.get("/api/stats")
def get_stats(x_user_id: int = Header(..., alias="X-User-Id")):
    return get_user_statistics(x_user_id)

@app.post("/api/stats/track-time")
def track_time(seconds: int = Body(embed=True), x_user_id: int = Header(..., alias="X-User-Id")):
    update_study_stats(x_user_id, seconds)
    return {"success": True}

# Video Downloads (Offline Mode)
def download_background_task(video_id: str, db_video_id: int):
    try:
        def progress_callback(percentage: int):
            update_video_download_status(db_video_id, "downloading", progress=percentage)
            
        offline_file = download_video(
            video_id=video_id,
            db_video_id=db_video_id,
            save_dir=DOWNLOADS_DIR,
            progress_callback=progress_callback
        )
        
        # Scramble the downloaded file to protect YouTube content integrity
        scramble_file(offline_file)
        
        rel_path = os.path.relpath(offline_file, os.path.dirname(os.path.abspath(__file__)))
        update_video_download_status(db_video_id, "completed", offline_path=rel_path, progress=100)
    except Exception as e:
        print(f"Background download error for video ID {db_video_id}: {e}")
        update_video_download_status(db_video_id, "failed", progress=0)
    finally:
        active_downloads.discard(db_video_id)

@app.post("/api/videos/{video_id}/download")
def start_video_download(video_id: int, background_tasks: BackgroundTasks, x_user_id: int = Header(..., alias="X-User-Id")):
    video = get_video_by_id(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    course = get_course_details(x_user_id, video["course_id"])
    if not course:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if video_id in active_downloads or video["download_status"] == "completed":
        return {"status": video["download_status"], "message": "Download already in progress or completed"}
        
    active_downloads.add(video_id)
    update_video_download_status(video_id, "downloading", progress=0)
    
    background_tasks.add_task(
        download_background_task,
        video_id=video["youtube_id"],
        db_video_id=video_id
    )
    
    return {"success": True, "status": "downloading"}

XOR_SIZE = 1024
XOR_KEY = 0x5A

def unscramble_bytes(chunk: bytes, offset: int) -> bytes:
    if offset < XOR_SIZE:
        unscramble_len = min(len(chunk), XOR_SIZE - offset)
        unscrambled = bytearray(chunk)
        for i in range(unscramble_len):
            unscrambled[i] ^= XOR_KEY
        return bytes(unscrambled)
    return chunk

def range_streamer(file_path: str, start: int, end: int, chunk_size: int = 256 * 1024):
    with open(file_path, "rb") as f:
        f.seek(start)
        remaining = end - start + 1
        curr_offset = start
        
        while remaining > 0:
            to_read = min(chunk_size, remaining)
            chunk = f.read(to_read)
            if not chunk:
                break
                
            chunk = unscramble_bytes(chunk, curr_offset)
            yield chunk
            remaining -= len(chunk)
            curr_offset += len(chunk)

@app.get("/api/videos/play/{video_id}")
def play_offline_video(
    video_id: int, 
    request: Request, 
    user_id: Optional[str] = None, 
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    # Authenticate user from query parameter or header (handles browser native video elements)
    uid_str = user_id or x_user_id
    if not uid_str or uid_str == "null" or uid_str == "undefined":
        raise HTTPException(status_code=401, detail="User ID required")
        
    try:
        effective_user_id = int(uid_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User ID format")

    video = get_video_by_id(video_id)
    if not video or not video["offline_path"]:
        raise HTTPException(status_code=404, detail="Video not downloaded or not found")
        
    course = get_course_details(effective_user_id, video["course_id"])
    if not course:
        raise HTTPException(status_code=403, detail="Access denied")
        
    base_dir = os.path.dirname(os.path.abspath(__file__))
    abs_path = os.path.join(base_dir, video["offline_path"])
    
    if not os.path.exists(abs_path):
        update_video_download_status(video_id, "none", offline_path="", progress=0)
        raise HTTPException(status_code=404, detail="Downloaded video file is missing on disk")
        
    file_size = os.path.getsize(abs_path)
    range_header = request.headers.get("range")
    
    headers = {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
    }
    
    if range_header:
        match = re.search(r"bytes=(\d+)-(\d*)", range_header)
        if match:
            start = int(match.group(1))
            end_group = match.group(2)
            end = int(end_group) if end_group else file_size - 1
            
            start = max(0, min(start, file_size - 1))
            end = max(start, min(end, file_size - 1))
            
            content_length = end - start + 1
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            headers["Content-Length"] = str(content_length)
            
            with open(abs_path, "rb") as f:
                f.seek(start)
                chunk = f.read(content_length)
                chunk = unscramble_bytes(chunk, start)
                
            return Response(
                content=chunk,
                status_code=206,
                headers=headers,
                media_type="video/mp4"
            )
            
    # Fallback to serving whole file if no range header was provided
    with open(abs_path, "rb") as f:
        chunk = f.read()
        chunk = unscramble_bytes(chunk, 0)
        
    headers["Content-Length"] = str(file_size)
    return Response(
        content=chunk,
        status_code=200,
        headers=headers,
        media_type="video/mp4"
    )

# Serve Frontend Static Files
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
os.makedirs(frontend_dir, exist_ok=True)

app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
