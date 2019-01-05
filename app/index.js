// Load application styles
import 'styles/index.scss';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

// f414b55d7015574938371e29587622 meetupkey

var map;
var marker;
var markers = [];
var pointMarker = [];

initMap();

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 48.86100450, lng: 2.357133695},
        zoom: 13,
    });

    var input = document.getElementById('pac-input');

    var autocomplete = new google.maps.places.Autocomplete(
        input, {placeIdOnly: true});
    autocomplete.bindTo('bounds', map);

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);
    var geocoder = new google.maps.Geocoder;
    marker = new google.maps.Marker({
        map: map
    });
    // marker.addListener('click', function() {
    //     infowindow.open(map, marker);
    // });


    map.addListener('click', function (e) {
        //lat and lng is available in e object
        console.log(e.latLng.lat(), e.latLng.lng());

        var pointer = document.createElement('div');
        pointer.classList.add('pointer');
        // pointer.style.left =
        console.log('클릭 후 데이터 수집중');
        requestData(e.latLng.lat(), e.latLng.lng());

        addMarker(e.latLng, map);
    });


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
        infowindow.open(map, marker);
        console.log('검색 후 데이터 수집중');
        requestData(results[0].geometry.location.lat(), results[0].geometry.location.lng());
        });
    });
}

function addMarker(location, map) {
    deletePointMarker();
    deleteMarkers();
    console.log('pointMarker', pointMarker);
    marker = new google.maps.Marker({
        position: location,
        map: map
    });
    pointMarker.push(marker);
}


function requestData(lat, lng, page = 10) {
    new Promise((resolve, reject) => {
        $.ajax({
            url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts%2C+featured_photo&lon=${lng}&lat=${lat}&sig=0ed587ea0a9a01c606e5de12ae751fac915d9214`,
            dataType: 'jsonp',
            success: function(data) {console.log('왔다!',data.data.events); resolve(data)},
            error: function(err) {console.log('에러ㅠ',err); reject(err)}
        })
    }).then(data => {
        var events = data.data.events;
        if (events.length) {
            for (let i = 0; i < events.length; i++) {
                if (events[i].venue) {
                    let latLng = {lat: events[i].venue.lat, lng: events[i].venue.lon}
                    addMarkerWithTimeout(latLng, i * 150, i, events);
                }
            }
        }
    });
};


var icon = {
    url: 'https://www.pacificrimvisitor.ca/wp-content/uploads/2017/04/flag.png',
    scaledSize: new google.maps.Size(50, 50)
}

function addMarkerWithTimeout(position, timeout, index, events) {
    setTimeout(function() {
        let venueMarker = new google.maps.Marker({
            position: position,
            map: map,
            // icon: icon,
            animation: google.maps.Animation.DROP
        });
        venueMarker.addListener('click', function(e) {
            console.log(index);
            console.log(events[index].name);
            console.log(venueMarker);

            var infowindow = new google.maps.InfoWindow({
                content: events[index].name
            });

            infowindow.open(map, venueMarker);
        });
        markers.push(venueMarker);
        console.log('markers', markers);
    }, timeout);
}

function deleteMarkers() {
    setMarkers(null);
    markers = [];
}

function setMarkers(map) {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function deletePointMarker() {
    setPointMarker(null);
    pointMarker = [];
}

function setPointMarker(map) {
    for (let i = 0; i < pointMarker.length; i++) {
        pointMarker[i].setMap(map);
    }
}




//   https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts%2C+featured_photo&lon=${lng}&lat=${lat}&sig=0ed587ea0a9a01c606e5de12ae751fac915d9214

