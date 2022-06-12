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
let overlayMaps = {
    "Asia": asiaLayer,
    "Europe": europeLayer,
    "Latin America": latin_americaLayer,
    "North America": north_americaLayer,
    "Oceania": oceaniaLayer
}
let layerControl = L.control.layers(null, overlayMaps).addTo(map)

// generate options for rank filter
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

// generate options for country filter
(async function run() {
    let response = await axios.get('../json/countries_info.json')
    let countryCodes = response.data.country_code[0]
    for (eachCountry in countryCodes) {
        let optionElementCountry = document.createElement('option')
        optionElementCountry.innerHTML = eachCountry
        optionElementCountry.value = countryCodes[eachCountry]
        document.querySelector('#select-country').appendChild(optionElementCountry)
    }
})()

document.querySelector('#btnSubject').addEventListener('click', async function () {
    for (eachLayer of allLayers) {
        eachLayer.clearLayers()
    }

    let subject = document.querySelector('#select-subject').value
    let resRankings = await axios.get('../json/qs_2021_with_latlng.json')
    let rankings = resRankings.data[subject]
    let rankS = Number(document.querySelector('#select-rank-s').value)
    let rankE = Number(document.querySelector('#select-rank-e').value)
    if (rankS > rankE) {
        alert(`
        Invalid Input @ Rank
        (second number must be larger or equal to first number)
    `)
    }

    let countrySelected = document.querySelector('#select-country').value

    let resCountriesInfo = await axios.get('../json/countries_info.json')
    let countryCodes = resCountriesInfo.data.country_code[0]
    let regions = resCountriesInfo.data.region[0]

    document.querySelector('#container-search-by-uni').style.zIndex = 699
    document.querySelector('#unis').innerHTML = ''
    for (let eachUni = rankS - 1; eachUni < rankE; eachUni++) {
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
        let countryCode = countryCodes[country]
        let countryIconType = ""
        if (rank == 1) { countryIconType = "-gold" }
        if (rank == 2) { countryIconType = "-silver" }
        if (rank == 3) { countryIconType = "-bronze" }
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
        let marker = L.marker([lat, lng], { icon: countryIcon })

        // generate popup
        let imgElementFlag = `<img src="https://countryflagsapi.com/png/${countryCode}" class="border rounded" height="30px"/>`
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
            <div class="d-flex">
                ${imgElementSubject}
                <span class="text-success fw-bold align-self-end ms-1">${subjectName[subject]}</span>
            </div>
            <div class="d-flex justify-content-between">
                <div class="align-self-end fs-5">Rank: <span class="fs-3">${rank}</span></div>
                ${imgElementFlag}
            </div>
            <hr class="m-0 mb-1 p-1 bg-success rounded-pill">
            <h4>${name}</h4>
            <div id="popup-chart-${rank}" style="width: 300px;"></div>
        `).openPopup()

        // generate popup chart
        let overallScore = rankings[eachUni].Score
        let academicScore = rankings[eachUni].Academic
        let employerScore = rankings[eachUni].Employer
        let citationsScore = rankings[eachUni].Citations
        let hScore = rankings[eachUni].H
        marker.addEventListener('click', function () {
            var options = {
                series: [{
                    name: 'Socre',
                    data: [overallScore, academicScore, employerScore, citationsScore, hScore]
                }],
                chart: {
                    type: 'bar',
                    height: 200
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

            var chart = new ApexCharts(document.querySelector(`#popup-chart-${rank}`), options);
            chart.render()
        })

        let region = regions[country]
        let selected = true
        if (countrySelected) {
            selected = false
            if (countryCode == countrySelected) {
                selected = true
            }
        }
        if (selected) {
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
})