import wntr
import matplotlib.pyplot as plt

wn = wntr.network.WaterNetworkModel()

# Tank requires elevation as a float
tank = wn.add_tank(
    'T1',
    elevation=10,        # elevation (float)
    init_level=10,
    min_level=5,
    max_level=15,
    diameter=20,
    overflow=True,
    coordinates=(0, 0)   # coordinates go here
)

# Add junction with elevation as float
node1 = wn.add_junction(
    'J1',
    elevation=10,        # elevation must be float
    base_demand=0.01,
    demand_pattern='pat1',
    coordinates=(100, 0)
)

wn.add_pattern('pat1', [1]*24)
wn.add_pipe('P1', 'T1', 'J1', length=100, diameter=0.3, roughness=100, minor_loss=0)

sim = wntr.sim.EpanetSimulator(wn)
results = sim.run_sim()

pressure = results.node['pressure']['J1']
flow = results.link['flowrate']['P1']

# ✅ Save results to CSV
pressure.to_csv("pressure.csv")
flow.to_csv("flow.csv")



print(pressure.head())
flow.plot()
plt.show()
