// Load application styles
import 'styles/index.scss';
import 'styles/_utils.scss';
import 'styles/_eventlist.scss';
import 'styles/_favorites.scss';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

// import {showFavorites} from 'favorites.js';

// f414b55d7015574938371e29587622 meetupkey

let map;
let marker;
let geocoder;
let autocomplete;
let pointer = [];
let markers = [];
let isRequesting = false;
let infowindow;
let infowindowContent;
let recentData;
let blank;
const googleMap = document.querySelector('.googleMap');
const info = document.querySelector('.info');
const setting = document.querySelector('.setting');

initMap();
countFavorites();

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 38.76630114693474  , lng: -9.182209028894022},
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false
    });

    const input = document.getElementById('input');
    autocomplete = new google.maps.places.Autocomplete(input, {placeIdOnly: true});
    autocomplete.bindTo('bounds', map);

    infowindowContent = document.querySelector('.infowindow-content');
    infowindow = new google.maps.InfoWindow({
        content: infowindowContent,
        maxWidth: 250
    });
    
    geocoder = new google.maps.Geocoder;

    map.addListener('click', function (e) {
        input.value = '';
        addPointer(e.latLng, map);
        requestData(e.latLng.lat(), e.latLng.lng());
        console.log(e.latLng.lat(), e.latLng.lng());
    });

    autocomplete.addListener('place_changed', function() {
        infowindow.close();
        let place = autocomplete.getPlace();
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

        addPointer(results[0].geometry.location, map);

        console.log(place.name);
        requestData(results[0].geometry.location.lat(), results[0].geometry.location.lng());
        });
    });
}

