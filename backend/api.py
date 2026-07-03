import csv
import io

from engine import Engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel


class AddCharsRequest(BaseModel):
    text: str

    class Config:
        json_schema_extra = {"example": {"text": "你好世界"}}


app = FastAPI()
engine = Engine()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])


@app.on_event("startup")
def startup():
    engine.load_dictionary("cedict.json")


@app.post("/api/refresh")
def refresh():
    for char in list(engine.bank.keys()):
        engine.bank[char] = {
            **engine.cedict.get(char, engine.bank[char]),
            **engine.bank[char],
        }
    engine._sync_words()
    return {"status": "ok"}


@app.get("/api/stats")  # ← decorator: HTTP method + URL path
def stats():  # ← function name doesn't matter
    return engine.get_stats()  # ← return a dict, FastAPI converts to JSON


@app.post("/api/characters/add")
def add_characters(data: AddCharsRequest):
    return engine.add_characters(data.text)


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


@app.get("/api/export")
def export_anki():
    rows = engine.export_anki()
    output = io.StringIO()
    writer = csv.writer(output, delimiter="\t")
    writer.writerow(["front", "back", "hsk"])
    for row in rows:
        writer.writerow([row["front"], row["back"], row["hsk"]])
    return Response(content=output.getvalue(), media_type="text/csv")
