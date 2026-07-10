import csv
import io
import os
import sys

from engine import Engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

if getattr(sys, "frozen", False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CEDICT_PATH = os.path.join(BASE_DIR, "cedict.json")
USER_DATA_PATH = os.path.join(os.path.expanduser("~"), ".openzi_user_data.json")


class AddCharsRequest(BaseModel):
    text: str

    class Config:
        json_schema_extra = {"example": {"text": "你好世界"}}


app = FastAPI()
engine = Engine()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])


@app.on_event("startup")
def startup():
    engine.load_dictionary(CEDICT_PATH)
    try:
        engine.load(USER_DATA_PATH)
    except Exception:
        pass


@app.post("/api/refresh")
def refresh():
    for char in list(engine.bank.keys()):
        engine.bank[char] = {
            **engine.bank[char],
            **engine.cedict.get(char, engine.bank[char]),
        }
    engine._sync_words()
    return {"status": "ok"}


@app.get("/api/stats")
def stats():
    return engine.get_stats()


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
    engine.save(USER_DATA_PATH)
    return {"status": "ok"}


@app.post("/api/load")
def load():
    engine.load(USER_DATA_PATH)
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


@app.get("/api/character/{char}")
def get_character(char: str):
    if char in engine.cedict:
        data = engine.cedict[char]
        return {
            "character": char,
            "pinyin": data.get("pinyin", ""),
            "definition": data.get("definition", ""),
            "hsk": data.get("hsk"),
            "frequency": data.get("frequency"),
            "frequency_rank": data.get("char_rank") or data.get("frequency_rank"),
            "in_bank": char in engine.bank,
        }
    return {"character": char, "error": "not found"}


@app.get("/api/dictionary")
def get_dictionary():
    """Return top 3000 single characters ranked by char_rank."""
    items = []
    for char, data in engine.cedict.items():
        if len(char) == 1 and data.get("char_rank"):
            items.append(
                {
                    "character": char,
                    "pinyin": data.get("pinyin", ""),
                    "definition": data.get("definition", ""),
                    "hsk": data.get("hsk"),
                    "frequency": data.get("char_rank"),
                    "frequency_rank": data.get("char_rank"),
                }
            )
    items.sort(key=lambda x: x["frequency"])
    items = items[:3000]
    return items


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
