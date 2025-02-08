/**
 * Includes HTML content into elements with the 'w3-include-html' attribute.
 * 
 * This function searches for all elements with the 'w3-include-html' attribute,
 * fetches the specified HTML file, and injects its content into the element.
 * If the file is not found, it displays "Page not found."
 */
export async function includeHTML() {
  const elements = document.querySelectorAll('[w3-include-html]');

  const fetchPromises = Array.from(elements).map(async (element) => {
    const file = element.getAttribute('w3-include-html');
    if (file) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          element.innerHTML = await response.text();
        } else if (response.status === 404) {
          element.innerHTML = 'Page not found.';
        }
      } catch (error) {
        console.error(`Error including HTML from ${file}:`, error);
        element.innerHTML = 'Error loading content.';
      }
      element.removeAttribute('w3-include-html');
    }
  });

  await Promise.all(fetchPromises);
}

export const customColors = {
  "red-gradient": ['#ffd9d9', '#e94f37'],
  "blue-gradient": ['#d3ebff', '#003965'],
  "red": '#E94F37',
  'blue': '#3F88C5',
  'green': '#03A059'
};

export const covidDates = {
  start: new Date(2020, 1, 1),
  end: new Date(2023, 2, 5)
};

export const omicronRelease = new Date(2021, 11, 24)

export const datasets = {
  GDPData: await loadGDP(),
  inflationData: await loadInflation(),
  unemploymentData: await loadunemploymentData(),
  educationData: await loadEducationData(),
  lockdownData: await loadLockdown(),
  mentalHealthData: await loadMentalHealth(),
  covidData: await loadCovidData(),
  expendituresData: await loadExpenditures()
}

export const europeanCountries = [
  'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
  'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Guernsey', 'Hungary', 'Iceland',
  'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands',
  'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'San Marino',
  'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom'
];

export const population = await fetch("../dataset/population.json")
  .then(response => response.json());

export const enrollemntQuantiles = await fetch("../dataset/EDUCATION/clean/enrollmentQuantiles.json")
  .then(response => response.json());

export const unemploymentQuantiles = await fetch("../dataset/UNEMPLOYMENT/clean/unemploymentQuantiles.json")
  .then(response => response.json());

export const europeGeoJson = await fetch("../dataset/europe.geo.json")
  .then(response => response.json());

export const ISOCountries = await fetch("../dataset/countries_ISO2_ISO3.json")
  .then(response => response.json());

async function loadunemploymentData() {
  return await d3.csv("../dataset/UNEMPLOYMENT/clean/estat_une_rt_m_filtered.csv");
}

async function loadEducationData() {
  return await d3.csv("../dataset/EDUCATION/clean/estat_educ_uoe_enrt02.csv");
}

async function loadLockdown() {
  return await d3.csv("../dataset/LOCKDOWN/clean/lockdonws_2022-08-25.csv");
}

async function loadGDP() {
  return await d3.csv("../../dataset/GDP/clean/estat_namq_10_gdp_filtered.csv");
}

async function loadInflation() {
  return await d3.csv("../../dataset/INFLATION/clean/inflation_finale.csv");
}

async function loadExpenditures() {
  return await d3.csv("../dataset/EXPENDITURE/clean/estat_gov_10a_exp_from_2016.csv");
}

async function loadMentalHealth() {
  // return await d3.csv("./../../../dataset/MENTAL_HEALTH/clean/perc_estat_hlth_cd_aro.csv");
  return await d3.csv("../../dataset/MENTAL_HEALTH/clean/melted_estat_hlth_cd_aro_ISO2.csv");
}

async function loadCovidData() {
  return {
    year_max: {
      cases: await d3.csv("../../dataset/COVID/covid_temp/clean/covid_cases_max_year.csv"),
      deaths: await d3.csv("../../dataset/COVID/covid_temp/clean/covid_deaths_max_year.csv"),
      vaccines: await d3.csv("../../dataset/COVID/covid_temp/clean/covid_vaccines_max_year.csv"),
    },
    daily: {
      cases: await d3.csv("../../dataset/COVID/covid_temp/clean/covid_cases_filled.csv"),
      deaths: await d3.csv("../../dataset/COVID/covid_temp/clean/covid_deaths_filled.csv"),
      vaccines: await d3.csv("../../dataset/COVID/covid_temp/clean/covid_vaccines_filled.csv"),
    },
    year_new: {
      cases: await d3.csv("../../dataset/COVID/covid_temp/clean/covid_new_cases_year.csv"),
    }
  }
}