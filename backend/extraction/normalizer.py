from __future__ import annotations

import re
from typing import Any

import pint

ureg = pint.UnitRegistry()

CANONICAL_TARGET_UNITS = {
    "mean_temperature": "K",
    "temperature_range": "K",
    "atmospheric_pressure": "Pa",
    "annual_precipitation": "mm/yr",
    "elevation_range": "m",
    "ph": "pH",
}

# Match aliases case-insensitively, but always pass Pint's canonical spelling
# through unchanged (notably degC/degF and kelvin).
UNIT_ALIASES = {
    "c": "degC", "degc": "degC", "celsius": "degC", "°c": "degC",
    "f": "degF", "degf": "degF", "fahrenheit": "degF", "°f": "degF",
    "k": "kelvin", "kelvin": "kelvin",
    "mbar": "millibar", "millibar": "millibar",
    "bar": "bar", "pa": "pascal", "pascal": "pascal", "pascals": "pascal",
    "kpa": "kilopascal", "hpa": "hectopascal", "atm": "atmosphere",
    "atmosphere": "atmosphere", "torr": "torr", "mmhg": "millimeter_of_mercury",
    "psi": "psi", "mm": "millimeter", "mm/yr": "millimeter/year",
    "mm/year": "millimeter/year", "mm a-1": "millimeter/year",
    "m": "meter", "meter": "meter", "meters": "meter", "metre": "meter",
    "metres": "meter", "km": "kilometer", "ft": "foot", "feet": "foot",
    "foot": "foot",
}


def clean_unit_str(unit_str: str | None) -> str | None:
    if unit_str is None:
        return None
    raw = unit_str.strip()
    if not raw:
        return None
    key = re.sub(r"\s+", " ", raw).casefold()
    return UNIT_ALIASES.get(key, raw)


def _convert_scalar(value: float | int, from_unit: str | None, target_unit: str) -> tuple[float | None, str, str | None]:
    if target_unit == "pH":
        return float(value), "pH", None
    if from_unit is None:
        return None, target_unit, "source unit is missing"
    clean_from = clean_unit_str(from_unit)
    try:
        quantity = ureg.Quantity(value, clean_from)
        pint_target = {"K": "kelvin", "Pa": "pascal", "mm/yr": "millimeter/year", "m": "meter"}.get(target_unit)
        if pint_target is None:
            raise ValueError(f"unsupported canonical unit {target_unit!r}")
        return round(float(quantity.to(pint_target).magnitude), 6), target_unit, None
    except (pint.errors.PintError, ValueError, TypeError) as exc:
        reason = f"cannot convert {from_unit!r} to {target_unit}: {exc}"
        return None, target_unit, reason


def normalize_numeric_scalar(val: float | int, from_unit: str | None, target_unit: str) -> tuple[float | None, str]:
    """Convert a value, returning None rather than the raw number on failure."""
    converted, unit, _ = _convert_scalar(val, from_unit, target_unit)
    return converted, unit


def normalize_parameter_value_detailed(
    param_name: str, raw_value: Any, unit: str | None
) -> tuple[Any, str | None, str | None]:
    """Return normalized value/unit plus a conversion error, if conversion failed."""
    if raw_value is None:
        return None, None, None
    target = CANONICAL_TARGET_UNITS.get(param_name)
    if isinstance(raw_value, dict) and ("min" in raw_value or "max" in raw_value):
        if not target or target == "pH":
            return raw_value, unit or target, None
        result: dict[str, float] = {}
        for edge in ("min", "max"):
            if edge in raw_value and raw_value[edge] is not None:
                value, _, error = _convert_scalar(raw_value[edge], unit, target)
                if error:
                    return None, target, f"{edge}: {error}"
                result[edge] = value
        return result, target, None
    if isinstance(raw_value, (int, float)):
        if target and target != "pH":
            value, out_unit, error = _convert_scalar(raw_value, unit, target)
            return value, out_unit, error
        return float(raw_value), target or unit, None
    if isinstance(raw_value, str):
        range_match = re.search(r"(-?\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(-?\d+(?:\.\d+)?)", raw_value)
        if range_match and target and target != "pH":
            return normalize_parameter_value_detailed(
                param_name,
                {"min": float(range_match.group(1)), "max": float(range_match.group(2))},
                unit,
            )
        number = re.search(r"-?\d+(?:\.\d+)?", raw_value)
        if number and target:
            return normalize_parameter_value_detailed(param_name, float(number.group()), unit)
        return raw_value.strip(), unit, None
    if isinstance(raw_value, list):
        return [str(item).strip() for item in raw_value if str(item).strip()], None, None
    return raw_value, unit, None


def normalize_parameter_value(param_name: str, raw_value: Any, unit: str | None) -> tuple[Any, str | None]:
    value, normalized_unit, _ = normalize_parameter_value_detailed(param_name, raw_value, unit)
    return value, normalized_unit
