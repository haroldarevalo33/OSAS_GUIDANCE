import cloudinary.uploader
from flask import Blueprint, request, jsonify
from app import db
from models import UploadedFile
import uuid

upload_bp = Blueprint("upload_bp", __name__, url_prefix="/file")


# =========================
# UPLOAD (CLOUDINARY ONLY)
# =========================
@upload_bp.route("/upload", methods=["POST"])
def upload_file():

    file = request.files.get("file")
    file_type = request.form.get("file_type")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    if not file_type:
        return jsonify({"error": "Missing file_type"}), 400

    try:
        result = cloudinary.uploader.upload(
        file,
        folder=f"{file_type}_files",
        resource_type="image" if file.mimetype == "application/pdf" else "raw",
        public_id=uuid.uuid4().hex
    )
        

        new_file = UploadedFile(
            file_type=file_type,
            filename_stored=result.get("public_id"),
            filename_original=file.filename,
            mimetype=file.mimetype,
            size_bytes=result.get("bytes", 0),
            path=result.get("secure_url")  # CLOUDINARY URL ONLY
        )

        db.session.add(new_file)
        db.session.commit()

        return jsonify({
            "message": "File uploaded successfully",
            "file_id": new_file.id,
            "stored": result.get("public_id"),
            "url": result.get("secure_url"),
            "file_type": file_type
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# =========================
# LIST ALL FILES
# =========================
@upload_bp.route("/list", methods=["GET"])
def list_files():

    try:
        files = UploadedFile.query.order_by(UploadedFile.id.desc()).all()

        return jsonify({
            "status": "success",
            "count": len(files),
            "files": [
                {
                    "id": f.id,
                    "file_type": f.file_type,
                    "original": f.filename_original,
                    "stored": f.filename_stored,
                    "mimetype": f.mimetype,
                    "size_bytes": f.size_bytes,
                    "url": f.path  # ALWAYS CLOUDINARY URL
                }
                for f in files
            ]
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500



# =========================
# GOOD MORAL ONLY
# =========================
@upload_bp.route("/good-moral", methods=["GET"])
def list_good_moral_files():

    try:
        files = UploadedFile.query.filter_by(
            file_type="good_moral"
        ).order_by(UploadedFile.id.desc()).all()

        return jsonify({
            "status": "success",
            "count": len(files),
            "files": [
                {
                    "id": f.id,
                    "original": f.filename_original,
                    "stored": f.filename_stored,
                    "mimetype": f.mimetype,
                    "size_bytes": f.size_bytes,
                    "url": f.path
                }
                for f in files
            ]
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500



# =========================
# GET SINGLE FILE
# =========================
@upload_bp.route("/file/<int:file_id>", methods=["GET"])
def get_file(file_id):

    file_record = UploadedFile.query.get(file_id)

    if not file_record:
        return jsonify({"error": "File not found"}), 404

    return jsonify({
        "id": file_record.id,
        "file_type": file_record.file_type,
        "original": file_record.filename_original,
        "stored": file_record.filename_stored,
        "mimetype": file_record.mimetype,
        "size_bytes": file_record.size_bytes,
        "url": file_record.path  # CLOUDINARY ONLY
    }), 200