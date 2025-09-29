// Convert Swiss LV03 coordinates to WGS84 (lat/lng)
function convertLv03ToWgs84(y, x) {
  const yAux = (y - 600000) / 1000000;
  const xAux = (x - 200000) / 1000000;

  const lng =
    ((2.6779094 +
      4.728982 * yAux +
      0.791484 * yAux * xAux +
      0.1306 * yAux * Math.pow(xAux, 2) -
      0.0436 * Math.pow(yAux, 3)) *
      100) /
    36;

  const lat =
    ((16.9023892 +
      3.238272 * xAux -
      0.270978 * Math.pow(yAux, 2) -
      0.002528 * Math.pow(xAux, 2) -
      0.0447 * Math.pow(yAux, 2) * xAux -
      0.014 * Math.pow(xAux, 3)) *
      100) /
    36;

  return [lat, lng];
}

module.exports = {
  convertLv03ToWgs84,
};