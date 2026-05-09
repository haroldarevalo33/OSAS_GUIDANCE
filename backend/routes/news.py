from flask import Blueprint, jsonify
import feedparser

news_bp = Blueprint("news", __name__, url_prefix="/api")


@news_bp.get("/news")
def get_news():
    feed = feedparser.parse("https://news.google.com/rss?hl=en-PH&gl=PH&ceid=PH:en")
    articles = []

    for entry in feed.entries[:10]:
        articles.append({
            "title": entry.title,
            "link": entry.link,
            "source": entry.get("source", {}).get("title", "Unknown")
        })

    return jsonify({"status": "ok", "articles": articles})
