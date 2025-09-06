import os
import logging
import pandas as pd
import matplotlib.pyplot as plt
import wntr

# -----------------------
# 0) CONFIG
# -----------------------
CONFIG = {
    "num_clusters": 10,
    "houses_per_cluster": 5,
    "house_base_demand": 0.002,            # m^3/s per house (base)
    "tank": {
        "elevation": 10.0,                 # m
        "init_level": 15.0,                # m above tank floor
        "min_level": 5.0,
        "max_level": 20.0,
        "diameter": 30.0,
        "overflow": True,
        "coordinates": (0, 0),
    },
    "pattern_24h": [0.6,0.7,0.8,1.0,1.2,1.4,1.5,1.3,1.0,0.8,0.7,0.6]*2,  # 24 steps
    "trunk_diameter": 0.20,               # m (Tank -> Cluster)
    "branch_diameter": 0.10,              # m (Cluster -> House)
    "roughness": 100,
    "thresholds": {
        "cluster_flow_ratio": 1.30,       # >130% of mean cluster flow => leak-ish
        "cluster_min_flow": 1e-4,         # ignore near-zero flows
        "low_pressure_m": 10.0            # pressure < 10 m => low pressure alert
    }
}

# -----------------------
# 1) FOLDERS + LOGGING
# -----------------------
os.makedirs("simulation/data", exist_ok=True)
os.makedirs("simulation/logs", exist_ok=True)

logging.basicConfig(
    filename="simulation/logs/simulation.log",
    filemode="w",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter("%(message)s"))
logging.getLogger().addHandler(console)

# -----------------------
# 2) BUILD NETWORK
# -----------------------
wn = wntr.network.WaterNetworkModel()

# Add Tank (use named args; set coordinates separately for WNTR 0.4.x compatibility)
tank = wn.add_tank(
    "Tank",
    elevation=CONFIG["tank"]["elevation"],
    init_level=CONFIG["tank"]["init_level"],
    min_level=CONFIG["tank"]["min_level"],
    max_level=CONFIG["tank"]["max_level"],
    diameter=CONFIG["tank"]["diameter"],
    overflow=CONFIG["tank"]["overflow"]
)
wn.get_node("Tank").coordinates = CONFIG["tank"]["coordinates"]

# Demand pattern
wn.add_pattern("daily", CONFIG["pattern_24h"])

# Geometry helpers
def cluster_xy(c_idx):
    return (c_idx * 200.0, 0.0)

def house_xy(c_idx, h_idx):
    return (c_idx * 200.0, h_idx * 30.0)

# Add clusters + houses
for c in range(1, CONFIG["num_clusters"] + 1):
    cnode = f"C{c}"
    wn.add_junction(
        cnode,
        elevation=0.0,
        base_demand=0.0,
        demand_pattern=None,
        coordinates=cluster_xy(c)
    )
    wn.add_pipe(
        f"P_Tank_{c}", "Tank", cnode,
        length=150 + c * 10,
        diameter=CONFIG["trunk_diameter"],
        roughness=CONFIG["roughness"]
    )
    for h in range(1, CONFIG["houses_per_cluster"] + 1):
        j = f"C{c}H{h}"
        wn.add_junction(
            j,
            elevation=0.0,
            base_demand=CONFIG["house_base_demand"],
            demand_pattern="daily",
            coordinates=house_xy(c, h)
        )
        wn.add_pipe(
            f"P_{c}_{h}", cnode, j,
            length=50.0,
            diameter=CONFIG["branch_diameter"],
            roughness=CONFIG["roughness"]
        )

logging.info("✅ Network built (1 tank → %d clusters → %d houses)",
             CONFIG["num_clusters"], CONFIG["num_clusters"] * CONFIG["houses_per_cluster"])

# -----------------------
# 3) RUN SIMULATION
# -----------------------
sim = wntr.sim.EpanetSimulator(wn)
results = sim.run_sim()
logging.info("✅ Simulation complete")

# -----------------------
# 4) SAVE RESULTS (CSV)
# -----------------------
node_pressure = results.node["pressure"]        # DataFrame [time x nodes]
node_demand   = results.node["demand"]          # DataFrame [time x nodes]

# Combine for convenience (MultiIndex columns: ('Pressure', node), ('Demand', node))
combined = pd.concat({"Pressure": node_pressure, "Demand": node_demand}, axis=1)
combined.to_csv("simulation/data/network_results.csv", index=True)

# Cluster trunk flows from Tank->Cluster pipes
cluster_flows = pd.DataFrame({
    f"Cluster{c}": results.link["flowrate"][f"P_Tank_{c}"]
    for c in range(1, CONFIG["num_clusters"] + 1)
})
cluster_flows.to_csv("simulation/data/cluster_flows.csv", index=True)

