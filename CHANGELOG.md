# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-16

### Added
- [Added] Role-based Dashboard landing surface in Portal (`DashboardView.tsx`) to reduce initial information density.
- [Added] Global GSI initialization lock to prevent duplicate Google Identity Services script calls.
- [Added] Dashboard/Workspace view switching state in Portal `App.tsx`.

### Changed
- [Changed] Removed "Command Centre Login" button from Marketing Site header to improve mobile responsiveness.
- [Changed] Relaxed `Cross-Origin-Opener-Policy` to `unsafe-none` in API middleware to resolve Google Login popup blockers.
- [Changed] Refactored `@kharon/domain` source exports to resolve Vite build resolution issues in the monorepo.

### Fixed
- [Fixed] Authentication instability caused by GSI double-initialization.
- [Fixed] Portal build failures caused by stale compiled files shadowing source and missing exports.
- [Fixed] Header density on small screens for the public marketing site.

### Security
- [Security] Standardized COOP headers to balance security and authentication interoperability.
- [Security] Ensured strict type adherence in new Dashboard components (Zero-Any policy).
