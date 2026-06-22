import json
from pathlib import Path
from typing import Any


SCENARIOS_DIR = Path(__file__).resolve().parent.parent / "scenarios"


def load_copd_sob_scenario() -> dict[str, Any]:
    scenario_path = SCENARIOS_DIR / "copd_sob.json"

    with scenario_path.open("r", encoding="utf-8") as scenario_file:
        return json.load(scenario_file)
