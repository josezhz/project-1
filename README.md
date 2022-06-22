# UNISEEK - Seek Your Destination

![Logo](images/logo_with_bg.png)

Access demo site [here](https://josezhz.github.io/project-1/)

## Overview

UNISEEK is a web application that helps visualize the locations and ranking scores of the world's top 50 universities through interactive map and charts.

### Users' Goals

Users of UNISEEK such as pre-university (pre-U) graduates aim to have a better visual understanding of the world's top universities in terms of locations, ranking scores and rankings by different subject areas.

### Organization's Goals

The goal of UNISEEK is to provide pre-U graduates who are still undecided about their destination for university education with a platform explore and make a more informed decision.

---

## UI/UX

### User Stories & Acceptance Criteria

User Stories | Acceptance Criteria
--- | ---
As a pre-U graduate who wants to pursue a degree in medicine in the United States, I would like to know what are the good universities for medicine in the United States and where they are located. | A map application that is able to show locations of top universities for medicine in the United States.
As a pre-U graduate interested in studying natural sciences in university but still unsure of which universities are good for pursuing a degree in natural sciences, I would like to have a general overview of the world's top universities for natural sciences, and for each university, how it scores in terms of academic and employer reputation. | A world's top universities ranking table that allows me to specify the type of ranking by subject with charts showing each university's score by different indicators such as academic and employer repuation.

### Color

![Theme colors](images/theme_colors.png)

Green and purple are the theme colors of this website.

Green is the main color used in the map page. It represents hope and symbolizes pre-U graduates' hope for styding in a top university of their desired location and subject.

Purple is the main color useed in the chart page. It represents wisdom and symbolizes universities as the place for intellectual excellence.

### Font

_Acme_ is used for the this site as it is a simple but beautiful sans serif typeface font that is free to use.

---

## Features

- ### Map
    1. Markers showing locations of the world's top 50 universities
    2. Popups showing information of each university, including rank, university name, country, subject
    3. A bar chart in the popup showing an overall score and respective scores for academic, employer, citations and h-index.
    4. Selection of subject that the ranking is based on
    5. Filtering by rank
    6. Filtering by country
    7. Filtering by regions
    8. Search by university name

- ### Chart
    1. A ranking table displaying the world's top 50 universities, including rank, university name, country
    2. A radialbar chart showing an overall score and respective scores for academic, employer, citations and h-index.
    3. Selection of subject that the ranking is based on
    4. Filtering by rank
    5. Filtering by country
    6. *Comparison of two selected universities in synchronized charts (**PENDING**)
    7. *A line chart showing the variation of the university's rank over the 5 few years (**PENDING DUE TO LACK OF DATA**)

---

## Technologies Used

1. HTML
    - for building up the website
2. CSS
    - for styling the website
3. [Bootstrap 5.1](https://getbootstrap.com/docs/5.1/getting-started/introduction/)
    - for responsiveness
4. [Google Fonts](https://fonts.google.com/)
    - for font _Acme_
5. [Flaticon](https://www.flaticon.com/)
    - for icons and interface icons
6. [LOGO.com](https://logo.com/)
    - for designing logo
7. Javascript
    - for rendering map and charts
8. [Axios](https://www.axios.com/)
    - for fetching data from APIs and local JSON files
9. [Country Flags API](https://countryflagsapi.com/)
    - for generating country flags
10. [Google Maps Platform Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview)
    - for geographical coordinates of each university
11. [Leaflet](https://leafletjs.com/)
    - for creating map
12. [Apexcharts](https://apexcharts.com/)
    - for creating charts
13. [Gitpod](https://www.gitpod.io/)
    - for coding
14. [GitHub](https://github.com/)
    - for repository and deployment

---

## Test Cases

---

## Deployment

The website is hosted using [GitHub Pages](https://pages.github.com/).

For detailed deployment steps, refer [here](https://pages.github.com/).

## Credits & Acknowledgement

### Data

- [QS World University Rankings 2021](https://www.topuniversities.com/university-rankings/world-university-rankings/2021)
    - for rankings data
- [Country Flags API](https://countryflagsapi.com/)
    - for country flags
- [Google Maps Platform Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview)
    - for geographical coordinates data

### Icons & Logos

- [Flaticon](https://www.flaticon.com/)
- [LOGO.com](https://logo.com/)