let initialLatLng = [20, 20]
if (window.innerWidth < 576) {
    initialLatLng = [50, 0]
} else if (window.innerWidth < 992) {
    initialLatLng = [40, -45]
}
function createMap() {
    let southWest = L.latLng(-90, -250)
    let northEast = L.latLng(90, 200)
    let bounds = L.latLngBounds(southWest, northEast)
    let map = L.map('map', {
        maxBounds: bounds,
        zoomControl: false
    }).setView(initialLatLng, 3)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 2,
        attribution: '© OpenStreetMap'
    }).addTo(map)
    let zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map)
    return map
}

let map = createMap()
let asiaLayer = L.layerGroup().addTo(map)
let europeLayer = L.layerGroup().addTo(map)
let latin_americaLayer = L.layerGroup().addTo(map)
let north_americaLayer = L.layerGroup().addTo(map)
let oceaniaLayer = L.layerGroup().addTo(map)
let allLayers = [asiaLayer, europeLayer, latin_americaLayer, north_americaLayer, oceaniaLayer]
let overlayMaps = {
    "Asia": asiaLayer,
    "Europe": europeLayer,
    "Latin America": latin_americaLayer,
    "North America": north_americaLayer,
    "Oceania": oceaniaLayer
}
let layerControl = L.control.layers(null, overlayMaps, { position: 'topright' }).addTo(map)

createRankOptions()
createCountryOptions()

