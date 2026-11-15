# TERRACROMA.AI
### AI-Powered Planetary Analog Discovery and Mission Rehearsal Platform

TERRACROMA.AI is an AI-powered platform designed to help researchers discover Earth locations with geological, environmental, and topographical characteristics similar to the Moon and Mars.

Using Retrieval-Augmented Generation (RAG), geospatial intelligence, and interactive robotic simulation, the platform helps researchers identify potential planetary analog environments, compare terrain properties, and experiment with robotic exploration scenarios.

## Key Features

- **AI-Powered RAG System:** Understands research queries, retrieves scientific information, and extracts relevant planetary terrain requirements.
- **Global Analog Discovery:** Identifies potential Earth locations resembling selected lunar and Martian environments.
- **Moon and Mars Analysis:** Supports geological, climatic, topographical, and illumination-based comparisons.
- **Scientific Comparison:** Evaluates similarities, differences, and environmental limitations between planetary regions and Earth locations.
- **Interactive Robot Simulation:** Allows users to customize terrain properties and observe robot movement and navigation under different environmental conditions.
- **Research Intelligence:** Provides scientific insights and evidence-based location comparisons.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| AI Integration | Google Gemini API |
| Intelligence | Retrieval-Augmented Generation (RAG) |
| Geospatial Analysis | Terrain and environmental data processing |
| Simulation | Interactive robotic terrain simulation |

## Project Architecture

```text
TERRACROMA.AI
|
|-- Frontend
|   |-- React
|   |-- TypeScript
|   |-- Vite
|
|-- Backend
|   |-- Python
|   |-- FastAPI
|   |-- Gemini API
|   |-- RAG Pipeline
|   |-- Scientific Processing
|   |-- Geospatial Matching
|   |-- Robot Simulation
```

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.10+
- Google Gemini API key

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Configure your Gemini API key in the backend `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

Start the backend:

```bash
uvicorn main:app --reload
```

API documentation:

`http://127.0.0.1:8000/docs`

## Research Applications

**Mars Exploration**
- Arid and rocky terrain discovery.
- Rover mobility testing.
- Autonomous navigation and obstacle avoidance.
- Geological sampling environments.

**Lunar Exploration**
- Lunar South Pole analog discovery.
- Permanently shadowed region research analogs.
- Low-light navigation experiments.
- Cold-environment and rugged-terrain analysis.

**Robotic Simulation**
- Customizable terrain conditions.
- Robot movement and navigation experiments.
- Obstacle and slope testing.
- Environmental scenario simulation.

## Scientific Integrity

TERRACROMA.AI treats Earth locations as partial planetary analogs rather than exact replicas. The platform aims to distinguish geological similarity, environmental similarity, operational suitability, and experiment transferability.

Scientific results should include supporting evidence, uncertainty, and known limitations.

## Future Scope

- Advanced planetary digital twins.
- Multi-site analog discovery.
- Mission route optimization.
- Autonomous analog discovery agents.
- Advanced robotic mission simulation.
- Integration of additional planetary datasets.

## Project Information

**Project:** TERRACROMA.AI  
**Event:** NASA Space Apps Challenge 2026  
**Domain:** Artificial Intelligence, Planetary Science, Geospatial Intelligence and Robotics.

**Mission:** Bringing planetary exploration research closer to Earth.
