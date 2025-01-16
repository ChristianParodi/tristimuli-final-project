// Creazione di un Line Chart con un selector per selezionare il paese
function lineChart() {
  // Creazione di dati fittizi per diversi paesi
  const data = {
    'Italy': [
      500, 600, 700, 800, 750, 720, 680, 700, 740, 760, 780, 800, 820, 830, 850, 870, 890, 920, 940, 960, 980, 1000, 1020, 1050, 1080],
    'France': [
      400, 450, 480, 500, 520, 550, 580, 600, 620, 640, 660, 680, 700, 720, 740, 760, 780, 800, 820, 840, 860, 880, 900, 920, 940],
    'Germany': [
      300, 350, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600, 620, 640, 660, 680, 700, 720, 740, 760, 780, 800, 820]
  };

  const labels = [
    'Jan 2020', 'Feb 2020', 'Mar 2020', 'Apr 2020', 'May 2020', 'Jun 2020', 'Jul 2020', 'Aug 2020', 'Sep 2020', 'Oct 2020', 'Nov 2020', 'Dec 2020',
    'Jan 2021', 'Feb 2021', 'Mar 2021', 'Apr 2021', 'May 2021', 'Jun 2021', 'Jul 2021', 'Aug 2021', 'Sep 2021', 'Oct 2021', 'Nov 2021', 'Dec 2021',
    'Jan 2022'
  ];

  // Creazione del canvas per il grafico
  const chartContainer = document.getElementById('chart-container');
  const canvas = document.createElement('canvas');
  canvas.id = 'lineChart';
  chartContainer.appendChild(canvas);

  // Creazione del selector per i paesi
  const selector = document.getElementById('country-selector');
  Object.keys(data).forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    selector.appendChild(option);
  });

  // Configurazione iniziale del grafico
  const ctx = canvas.getContext('2d');
  const chart= {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Infections',
        data: data['Italy'],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Infections'
          }
        }
      }
    }
  };

  // Aggiornamento del grafico quando si cambia paese
  selector.addEventListener('change', function() {
    const selectedCountry = selector.value;
    chart.data.datasets[0].data = data[selectedCountry];
    chart.update();
  });
};
lineChart();