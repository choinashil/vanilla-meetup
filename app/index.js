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
var pointer = [];
var markers = [];
const info = document.querySelector('.info');

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
        addPointer(e.latLng, map);
        console.log(e.latLng.lat(), e.latLng.lng());
        console.log('클릭 후 데이터 수집중');
        requestData(e.latLng.lat(), e.latLng.lng());
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

function addPointer(location, map) {
    deletePointer();
    deleteMarkers();
    console.log('pointer', pointer);
    marker = new google.maps.Marker({
        position: location,
        map: map
    });
    pointer.push(marker);
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
            // console.log('element만들준비..이벤트갯수', events.length);
            showList(events);
        }
    });
};

function showList(events) {
    // 쌓이는거 리셋한 후에 만들기
    while ( info.childElementCount ) { 
        info.removeChild( info.firstElementChild ); 
    } 

    console.log('이벤트갯수', events.length);
    console.log('도착한 event data:', events);
    for (let i = 0; i < events.length; i++) {
        const event = document.createElement('div');
        event.classList.add('event');
        const hostInfo = document.createElement('div');
        const imgWrapper = document.createElement('div');
        const hostImg = document.createElement('img');
        const hostName = document.createElement('span');
        if (events[i].event_hosts) {
            hostImg.src = events[i].event_hosts[0].photo.highres_link;
            hostName.textContent = events[i].event_hosts[0].name;
        }
        imgWrapper.appendChild(hostImg);
        hostInfo.appendChild(imgWrapper);
        hostInfo.appendChild(hostName);
        event.appendChild(hostInfo);

        const eventInfo = document.createElement('div');
        const eventTitle = document.createElement('span');
        const eventGroup = document.createElement('span');
        const eventDate = document.createElement('span');
        const eventRsvp = document.createElement('span');
        const dateAndTime = events[i].local_date + ' ' + events[i].local_time;
        eventTitle.textContent = events[i].name;
        eventGroup.textContent = events[i].group.name;
        eventDate.textContent = dateAndTime;
        eventRsvp.textContent = events[i].yes_rsvp_count + '명 참석';
        eventInfo.appendChild(eventTitle);
        eventInfo.appendChild(eventGroup);
        eventInfo.appendChild(eventDate);
        eventInfo.appendChild(eventRsvp);
        event.appendChild(eventInfo);

        const additionalInfo = document.createElement('div');
        const dDay = document.createElement('span');
        const link = document.createElement('div');
        // dDay.textContent = 
        link.textContent = '참석하기';
        
        const eventLink = document.createElement('a');
        // eventlink.setAttribute('class', 'signature');
        eventLink.setAttribute('href', events[i].link);
        link.appendChild(eventLink);

        additionalInfo.appendChild(dDay);
        additionalInfo.appendChild(link);
        event.appendChild(additionalInfo);

        info.appendChild(event);
    }
}


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
            // console.log(index);
            // console.log(events[index].name);
            // console.log(venueMarker);

            var infowindow = new google.maps.InfoWindow({
                content: events[index].name
            });

            infowindow.open(map, venueMarker);
        });
        markers.push(venueMarker);
        // console.log('markers', markers);
    }, timeout);
}

function deleteMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function deletePointer() {
    pointer.forEach(p => p.setMap(null));
    pointer = [];
}





//   https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts%2C+featured_photo&lon=${lng}&lat=${lat}&sig=0ed587ea0a9a01c606e5de12ae751fac915d9214



// 화분 https://images.unsplash.com/photo-1511949817959-d24d516a8f8e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80
// 그림 https://images.unsplash.com/photo-1518774968953-dfb65a8874ea?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1349&q=80
// 캠핑 https://images.unsplash.com/photo-1535700601052-b90a78c466f5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1340&q=80
// 사람들 https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80
// 신난사람들 https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1351&q=80
// 식탁앞 사람들 https://images.unsplash.com/photo-1519671282429-b44660ead0a7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80
// 춤추는 사람들 https://images.unsplash.com/photo-1469488865564-c2de10f69f96?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80
// 불꽃놀이 https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80
// 와인 https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80
// 뛰는 사람들 https://images.unsplash.com/photo-1525026198548-4baa812f1183?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1233&q=80