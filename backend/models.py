from datetime import date, datetime
from extension import db  # Use the db instance from extension.py

# -----------------------------
# Admin Table
# -----------------------------
class Admin(db.Model):
    __tablename__ = 'admin_tbl'

    admin_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    profile_pic = db.Column(db.String(255), nullable=False, default='default.png')

    # Relationships
    uploads = db.relationship(
        "UploadedFile",
        back_populates="uploader",
        cascade="all, delete-orphan"
    )
    violations_encoded = db.relationship(
        "Violation",
        back_populates="encoder",
        cascade="all, delete-orphan"
    )
    students_encoded = db.relationship(
        "Student",
        back_populates="encoder",
        cascade="all, delete-orphan"
    )
    good_moral_processed = db.relationship(
        "GoodMoralRequest",
        back_populates="processed_by_admin",
        cascade="all, delete-orphan"
    )


# -----------------------------
# Student Table
# -----------------------------
class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    student_number = db.Column(db.Integer, unique=True, nullable=False)
    student_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    course = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    profile_pic = db.Column(db.String(255), nullable=True) 

    # Link to admin who encoded the student
    encoded_by = db.Column(
        db.Integer,
        db.ForeignKey("admin_tbl.admin_id", ondelete="SET NULL"),
        nullable=True
    )
    encoder = db.relationship("Admin", back_populates="students_encoded")

    # Relationships
    violations = db.relationship("Violation", back_populates="student")
    good_moral_requests = db.relationship(
        "GoodMoralRequest",
        back_populates="student",
        cascade="all, delete-orphan"
    )


# -----------------------------
# Uploaded Files Table
# -----------------------------
class UploadedFile(db.Model):
    __tablename__ = "uploaded_files"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    file_type = db.Column(
        db.Enum("good_moral", "rules", "other", name="file_type_enum"),
        nullable=False,
        default="other"
    )
    filename_stored = db.Column(db.String(255), nullable=False)
    filename_original = db.Column(db.String(255), nullable=False)
    mimetype = db.Column(db.String(100), nullable=False)
    size_bytes = db.Column(db.BigInteger, nullable=False)
    path = db.Column(db.String(512), nullable=False)

    uploaded_by = db.Column(
        db.Integer,
        db.ForeignKey("admin_tbl.admin_id", ondelete="SET NULL"),
        nullable=True
    )
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    uploader = db.relationship("Admin", back_populates="uploads")


# -----------------------------
# Violations Table
# -----------------------------
class Violation(db.Model):
    __tablename__ = "violations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_name = db.Column(db.String(150), nullable=False)
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.student_number", ondelete="CASCADE"),
        nullable=False
    )
    course_year_section = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    violation_text = db.Column(db.Text, nullable=False)
    violation_date = db.Column(db.Date, nullable=False, default=date.today)
    predicted_violation = db.Column(db.String(150), nullable=True)
    predicted_section = db.Column(db.String(100), nullable=True)
    predictive_text = db.Column(db.Text, nullable=True)
    standard_text = db.Column(db.Text, nullable=True)
    encoded_by = db.Column(
        db.Integer,
        db.ForeignKey("admin_tbl.admin_id", ondelete="SET NULL"),
        nullable=True
    )

    encoder = db.relationship("Admin", back_populates="violations_encoded")
    student = db.relationship("Student", back_populates="violations")


# -----------------------------
# Good Moral Requests Table
# -----------------------------
class GoodMoralRequest(db.Model):
    __tablename__ = "good_moral_requests"

    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_number = db.Column(
        db.Integer,
        db.ForeignKey("students.student_number", ondelete="CASCADE"),
        nullable=False
    )
    filename_stored = db.Column(db.String(255), nullable=True)  # ✅ nullable
    filename_original = db.Column(db.String(255), nullable=True) 
    status = db.Column(
        db.Enum("Pending", "Approved", "Rejected", name="gmr_status_enum"),
        nullable=False,
        default="Pending"
    )
    requested_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    processed_by = db.Column(
        db.Integer,
        db.ForeignKey("admin_tbl.admin_id", ondelete="SET NULL"),
        nullable=True
    )
    processed_at = db.Column(db.DateTime, nullable=True)
    remarks = db.Column(db.Text, nullable=True)

    student = db.relationship("Student", back_populates="good_moral_requests")
    processed_by_admin = db.relationship("Admin", back_populates="good_moral_processed")
