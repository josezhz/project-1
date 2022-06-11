function createMap() {
    let map = L.map('map').setView([20, 20], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map)
    return map
}

let map = createMap()
let asiaLayer = L.layerGroup().addTo(map)
let europeLayer = L.layerGroup().addTo(map)
let latin_americaLayer = L.layerGroup().addTo(map)
let north_americaLayer = L.layerGroup().addTo(map)
let oceaniaLayer = L.layerGroup().addTo(map)
let allLayers = [asiaLayer, europeLayer, latin_americaLayer, north_americaLayer, oceaniaLayer]

let selectRankS = document.querySelector('#select-rank-s')
let selectRankE = document.querySelector('#select-rank-e')
for (let i = 1; i <= 50; i++) {
    let optionElement = document.createElement('option')
    optionElement.innerHTML = i
    optionElement.value = i
    if (i == 1) { optionElement.selected = true }
    selectRankS.appendChild(optionElement)
}
for (let i = 1; i <= 50; i++) {
    let optionElement = document.createElement('option')
    optionElement.innerHTML = i
    optionElement.value = i
    if (i == 50) { optionElement.selected = true }
    selectRankE.appendChild(optionElement)
}

document.querySelector('#btnSubject').addEventListener('click', async function () {
    for (eachLayer of allLayers) {
        eachLayer.clearLayers()
    }

    let overlayMaps = {
        "Asia": asiaLayer,
        "Europe": europeLayer,
        "Latin America": latin_americaLayer,
        "North America": north_americaLayer,
        "Oceania": oceaniaLayer
    }
    let layerControl = L.control.layers(null, overlayMaps).addTo(map)

    let subject = document.querySelector('#select-subject').value
    let resRankings = await axios.get('../json/qs_2021_with_latlng.json')
    let rankings = resRankings.data[subject]

    let resCountriesInfo = await axios.get('../json/countries_info.json')
    let countryCodes = resCountriesInfo.data.country_code[0]
    let regions = resCountriesInfo.data.region[0]

    document.querySelector('#container-search-by-uni').style.zIndex = 701
    document.querySelector('#unis').innerHTML = ''
    for (eachUni in rankings) {
        let name = rankings[eachUni].Institution
        let country = rankings[eachUni].Location
        let rank = rankings[eachUni][2021]

        // create options for the datalist
        let optionElement = document.createElement('option')
        optionElement.value = name
        document.querySelector('#unis').appendChild(optionElement)

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
        let countryIcon = L.icon({
            iconUrl: `../images/country_markers/united-states.png`,

            iconSize: [50, 50],
            iconAnchor: [25, 50],
            popupAnchor: [0, -50]
        })
        let marker = L.marker([lat, lng], { icon: countryIcon })

        // generate popup
        let countryCode = countryCodes[country]
        let imgElementFlag = `<img src="https://countryflagsapi.com/png/${countryCode}" class="border rounded" height="50px"/>`
        marker.bindPopup(`
            <h5>Rank: ${rank}</h5>
            ${imgElementFlag}
            <h3>${name}</h3>
            <div id="popup-chart-${rank}" style="width: 300px;"></div>
        `).openPopup()



        marker.addEventListener('click', function () {
            var options = {
                chart: {
                    type: 'line'
                },
                series: [{
                    name: 'sales',
                    data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
                }],
                xaxis: {
                    categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999]
                }
            }

            var chart = new ApexCharts(document.querySelector(`#popup-chart-${rank}`), options);

            chart.render()
        })



        let region = regions[country]
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
})