function LineChart() {
    d3.csv("./../../../dataset/COVID/covid.csv", d => ({
      country: d.country,
      year: +d.year,
      month: +d.month,
      total_cases: +d.total_cases,
    })).then(covidData => {
      // Raggruppa i dati per paese
      const groupedData = d3.group(covidData, d => d.country);
  
      // Trasforma i dati in un formato più adatto
      const parsedData = Array.from(groupedData, ([country, values]) => ({
        country,
        values: values.map(d => ({
          date: new Date(d.year, d.month - 1),
          total_cases: d.total_cases,
        })),
      }));
  
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
        .domain(d3.extent(covidData, d => new Date(d.year, d.month - 1)))
        .range([0, width]);
  
      const xAxis = d3.axisBottom(x)
        .ticks(d3.timeMonth.every(3))
        .tickFormat(d3.timeFormat("%b %Y"));
  
      // Aggiungi l'asse x
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .style("color", "#ccc")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "black");
  
      // Scala delle infezioni (asse y)
      const y = d3.scaleLinear()
        .range([height, 0]);
  
      const yAxisGroup = svg.append("g")
        .attr("class", "y-axis");
  
      // Griglia orizzontale
      const horizontalGrid = svg.append("g")
        .attr("class", "grid-horizontal");
  
      // Griglia verticale
      const verticalGrid = svg.append("g")
        .attr("class", "grid-vertical");
  
      // Linea del grafico
      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.total_cases));
  
      // Funzione per aggiornare il grafico in base al paese selezionato
      function updateChart(country) {
        const countryData = parsedData.find(d => d.country === country);
  
        // Determina il dominio dell'asse Y
        const maxTotalCases = d3.max(countryData.values, d => d.total_cases);
        console.log(maxTotalCases)
        y.domain([0, d3.max(covidData, d => d.total_cases)]).nice();
        if (maxTotalCases < '500000') {
          y.domain([0, maxTotalCases]).nice();
        } 

        
  
        // Aggiorna l'asse Y
        yAxisGroup.call(d3.axisLeft(y))
          .selectAll("text")
          .style("fill", "black");
  
        // Aggiorna la griglia orizzontale
        horizontalGrid.call(
          d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        ).selectAll("line")
          .style("stroke", "#ccc")
          .style("stroke-opacity", 0.7)
          .style("shape-rendering", "crispEdges");
  
        // Aggiorna la griglia verticale
        verticalGrid.call(
          d3.axisBottom(x)
            .tickSize(-height)
            .tickFormat("")
        ).attr("transform", `translate(0, ${height})`)
          .selectAll("line")
          .style("stroke", "#ccc")
          .style("stroke-opacity", 0.7)
          .style("shape-rendering", "crispEdges");
  
        // Rimuove la linea precedente
        svg.selectAll(".line").remove();
  
        // Aggiunge la nuova linea
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
        .data(parsedData.map(d => d.country))
        .enter()
        .append("option")
        .text(d => d);
  
      // Disegna il grafico iniziale
      updateChart(parsedData[0].country);
    });
  }
  
  LineChart();
  