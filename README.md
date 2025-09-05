# Smart Water Plus

## What
A project to build a smart water management system using **simulation and AI**.  
The focus is on **detecting leaks** and **predicting water demand** before moving to real hardware.

## Why
Water is wasted due to hidden leaks and poor planning.  
By simulating a water network and applying machine learning, we can find problems early and plan distribution better.

## How
- Use **hydraulic simulation** (WNTR/EPANET) to model water flow.  
- Train **AI models** for demand forecasting and leak detection.  
- Provide results through a simple **dashboard / PWA**.  

## Repo Structure
smart-water-plus/
│── backend/ # Flask APIs + ML models
│── frontend/ # React PWA
│── simulation/ # WNTR/EPANET scripts, datasets
│── docs/ # Reports, PPTs, logs
│── README.md # Main documentation