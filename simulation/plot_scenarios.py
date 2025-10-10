import os
import pandas as pd
import matplotlib.pyplot as plt
from glob import glob

# -----------------------
# CONFIG
# -----------------------
data_dir = "simulation/data"
plot_dir = os.path.join(data_dir, "plots")
os.makedirs(plot_dir, exist_ok=True)

# -----------------------
# GET ALL CSV FILES
# -----------------------
demand_files = glob(os.path.join(data_dir, "*_demand_*.csv"))
pressure_files = glob(os.path.join(data_dir, "*_pressure_*.csv"))

# -----------------------
# FUNCTION TO PLOT CSV
# -----------------------
def plot_csv(csv_file, ylabel, plot_dir):
    df = pd.read_csv(csv_file, index_col=0)
    df.index = pd.to_datetime(df.index)  # if index is time
    plt.figure(figsize=(10,6))
    for col in df.columns:
        plt.plot(df.index, df[col], label=col)
    plt.title(f"{ylabel} - {os.path.basename(csv_file).replace('_', ' ')}")
    plt.xlabel("Time")
    plt.ylabel(ylabel)
    plt.legend(fontsize='small', ncol=2)
    plt.tight_layout()
    
    # Save plot
    filename = os.path.basename(csv_file).replace(".csv", ".png")
    plt.savefig(os.path.join(plot_dir, filename))
    plt.close()

# -----------------------
# PLOT DEMAND FILES
# -----------------------
for f in demand_files:
    plot_csv(f, "Demand (m³/s)", plot_dir)

# -----------------------
# PLOT PRESSURE FILES
# -----------------------
for f in pressure_files:
    plot_csv(f, "Pressure (m)", plot_dir)

print(f"✅ Plots saved in {plot_dir}")
