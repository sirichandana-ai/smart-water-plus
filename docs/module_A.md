# Simulation Module A — Digital Twin for Smart Water Network

## 1. Why Simulation?
Building a real water distribution network with tanks, clusters, sensors, and valves is expensive and time-consuming.  
A digital twin (simulation) allows us to replicate the village network in Python, test scenarios, generate data, and detect leaks without any physical setup.  
This approach is ideal for prototyping and machine learning experiments.

---

## 2. What Did I Build?
The simulation replicates a **village water network** with:

- 1 central tank supplying water  
- 10 clusters of houses  
- Each cluster containing multiple households  
- Simulated pressure and water demand at each node  

The goal is to generate a realistic dataset representing pressure and flow behavior across the network.

---

## 3. How Leaks Were Simulated?
Leaks were introduced in the simulation by:

- Selecting nodes or clusters randomly  
- Varying leak size (small, medium, large)  
- Varying leak timing to simulate real-world events  

The leaks cause noticeable pressure drops in the network, which are later labeled in the dataset.

---

## 4. Simulation Outputs
The Python simulation produces CSV files containing:

- `pressure` → water pressure at nodes or clusters  
- `flow` → water demand or flow at nodes  
- `leak` → binary labels: 0 = no leak, 1 = leak  

These files are the raw data for machine learning.

---

## 5. Dataset Preparation
To make the dataset ML-ready:

1. Generated timestamps and set as index  
2. Resampled data to 1-minute intervals  
3. Handled missing values using interpolation  
4. Created feature engineering columns:
   - Rolling mean (5 readings)  
   - Delta (pressure change)  
   - Lag features (previous 1–10 readings)  
   - Windowed aggregates (min, max, std)  
5. Normalized all numeric columns using `StandardScaler`  
6. Automated leak labeling based on pressure thresholds  

This prepares a clean, structured dataset ready for training ML models.

---

## 6. Visualizations

### Pressure Over Time with Leaks
![Pressure over time](img/pressure_vs_time.png)

### Flow Over Time with Leaks
![Flow over time](img/flow_vs_time.png)

### Feature Correlation Heatmap
![Feature correlation](img/corr_heatmap.png)

---

## 7. Future Work / Notes

- Increase dataset size by simulating more time steps or scenarios  
- Keep individual cluster pressures and flows as separate features for better ML performance  
- Introduce varying demand patterns (morning peak, evening peak)  
- Integrate with real-time monitoring for hybrid digital twin + IoT  

---

Document created as part of Smart Water Plus — Simulation Module.