function addPointer(location, map) {
    deletePointer();
    deleteMarkers();
    console.log('클릭한 위치', location);

    geocoder.geocode({'location': location}, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
                marker = new google.maps.Marker({
                    position: location,
                    map: map
                });
                pointer.push(marker);
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}


function requestData(lat, lng, page = 10) {
    if (!isRequesting) {
        new Promise((resolve, reject) => { 
            isRequesting = true;
            $.ajax({
                url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts%2C+featured_photo&lon=${lng}&lat=${lat}&sig=0ed587ea0a9a01c606e5de12ae751fac915d9214`,
                dataType: 'jsonp',
                success: function(rawData) {console.log('왔다!',rawData.data); resolve(rawData)},
                error: function(err) {console.log('에러ㅠ',err); reject(err)}
            })
        }).then(rawData => {
            let data = rawData.data;
            recentData = data;
            console.log('장소검색할',data);
            if (data.events.length) {
                for (let i = 0; i < data.events.length; i++) {
                    data.city.country = data.city.country.toUpperCase();
                    if (data.events[i].venue) {
                        let latLng = {lat: data.events[i].venue.lat, lng: data.events[i].venue.lon}
                        dropMarkers(latLng, 100, i, data.events);
                    } else {
                        data.events[i].venue = data.city.city;
                    }
                }
            }
            setting.children[0].children[1].textContent = `${data.city.city}, ${data.city.country}`;
            showList(data);
        }).catch(err => {
            // alert(err);
        });    
    }
};

setting.children[0].children[0].addEventListener('click', () => showList(recentData));
setting.children[1].children[1].addEventListener('click', showFavorites);


function showList(data) {
    isRequesting = false;

    googleMap.classList.remove('w50');
    googleMap.classList.add('w60');
    info.classList.remove('w50');
    info.classList.add('w40');

    setting.classList.remove('show-favorites');
    setting.classList.add('show-list');
    info.classList.remove('info-favorites');
    info.classList.add('info-list');

    setting.children[0].children[1].classList.remove('invisible');


    while (info.childElementCount > 1) { 
        info.removeChild(info.lastElementChild); 
    }

    blank = document.createElement('div');
    blank.classList.add('blank', 'blank-full');
    info.appendChild(blank);

    // console.log('data', data);

    setTimeout(() => makeEventList(data), 0);
    // makeEventList(data);
}

function makeEventList(data) {
    blank.classList.remove('blank-full');
    blank.classList.add('h0');

    if (data) {
        if (data.events && data.events.length) {
            for (let i = 0; i < data.events.length; i++) {
                const event = document.createElement('div');
                event.classList.add('event');
                const hostInfo = document.createElement('div');
                const imgWrapper = document.createElement('div');
                const hostImg = document.createElement('img');
                const hostName = document.createElement('span');
                if (data.events[i].event_hosts && data.events[i].event_hosts[0].photo) {
                    hostImg.src = data.events[i].event_hosts[0].photo.photo_link;
                    hostName.textContent = data.events[i].event_hosts[0].name;
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
                const dateAndTime = data.events[i].local_date + ' ' + data.events[i].local_time;
                eventTitle.textContent = data.events[i].name;
                eventGroup.textContent = data.events[i].group.name;
                eventDate.textContent = dateAndTime;
                eventRsvp.textContent = 'RSVP ' + data.events[i].yes_rsvp_count;
                eventInfo.appendChild(eventTitle);
                eventInfo.appendChild(eventGroup);
                eventInfo.appendChild(eventDate);
                eventInfo.appendChild(eventRsvp);
                event.appendChild(eventInfo);

                const additionalInfo = document.createElement('div');
                const addEvent = document.createElement('img');
                addEvent.src = 'https://cdn0.iconfinder.com/data/icons/slim-square-icons-basics/100/basics-15-512.png';
                if (localStorage.getItem(data.events[i].id)) {
                    addEvent.classList.add('add-event');
                }
                addEvent.addEventListener('click', function(e) {
                    addOrRemoveFromList(e, i, data.events);
                    countFavorites();
                });

                additionalInfo.appendChild(addEvent);
                event.appendChild(additionalInfo);

                info.appendChild(event);
            }
        } else {
            const noResult = document.createElement('div');
            noResult.classList.add('noResult');
            noResult.textContent = `There is no meetup in ${data.city.city}!`;
            info.appendChild(noResult);
        }
    }

}

function showFavorites() {
    googleMap.classList.remove('w60');
    googleMap.classList.add('w50');
    info.classList.remove('w40');
    info.classList.add('w50');

    setting.classList.remove('show-list');
    setting.classList.add('show-favorites');
    info.classList.remove('info-list');
    info.classList.add('info-favorites');

    setting.children[0].children[1].classList.add('invisible');

    while (info.childElementCount > 1) { 
        info.removeChild(info.lastElementChild); 
    } 
    localStorage.removeItem('loglevel:webpack-dev-server');
    if (localStorage.length) {
        for (let i = 0; i < localStorage.length; i++) {
            let favData = JSON.parse(Object.values(localStorage)[i]);
            const favWrapper = document.createElement('div');
            favWrapper.classList.add('fav-wrapper');
            const fav = document.createElement('div');
            fav.classList.add('fav');
            const favMainInfo = document.createElement('div');
            const favEventImg = document.createElement('img');
            if (favData.featured_photo) {
                favEventImg.src = favData.featured_photo.photo_link;
            } else {
                console.log('사진없음', Object.keys(localStorage)[i]);
            }

            const favTitleWrapper = document.createElement('div');
            const favEventTitle = document.createElement('span');
            favEventTitle.textContent = favData.name;
            favTitleWrapper.appendChild(favEventTitle);
            const favDeleteBt = document.createElement('img');
            favDeleteBt.src = 'https://postfiles.pstatic.net/MjAxOTAxMDdfMTIy/MDAxNTQ2ODA3NTI1NzY2.RskCx8ubPA4maS8GQ5rynPb2_q2xSTlDj9mjadqc2lgg.9pKiY1GLgdO3zYj4TNRtxwSvedqpigHgNWZSBHp2dDcg.PNG.choinashil/basics-15-512.png?type=w773';

            favDeleteBt.addEventListener('click', (e) => {
                removeFromFavorites(e, favData);
                countFavorites();
            });

            favMainInfo.appendChild(favEventImg);
            favMainInfo.appendChild(favTitleWrapper);
            favMainInfo.appendChild(favDeleteBt);
            const favDetails = document.createElement('div');
            const favGroupNameWrapper = document.createElement('div');
            const prepBy = document.createElement('span');
            const favGroupName = document.createElement('span');
            const favDateWrapper = document.createElement('div');
            const favDate = document.createElement('span');
            const prepIn = document.createElement('span');
            const favCity = document.createElement('span');
            prepBy.textContent = 'by'
            favGroupName.textContent = favData.group.name;
            favDate.textContent = favData.local_date + ' ' + favData.local_time;
            prepIn.textContent = 'in';
            favCity.textContent = favData.venue.city ? favData.venue.city : favData.venue;
            favGroupNameWrapper.appendChild(prepBy);
            favGroupNameWrapper.appendChild(favGroupName);
            favDateWrapper.appendChild(favDate);
            favDateWrapper.appendChild(prepIn);
            favDateWrapper.appendChild(favCity);
            favDetails.appendChild(favGroupNameWrapper);
            favDetails.appendChild(favDateWrapper);

            fav.appendChild(favMainInfo);
            fav.appendChild(favDetails);

            favWrapper.appendChild(fav);
            info.appendChild(favWrapper);
        }
    }


};

function countFavorites() {
    localStorage.removeItem('loglevel:webpack-dev-server');
    setting.children[1].children[0].children[0].textContent = localStorage.length;
}

function addOrRemoveFromList(e, i, events) {
    if (!e.target.classList.length || e.target.classList.contains('remove-event')) {
        e.target.classList.remove('remove-event');
        e.target.classList.add('add-event');
        localStorage.setItem(events[i].id, JSON.stringify(events[i]));

    } else if (e.target.classList.contains('add-event')) {
        e.target.classList.remove('add-event');
        e.target.classList.add('remove-event');
        localStorage.removeItem(events[i].id);
    }
}

function removeFromFavorites(e, favData) {
    localStorage.removeItem(favData.id);
    e.target.parentElement.parentElement.parentElement.remove();

}

var icon = {
    url: 'https://www.pacificrimvisitor.ca/wp-content/uploads/2017/04/flag.png',
    scaledSize: new google.maps.Size(50, 50)
}

function dropMarkers(position, time, index, events) {
    const infowindowImg = infowindowContent.children[0];
    const infowindowTitle = infowindowContent.children[1];

    if (infowindowImg.childElementCount) { 
        infowindowImg.removeChild(infowindowImg.firstElementChild); 
    } 
    if (infowindowTitle.children[0].textContent) { 
        infowindowTitle.children[0].textContent = '';
    } 

    infowindowTitle.children[1].textContent = `${events.length} meetups are around here!`;
    infowindow.open(map, marker);

    setTimeout(function() {
        let venueMarker = new google.maps.Marker({
            position: position,
            map: map,
            // icon: icon,
            animation: google.maps.Animation.DROP
        });

        venueMarker.addListener('click', function() {

            if (infowindowImg.childElementCount) { 
                infowindowImg.removeChild(infowindowImg.firstElementChild); 
            }         

            const venueImg = document.createElement('img');
            if (events[index].featured_photo) {
                venueImg.src = events[index].featured_photo.thumb_link;
            } else {
                venueImg.src = 'https://cdn.shopify.com/s/files/1/1061/1924/files/Kiss_Emoji_with_Closed_Eyes.png?8026536574188759287';
            }
            infowindowImg.appendChild(venueImg);

            let dDay = calculateDday(events, index);

            infowindowTitle.children[0].textContent = dDay ? `D-${dDay}` : 'Today!';
            
            infowindowTitle.children[1].textContent = events[index].name;
            infowindow.open(map, venueMarker);
        });
        markers.push(venueMarker);

        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }
        bounds.extend(pointer[0].getPosition());
        map.fitBounds(bounds);

    }, time);
}

function calculateDday(events, index) {
    const d = new Date();
    const year = String(d.getFullYear()); 
    const month = (d.getMonth() + 1) < 10 ? '0' + String(d.getMonth() + 1) : String(d.getMonth() + 1);
    const date = (d.getDate()) < 10 ? '0' + String(d.getDate()) : String(d.getDate());
    const today = year + month + date;

    let eventDate = events[index].local_date;
    eventDate = eventDate.replace(/-/g, '');
    // console.log(today);
    // console.log(eventDate);

    // console.log(eventDate - today);
    return eventDate - today;
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