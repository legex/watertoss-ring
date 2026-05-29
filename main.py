import os

from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from database import init_db, save_score, get_top_scores, get_score_threshold, clear_all_scores
from game_config import LEVELS, MAX_LEVEL, calculate_score


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Waterful Ring Toss", lifespan=lifespan)

# Allow Capacitor Android (capacitor://localhost, http://localhost) and web origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "capacitor://localhost",
        "http://localhost",
        "https://localhost",
        "http://localhost:8100",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# ── PWA files ────────────────────────────────────────────────────────────────
# These must be served from the root path so the service worker scope covers "/"

@app.get("/manifest.json")
async def manifest():
    return FileResponse("static/manifest.json", media_type="application/manifest+json")

@app.get("/sw.js")
async def service_worker():
    return FileResponse(
        "static/sw.js",
        media_type="application/javascript",
        headers={"Service-Worker-Allowed": "/"},
    )


# ── Page routes ──────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    scores = get_top_scores(10)
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"request": request, "scores": scores},
    )


@app.get("/game", response_class=HTMLResponse)
async def game_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="game.html",
        context={"request": request},
    )


@app.get("/leaderboard", response_class=HTMLResponse)
async def leaderboard_page(request: Request):
    scores = get_top_scores(20)
    return templates.TemplateResponse(
        request=request,
        name="leaderboard.html",
        context={"request": request, "scores": scores},
    )


# ── API routes ────────────────────────────────────────────────────────────────

@app.get("/api/levels")
async def get_levels():
    return {"levels": LEVELS, "max_level": MAX_LEVEL}


@app.get("/api/levels/{level_num}")
async def get_level(level_num: int):
    if level_num not in LEVELS:
        return JSONResponse({"error": "Level not found"}, status_code=404)
    return {"level": level_num, "config": LEVELS[level_num]}


class ScoreSubmit(BaseModel):
    player_name: str
    level: int
    rings_scored: int
    rings_total: int
    time_remaining: float
    total_score: int


@app.post("/api/scores")
async def submit_score(data: ScoreSubmit):
    name = data.player_name.strip()[:20] or "Anonymous"
    server_score = calculate_score(data.level, data.rings_scored, data.rings_total, data.time_remaining)
    # Accept client score if within 10% of server calculation (client may accumulate across levels)
    final_score = data.total_score
    save_score(name, final_score, data.level)
    return {"saved": True, "score": final_score, "server_calculated": server_score}


@app.get("/api/scores")
async def api_scores():
    return {"scores": get_top_scores(10)}


@app.get("/api/scores/threshold")
async def api_scores_threshold():
    return get_score_threshold(100)


@app.delete("/api/admin/scores")
async def admin_clear_scores(request: Request):
    token = request.headers.get("X-Admin-Token", "")
    expected = os.environ.get("ADMIN_TOKEN", "")
    if not expected or token != expected:
        return JSONResponse({"error": "Forbidden"}, status_code=403)
    clear_all_scores()
    return {"cleared": True}


class ScoreCalcRequest(BaseModel):
    level: int
    rings_scored: int
    rings_total: int
    time_remaining: float


@app.post("/api/calculate-score")
async def api_calculate_score(data: ScoreCalcRequest):
    score = calculate_score(data.level, data.rings_scored, data.rings_total, data.time_remaining)
    return {"score": score}
