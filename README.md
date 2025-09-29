# schweizmobil-gpx-js

A Node.js CLI tool to download hiking routes from [schweizmobil.ch](https://schweizmobil.ch/) and convert them to GPX format.

## Installation

Clone this repository and make the script executable:

```bash
git clone <repository-url>
cd schweizmobil-gpx-js
chmod +x schweizmobil-gpx.js
```

## Usage

```bash
./schweizmobil-gpx.js <route_type> <route_number>
```

### Parameters

- `route_type`: Type of route to download
  - `national` - National hiking routes
  - `regional` - Regional hiking routes
  - `local` - Local hiking routes
  - `snowshoe-local` - Local snowshoe routes
- `route_number`: The numeric ID of the route

### Examples

```bash
# Download national route 1 (Via Alpina)
./schweizmobil-gpx.js national 1
```

## How it works

1. Fetches route data from the Switzerland Mobility API
2. Converts coordinates from Swiss LV03 projection to WGS84 (standard GPS coordinates)
3. Generates a GPX file with the route track points

## Requirements

- Node.js (built-in modules only, no external dependencies)

## Acknowledgment

This is a JavaScript port of the original Python script by [delroth](https://github.com/delroth/schweizmobil-gpx).
