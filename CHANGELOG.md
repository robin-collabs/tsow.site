# Changelog

[![Version](https://img.shields.io/badge/version-0.2.0-blue?style=for-the-badge)](#020---2026-11-11)
[![SemVer](https://img.shields.io/badge/semver-2.0.0-green?style=for-the-badge)](https://semver.org)
[![Keep a Changelog](https://img.shields.io/badge/changelog-keep%20a%20changelog-orange?style=for-the-badge)](https://keepachangelog.com)

All notable changes follow [Keep a Changelog](https://keepachangelog.com) and [Semantic Versioning](https://semver.org).

## [Unreleased]
- Residential-road OSM re-import, multi-district OD-matrix trip editor (see `docs/V2_SPEC.md`).

## [0.2.0] - 2026-11-11
![v0.2.0](https://img.shields.io/badge/v0.2.0-minor-blue?style=for-the-badge)

### Added
- **Follow** button beside the vehicle ID in the inspector.
- Journey minimap while following: remaining route in blue, amber (30–70% of limit) or red (<30%) by traffic ahead.
- GitHub Actions Pages workflow triggered only by `v*` tags or manual dispatch; `CNAME` for `tsow.site`.
- `LICENSE.md` (MIT), `SECURITY.md`, `CHANGELOG.md`, `docs/V2_SPEC.md`.

### Changed
- Inspector widened to 340px so full road names show.
- Vehicle cap raised from 100 to 300.

### Removed
- Full-width "Follow this vehicle" button at the bottom of the inspector.

## [0.1.0] - 2026-11-10
![v0.1.0](https://img.shields.io/badge/v0.1.0-initial-lightgrey?style=for-the-badge)

### Added
- Real OSM roads Chennai Central → Injambakkam, zones, A* routing, signals.
- Four parameter-driven vehicle types with IDM driving, canvas renderer, stats, settings, inspector and follow camera.