# -----------------------
# 5) ANOMALY-ONLY ALERTS (live-style pass)
# -----------------------
alerts = []
lowP_threshold = CONFIG["thresholds"]["low_pressure_m"]
ratio = CONFIG["thresholds"]["cluster_flow_ratio"]
min_flow = CONFIG["thresholds"]["cluster_min_flow"]

times = cluster_flows.index

# Pre-list of house columns
house_cols = [f"C{c}H{h}" for c in range(1, CONFIG["num_clusters"] + 1)
                             for h in range(1, CONFIG["houses_per_cluster"] + 1)
              if f"C{c}H{h}" in node_pressure.columns]

for t in times:
    row = cluster_flows.loc[t]
    mean_flow = row.mean()

    # Leak-ish: cluster flow >> mean
    for cname, val in row.items():
        if val > max(min_flow, ratio * mean_flow):
            msg = f"⚠ Possible Leak: {cname} flow={val:.5f} m³/s at t={t}"
            logging.warning(msg)
            alerts.append({"Time": t, "Type": "High Cluster Flow", "Target": cname, "Value": val})

    # Low pressure at houses
    if lowP_threshold is not None and house_cols:
        p_row = node_pressure.loc[t, house_cols]
        lowP = p_row[p_row < lowP_threshold]
        for hnode, pval in lowP.items():
            msg = f"⚠ Low Pressure: {hnode} pressure={pval:.2f} m at t={t}"
            logging.warning(msg)
            alerts.append({"Time": t, "Type": "Low Pressure", "Target": hnode, "Value": float(pval)})

alerts_df = pd.DataFrame(alerts)
alerts_path = "simulation/data/leak_alerts.csv"
if not alerts_df.empty:
    alerts_df.to_csv(alerts_path, index=False)
    logging.info("🚨 %d anomalies written to %s", len(alerts_df), alerts_path)
else:
    logging.info("✅ No anomalies detected (thresholds may be conservative).")

# -----------------------
# 6) PLOTS (saved, not shown)
# -----------------------
# (a) Sample house pressures
sample_houses = [f"C{c}H1" for c in range(1, min(6, CONFIG["num_clusters"] + 1)) if f"C{c}H1" in node_pressure.columns]
if sample_houses:
    node_pressure[sample_houses].plot(figsize=(9, 5))
    plt.title("Pressure at Sample Houses")
    plt.xlabel("Time (hrs)")
    plt.ylabel("Pressure (m)")
    plt.tight_layout()
    plt.savefig("simulation/data/pressure_plot.png")
    plt.close()

# (b) Cluster trunk flows
cluster_flows.plot(figsize=(10, 6), alpha=0.8)
plt.title("Cluster Trunk Flows (Tank → Cluster)")
plt.xlabel("Time (hrs)")
plt.ylabel("Flowrate (m³/s)")
plt.tight_layout()
plt.savefig("simulation/data/cluster_flows_plot.png")
plt.close()

# (c) Network layout
wntr.graphics.plot_network(wn, title="Village Water Network")
plt.tight_layout()
plt.savefig("simulation/data/network_layout.png")
plt.close()

# -----------------------
# 7) SUMMARY REPORT
# -----------------------
report_lines = []
report_lines.append("Smart Water Plus – Simulation Summary\n")
report_lines.append(f"Clusters: {CONFIG['num_clusters']}")
report_lines.append(f"Houses per cluster: {CONFIG['houses_per_cluster']}")
report_lines.append(f"Total houses: {CONFIG['num_clusters'] * CONFIG['houses_per_cluster']}")
report_lines.append(f"Cluster flow anomaly ratio: {ratio}x mean (min {min_flow} m³/s)")
report_lines.append(f"Low pressure threshold: {lowP_threshold} m\n")

if alerts_df.empty:
    report_lines.append("Anomalies: 0 (no alerts)\n")
else:
    n_leaks = (alerts_df["Type"] == "High Cluster Flow").sum()
    n_lowp  = (alerts_df["Type"] == "Low Pressure").sum()
    report_lines.append(f"Anomalies: {len(alerts_df)}  →  High Cluster Flow: {n_leaks}, Low Pressure: {n_lowp}\n")
    # Show first few
    for _, r in alerts_df.head(10).iterrows():
        report_lines.append(f"- {r['Time']}: {r['Type']} @ {r['Target']} (value={r['Value']:.5f})")
    if len(alerts_df) > 10:
        report_lines.append(f"... and {len(alerts_df) - 10} more")

with open("simulation/logs/report.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(report_lines))

logging.info("📝 Summary written to simulation/logs/report.txt")
logging.info("✅ All CSVs/PNGs saved under simulation/data/")
