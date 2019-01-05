// Load application styles
import 'styles/index.scss';

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
// }s

var map;
var markers = [];
var marker;

initMap();

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 55.67528613506351 , lng: 12.569255856587574},
        zoom: 12,
    });

    // 48.861004500037154 2.3571336952585398 파리
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
            url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts%2C+featured_photo&lon=${lng}&lat=${lat}&sig=0ed587ea0a9a01c606e5de12ae751fac915d9214`,
            dataType: 'jsonp',
            success: function(data) {console.log('왔다!',data.data.events); resolve(data)},
            error: function(err) {console.log('에러ㅠ',err); reject(err)}
        })
    }).then(data => {
        var events = data.data.events;
        if (events.length) {
            deleteMarkers();

            for (let i = 0; i < events.length; i++) {
                if (events[i].venue) {
                    let latLng = {lat: events[i].venue.lat, lng: events[i].venue.lon}
                    // let marker = new google.maps.Marker({
                    //     position: latLng,
                    //     map: map
                    // });
                    // markers.push(marker);
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
            icon: icon,
            animation: google.maps.Animation.DROP
        });
        venueMarker.addListener('click', function(e) {
            // infowindow.open();
            console.log(e);
            console.log(index);
            console.log(events[index].name);

            var infowindow = new google.maps.InfoWindow({
                content: events[index].name
            });

            infowindow.open(map, venueMarker);
        });
        
        markers.push({index, venueMarker});
        console.log('markers',markers);
    }, timeout);
}

function deleteMarkers() {
    setMarkers(null);
    markers = [];
    console.log('3',markers);
}

function setMarkers(map) {
    console.log('1',markers);
    // debugger
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
    console.log('2',markers);
}




//   https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts%2C+featured_photo&lon=${lng}&lat=${lat}&sig=0ed587ea0a9a01c606e5de12ae751fac915d9214

