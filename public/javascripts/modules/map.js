import axios from "axios";
import { $ } from "./bling";

const mapOptions = {
  center: { lat: 41.8, lng: -87.6 },
  zoom: 10,
};

function loadPlaces(map, lat = 41.8, lng = -87.6) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`).then((res) => {
    const places = res.data;
    

    if (!places.length) {
      alert("no places found");
      return;
    }

    // create a bounds

    const bounds = new google.maps.LatLngBounds();

    const infoWindow = new google.maps.InfoWindow()

    const markers = places.map((cur) => {
      const [placeLng, placeLat] = cur.location.coordinates;

      const position = { lat: placeLat, lng: placeLng };

      bounds.extend(position);

      const marker = new google.maps.Marker({map, position });
      marker.place = cur
      return marker
    });

    // click listner 

    markers.forEach(marker => marker.addListener('click', function(){
        const html = `
        <div class="popup">
            <a href="/store/${this.place.slug}">
                <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}"/>
                <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
        </div>`
        infoWindow.setContent(html);
        infoWindow.open(map, marker)
    }))


    // zoom map to fit 

    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);



    
  });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;

  // make our map

  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');

  const autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng() )
  })
}

export default makeMap;
