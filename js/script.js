let map = L.map('map').setView([20, 20], 2)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map)

async function loadMarkers() {
    let res = await axios.get('../qs_2021.json')
    let rankings = res.overall
    for (each in rankings) {
        let name = rankings[each].Institution
        let country = rankings[each].Location
        let address = name + ", " + country
        let response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params:{
                address:address,
                key:'AIzaSyDKJvrzonuv9qzW29p_QTgfbKQfOevoD74'
            }
        })
        let location = response.data.results[0].geometry.location
        let lat = Number(location.lat)
        let lng = Number(location.lng)

        let rank = rankings[each][2021]
        let countryCode = country.toLowerCase()
        if (country == "South Korea") {countryCode = "kr"}
        if (country == "Russia") {countryCode = "ru"}
        let imgElementFlag = `<img src="https://countryflagsapi.com/png/${countryCode}" style="height: 50px; border: 1px solid black;"/>`
        let marker = L.marker([lat, lng])
        marker.bindPopup(`
            <h5>Rank: ${rank}</h5>
            ${imgElementFlag}
            <h3>${name}</h3>
        `).openPopup()
        marker.addTo(map)
    }
}
loadMarkers()