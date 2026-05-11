from flask import Blueprint, jsonify
import feedparser
import time

news_bp = Blueprint("news", __name__, url_prefix="/api")

CACHE = {
    "data": [],
    "timestamp": 0
}

CACHE_TIME = 300  # 5 minutes


@news_bp.get("/news")
def get_news():
    now = time.time()

    # return cached data if still valid
    if CACHE["data"] and now - CACHE["timestamp"] < CACHE_TIME:
        return jsonify({"status": "ok", "articles": CACHE["data"]})

    feed = feedparser.parse(
        "https://news.google.com/rss?hl=en-PH&gl=PH&ceid=PH:en"
    )

    articles = []

    for entry in feed.entries[:10]:
        articles.append({
            "title": getattr(entry, "title", "No title"),
            "link": getattr(entry, "link", "#"),
            "source": entry.get("source", {}).get("title", "Unknown")
        })

    #  IMPORTANT FIX: only update cache if NOT empty
    if articles:
        CACHE["data"] = articles
        CACHE["timestamp"] = now

    #  fallback: if RSS failed, return old cache
    if not articles and CACHE["data"]:
        return jsonify({"status": "ok", "articles": CACHE["data"]})

    return jsonify({"status": "ok", "articles": articles})