import json
from pathlib import Path
from typing import Any, Callable, TypedDict

from app.services.persona_settings import apply_persona_settings


SCENARIOS_DIR = Path(__file__).resolve().parent.parent / "scenarios"
ScenarioSettingsApplier = Callable[[dict[str, Any]], dict[str, Any]]


class ScenarioNotFoundError(ValueError):
    pass


class ScenarioRegistryEntry(TypedDict):
    file_name: str
    settings_applier: ScenarioSettingsApplier | None


SCENARIO_REGISTRY: dict[str, ScenarioRegistryEntry] = {
    "copd-sob": {
        "file_name": "copd_sob.json",
        "settings_applier": apply_persona_settings,
    },
}


def list_scenarios() -> list[dict[str, Any]]:
    return [load_scenario(scenario_id) for scenario_id in SCENARIO_REGISTRY]


def load_scenario(scenario_id: str) -> dict[str, Any]:
    scenario_entry = SCENARIO_REGISTRY.get(scenario_id)

    if scenario_entry is None:
        raise ScenarioNotFoundError(f"Unknown scenario: {scenario_id}")

    scenario = _load_scenario_file(scenario_entry["file_name"])
    _validate_scenario_id(scenario_id, scenario)

    settings_applier = scenario_entry.get("settings_applier")

    if settings_applier is None:
        return scenario

    return settings_applier(scenario)


def load_copd_sob_scenario() -> dict[str, Any]:
    return load_scenario("copd-sob")


def _load_scenario_file(file_name: str) -> dict[str, Any]:
    scenario_path = SCENARIOS_DIR / file_name

    with scenario_path.open("r", encoding="utf-8") as scenario_file:
        return json.load(scenario_file)


def _validate_scenario_id(
    requested_scenario_id: str,
    scenario: dict[str, Any],
) -> None:
    loaded_scenario_id = scenario.get("scenario_id")

    if loaded_scenario_id != requested_scenario_id:
        raise ValueError(
            "Scenario registry mismatch: "
            f"requested {requested_scenario_id}, loaded {loaded_scenario_id}."
        )
