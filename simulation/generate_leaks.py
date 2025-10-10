#!/usr/bin/env python3
"""
generate_leaks.py

Create multiple leak scenarios for a WNTR/EPANET model and save demand & pressure
results (CSV) under /simulation/data.

Usage examples:
    python generate_leaks.py --inp simulation/village_model.inp --out simulation/data
    python generate_leaks.py --inp simulation/village_model.inp --out simulation/data --simulator wntr
    python generate_leaks.py --inp simulation/village_model.inp --out simulation/data --sample

Features:
  - Loads an EPANET INP file (or optionally generates a small sample network)
  - Builds multiple scenarios (normal, small/big leaks, morning/evening)
  - Runs WNTRSimulator (recommended) or EpanetSimulator
  - Exports timestamped CSVs for demand & pressure per scenario

Requirements:
  pip install wntr pandas numpy

"""

from pathlib import Path
import argparse
import logging
import sys
from datetime import datetime

import pandas as pd
import wntr


# --- configuration ---
DEFAULT_NODES = ["C1H2", "C2H3", "C3H5"]
SMALL_LEAK_AREA = 5e-05    # m^2 (~8 mm diameter)
MEDIUM_LEAK_AREA = 1e-04   # m^2 (~11 mm diameter)
BIG_LEAK_AREA = 2e-04      # m^2 (~16 mm diameter)
DISCHARGE_COEFF = 0.75
MORNING = (6 * 3600, 9 * 3600)   # start, end in seconds
EVENING = (18 * 3600, 21 * 3600)


# --- helpers ---

def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def load_model(inp_path: Path) -> wntr.network.WaterNetworkModel:
    if not inp_path.exists():
        raise FileNotFoundError(f"INP file not found: {inp_path}")
    wn = wntr.network.WaterNetworkModel(str(inp_path))
    return wn


def add_leaks_to_wn(wn: wntr.network.WaterNetworkModel, leaks: list):
    """Add leak(s) to a WNTR WaterNetworkModel.

    leaks: list of dicts with keys: junction, area, discharge_coeff, start_time, end_time
    """
    for leak in leaks:
        junc = leak["junction"]
        try:
            node = wn.get_node(junc)
        except Exception:
            logging.error("Node not found in INP: %s", junc)
            raise
        # WNTR node objects expose add_leak(wn, area=..., discharge_coeff=..., start_time=..., end_time=...)
        node.add_leak(wn,
                      area=leak.get("area", SMALL_LEAK_AREA),
                      discharge_coeff=leak.get("discharge_coeff", DISCHARGE_COEFF),
                      start_time=leak.get("start_time", None),
                      end_time=leak.get("end_time", None))


def run_sim_and_save(wn: wntr.network.WaterNetworkModel, scenario_name: str, outdir: Path, simulator: str = "wntr"):
    logging.info("Running scenario: %s (simulator=%s)", scenario_name, simulator)
    if simulator == "wntr":
        sim = wntr.sim.WNTRSimulator(wn)
    else:
        sim = wntr.sim.EpanetSimulator(wn)

    results = sim.run_sim()

    demand = results.node["demand"]
    pressure = results.node["pressure"]

    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    demand_file = outdir / f"{scenario_name}_demand_{timestamp}.csv"
    pressure_file = outdir / f"{scenario_name}_pressure_{timestamp}.csv"

    # Add a small meta column so the CSV file self-documents the scenario
    # (we don't change node columns — we add a scalar column at the end)
    demand_meta = demand.copy()
    pressure_meta = pressure.copy()
    demand_meta["scenario"] = scenario_name
    pressure_meta["scenario"] = scenario_name

    demand_meta.to_csv(demand_file)
    pressure_meta.to_csv(pressure_file)

    logging.info("Saved: %s and %s", demand_file, pressure_file)


