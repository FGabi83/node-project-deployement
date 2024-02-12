function autocomplete(input, latInput, lngInput) {
  if(!input) return; // skip this fn from running if there is not input on the page
  // console.log(input, latInput, lngInput);
  const dropdown = new google.maps.places.Autocomplete(input); //google api

  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat(); //google api
    lngInput.value = place.geometry.location.lng(); //google api
  });
}
export default autocomplete;