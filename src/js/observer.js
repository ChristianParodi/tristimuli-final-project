const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      if (!entry.target.dataset.loaded) {
        loadPlot(id);
        entry.target.dataset.loaded = true;
      }
    }
  });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});

function loadPlot(id) {
  switch (id) {
    case 'section1':
      import('./../js/covidspread/map.js').then(module => {
        module.default('#map-container');
      }).catch(err => console.error(`Error loading map.js: ${err}`));
      break;
    case 'section2':
      import('./../js/covidspread/linechart.js').then(module => {
        module.default('#chart-container');
      }).catch(err => console.error(`Error loading linechart.js: ${err}`));
      break;
    case 'section3':
      import('./../js/covidspread/stackbarchart.js').then(module => {
        module.default('#stackbarchart_container');
      }).catch(err => console.error(`Error loading stackbarchart.js: ${err}`));
      break;
    case 'section4':
      import('./../js/economy/bubblechart.js').then(module => {
        module.default('#bubblechart_container');
      }).catch(err => console.error(`Error loading bubblechart.js: ${err}`));
      break;
    case 'section5':
      import('./../js/lockdowns/bubbleEnrollments.js').then(module => {
        module.default('#bubble-enrollments-container');
      }).catch(err => console.error(`Error loading bubbleEnrollments.js: ${err}`));
      break;
    default:
      console.warn(`No loadPlot case for id: ${id}`);
  }
}