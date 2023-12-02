import * as leaflet from 'leaflet';

export default class MapContainer {
  constructor(mapContainer) {
    this.mapContainer = mapContainer;

    this.map = leaflet.map(mapContainer.getAttribute('id'), {
      scrollWheelZoom: false,
      maxZoom: 14,
      minZoom: 4,
      dragging: !leaflet.Browser.mobile,
    });

    this.icon = leaflet.icon({
      iconUrl: '/pin.svg',
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -45],
      shadowUrl: '/shadow.png',
      shadowSize: [50, 50],
      shadowAnchor: [16, 51],
    });

    const { locations, mapUrl, mapAttr } = mapContainer.dataset;
    this.showLocationMap(mapUrl, mapAttr, JSON.parse(locations));
  }

  showLocationMap(url, attribution, locations) {
    leaflet.tileLayer(url, { attribution }).addTo(this.map);

    leaflet.geoJSON(locations, {
      pointToLayer: (geoJsonPoint, latlng) => leaflet.marker(latlng, {
        icon: this.icon,
        riseOnHover: true,
        title: `Day ${geoJsonPoint.day} ${geoJsonPoint.description}`,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(leaflet.popup({
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
        })).setPopupContent(`Day ${feature.day}<br>${feature.description}`);
      },
    }).addTo(this.map);

    const latlng = locations.map((loc) => leaflet.GeoJSON.coordsToLatLng(loc.coordinates));
    const mapBounds = leaflet.latLngBounds(latlng).pad(0.5);

    this.map.fitBounds(mapBounds, { maxZoom: 10 }).setMaxBounds(mapBounds);
  }
}
