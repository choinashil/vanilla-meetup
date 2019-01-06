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
var infowindow;
var infowindowContent;
const info = document.querySelector('.info');
const favoriteButton = document.querySelector('.favoriteButton');

initMap();

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 51.46, lng: -2.6},
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false
    });

    // var inputInIntro = document.getElementById('input-in-intro');

    // var autocomplete2 = new google.maps.places.Autocomplete(
    //     inputInIntro, {placeIdOnly: true});

    // autocomplete2.bindTo('bounds', map);


    var inputInTheMap = document.getElementById('input-in-the-map');

    var autocomplete = new google.maps.places.Autocomplete(
        inputInTheMap, {placeIdOnly: true});
    
    autocomplete.bindTo('bounds', map);
    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputInTheMap);

    infowindow = new google.maps.InfoWindow();
    infowindowContent = document.getElementById('infowindow-content');
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
        // getPlace() 리턴값은 객체. name, place_id, types로 이루어져있음 
        console.log('place',place);
        if (!place.place_id) {
            return;
        }
        geocoder.geocode({'placeId': place.place_id}, function(results, status) {
        console.log('results',results);
        if (status !== 'OK') {
            window.alert('Geocoder failed due to: ' + status);
            return;
        }
        map.setZoom(13);
        map.setCenter(results[0].geometry.location);

        // Set the position of the marker using the place ID and location.
        // marker.setPlace({
        //   placeId: place.place_id,
        //   location: results[0].geometry.location
        // });
        // marker.setVisible(true);
        addPointer(results[0].geometry.location, map);

        infowindowContent.children['place-name'].textContent = `${place.name} 주변의 검색결과입니다`;
        infowindow.open(map, marker);   
        console.log('검색 후 데이터 수집중');
        requestData(results[0].geometry.location.lat(), results[0].geometry.location.lng());
        });
    });
}

function addPointer(location, map) {
    deletePointer();
    deleteMarkers();
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
            success: function(data) {console.log('왔다!',data.data); resolve(data)},
            error: function(err) {console.log('에러ㅠ',err); reject(err)}
        })
    }).then(data => {
        var events = data.data.events;
        if (events.length) {
            for (let i = 0; i < events.length; i++) {
                if (events[i].venue) {
                    let latLng = {lat: events[i].venue.lat, lng: events[i].venue.lon}
                    dropMarkers(latLng, i * 150, i, events);
                }
            }
            // console.log('element만들준비..이벤트갯수', events.length);
        }
        showList(events);
    });
};

favoriteButton.addEventListener('click', showFavorite);

function showFavorite(e) {
    e.target.classList.add('selected');
};

function showList(events) {
    // 쌓이는거 리셋한 후에 만들기
    while ( info.childElementCount > 1 ) { 
        info.removeChild( info.lastElementChild ); 
    } 

    if (events.length) {
        // console.log('이벤트갯수', events.length);
        // console.log('도착한 event data:', events);
        for (let i = 0; i < events.length; i++) {
            const event = document.createElement('div');
            event.classList.add('event');
            const hostInfo = document.createElement('div');
            const imgWrapper = document.createElement('div');
            const hostImg = document.createElement('img');
            const hostName = document.createElement('span');
            if (events[i].event_hosts && events[i].event_hosts[0].photo) {
                hostImg.src = events[i].event_hosts[0].photo.photo_link;
                hostName.textContent = events[i].event_hosts[0].name;
            } else {
                hostImg.src = 'https://www.smallstreammedia.nl/workspace/assets/images/empty_profile.png';
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
            eventRsvp.textContent = 'RSVP ' + events[i].yes_rsvp_count;
            eventInfo.appendChild(eventTitle);
            eventInfo.appendChild(eventGroup);
            eventInfo.appendChild(eventDate);
            eventInfo.appendChild(eventRsvp);
            event.appendChild(eventInfo);

            const additionalInfo = document.createElement('div');
            const dDay = document.createElement('span');
            const favorite = document.createElement('div');
            const addEvent = document.createElement('img');
            const link = document.createElement('div');
            // dDay.textContent = 
            addEvent.src = 'https://cdn0.iconfinder.com/data/icons/slim-square-icons-basics/100/basics-15-512.png';
            addEvent.addEventListener('click', function(e) {
                addFavorite(e, i, events);
            });
            favorite.appendChild(addEvent);
            link.textContent = 'JOIN';
            // const eventLink = document.createElement('a');
            // eventlink.setAttribute('class', 'signature');
            // eventLink.setAttribute('href', events[i].link);
            // link.appendChild(eventLink);

            additionalInfo.appendChild(dDay);
            additionalInfo.appendChild(favorite);
            additionalInfo.appendChild(link);
            event.appendChild(additionalInfo);

            info.appendChild(event);
        }
    }
}


function addFavorite(e, i, events) {
    console.log(events[i].id);
    console.log(events[i]);
    console.log('storage', localStorage);

    if (!e.target.classList.length || e.target.classList.contains('remove-event')) {
        e.target.classList.remove('remove-event');
        e.target.classList.add('add-event');
        window.localStorage.setItem(events[i].id, JSON.stringify(events[i]));
        console.log('넣은후storage', localStorage);

    } else if (e.target.classList.contains('add-event')) {
        e.target.classList.remove('add-event');
        e.target.classList.add('remove-event');
        window.localStorage.removeItem(events[i].id);
        console.log('삭제후storage', localStorage);
    }
}

var icon = {
    url: 'https://www.pacificrimvisitor.ca/wp-content/uploads/2017/04/flag.png',
    scaledSize: new google.maps.Size(50, 50)
}

function dropMarkers(position, time, index, events) {
    setTimeout(function() {
        let venueMarker = new google.maps.Marker({
            position: position,
            map: map,
            // icon: icon,
            animation: google.maps.Animation.DROP
        });
        venueMarker.addListener('click', function() {
            infowindowContent.children['place-name'].textContent = events[index].name;
            infowindow.open(map, venueMarker);
        });
        markers.push(venueMarker);
    }, time);
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