def generate_sample_inp(path: Path):
    """Generate a tiny sample network and write an INP file to `path`.
    Use this when you don't have an INP file yet (good for testing).
    """
    wn = wntr.network.WaterNetworkModel()
    # Simple network: one reservoir, 3 junctions, connecting pipes
    wn.add_reservoir("Res1", base_head=100)
    wn.add_junction("C1H1", base_demand=0.001, elevation=10)
    wn.add_junction("C1H2", base_demand=0.001, elevation=10)
    wn.add_junction("C2H3", base_demand=0.001, elevation=10)

    wn.add_pipe("P1", "Res1", "C1H1", length=100, diameter=0.1, roughness=100)
    wn.add_pipe("P2", "C1H1", "C1H2", length=50, diameter=0.05, roughness=100)
    wn.add_pipe("P3", "C1H2", "C2H3", length=50, diameter=0.05, roughness=100)

    wn.write_inpfile(str(path))
    logging.info("Wrote sample INP to %s", path)


# --- main ---

def build_default_scenarios(nodes: list):
    scenarios = []
    # normal (no leaks)
    scenarios.append({"name": "normal", "leaks": []})

    # per-node scenarios (small/big) and morning/evening
    for n in nodes:
        scenarios.append({
            "name": f"{n}_small_morning",
            "leaks": [{"junction": n, "area": SMALL_LEAK_AREA, "discharge_coeff": DISCHARGE_COEFF, "start_time": MORNING[0], "end_time": MORNING[1]}]
        })
        scenarios.append({
            "name": f"{n}_big_evening",
            "leaks": [{"junction": n, "area": BIG_LEAK_AREA, "discharge_coeff": DISCHARGE_COEFF, "start_time": EVENING[0], "end_time": EVENING[1]}]
        })

    # two simultaneous leaks example (combination)
    if len(nodes) >= 2:
        scenarios.append({
            "name": f"{nodes[0]}_{nodes[1]}_two_small",
            "leaks": [
                {"junction": nodes[0], "area": SMALL_LEAK_AREA, "start_time": MORNING[0], "end_time": MORNING[1]},
                {"junction": nodes[1], "area": SMALL_LEAK_AREA, "start_time": MORNING[0], "end_time": MORNING[1]}
            ]
        })

    return scenarios


def parse_args():
    parser = argparse.ArgumentParser(description="Generate leak scenarios and export demand/pressure CSVs using WNTR")
    parser.add_argument("--inp", type=str, default="simulation/village_model.inp", help="Path to EPANET INP file")
    parser.add_argument("--out", type=str, default="simulation/data", help="Output directory for CSVs")
    parser.add_argument("--simulator", choices=["wntr", "epanet"], default="wntr", help="Which simulator to use (wntr recommended for leaks)")
    parser.add_argument("--sample", action="store_true", help="Generate a small sample INP if the INP path is missing")
    parser.add_argument("--nodes", nargs="*", help="Optional list of node names to build scenarios for (overrides defaults)")
    return parser.parse_args()


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    args = parse_args()

    inp_path = Path(args.inp)
    out_dir = Path(args.out)
    ensure_dir(out_dir)

    if args.sample and not inp_path.exists():
        ensure_dir(inp_path.parent)
        generate_sample_inp(inp_path)

    nodes = args.nodes if args.nodes else DEFAULT_NODES
    scenarios = build_default_scenarios(nodes)

    for sc in scenarios:
        wn = load_model(inp_path)
        if sc["leaks"]:
            try:
                add_leaks_to_wn(wn, sc["leaks"])
            except Exception as e:
                logging.exception("Failed to add leaks for scenario %s: %s", sc["name"], e)
                continue
        try:
            run_sim_and_save(wn, sc["name"], out_dir, simulator=args.simulator)
        except Exception:
            logging.exception("Simulation failed for scenario: %s", sc["name"])

    logging.info("All scenarios processed. CSVs are in %s", out_dir)


if __name__ == "__main__":
    main()
