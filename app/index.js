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

let map;
let marker;
let geocoder;
let autocomplete;
let infowindow;
let infowindowContent;
let infowindowImg;
let infowindowTitle;
let blank;
let recentData;
let displayType;
let pointer = [];
let markers = [];
let isRequesting = false;
const info = document.querySelector('.info');
const setting = document.querySelector('.setting');
const googleMap = document.querySelector('.googleMap');

const BigMarker = {
    url: 'https://postfiles.pstatic.net/MjAxOTAxMDhfMTk4/MDAxNTQ2OTE5MjkyNjky.TNacKrbzR2UkFPei4NjHYbKvc8G1m5GkHltcBAJczCMg.BQigOiRfIsAJIjMThInuiFUyHIGfWAFUu-NYHxnnmpsg.PNG.choinashil/bigMarker.png?type=w773',
    scaledSize: new google.maps.Size(30, 45)
}

const smallMarker = {
    url: 'https://postfiles.pstatic.net/MjAxOTAxMDhfMjIw/MDAxNTQ2OTE5NzkyMTg1.pS-e_UBx58xjd6EZx3NYwJzinS3fB-jFVFpcuUD5QNUg.HUknQPc0P5j6BSJ_4cCMMGS_AL2OjBTw-0NTawBHKXMg.PNG.choinashil/smallMarker.png?type=w773',
    scaledSize: new google.maps.Size(25, 35)
}

initMap();
countFavorites();

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 59.91348795365442, lng: 10.751302987337112},
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
            {
                "featureType": "all",
                "stylers": [{"saturation": 0}, {"hue": "#e7ecf0"}]
            },
            {
                "featureType": "road",
                "stylers": [{"saturation": -70}]
            },
            {
                "featureType": "transit",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "poi",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "water",
                "stylers": [{"visibility": "simplified"}, {"saturation": -60}]
            }
        ]
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

    addEventListenerToMap();
    addEventListenerToAutocomplete();
    addEventListenerToSetting();
}

function addEventListenerToMap() {
    map.addListener('click', (e) => {
        input.value = '';
        addPointer(e.latLng, map);
        requestData(e.latLng.lat(), e.latLng.lng());
        console.log(e.latLng.lat(), e.latLng.lng());
    });
}

function addEventListenerToAutocomplete() {
    autocomplete.addListener('place_changed', () => {
        infowindow.close();
        let place = autocomplete.getPlace();
        if (!place.place_id) {
            return;
        }
        geocoder.geocode({'placeId': place.place_id}, (results, status) => {
            if (status !== 'OK') {
                info.children[1].classList.remove('invisible');
                info.children[1].textContent = `Geocoder failed due to: ${status}`;
                return;
            }
            const location = results[0].geometry.location;
            map.setZoom(13);
            map.setCenter(location);
            addPointer(location, map);
            requestData(location.lat(), location.lng());
        });
    });
}

function addEventListenerToSetting() {
    setting.children[0].children[0].addEventListener('click', () => showList(recentData));
    setting.children[1].children[1].addEventListener('click', showFavorites);
}

function addPointer(location, map) {
    deletePointer();
    deleteMarkers();

    geocoder.geocode({'location': location}, (results, status) => {
        if (status === 'OK') {
            if (results[0]) {
                marker = new google.maps.Marker({
                    position: location,
                    map: map,
                    icon: BigMarker
                });
                pointer.push(marker);
            } else {
                info.children[1].classList.remove('invisible');
                info.children[1].textContent = 'No results found';
            }
        } else {
            info.children[1].classList.remove('invisible');
            info.children[1].textContent = `Geocoder failed due to: ${status}`;
        }
    });
}

function deletePointer() {
    pointer.forEach(p => p.setMap(null));
    pointer = [];
}

function deleteMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function requestData(lat, lng, page = 10) {
    if (!isRequesting) {
        new Promise((resolve, reject) => {
            isRequesting = true;
            $.ajax({
                url: `https://api.meetup.com/find/upcoming_events?photo-host=public&page=${page}&sig_id=271259792&fields=event_hosts%2C+featured_photo&lon=${lng}&lat=${lat}&sig=0ed587ea0a9a01c606e5de12ae751fac915d9214`,
                dataType: 'jsonp',
                success: (rawData) => resolve(rawData),
                error: (err) => reject(err)
            })
        }).then(rawData => {
            const data = rawData.data;
            recentData = data;
            data.city.country = data.city.country.toUpperCase();
            if (data.events.length) {
                for (let i = 0; i < data.events.length; i++) {
                    if (data.events[i].venue) {
                        let latLng = {lat: data.events[i].venue.lat, lng: data.events[i].venue.lon}
                        showVenuesOnTheMap(latLng, 100, data.events, i);
                    } else {
                        data.events[i].venue = data.city.city;
                    }
                }
            }
            setting.children[0].children[1].textContent = `${data.city.city}, ${data.city.country}`;
            showList(data);
        }).catch(err => {
            while (info.childElementCount > 2) {
                info.removeChild(info.lastElementChild);
            }
            info.children[1].classList.remove('invisible');
            info.children[1].innerHTML = 'Error occured! <p> Please reload the page and try again';
        });
    }
}

