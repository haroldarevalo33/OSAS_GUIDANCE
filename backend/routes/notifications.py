from flask import Blueprint, request, jsonify
from datetime import datetime, date, time
from models import (
    GoodMoralRequest,
    Violation,
    ExitRequest,
    CounselingRequest,
    PsychologicalRequest,
    db
)

notification_bp = Blueprint(
    "notification_bp",
    __name__,
    url_prefix="/notification"
)

# =========================
# SAFE DATETIME HANDLER
# =========================
def safe_date(value):
    if not value:
        return datetime.min

    if isinstance(value, datetime):
        return value

    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except:
            return datetime.min

    return datetime.min


# =========================
# SAFE JSON SERIALIZER (FIX FOR TIME ERROR)
# =========================
def safe_json(value):
    if value is None:
        return None

    if isinstance(value, (datetime, date, time)):
        return value.isoformat()

    return value


# =========================
# MAIN MERGED NOTIFICATIONS
# =========================
@notification_bp.get("/student")
def combined_notifications():

    student_number = request.args.get("student_number")
    student_id = request.args.get("student_id")

    if not student_number or not student_id:
        return jsonify({"message": "missing student info"}), 400

    notifications = []

    # =====================================================
    # GOOD MORAL NOTIFICATIONS
    # =====================================================
    good_morals = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        is_deleted=False
    ).order_by(GoodMoralRequest.requested_at.desc()).all()

    for r in good_morals:

        if hasattr(r, "revoke_violation_id") and r.revoke_violation_id:
            latest_violation = Violation.query.get(r.revoke_violation_id)
        else:
            latest_violation = (
                Violation.query
                .filter(
                    Violation.student_id == r.student_number,
                    Violation.is_deleted == False
                )
                .order_by(Violation.violation_date.desc())
                .first()
            )

        violation_name = "Violation"
        sanction_text = "No sanction recorded"

        if latest_violation:
            violation_name = latest_violation.predicted_violation or "Violation"
            sanction_text = latest_violation.sanction or "No sanction recorded"

        if r.status == "Pending":
            message = "Your Good Moral request is pending."
        elif r.status == "Approved":
            message = "Your Good Moral request has been approved."
        elif r.status == "Rejected":
            if r.remarks and "auto-revoked" in (r.remarks or "").lower():
                message = "Auto-revoked due to violation sanction level."
            else:
                message = "Your Good Moral request has been rejected."
        else:
            message = "Status unknown."

        notifications.append({
            "id": r.request_id,
            "type": "good_moral",
            "status": r.status,
            "message": message,
            "created_at": safe_json(r.requested_at),
            "is_read": bool(r.is_read),
            "is_deleted": bool(r.is_deleted)
        })

    # =====================================================
    # VIOLATION NOTIFICATIONS
    # =====================================================
    violations = Violation.query.filter(
        Violation.student_id == str(student_id),
        Violation.is_deleted == False
    ).order_by(Violation.violation_date.desc()).all()

    changed = False

    for v in violations:

        if v.is_notified is None:
            v.is_notified = False
            changed = True

        if v.is_read is None:
            v.is_read = False
            changed = True

        if v.is_deleted is None:
            v.is_deleted = False
            changed = True

        if v.is_resolved == "Resolved":
            status = "Resolved"
            message = f"Your {v.predicted_violation} violation has been resolved."
        else:
            status = "Violation"
            message = f"You received a new {v.predicted_violation} violation."
            if v.sanction:
                message += f" Sanction: {v.sanction}"

        notifications.append({
            "id": v.id,
            "type": "violation",
            "status": status,
            "message": message,
            "created_at": safe_json(v.notification_sent_at or v.violation_date),
            "is_read": bool(v.is_read),
            "is_deleted": bool(v.is_deleted)
        })

    # =====================================================
    # EXIT REQUEST NOTIFICATIONS
    # =====================================================
    exits = ExitRequest.query.filter_by(
        student_number=student_number,
        is_deleted=False
    ).order_by(ExitRequest.requested_at.desc()).all()

    for r in exits:

        msg = f"Exit request is {r.status.lower()}."

        if r.status == "Approved" and r.admin_set_date:
            msg += f" Scheduled: {r.admin_set_date} {r.admin_set_time or ''}"

        notifications.append({
            "id": r.request_id,
            "type": "exit_request",
            "status": r.status,
            "message": msg,
            "created_at": safe_json(r.requested_at),
            "is_read": bool(r.is_read),
            "is_deleted": bool(r.is_deleted),
            "admin_set_date": safe_json(r.admin_set_date),
            "admin_set_time": safe_json(r.admin_set_time)
        })

    # =====================================================
    # COUNSELING REQUEST NOTIFICATIONS
    # =====================================================
    counselings = CounselingRequest.query.filter_by(
        student_number=student_number,
        is_deleted=False
    ).order_by(CounselingRequest.requested_at.desc()).all()

    for r in counselings:

        msg = f"Counseling request is {r.status.lower()}."

        if r.status == "Approved" and r.admin_set_date:
            msg += f" Scheduled: {r.admin_set_date} {r.admin_set_time or ''}"

        notifications.append({
            "id": r.request_id,
            "type": "counseling_request",
            "status": r.status,
            "message": msg,
            "created_at": safe_json(r.requested_at),
            "is_read": bool(r.is_read),
            "is_deleted": bool(r.is_deleted),
            "admin_set_date": safe_json(r.admin_set_date),
            "admin_set_time": safe_json(r.admin_set_time)
        })

    # =====================================================
    # PSYCHOLOGICAL REQUEST NOTIFICATIONS
    # =====================================================
    psychs = PsychologicalRequest.query.filter_by(
        student_number=student_number,
        is_deleted=False
    ).order_by(PsychologicalRequest.requested_at.desc()).all()

    for r in psychs:

        msg = f"Psychological request is {r.status.lower()}."

        if r.status == "Approved" and r.admin_set_date:
            msg += f" Scheduled: {r.admin_set_date} {r.admin_set_time or ''}"

        notifications.append({
            "id": r.request_id,
            "type": "psychological_request",
            "status": r.status,
            "message": msg,
            "created_at": safe_json(r.requested_at),
            "is_read": bool(r.is_read),
            "is_deleted": bool(r.is_deleted),
            "admin_set_date": safe_json(r.admin_set_date),
            "admin_set_time": safe_json(r.admin_set_time)
        })

    # =========================
    # SAFE SORT
    # =========================
    notifications = sorted(
        notifications,
        key=lambda x: safe_date(x["created_at"]),
        reverse=True
    )

    if changed:
        db.session.commit()

    return jsonify({
        "notifications": notifications
    })


# =========================
# UNREAD COUNT
# =========================
@notification_bp.get("/student/unread-count")
def unread_count():

    student_number = request.args.get("student_number")
    student_id = request.args.get("student_id")

    if not student_number or not student_id:
        return jsonify({"message": "missing student info"}), 400

    good = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        is_read=False,
        is_deleted=False
    ).count()

    viol = Violation.query.filter(
        Violation.student_id == str(student_id),
        Violation.is_read == False,
        Violation.is_deleted == False
    ).count()

    exitc = ExitRequest.query.filter_by(
        student_number=student_number,
        is_read=False,
        is_deleted=False
    ).count()

    counsel = CounselingRequest.query.filter_by(
        student_number=student_number,
        is_read=False,
        is_deleted=False
    ).count()

    psych = PsychologicalRequest.query.filter_by(
        student_number=student_number,
        is_read=False,
        is_deleted=False
    ).count()

    return jsonify({
        "unread_count": good + viol + exitc + counsel + psych
    })