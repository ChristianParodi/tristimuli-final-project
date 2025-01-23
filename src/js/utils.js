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

function addLoaderListener() {
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    console.log(loader)
    if (loader) {
      loader.style.display = 'none';
    }
  });
}

export const covidDates = {
  start: new Date(2020, 1, 1),
  end: new Date(2023, 2, 5)
};

export const datasets = {
  unenploymentData: await loadUnenploymentData(),
  educationData: await loadEducationData(),
  lockdownData: await loadLockdown()
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

export const population = await fetch("../../dataset/population.json")
  .then(response => response.json());

async function loadUnenploymentData() {
  return await d3.csv("../../dataset/UNENPLOYMENT/clean/estat_une_rt_m_filtered.csv");
}

async function loadEducationData() {
  return await d3.csv("../../dataset/EDUCATION/clean/estat_educ_uoe_enrt02.csv");
}

async function loadLockdown() {
  return await d3.csv("../../dataset/LOCKDOWN/clean/lockdonws_2022-08-25.csv");
}