function showList(data) {
    isRequesting = false;
    displayType = 'list';

    changeSettingsForList();

    while (info.childElementCount > 2) {
        info.removeChild(info.lastElementChild);
    }

    blank = document.createElement('div');
    blank.classList.add('blank', 'blank-full');
    info.appendChild(blank);

    setTimeout(() => makeEventList(data), 0);
}

function changeSettingsForList() {
    googleMap.classList.remove('w50');
    googleMap.classList.add('w60');
    info.classList.remove('w50');
    info.classList.add('w40');

    setting.classList.remove('show-favorites');
    setting.classList.add('show-list');
    info.classList.remove('info-favorites');
    info.classList.add('info-list');

    setting.children[0].children[1].classList.remove('invisible');
    info.children[1].classList.add('invisible');
}

function makeEventList(data) {
    blank.classList.remove('blank-full');
    if (data) {
        if (data.events && data.events.length) {
            for (let i = 0; i < data.events.length; i++) {
                const event = document.createElement('div');
                const hostInfo = document.createElement('div');
                const imgWrapper = document.createElement('div');
                const hostImg = document.createElement('img');
                const hostName = document.createElement('span');
                const eventInfo = document.createElement('div');
                const eventTitle = document.createElement('span');
                const eventGroup = document.createElement('span');
                const eventDate = document.createElement('span');
                const eventRsvp = document.createElement('span');
                const additionalInfo = document.createElement('div');
                const addFavorites = document.createElement('img');

                event.classList.add('event');
                if (data.events[i].event_hosts && data.events[i].event_hosts[0].photo) {
                    hostImg.src = data.events[i].event_hosts[0].photo.photo_link;
                    hostName.textContent = data.events[i].event_hosts[0].name;
                } else {
                    hostImg.src = 'https://www.smallstreammedia.nl/workspace/assets/images/empty_profile.png';
                }
                let eDate = data.events[i].local_date;
                eDate = eDate.replace(/-/g, '.');
                const dateAndTime = `${eDate} ${data.events[i].local_time}`;
                eventTitle.textContent = data.events[i].name;
                eventGroup.textContent = data.events[i].group.name;
                eventDate.textContent = dateAndTime;
                eventRsvp.textContent = `RSVP ${data.events[i].yes_rsvp_count}`;
                addFavorites.src = 'https://cdn0.iconfinder.com/data/icons/slim-square-icons-basics/100/basics-15-512.png';
                if (localStorage.getItem(data.events[i].id)) {
                    addFavorites.classList.add('add-event');
                }

                addFavorites.addEventListener('click', (e) => {
                    addOrRemoveFromList(e, i, data.events);
                    countFavorites();
                });

                imgWrapper.appendChild(hostImg);
                hostInfo.appendChild(imgWrapper);
                hostInfo.appendChild(hostName);
                eventInfo.appendChild(eventTitle);
                eventInfo.appendChild(eventGroup);
                eventInfo.appendChild(eventDate);
                eventInfo.appendChild(eventRsvp);
                additionalInfo.appendChild(addFavorites);
                event.appendChild(hostInfo);
                event.appendChild(eventInfo);
                event.appendChild(additionalInfo);
                info.appendChild(event);
            }
        } else {
            info.children[1].classList.remove('invisible');
            info.children[1].textContent = `No meetup in ${data.city.city}!`;
        }
    }
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

function countFavorites() {
    localStorage.removeItem('loglevel:webpack-dev-server');
    setting.children[1].children[0].children[0].textContent = localStorage.length;
    if (!localStorage.length) {
        alertEmptyStatus();
    }
}

function showFavorites() {
    displayType = 'favorites';
    changeSettingsForFavorites();

    while (info.childElementCount > 2) {
        info.removeChild(info.lastElementChild);
    }
    makeFavorites();
};

function changeSettingsForFavorites() {
    googleMap.classList.remove('w60');
    googleMap.classList.add('w50');
    info.classList.remove('w40');
    info.classList.add('w50');

    setting.classList.remove('show-list');
    setting.classList.add('show-favorites');
    info.classList.remove('info-list');
    info.classList.add('info-favorites');

    setting.children[0].children[1].classList.add('invisible');
    info.children[1].classList.add('invisible');
}

function makeFavorites() {
    localStorage.removeItem('loglevel:webpack-dev-server');
    if (localStorage.length) {
        for (let i = 0; i < localStorage.length; i++) {
            const favWrapper = document.createElement('div');
            const fav = document.createElement('div');
            const favMainInfo = document.createElement('div');
            const favEventImg = document.createElement('img');
            const favTitleWrapper = document.createElement('div');
            const favEventTitle = document.createElement('span');
            const favDeleteBt = document.createElement('img');
            const favDetails = document.createElement('div');
            const favGroupNameWrapper = document.createElement('div');
            const prepBy = document.createElement('span');
            const favGroupName = document.createElement('span');
            const favDateWrapper = document.createElement('div');
            const favDate = document.createElement('span');
            const prepIn = document.createElement('span');
            const favCity = document.createElement('span');

            let favData = JSON.parse(Object.values(localStorage)[i]);
            favWrapper.classList.add('fav-wrapper');
            fav.classList.add('fav');

            if (favData.featured_photo) {
                favEventImg.src = favData.featured_photo.photo_link;
            } else {
                favEventImg.src = pickRandomImg();
            }

            favDeleteBt.src = 'https://postfiles.pstatic.net/MjAxOTAxMDdfMTIy/MDAxNTQ2ODA3NTI1NzY2.RskCx8ubPA4maS8GQ5rynPb2_q2xSTlDj9mjadqc2lgg.9pKiY1GLgdO3zYj4TNRtxwSvedqpigHgNWZSBHp2dDcg.PNG.choinashil/basics-15-512.png?type=w773';

            favDeleteBt.addEventListener('click', (e) => {
                removeFromFavorites(e, favData);
                countFavorites();
            });

            favEventTitle.textContent = favData.name;
            prepBy.textContent = 'by';
            favGroupName.textContent = favData.group.name;
            favDate.textContent = `${favData.local_date} ${favData.local_time}`;
            prepIn.textContent = 'in';
            favCity.textContent = favData.venue.city ? favData.venue.city : favData.venue;

            favTitleWrapper.appendChild(favEventTitle);
            favMainInfo.appendChild(favEventImg);
            favMainInfo.appendChild(favTitleWrapper);
            favMainInfo.appendChild(favDeleteBt);
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
    } else {
        alertEmptyStatus();
    }
}

function pickRandomImg() {
    const imgStorage = ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80', 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1351&q=80', 'https://images.unsplash.com/photo-1520881363902-a0ff4e722963?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80', 'https://i.pinimg.com/564x/ff/97/7a/ff977a8ec331fb14fde7a36fa7f2f45d.jpg', 'https://i.pinimg.com/564x/11/95/6e/11956eef61d061e36c2bf1361b2f79c8.jpg'];

    return imgStorage[Math.floor(Math.random() * imgStorage.length)];
}

function removeFromFavorites(e, favData) {
    localStorage.removeItem(favData.id);
    e.target.parentElement.parentElement.parentElement.remove();
}

function alertEmptyStatus() {
    if (displayType === 'favorites') {
        info.children[1].classList.remove('invisible');
        info.children[1].textContent = 'Why don\'t you mark your favorite?';
    }
}

function showVenuesOnTheMap(position, time, events, index) {
    infowindowImg = infowindowContent.children[0];
    infowindowTitle = infowindowContent.children[1];

    setInfowindow(events);

    setTimeout(() => {
        let venueMarker = new google.maps.Marker({
            position: position,
            map: map,
            icon: smallMarker,
            animation: google.maps.Animation.DROP
        });
        venueMarker.addListener('click', () => {
            fillInfowindow(venueMarker, events, index);
        });
        markers.push(venueMarker);
        adjustBoundary();
    }, time);
}

function setInfowindow(events) {
    if (infowindowImg.childElementCount) {
        infowindowImg.removeChild(infowindowImg.firstElementChild);
    }
    if (infowindowTitle.children[1].textContent) {
        infowindowTitle.children[1].textContent = '';
    }
    if (events.length === 1) {
        infowindowTitle.children[0].textContent = 'A meetup for you!';
    } else {
        infowindowTitle.children[0].textContent = `${events.length} meetups are around here!`;
    }
    infowindow.open(map, marker);
}

function fillInfowindow(venueMarker, events, index) {
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
}

function calculateDday(events, index) {
    const d = new Date();
    const year = String(d.getFullYear());
    const month = (d.getMonth() + 1) < 10 ? '0' + String(d.getMonth() + 1) : String(d.getMonth() + 1);
    const date = (d.getDate()) < 10 ? '0' + String(d.getDate()) : String(d.getDate());
    const today = year + month + date;
    let eventDate = events[index].local_date;
    eventDate = eventDate.replace(/-/g, '');
    return eventDate - today;
}

function adjustBoundary() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }
    bounds.extend(pointer[0].getPosition());
    map.fitBounds(bounds);
}
