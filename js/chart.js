createRankOptions()
createCountryOptions()
// example
let subject = 'overall'
var options1 = {
  chart: {
    height: 200,
    type: "radialBar",
  },
  series: [67, 84, 97, 61],
  plotOptions: {
    radialBar: {
      inverseOrder: true,
      dataLabels: {
        name: {
          show: true,
          fontFamily: "'Acme', sans-serif",
          fontSize: '32px',
          fontWeight: 400,
          offsetY: -10
        },
        value: {
          show: true,
          fontFamily: "'Acme', sans-serif",
          fontSize: '32px',
          fontWeight: 400,
          offsetY: 0,
          formatter: function (value) {
            return value
          }
        },
        total: {
          show: true,
          label: 'OVERALL',
          fontFamily: "'Acme', sans-serif",
          fontSize: '16px',
          fontWeight: 400,
          color: '#6f42c1',
          formatter: function (w) {
            values = w.config.series
            let a = values[0]
            let e = values[1]
            let c = values[2]
            let h = values[3]
            return calculateOverallScore(a, e, c, h, subject)
          }
        }
      }
    }
  },
  labels: ['ACADEMIC', 'EMPLOYER', 'CITATIONS', 'H-INDEX'],
  colors: ['#dc3545', '#ffc107', '#198754', '#0d6efd']
};
new ApexCharts(document.querySelector("#chart-radial-bar-subject-x"), options1).render();



document.querySelector('#btn-search').addEventListener('click', async function () {
  toggleNav()
  let chartResults = document.querySelector('#chart-results')
  chartResults.innerHTML = ''
  let subject = document.querySelector('#select-subject').value
  let resRankings = await axios.get('../json/qs_2021_with_latlng.json')
  let rankings = resRankings.data[subject]
  let rankS = Number(document.querySelector('#select-rank-s').value)
  let rankE = Number(document.querySelector('#select-rank-e').value)
  let countrySelected = document.querySelector('#select-country').value
  let resCountriesInfo = await axios.get('../json/countries_info.json')
  let countryCodes = resCountriesInfo.data.country_code[0]
  let countryListWithResults = []
  for (let eachUni = rankS - 1; eachUni < rankE; eachUni++) {
    if (!countryListWithResults.includes(rankings[eachUni].Location)) {
      countryListWithResults.push(rankings[eachUni].Location)
    }
  }
  if (rankS > rankE) {
    document.querySelector('#alert-invalid-rank').style.display = 'block'
    document.querySelector('#alert-no-results').style.display = 'none'
  } else if (countrySelected && !countryListWithResults.includes(countrySelected)) {
    document.querySelector('#alert-invalid-rank').style.display = 'none'
    document.querySelector('#alert-no-results').style.display = 'flex'
    document.querySelector('#country-with-no-results').innerHTML = countrySelected
  }
  for (let eachUni = rankS - 1; eachUni < rankE; eachUni++) {
    let divRow = document.createElement('div')
    divRow.className = 'row chart-row'

    let name = rankings[eachUni].Institution
    let country = rankings[eachUni].Location
    let rank = rankings[eachUni][2021]
    let rank2020 = rankings[eachUni][2020]
    let countryCode = countryCodes[country]
    if (!countrySelected || countrySelected == country) {
      chartResults.appendChild(divRow)
    }

    let divRank = document.createElement('div')
    divRank.className = 'col-1 chart-rank'
    divRank.innerHTML = `
      <input type="checkbox" class="btn-check" name="compare" id="rank-${subject}-${rank}">
      <label class="btn btn-outline-success" for="rank-${subject}-${rank}">${rank}</label>
    `
    divRow.appendChild(divRank)

    let divUni = document.createElement('div')
    divUni.className = 'col-7 col-md-4 chart-uni'
    divUni.innerHTML = name
    divRow.appendChild(divUni)

    let divCountry = document.createElement('div')
    divCountry.className = 'col-4 col-md-2 chart-country'
    divCountry.innerHTML = `
      <img class="chart-flag" src="https://countryflagsapi.com/png/${countryCode}">
      ${country}
    `
    divRow.appendChild(divCountry)

    let divScoresSm = document.createElement('div')
    divScoresSm.className = 'col-12 d-md-none score-header-sm'
    divScoresSm.innerHTML = 'Scores'
    divRow.appendChild(divScoresSm)

    let divScores = document.createElement('div')
    divScores.className = 'col-12 col-md-5'
    let divChart = document.createElement('div')
    divChart.id = `chart-${subject}-${rank}`
    divScores.appendChild(divChart)
    divRow.appendChild(divScores)

    // let overallScore = Number(rankings[eachUni].Score)
    let academicScore = Number(rankings[eachUni].Academic)
    let employerScore = Number(rankings[eachUni].Employer)
    let citationsScore = Number(rankings[eachUni].Citations)
    let hScore = Number(rankings[eachUni].H)
    let options = {
      chart: {
        height: 200,
        type: "radialBar",
      },
      series: [academicScore, employerScore, citationsScore, hScore],
      plotOptions: {
        radialBar: {
          inverseOrder: true,
          dataLabels: {
            name: {
              show: true,
              fontFamily: "'Acme', sans-serif",
              fontSize: '32px',
              fontWeight: 400,
              offsetY: -10
            },
            value: {
              show: true,
              fontFamily: "'Acme', sans-serif",
              fontSize: '32px',
              fontWeight: 400,
              offsetY: 0,
              formatter: function (value) {
                return value
              }
            },
            total: {
              show: true,
              label: 'OVERALL',
              fontFamily: "'Acme', sans-serif",
              fontSize: '16px',
              fontWeight: 400,
              color: '#6f42c1',
              formatter: function (w) {
                values = w.config.series
                let a = values[0]
                let e = values[1]
                let c = values[2]
                let h = values[3]
                return calculateOverallScore(a, e, c, h, subject)
              }
            }
          }
        }
      },
      labels: ['ACADEMIC', 'EMPLOYER', 'CITATIONS', 'H-INDEX'],
      colors: ['#dc3545', '#ffc107', '#198754', '#0d6efd']
    }
    new ApexCharts(divChart, options).render()
  }
})