import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app import db
from models import UploadedFile

upload_bp = Blueprint("upload_bp", __name__, url_prefix="/file")

# File upload endpoint
@upload_bp.route("/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    file_type = request.form.get("file_type")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    if not file_type:
        return jsonify({"error": "Missing file_type"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    save_dir = os.path.join(current_app.root_path, "upload")
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, unique_name)
    file.save(save_path)

    # Save file metadata to the database
    new_file = UploadedFile(
        file_type=file_type,
        filename_stored=unique_name,
        filename_original=file.filename,
        mimetype=file.mimetype,
        size_bytes=os.path.getsize(save_path),
        path=save_path
    )
    db.session.add(new_file)
    db.session.commit()

    return jsonify({
        "message": "File uploaded successfully",
        "file_id": new_file.id,
        "stored": unique_name,
        "original": file.filename
    })
# List all uploaded files
@upload_bp.route("/list", methods=["GET"])
def list_files():
    try:
        # Optional: sort by newest first
        files = UploadedFile.query.order_by(UploadedFile.id.desc()).all()

        file_list = [
            {
                "id": f.id,
                "file_type": f.file_type,
                "stored": f.filename_stored,
                "original": f.filename_original,
                "mimetype": f.mimetype,
                "size_bytes": f.size_bytes,
                "path": f.path
            }
            for f in files
        ]

        return jsonify({
            "status": "success",
            "count": len(file_list),
            "files": file_list
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
# List only Good Moral files
@upload_bp.route("/good-moral", methods=["GET"])
def list_good_moral_files():
    try:
        files = UploadedFile.query.filter_by(file_type="good_moral").order_by(UploadedFile.id.desc()).all()
        file_list = [
            {
                "id": f.id,
                "stored": f.filename_stored,
                "original": f.filename_original,
                "mimetype": f.mimetype,
                "size_bytes": f.size_bytes,
                "path": f.path
            }
            for f in files
        ]
        return jsonify({
            "status": "success",
            "count": len(file_list),
            "files": file_list
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# Serve files for download
@upload_bp.route("/download/<filename>", methods=["GET"])
def download_file(filename):
    upload_dir = os.path.join(current_app.root_path, "upload")
    return send_from_directory(upload_dir, filename)


