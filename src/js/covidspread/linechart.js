// Creazione di un Line Chart con un selector per selezionare il paese
function LineChart() {
          // Dati di esempio per i paesi
          const data = [
            { country: "Italia", values: [
              { date: "2020-01", infections: 500 },
              { date: "2020-02", infections: 700 },
              { date: "2020-03", infections: 1500 },
              // Aggiungi altri dati per ogni mese fino al 2024
            ]},
            { country: "Francia", values: [
              { date: "2020-01", infections: 300 },
              { date: "2020-02", infections: 600 },
              { date: "2020-03", infections: 1200 },
              // Aggiungi altri dati per ogni mese fino al 2024
            ]},
            // Aggiungi altri paesi
          ];
  
          // Configurazione del grafico
          const margin = { top: 20, right: 30, bottom: 50, left: 60 };
          const width = 800 - margin.left - margin.right;
          const height = 400 - margin.top - margin.bottom;
  
          const svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
  
          // Scala del tempo (asse x)
          const x = d3.scaleTime()
            .domain([new Date(2020, 0, 1), new Date(2024, 11, 31)])
            .range([0, width]);
  
          const xAxis = d3.axisBottom(x).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%b %Y"));
  
          // Scala delle infezioni (asse y)
          const y = d3.scaleLinear()
            .domain([0, d3.max(data.flatMap(d => d.values.map(v => v.infections)))])
            .nice()
            .range([height, 0]);
  
          const yAxis = d3.axisLeft(y);
  
          // Aggiungi gli assi
          svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
  
          svg.append("g")
            .call(yAxis);
  
          // Linea del grafico
          const line = d3.line()
            .x(d => x(new Date(d.date)))
            .y(d => y(d.infections));
  
          // Aggiorna il grafico in base al paese selezionato
          function updateChart(country) {
            const countryData = data.find(d => d.country === country);
  
            svg.selectAll(".line").remove();
  
            svg.append("path")
              .datum(countryData.values)
              .attr("class", "line")
              .attr("fill", "none")
              .attr("stroke", "steelblue")
              .attr("stroke-width", 2)
              .attr("d", line);
          }
  
          // Dropdown per selezionare il paese
          const selector = d3.select("#country-selector")
            .on("change", function() {
              updateChart(this.value);
            });
  
          selector.selectAll("option")
            .data(data.map(d => d.country))
            .enter()
            .append("option")
            .text(d => d);
  
          // Disegna il grafico iniziale
          updateChart(data[0].country);
}
LineChart();