/**
 * Includes HTML content into elements with the 'w3-include-html' attribute.
 * 
 * This function searches for all elements with the 'w3-include-html' attribute,
 * fetches the specified HTML file, and injects its content into the element.
 * If the file is not found, it displays "Page not found."
 */
async function includeHTML() {
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