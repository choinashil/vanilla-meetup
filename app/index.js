// Load application styles
import 'styles/index.less';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

// f414b55d7015574938371e29587622 meetupkey


// function searchEvent() {
//     $.ajax({
//         url: 'https://api.meetup.com/find/upcoming_events\?key\=f414b55d7015574938371e29587622',
//         dataType: 'jsonp',
//         success: function(data) {console.log(data)}
//     })    
// }

var map;
var position;

initMap();

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -33.8688, lng: 151.2195},
      zoom: 13
    });

    //  37.504464, 127.024415 강남역
    //  40.714047, -74.004013  뉴욕

    var input = document.getElementById('pac-input');

    var autocomplete = new google.maps.places.Autocomplete(
        input, {placeIdOnly: true});
    autocomplete.bindTo('bounds', map);

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);
    var geocoder = new google.maps.Geocoder;
    var marker = new google.maps.Marker({
        position: position,
        map: map
    });
    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });


    google.maps.event.addListener(map, "click", function (e) {
        //lat and lng is available in e object
        console.log(e.latLng.lat(), e.latLng.lng());

        var pointer = document.createElement('div');
        pointer.classList.add('pointer');
        // pointer.style.left = 
        console.log('클릭 후 데이터 수집중');
        requestData(e.latLng.lat(), e.latLng.lng());

        // var latLng = e.latLng;
        // position = {
        //     center: {lat: e.latLng.lat(), lng: e.latLng.lng()},
        //     zoom: 13
        // };

        // infowindow.open(map, position);

    });

    // var marker = new google.maps.Marker({position: uluru, map: map});

    autocomplete.addListener('place_changed', function() {
      infowindow.close();
      var place = autocomplete.getPlace();
      if (!place.place_id) {
        return;
      }
      geocoder.geocode({'placeId': place.place_id}, function(results, status) {

        if (status !== 'OK') {
          window.alert('Geocoder failed due to: ' + status);
          return;
        }
        map.setZoom(15);
        map.setCenter(results[0].geometry.location);
        // Set the position of the marker using the place ID and location.
        marker.setPlace({
          placeId: place.place_id,
          location: results[0].geometry.location
        });
        marker.setVisible(true);
        infowindowContent.children['place-name'].textContent = place.name;
        // infowindowContent.children['place-id'].textContent = place.place_id;
        // infowindowContent.children['place-address'].textContent =
        //     results[0].formatted_address;
        infowindow.open(map, marker);
        console.log('검색 후 데이터 수집중');
        requestData(results[0].geometry.location.lat(), results[0].geometry.location.lng());
      });
    });
  }


  function requestData(lat, lng, page = 10) {
      new Promise((resolve, reject) => {
        $.ajax({
            url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts&lon=${lng}&lat=${lat}&sig=a8d009fde3a08ea8f77a6132165d9092d4202245`,
            dataType: 'jsonp',
            success: function(data) {console.log('왔다!',data); resolve(data)},
            error: function(err) {console.log('에러ㅠ',err); reject(err)}
        })
      }).then(data => {
          var event = data.data.events[0];
          console.log('이벤트이름: ',event.name);
          console.log('그룹이름: ', event.group.name);
          console.log('이벤트날짜,시간: ', event.local_data, event.local_time);
          console.log('인원: ', event.yes_rsvp_count);
          if (event.visibility === 'public') {
            console.log('호스트이름: ', event.event_hosts[0].name);
          }
      })
  };

//   https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts&lon=${lng}&lat=${lat}&sig=a8d009fde3a08ea8f77a6132165d9092d4202245


// https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&lon=${lng}&page=${page}&lat=${lat}
// https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&lon=${lng}&lat=${lat}&sig=7ad75514ef47c407423c67144c2d14f4d703bdb3



//   https://api.meetup.com/find/upcoming_events?photo-host=public&page=10&text=beer&sig_id=271259792&radius=smart&lon=-74.004013&lat=40.714047&sig=ac91a4756b43db79c14952a5a4a9951c62ceaabd
  

//   https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&lon=${lng}&page=${page}&lat=${lat}
// https://api.meetup.com/find/upcoming_events?key=ABDE12456AB2324445&photo-host=public&lon=${lng}&page=${page}&lat=${lat}




// initMap();
// function initMap() {
//     var map = new google.maps.Map(document.getElementById('map'), {
//       zoom: 12,
//       center: {lat: 37.530, lng: 127.005}
//     });
//     // 37.504464, 127.024415
//     var geocoder = new google.maps.Geocoder();

//     document.getElementById('submit').addEventListener('click', function() {
//       geocodeAddress(geocoder, map);
//     });
//   }

//   function geocodeAddress(geocoder, resultsMap) {
//     var address = document.getElementById('address').value;
//     geocoder.geocode({'address': address}, function(results, status) {
//       if (status === 'OK') {
//         resultsMap.setCenter(results[0].geometry.location);
//         var marker = new google.maps.Marker({
//           map: resultsMap,
//           position: results[0].geometry.location
//         });
//       } else {
//         alert('Geocode was not successful for the following reason: ' + status);
//       }
//     });
//   }




// initialize();

// var map;
// var service;
// var infowindow;

// function initialize() {
//   var pyrmont = new google.maps.LatLng(-33.8665433,151.1956316);

//   map = new google.maps.Map(document.getElementById('map'), {
//       center: pyrmont,
//       zoom: 15
//     });

//   var request = {
//     location: pyrmont,
//     radius: '500',
//     query: 'restaurant'
//   };

//   service = new google.maps.places.PlacesService(map);
//   service.textSearch(request, callback);
// }

// function callback(results, status) {
//   if (status == google.maps.places.PlacesServiceStatus.OK) {
//     for (var i = 0; i < results.length; i++) {
//       var place = results[i];
//       createMarker(results[i]);
//     }
//   }
// }








// var map;
// initMap();

// function initMap() {
//   // Create the map.
//   var pyrmont = {lat: -33.866, lng: 151.196};
//   map = new google.maps.Map(document.getElementById('map'), {
//     center: pyrmont,
//     zoom: 17
//   });

//   // Create the places service.
//   var service = new google.maps.places.PlacesService(map);
//   var getNextPage = null;
//   var moreButton = document.getElementById('more');
//   moreButton.onclick = function() {
//     moreButton.disabled = true;
//     if (getNextPage) getNextPage();
//   };

//   // Perform a nearby search.
//   service.nearbySearch(
//       {location: pyrmont, radius: 500, type: ['store']},
//       function(results, status, pagination) {
//         if (status !== 'OK') return;

//         createMarkers(results);
//         moreButton.disabled = !pagination.hasNextPage;
//         getNextPage = pagination.hasNextPage && function() {
//           pagination.nextPage();
//         };
//       });
//     }

    function createMarkers(places) {
      var bounds = new google.maps.LatLngBounds();
      var placesList = document.getElementById('places');
    
      for (var i = 0, place; place = places[i]; i++) {
        var image = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };
    
        var marker = new google.maps.Marker({
          map: map,
          icon: image,
          title: place.name,
          position: place.geometry.location
        });
    
        var li = document.createElement('li');
        li.textContent = place.name;
        placesList.appendChild(li);
    
        bounds.extend(place.geometry.location);
      }
      map.fitBounds(bounds);
    }


