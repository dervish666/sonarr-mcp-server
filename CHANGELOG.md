# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-17

### Added
- New `getMonitoredEpisodes` tool to retrieve all monitored episodes for a specific series
- New `searchMonitoredEpisodes` tool to trigger Sonarr to actively search for monitored episodes
- Support for searching episodes by series ID or series title
- Comprehensive episode information including season, episode number, air date, and file status
- Command API integration for triggering episode searches

### Changed
- Updated README.md to document the new features
- Incremented version to 1.1.0 following semantic versioning

## [1.0.0] - Initial Release

### Added
- Initial MCP server implementation for Sonarr integration
- `listSeries` tool to retrieve all tracked series
- `getCalendar` tool to get upcoming and recent episodes
- `lookupSeries` tool to search for new series by name
- `addSeries` tool to add new series to Sonarr
- Docker support for containerized deployment
- Health check endpoint
- Support for both standard MCP protocol and legacy tool discovery