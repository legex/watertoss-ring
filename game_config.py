"""Level configurations — 30 levels of progressive difficulty."""

# restricted_pegs : how many pegs need a specific color (0 = all free)
# colors_per_peg  : accepted colors per restricted peg (1 = strict, 2 = dual)
# Free rings (silver) ONLY land on free pegs; colored rings ONLY land on their matching peg.

LEVELS = {
    # ── Phase 1 · Free play — learn the jets (1–3) ────────────────────────────
    1:  {"pegs": 2, "rings": 3,  "time": 65, "peg_moving": False, "water_power": 0.58, "ring_drift": 0.018, "points_per_ring": 80,  "restricted_pegs": 0, "colors_per_peg": 1},
    2:  {"pegs": 3, "rings": 4,  "time": 63, "peg_moving": False, "water_power": 0.60, "ring_drift": 0.020, "points_per_ring": 90,  "restricted_pegs": 0, "colors_per_peg": 1},
    3:  {"pegs": 3, "rings": 5,  "time": 61, "peg_moving": False, "water_power": 0.62, "ring_drift": 0.022, "points_per_ring": 100, "restricted_pegs": 0, "colors_per_peg": 1},

    # ── Phase 2 · Color intro: 1 restricted peg (4–6) ─────────────────────────
    4:  {"pegs": 3, "rings": 5,  "time": 59, "peg_moving": False, "water_power": 0.63, "ring_drift": 0.023, "points_per_ring": 115, "restricted_pegs": 1, "colors_per_peg": 1},
    5:  {"pegs": 3, "rings": 6,  "time": 57, "peg_moving": False, "water_power": 0.64, "ring_drift": 0.024, "points_per_ring": 130, "restricted_pegs": 1, "colors_per_peg": 1},
    6:  {"pegs": 4, "rings": 6,  "time": 56, "peg_moving": False, "water_power": 0.65, "ring_drift": 0.025, "points_per_ring": 145, "restricted_pegs": 1, "colors_per_peg": 1},

    # ── Phase 3 · Color intro: 2 restricted pegs (7–9) ────────────────────────
    7:  {"pegs": 4, "rings": 7,  "time": 54, "peg_moving": False, "water_power": 0.66, "ring_drift": 0.026, "points_per_ring": 160, "restricted_pegs": 2, "colors_per_peg": 1},
    8:  {"pegs": 4, "rings": 7,  "time": 53, "peg_moving": False, "water_power": 0.67, "ring_drift": 0.027, "points_per_ring": 175, "restricted_pegs": 2, "colors_per_peg": 1},
    9:  {"pegs": 5, "rings": 8,  "time": 52, "peg_moving": False, "water_power": 0.68, "ring_drift": 0.028, "points_per_ring": 190, "restricted_pegs": 3, "colors_per_peg": 1},

    # ── Phase 4 · All restricted, 2 colors per peg (10–12) ────────────────────
    10: {"pegs": 4, "rings": 8,  "time": 51, "peg_moving": False, "water_power": 0.70, "ring_drift": 0.030, "points_per_ring": 210, "restricted_pegs": 4, "colors_per_peg": 2},
    11: {"pegs": 5, "rings": 9,  "time": 50, "peg_moving": False, "water_power": 0.71, "ring_drift": 0.031, "points_per_ring": 230, "restricted_pegs": 5, "colors_per_peg": 2},
    12: {"pegs": 5, "rings": 10, "time": 49, "peg_moving": False, "water_power": 0.72, "ring_drift": 0.032, "points_per_ring": 250, "restricted_pegs": 5, "colors_per_peg": 2},

    # ── Phase 5 · Moving pegs + 2 colors (13–15) ──────────────────────────────
    13: {"pegs": 5, "rings": 10, "time": 48, "peg_moving": True,  "water_power": 0.73, "ring_drift": 0.033, "points_per_ring": 270, "restricted_pegs": 5, "colors_per_peg": 2},
    14: {"pegs": 6, "rings": 11, "time": 47, "peg_moving": True,  "water_power": 0.74, "ring_drift": 0.034, "points_per_ring": 290, "restricted_pegs": 6, "colors_per_peg": 2},
    15: {"pegs": 6, "rings": 12, "time": 46, "peg_moving": True,  "water_power": 0.75, "ring_drift": 0.035, "points_per_ring": 315, "restricted_pegs": 6, "colors_per_peg": 2},

    # ── Phase 6 · Strict 1-color, moving (16–18) ──────────────────────────────
    16: {"pegs": 5, "rings": 10, "time": 45, "peg_moving": True,  "water_power": 0.76, "ring_drift": 0.037, "points_per_ring": 340, "restricted_pegs": 5, "colors_per_peg": 1},
    17: {"pegs": 6, "rings": 11, "time": 43, "peg_moving": True,  "water_power": 0.77, "ring_drift": 0.039, "points_per_ring": 365, "restricted_pegs": 6, "colors_per_peg": 1},
    18: {"pegs": 6, "rings": 12, "time": 41, "peg_moving": True,  "water_power": 0.79, "ring_drift": 0.041, "points_per_ring": 390, "restricted_pegs": 6, "colors_per_peg": 1},

    # ── Phase 7 · More pegs, strict (19–21) ───────────────────────────────────
    19: {"pegs": 7, "rings": 12, "time": 40, "peg_moving": True,  "water_power": 0.80, "ring_drift": 0.043, "points_per_ring": 420, "restricted_pegs": 7, "colors_per_peg": 1},
    20: {"pegs": 7, "rings": 13, "time": 38, "peg_moving": True,  "water_power": 0.81, "ring_drift": 0.045, "points_per_ring": 450, "restricted_pegs": 7, "colors_per_peg": 1},
    21: {"pegs": 7, "rings": 14, "time": 37, "peg_moving": True,  "water_power": 0.82, "ring_drift": 0.047, "points_per_ring": 480, "restricted_pegs": 7, "colors_per_peg": 1},

    # ── Phase 8 · 8 pegs, strict (22–25) ──────────────────────────────────────
    22: {"pegs": 8, "rings": 14, "time": 36, "peg_moving": True,  "water_power": 0.84, "ring_drift": 0.049, "points_per_ring": 515, "restricted_pegs": 8, "colors_per_peg": 1},
    23: {"pegs": 8, "rings": 15, "time": 34, "peg_moving": True,  "water_power": 0.85, "ring_drift": 0.051, "points_per_ring": 550, "restricted_pegs": 8, "colors_per_peg": 1},
    24: {"pegs": 8, "rings": 16, "time": 33, "peg_moving": True,  "water_power": 0.87, "ring_drift": 0.053, "points_per_ring": 590, "restricted_pegs": 8, "colors_per_peg": 1},
    25: {"pegs": 8, "rings": 16, "time": 32, "peg_moving": True,  "water_power": 0.88, "ring_drift": 0.055, "points_per_ring": 630, "restricted_pegs": 8, "colors_per_peg": 1},

    # ── Phase 9 · Maximum difficulty (26–30) ──────────────────────────────────
    26: {"pegs": 8, "rings": 17, "time": 30, "peg_moving": True,  "water_power": 0.90, "ring_drift": 0.058, "points_per_ring": 675, "restricted_pegs": 8, "colors_per_peg": 1},
    27: {"pegs": 8, "rings": 18, "time": 28, "peg_moving": True,  "water_power": 0.92, "ring_drift": 0.061, "points_per_ring": 720, "restricted_pegs": 8, "colors_per_peg": 1},
    28: {"pegs": 8, "rings": 19, "time": 26, "peg_moving": True,  "water_power": 0.94, "ring_drift": 0.064, "points_per_ring": 770, "restricted_pegs": 8, "colors_per_peg": 1},
    29: {"pegs": 8, "rings": 20, "time": 24, "peg_moving": True,  "water_power": 0.97, "ring_drift": 0.067, "points_per_ring": 825, "restricted_pegs": 8, "colors_per_peg": 1},
    30: {"pegs": 8, "rings": 20, "time": 22, "peg_moving": True,  "water_power": 1.00, "ring_drift": 0.070, "points_per_ring": 900, "restricted_pegs": 8, "colors_per_peg": 1},
}

MAX_LEVEL = 30

TIME_BONUS_MULTIPLIER = 5
PERFECT_CLEAR_BONUS   = 500


def calculate_score(level: int, rings_scored: int, rings_total: int, time_remaining: float) -> int:
    cfg   = LEVELS.get(level, LEVELS[30])
    base  = rings_scored * cfg["points_per_ring"]
    time_bonus = int(time_remaining * TIME_BONUS_MULTIPLIER)
    perfect    = PERFECT_CLEAR_BONUS if rings_scored == rings_total else 0
    return base + time_bonus + perfect
