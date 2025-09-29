// Generate GPX XML from coordinate points
function createGpxFromPoints(wgs84Points, routeName) {
  const trackPoints = wgs84Points
    .map(([lat, lon]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="https://www.topografix.com/GPX/1/1" creator="schweizmobil-gpx-js">
  <metadata>
    <name>${routeName}</name>
    <creator>schweizmobil-gpx-js</creator>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${routeName}</name>
    <trkseg>
    ${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

module.exports = {
  createGpxFromPoints,
};