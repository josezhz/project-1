let containerNav = document.querySelector('.container-nav')
function toggleNav() {
    containerNav.classList.toggle('hide')
    document.querySelector('.container-nav-toggle').classList.toggle('dropend')
    document.querySelector('.container-nav-toggle').classList.toggle('dropstart')
}
document.querySelector('#nav-toggle').addEventListener('click', toggleNav)

function createRankOptions() {
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
}

async function createCountryOptions() {
    let response = await axios.get('../json/countries_info.json')
    let countryCodes = response.data.country_code[0]
    for (eachCountry in countryCodes) {
        let optionElementCountry = document.createElement('option')
        optionElementCountry.innerHTML = eachCountry
        optionElementCountry.value = eachCountry
        document.querySelector('#select-country').appendChild(optionElementCountry)
    }
}