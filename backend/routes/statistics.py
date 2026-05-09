from flask import Blueprint, jsonify
from models import Violation
from datetime import date

stats_bp = Blueprint("statistics", __name__, url_prefix="/statistics")


@stats_bp.get("/monthly")
def monthly_stats():
    result = {m: 0 for m in ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}
    violations = Violation.query.all()

    for v in violations:
        dt = v.violation_date or date.today()
        result[dt.strftime("%b")] += 1

    return jsonify([{"month": m, "cases": c} for m, c in result.items()])
