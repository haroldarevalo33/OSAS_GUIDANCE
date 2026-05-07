import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:KHnUotgxpadhGOXNemLYxXOjpvBqWvnY@turntable.proxy.rlwy.net:33897/railway"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False