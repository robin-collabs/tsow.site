# Traffic Simulator On Web(TSOW).site 
## Chennai Autonomous Traffic Simulator

<p align="center">
  <img src="https://img.shields.io/badge/Status-MVP%20v1-blueviolet?style=for-the-badge" alt="MVP v1" />
  <img src="https://img.shields.io/badge/Location-Chennai%2C%20India-orange?style=for-the-badge" alt="Chennai, India" />
  <img src="https://img.shields.io/badge/Simulation-Client--side-success?style=for-the-badge" alt="Client side simulation" />
</p>

<p align="center">
  <strong>A browser based autonomous traffic simulator set on real roads in Chennai, India.</strong><br/>
  Explore a virtual Chennai, populate its roads with Indian vehicle types, and watch rule based autonomous drivers navigate the network.
</p>

<p align="center">
  <a href="https://github.com/robin-collabs/tsow.site/stargazers"><img src="https://img.shields.io/github/stars/robin-collabs/tsow.site?style=flat&logo=github" alt="GitHub stars"/></a>
  <a href="https://github.com/robin-collabs/tsow.site/network/members"><img src="https://img.shields.io/github/forks/robin-collabs/tsow.site?style=flat&logo=github" alt="GitHub forks"/></a>
  <a href="https://github.com/robin-collabs/tsow.site/issues"><img src="https://img.shields.io/github/issues/robin-collabs/tsow.site?style=flat&logo=github" alt="GitHub issues"/></a>
  <a href="https://github.com/robin-collabs/tsow.site/commits/main"><img src="https://img.shields.io/github/last-commit/robin-collabs/tsow.site?style=flat&logo=github" alt="Last commit"/></a>
  <a href="https://github.com/robin-collabs/tsow.site"><img src="https://img.shields.io/github/repo-size/robin-collabs/tsow.site?style=flat&logo=github" alt="Repository size"/></a>
  <img src="https://img.shields.io/badge/License-TBD-lightgrey?style=flat" alt="License to be specified"/>
</p>

---

## Overview

