# Vanilla meetup

Google Map과 Meetup API를 이용한 지역 기반 Meetup 검색 어플리케이션입니다.

<img src="./2nd-test-choinashil.gif" alt="example">

## Setup

Install dependencies

```sh
$ yarn install (or npm install)
```

## Development

```sh
$ yarn dev (or npm run dev)
# visit http://localhost:8080
```


## Features

- Google Map을 통해 원하는 지역을 클릭하거나 지역명을 검색할 수 있습니다.
- [Meetup API](https://www.meetup.com/meetup_api)를 이용하여 선택한 지역의 Meetup List를 검색합니다.
- 검색 결과는 기본적으로 10개가 보여집니다.
- 위치 정보를 가진 검색 결과인 경우 지도 상에 마커로 표시됩니다.
- 마커를 클릭할 경우, 해당 Meetup의 기본 정보와 D-Day를 볼 수 있습니다.
- 원하는 Meetup을 즐겨찾기에 추가 및 삭제할 수 있습니다.
