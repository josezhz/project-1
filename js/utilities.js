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

let weightings = {
    overall: {
        a: 50, e: 10, c: 20, h: 20
    },
    arts_and_humanities: {
        a: 60, e: 20, c: 10, h: 10
    },
    engineering_and_technology: {
        a: 40, e: 30, c: 15, h: 15
    },
    life_sciences_and_medicine: {
        a: 40, e: 10, c: 25, h: 25
    },
    natural_sciences: {
        a: 40, e: 20, c: 20, h: 20
    },
    social_sciences_and_management: {
        a: 50, e: 30, c: 10, h: 10
    }
}

function calculateOverallScore(a, e, c, h, subject) {
    let o = (a * weightings[subject].a + e * weightings[subject].e + c * weightings[subject].c + h * weightings[subject].h) / 100
    return o.toFixed(1)
}