**TSOW.site** is an experimental autonomous traffic simulation project inspired by [Virtual World](https://github.com/gniziemazity/virtual-world) by [gniziemazity](https://github.com/gniziemazity).

Instead of a fictional map, the project uses a bundled road network derived from [OpenStreetMap](https://www.openstreetmap.org/) for a section of Chennai, spanning the Chennai Central area south towards Injambakkam. The simulation uses a top down canvas renderer with a stylised, fake 3D presentation.

The MVP focuses on four vehicle categories:

| Vehicle | Behaviour represented |
| --- | --- |
| 🚗 Cars | Speed adaptation, following, lane changes and overtaking |
| 🏍️ Bikes and scooters | Compact dimensions, quicker acceleration and lane filtering |
| 🛺 Auto rickshaws | Distinct speed and following parameters, occasional roadside pickup stops |
| 🚚 Trucks | Slower acceleration, larger dimensions, longer headway and conservative turns |

Vehicle behaviour is parameter driven and shares a common simulation engine.

> **Project status:** MVP v1. This is a traffic simulation experiment, not a production autonomous driving system or a calibrated microscopic traffic model.

## Features

### Chennai road network

- Bundled OpenStreetMap road data. No Overpass request is needed while the simulator runs.
- Directed road graph with intersections and connected road segments.
- Road classification, one way direction, lane counts and speed information.
- Traffic signal locations from the imported OSM dataset.
- City overview and selectable zones:
  - Central Chennai
  - Southern Chennai
  - Injambakkam and ECR

### Autonomous traffic

- A* route finding across the road graph.
- Left side driving conventions.
- Intelligent Driver Model (IDM) based car following.
- Signal response and basic right of way behaviour at unsignalled junctions.
- Lane changes, overtaking and lane filtering policies.
- Type specific acceleration, braking, headway, dimensions and turn speed.
- Recovery behaviour for vehicles that remain stuck.

### Simulation controls

- Start, pause and reset.
- Simulation speed control.
- Configurable traffic count from 30 to 100 vehicles.
- Traffic density presets and vehicle mix settings.
- Spawn vehicles by type and filter visible vehicle categories.
- Select a vehicle to inspect it and use follow camera.
- Pan and zoom the simulation view.
- Live traffic statistics and settings persisted in LocalStorage.

## Screenshots

<!-- Add screenshots or a short demo GIF here. Suggested files: docs/images/simulator-overview.png and docs/images/simulator-controls.png. -->

<p align="center"><em>Screenshots and demo recording coming soon.</em></p>

## Tech stack

<p>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/TanStack_Start-FF4154?style=flat&logo=reactquery&logoColor=white" alt="TanStack Start"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Canvas_API-E34F26?style=flat&logo=html5&logoColor=white" alt="Canvas API"/>
  <img src="https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=flat&logo=openstreetmap&logoColor=white" alt="OpenStreetMap"/>
  <img src="https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white" alt="Bun"/>
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white" alt="Vitest"/>
</p>

| Area | Implementation |
| --- | --- |
| UI and app | React 19, TypeScript, TanStack Start |
| Build tooling | Vite 8 |
| Styling | Tailwind CSS 4, Radix UI and shadcn/ui components |
| Simulation graphics | HTML Canvas |
| Road network | Custom directed graph and A* router |
| Driving model | Intelligent Driver Model and rule based driver policies |
| Geographic source | OpenStreetMap |
| Tests | Vitest, Testing Library |
| Package manager | Bun lockfile included; npm scripts are also defined |

## Architecture

The codebase separates geographic data, graph construction, vehicle behaviour, simulation and rendering.

```text
src/
├── ai/                 # IDM car following and driving policy
├── components/
│   └── sim/            # Simulator view, controls, settings and inspector
├── controls/            # Input handling and persisted settings
├── geographic/          # Road dataset decoding and Chennai zones
├── rendering/           # Canvas renderer, camera, palette and sprites
├── road-network/        # Directed graph, zone network and A* routing
├── simulation/          # Engine, random utilities, settings and signals
├── vehicles/            # Vehicle model and type parameter table
└── routes/              # Application routes

public/
└── data/
    └── chennai-roads.json

scripts/
└── osm/
    ├── fetch_chennai.sh  # Fetch raw OSM road data
    └── build_roads.py    # Convert raw OSM data into simulator format

docs/
└── MVP_SPEC.md           # MVP scope and deferred work
```

### Simulation pipeline

1. **OSM import:** Download the selected Chennai road network during dataset preparation.
2. **Dataset generation:** Convert OSM ways and nodes into a compact local road dataset.
3. **Graph construction:** Build directed edges, intersections, lane metadata and signal locations.
4. **Routing:** Use A* to select a path through connected road segments.
5. **Driving policy:** Compute acceleration and manoeuvres using vehicle parameters, nearby traffic and signal state.
6. **Simulation step:** Update vehicle state using the simulation timestep.
7. **Rendering:** Draw the map and vehicle sprites on Canvas.

### Vehicle model

The vehicle types share one engine. Their differences are defined in `src/vehicles/types.ts`, including:

- Length, width and height
- Maximum speed and acceleration
- Comfortable and maximum deceleration
- Time headway and minimum gap
- Lateral movement speed
- Lane filtering capability
- Turning speed and overtaking clearance
- Optional roadside stop behaviour

The driving policy uses the **Intelligent Driver Model (IDM)** for longitudinal car following. It is a rule based simulation model, not machine learning.

## Getting started

### Prerequisites

- Node.js compatible with the Vite toolchain
- npm or Bun
- Git

### Clone and install

```bash
git clone https://github.com/robin-collabs/tsow.site.git
cd tsow.site
npm install
```

Using Bun:

```bash
bun install
```

### Run locally

```bash
npm run dev
```

Open the local URL printed by Vite.

### Production build

```bash
npm run build
npm run preview
```

### Quality checks

```bash
npm run lint
npm run test
```

Available scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build the application |
| `npm run build:dev` | Build using development mode |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format project files with Prettier |
| `npm run test` | Run the Vitest suite |
| `npm run test:watch` | Run Vitest in watch mode |

## OpenStreetMap data and attribution

The bundled Chennai road dataset is derived from **© OpenStreetMap contributors** and is made available under the [Open Database License (ODbL)](https://www.openstreetmap.org/copyright).

The data preparation pipeline is in `scripts/osm/`:

```bash
bash scripts/osm/fetch_chennai.sh /tmp/osm/roads.json
python3 scripts/osm/build_roads.py /tmp/osm/roads.json public/data/chennai-roads.json
```

The fetch step requires an internet connection and uses the Overpass API. It is intended for dataset maintenance, not for normal application runtime. Please follow the [Overpass API usage guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) and avoid frequent or unnecessary bulk requests.

When redistributing or adapting the dataset, retain the required OSM attribution and comply with the ODbL. See the [OpenStreetMap copyright and attribution page](https://www.openstreetmap.org/copyright).

## Scope and limitations

MVP v1 intentionally focuses on a manageable section of Chennai and four road vehicle types.

Current limitations include:

- The imported road network prioritises major roads. Residential streets are not comprehensively represented.
- Traffic behaviour is a simplified rule based approximation. It is not calibrated against measured Chennai traffic data.
- The simulation does not implement a complete rigid body or continuous 2D collision solver.
- Traffic queues and interactions are simplified, particularly at complex junctions.
- The project does not currently simulate trains, railway tracks, pedestrians or public transport.
- The simulator is designed as an interactive experiment and should not be used for real world vehicle control, safety analysis or traffic engineering decisions.

## Roadmap

- [x] Import a bundled Chennai OSM road dataset
- [x] Build a directed road graph and zone based networks
- [x] Add A* routing
- [x] Implement car, bike, auto and truck vehicle profiles
- [x] Implement rule based autonomous driving and IDM following
- [x] Add traffic signals, controls, settings and vehicle inspection
- [ ] Expand coverage to residential streets
- [ ] Improve opposite lane overtaking and roundabout behaviour
- [ ] Add a static GitHub Pages deployment workflow
- [ ] Evaluate an optional geographic basemap layer
- [ ] Add railway tracks, stations and train simulation
- [ ] Add pedestrians and other road users

See [docs/MVP_SPEC.md](docs/MVP_SPEC.md) for the implementation scope and deferred items.

## Contributing

Contributions, bug reports and ideas are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes and add or update tests where appropriate.
4. Run `npm run lint` and `npm run test`.
5. Open a pull request with a clear description and screenshots for UI changes.

For substantial changes to simulation behaviour, include a short explanation of the model or assumptions used.

## Acknowledgements

- [gniziemazity/virtual-world](https://github.com/gniziemazity/virtual-world) for the original virtual world and autonomous vehicle inspiration.
- [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) for the geographic road data.
- [Lovable](https://lovable.dev) for the initial MVP development workflow.

<p align="center">
  Built for experimentation with autonomous traffic on Chennai roads.
  <br/>
  <strong>TSOW.site · MVP v1</strong>
</p>
