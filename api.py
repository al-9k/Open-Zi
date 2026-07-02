from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engine import Engine

app = FastAPI()
engine = Engine()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])


@app.on_event("startup")
def startup():
    engine.load_dictionary("sample_dict.json")


@app.get("/api/stats")  # ← decorator: HTTP method + URL path
def stats():  # ← function name doesn't matter
    return engine.get_stats()  # ← return a dict, FastAPI converts to JSON


@app.post("/api/characters/add")
def add_characters(data: dict):
    return engine.add_characters(data["text"])


@app.post("/api/characters/remove")
def remove_character(data: dict):
    return engine.remove_character(data["character"])


@app.get("/api/characters")
def get_characters():
    return engine.bank


@app.get("/api/words")
def get_words():
    return engine.beastiary


@app.get("/api/search")
def search(q: str = ""):
    return engine.search(q)


@app.post("/api/save")
def save():
    engine.save("user_data.json")
    return {"status": "ok"}


@app.post("/api/load")
def load():
    engine.load("user_data.json")
    return {"status": "ok"}
