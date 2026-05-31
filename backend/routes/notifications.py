from flask import Blueprint, request, jsonify
from datetime import datetime, date
from models import GoodMoralRequest, Violation, db

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
# MAIN MERGED NOTIFICATIONS (FIXED)
# =========================
@notification_bp.get("/student")
def combined_notifications():

    student_number = request.args.get("student_number")
    student_id = request.args.get("student_id")

    if not student_number or not student_id:
        return jsonify({"message": "missing student info"}), 400

    notifications = []

    # =====================================================
    # GOOD MORAL NOTIFICATIONS (FIXED REVOCATION LOCK)
    # =====================================================
    good_morals = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        is_deleted=False
    ).order_by(GoodMoralRequest.requested_at.desc()).all()

    for r in good_morals:

        # =========================
        # LOCKED VIOLATION (IMPORTANT FIX)
        # =========================
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

        # =========================
        # MESSAGE LOGIC (UNCHANGED BUT STABLE)
        # =========================
        if r.status == "Pending":
            message = "Your Good Moral request is pending."

        elif r.status == "Approved":
            message = "Your Good Moral request has been approved."
        elif r.status == "Rejected":

            if r.remarks and "auto-revoked" in (r.remarks or "").lower():
                message = "Auto-revoked due to violation sanction level."

            else:
                parts = ["Your Good Moral request has been rejected"]

                if violation_name:
                    parts.append(f"Violation: {violation_name}")

                if sanction_text:
                    parts.append(f"Sanction: {sanction_text}")

                message = ". ".join(parts) + "."

        else:
            message = "Status unknown."

        if not r.is_notified:
            r.is_notified = True
            r.notification_sent_at = datetime.utcnow()

        notifications.append({
            "id": r.request_id,
            "type": "good_moral",
            "status": r.status,
            "message": message,
            "created_at": r.requested_at,
            "is_read": bool(r.is_read),
            "is_deleted": bool(r.is_deleted)
        })

    # =========================
    # VIOLATION NOTIFICATIONS (UNCHANGED LOGIC)
    # =========================
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

            remaining = Violation.query.filter(
                Violation.student_id == str(student_id),
                Violation.is_resolved != "Resolved",
                Violation.is_deleted == False
            ).count()

            if remaining == 0:
                status = "Cleared"
                message = "All your violations have been cleared."
            else:
                status = "Resolved"
                message = f"Your {v.predicted_violation} violation has been resolved."

        else:
            status = "Violation"
            message = f"You received a new {v.predicted_violation} violation."

            if v.sanction:
                message += f" Sanction: {v.sanction}"

        if not v.is_notified:
            v.is_notified = True
            v.notification_sent_at = datetime.utcnow()
            changed = True

        notifications.append({
            "id": v.id,
            "type": "violation",
            "status": status,
            "message": message,
            "created_at": v.notification_sent_at or v.violation_date,
            "is_read": bool(v.is_read),
            "is_deleted": bool(v.is_deleted)
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

    return jsonify({
        "unread_count": good + viol
    })


# =========================
# MARK AS READ
# =========================
@notification_bp.patch("/student/close/<string:ntype>/<int:notification_id>")
def mark_as_read(ntype, notification_id):

    obj = GoodMoralRequest.query.get(notification_id) if ntype == "good_moral" else Violation.query.get(notification_id)

    if not obj:
        return jsonify({"message": "not found"}), 404

    obj.is_read = True
    db.session.commit()

    return jsonify({"message": "marked as read"})


# =========================
# DELETE (SOFT)
# =========================
@notification_bp.delete("/student/delete/<string:ntype>/<int:notification_id>")
def delete_notification(ntype, notification_id):

    obj = GoodMoralRequest.query.get(notification_id) if ntype == "good_moral" else Violation.query.get(notification_id)

    if not obj:
        return jsonify({"message": "not found"}), 404

    obj.is_deleted = True
    db.session.commit()

    return jsonify({"message": "deleted"})