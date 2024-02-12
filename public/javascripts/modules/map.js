import axios from 'axios';
import { $ } from './bling';

// set up the defualt map options
const mapOptions = { 
  zoom: 8
};

// load places from the server and add them to the map
function loadPlaces(map, lat, lng) {
  axios
    .get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        alert('No places found.');
        return;
      }

      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      markers.forEach(marker => marker.addListener('click', function() {
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    const initialPosition = { lat: latitude, lng: longitude };
    const map = new google.maps.Map(mapDiv, { ...mapOptions, center: initialPosition }); // ES6 spread operator to merge the two objects
    loadPlaces(map, latitude, longitude);

    const input = $('[name="geolocate"]');
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
    });
  },
  error => {
    // Default coordinates if geolocation is denied or unavailable
    const defaultPosition = { lat: 43.2, lng: -79.8 };
    const map = new google.maps.Map(mapDiv, { ...mapOptions, center: defaultPosition });
    loadPlaces(map, defaultPosition.lat, defaultPosition.lng);

    const input = $('[name="geolocate"]');
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
    });

    console.error(error.message); // Log the error message
  }
);
}

export default makeMap;