document.querySelector('#btn-search').addEventListener('click', async function () {

    if (window.innerWidth < 992) { toggleNav() }

    for (eachLayer of allLayers) {
        eachLayer.clearLayers()
    }

    map.flyTo(initialLatLng, 3)
    markers = []

    let subject = document.querySelector('#select-subject').value
    let resRankings = await axios.get('../json/qs_2021_with_latlng.json')
    let rankings = resRankings.data[subject]
    let rankS = Number(document.querySelector('#select-rank-s').value)
    let rankE = Number(document.querySelector('#select-rank-e').value)
    let countrySelected = document.querySelector('#select-country').value
    let resCountriesInfo = await axios.get('../json/countries_info.json')
    let countryCodes = resCountriesInfo.data.country_code[0]
    let regions = resCountriesInfo.data.region[0]
    let countryListWithResults = []
    for (let eachUni = rankS - 1; eachUni < rankE; eachUni++) {
        if (!countryListWithResults.includes(rankings[eachUni].Location)) {
            countryListWithResults.push(rankings[eachUni].Location)
        }
    }

    if (rankS > rankE) {
        document.querySelector('#container-search-by-uni').style.display = 'none'
        document.querySelector('#alert-invalid-rank').style.display = 'block'
        document.querySelector('#alert-no-results').style.display = 'none'
    } else if (countrySelected && !countryListWithResults.includes(countrySelected)) {
        document.querySelector('#container-search-by-uni').style.display = 'none'
        document.querySelector('#alert-invalid-rank').style.display = 'none'
        document.querySelector('#alert-no-results').style.display = 'flex'
        document.querySelector('#country-with-no-results').innerHTML = countrySelected
    } else {
        document.querySelector('#container-search-by-uni').style.display = 'flex'
        document.querySelector('#alert-invalid-rank').style.display = 'none'
        document.querySelector('#alert-no-results').style.display = 'none'
    }

    document.querySelector('#unis').innerHTML = ''
    for (let eachUni = rankS - 1; eachUni < rankE; eachUni++) {
        let name = rankings[eachUni].Institution
        let country = rankings[eachUni].Location
        let rank = rankings[eachUni][2021]

        /*
        // get latlng from google map api
        let address = name + ", " + country
        let response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: 'AIzaSyDKJvrzonuv9qzW29p_QTgfbKQfOevoD74'
            }
        })
        let location = response.data.results[0].geometry.location
        let lat = Number(location.lat)
        let lng = Number(location.lng)
        */
        // get latlng from localized data
        let lat = rankings[eachUni].lat
        let lng = rankings[eachUni].lng

        // generate marker
        let countryCode = countryCodes[country]
        let countryIconType = ""
        if (rank == 1) { countryIconType = "_gold" }
        if (rank == 2) { countryIconType = "_silver" }
        if (rank == 3) { countryIconType = "_bronze" }
        let iconSize = [50, 50]
        let iconAnchor = [25, 50]
        let popupAnchor = [0, -50]
        if (countryIconType) {
            iconSize = [70, 70]
            iconAnchor = [35, 70]
            popupAnchor = [0, -70]
        }

        let countryIcon = L.icon({
            iconUrl: `../images/country_markers/${countryCode}${countryIconType}.png`,

            iconSize: iconSize,
            iconAnchor: iconAnchor,
            popupAnchor: popupAnchor
        })
        let marker = L.marker([lat, lng], { icon: countryIcon, title: `${name}` }).openPopup()
        markers.push(marker)

        // generate popup
        let imgElementFlag = `<img src="https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png" height="25px"/>`
        let imgElementSubject = `<img src="../images/subject_logos/${subject}.png" height="30px">`
        let subjectName = {
            overall: "OVERALL",
            arts_and_humanities: "ARTS & HUMANITIES",
            engineering_and_technology: "ENGINEERING & TECHNOLOGY",
            life_sciences_and_medicine: "LIFE SCIENCES & MEDICINE",
            natural_sciences: "NATURAL & SCIENCES",
            social_sciences_and_management: "SOCIAL SCIENCES & MANAGEMENT"
        }
        marker.bindPopup(`
            <div style="width: 250px;">
                <div class="d-flex">
                    ${imgElementSubject}
                    <span class="text-success align-self-end ms-1 fs-light" style="font-family: 'Acme', sans-serif;">${subjectName[subject]}</span>
                </div>
                <div class="d-flex justify-content-between">
                    <div class="align-self-end">#<span class="fs-5">${rank}</span></div>
                    <div class="d-flex"><span class="align-self-end me-1" style="font-family: 'Acme', sans-serif;">${country}</span>${imgElementFlag}</div>
                </div>
                <hr class="mt-1 mb-1 p-1 bg-success rounded-pill">
                <h5 style="font-family: 'Acme', sans-serif;">${name}</h5>
                <div class="w-100" id="popup-chart-${rank}"></div>
            </div>
        `)

        // generate popup chart
        let overallScore = rankings[eachUni].Score
        let academicScore = rankings[eachUni].Academic
        let employerScore = rankings[eachUni].Employer
        let citationsScore = rankings[eachUni].Citations
        let hScore = rankings[eachUni].H
        marker.addEventListener('click', function () {
            let options = {
                series: [{
                    name: 'Socre',
                    data: [overallScore, academicScore, employerScore, citationsScore, hScore]
                }],
                chart: {
                    type: 'bar',
                    height: 148
                },
                title: {
                    text: 'Scores',
                    align: 'center',
                    margin: 0,
                    offsetX: 0,
                    offsetY: 0,
                    floating: true,
                    style: {
                        fontSize: '16px',
                        fontWeight: 400,
                        fontFamily: "'Acme', sans-serif",
                        color: '#198754',
                    },
                },
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        horizontal: true,
                    }
                },
                colors: ['#198754'],
                dataLabels: { enabled: true },
                xaxis: { categories: ['Overall', 'Academic', 'Employer', 'Citations', 'H-Index'] }
            };

            let chart = new ApexCharts(document.querySelector(`#popup-chart-${rank}`), options);
            chart.render()
        })

        let region = regions[country]
        let selected = true
        if (countrySelected) {
            selected = false
            if (country == countrySelected) { selected = true }
        }
        if (selected) {
            // create options for search by uni
            let optionElementUni = document.createElement('option')
            optionElementUni.innerHTML = "#" + rank + " - " + country
            optionElementUni.value = name
            document.querySelector('#unis').appendChild(optionElementUni)
            // add to overlays of corresponding regions
            if (region == "asia") {
                marker.addTo(asiaLayer)
            } else if (region == "europe") {
                marker.addTo(europeLayer)
            } else if (region == "latin_america") {
                marker.addTo(latin_americaLayer)
            } else if (region == "north_america") {
                marker.addTo(north_americaLayer)
            } else if (region == "oceania") {
                marker.addTo(oceaniaLayer)
            }
        }
    }
    document.querySelector('#clear-search-by-uni').addEventListener('click', function () {
        document.querySelector('#search-by-uni').value = ''
    })
    document.querySelector('#btn-search-by-uni').addEventListener('click', function () {
        let uniSelected = document.querySelector('#search-by-uni').value
        for (eachMarker of markers) {
            if (eachMarker.options.title == uniSelected) {
                eachMarker.openPopup()
                let lat = eachMarker._latlng.lat
                let lng = eachMarker._latlng.lng
                map.flyTo([lat + 0.001, lng], 17)
            }
        }
        document.querySelector('#search-by-uni').value = ""
        if (!containerNav.classList.contains('hide') && window.innerWidth < 992) {
            toggleNav()
        }
    })
})

let regionsContainer = document.querySelector('.leaflet-control-layers-overlays')
console.log(regionsContainer)
regionsContainer.classList.add('form-switch', 'form-check')
let regions = document.querySelectorAll('.leaflet-control-layers-selector')
for (region of regions) {
    region.classList.add('form-check-input')
}
console.log(document.querySelector('.leaflet-control-zoom-in'))