let map;

async function initMap() {
   
  const pos = { lat: 41.251, lng: -75.268 }
  const pos2 = { lat: 39.047, lng: -95.677 }

 // The location of Uluru
  const position = { lat: -25.344, lng: 131.031 };
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  // The map, centered at Uluru
  map = new Map(document.getElementById("map"), {
    zoom: 15,
    center: pos2,
    mapId: "DEMO_MAP_ID",
  });

/*
  ZOOMS 
  1: World
  5: Landmass or continent
  10: City
  15: Streets
  20: Buildings
*/

  // The marker, positioned at Uluru
  const marker = new AdvancedMarkerElement({
    map: map,
    position: pos2,
    title: "My Rod",
  });
}

initMap();