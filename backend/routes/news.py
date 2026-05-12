from flask import Blueprint, jsonify
import feedparser

news_bp = Blueprint("news", __name__, url_prefix="/api")


@news_bp.get("/news")
def get_news():
    feeds = [
        ("https://data.gmanetwork.com/gno/rss/news/feed.xml", "GMA News"),
        ("https://news.abs-cbn.com/rss/latest-news", "ABS-CBN News"),
        ("https://www.inquirer.net/feed", "Philippine Daily Inquirer"),
        ("https://www.philstar.com/rss/headlines", "Philstar"),
        ("https://www.manilatimes.net/feed", "Manila Times")
    ]

    articles = []

    for url, source_name in feeds:
        feed = feedparser.parse(url)

        for entry in feed.entries[:5]:
            articles.append({
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "source": source_name
            })

    return jsonify({
        "status": "ok",
        "articles": articles
    })