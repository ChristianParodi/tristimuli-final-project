function StackbarChart(){
   // Dati di esempio
const data = [
    { paese: "Italia", guarite: 5000, morte: 2000, infette: 10000, maschi: 6000, femmine: 4000, under50: 7000, over50: 3000 },
    { paese: "USA", guarite: 8000, morte: 3000, infette: 20000, maschi: 12000, femmine: 8000, under50: 14000, over50: 6000 },
    // Aggiungi altri paesi qui...
  ];
  
  d3.csv("./../../../dataset/COVID/covid.csv", d => ({
    country: d.country,
    year: +d.year,
    month: +d.month,
    day: +d.day,
    cases: +d.total_cases,
    deaths: +d.total_deaths,
    vaccined: +d.people_vaccinated,
    hosp_patients: +d.hosp_patients
  })).then(covidData => {

  const width = 800;
  const height = 500;
  const margin = { top: 20, right: 20, bottom: 50, left: 100 };
  
  // SVG
  const svg = d3
    .select("#stackbarchart_container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  
  // Funzione per aggiornare il grafico
  function updateChart() {
    const groupBy = d3.select("#group").property("value");
    const metric = d3.select("#metric").property("value");
  
    // Processa i dati
    const groupedData = data.map(d => ({
      paese: d.paese,
      metric: d[metric],
      group1: groupBy === "sesso" ? d.maschi : d.under50,
      group2: groupBy === "sesso" ? d.femmine : d.over50,
    }));
  
    const top10 = groupedData
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 10);
  
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(top10, d => d.metric)])
      .range([margin.left, width - margin.right]);
  
    const yScale = d3
      .scaleBand()
      .domain(top10.map(d => d.paese))
      .range([margin.top, height - margin.bottom])
      .padding(0.1);
  
    const color = d3.scaleOrdinal(["#1f77b4", "#ff7f0e"]);
  
    const stack = d3.stack().keys(["group1", "group2"]);
    const stackedData = stack(top10.map(d => ({ group1: d.group1, group2: d.group2 })));
  
    // Rimuove elementi precedenti
    svg.selectAll("g").remove();
  
    // Aggiunge assi
    svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .style("color", "#ccc")
        .selectAll("text")
        .style("text-anchor", "end")
        .style("fill", "black");
  
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .style("color", "#ccc")
      .selectAll("text")
        .style("fill", "black");
  
    // Aggiunge barre
    const groups = svg
      .selectAll(".bar-group")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("fill", (d, i) => color(i));
  
    groups
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d[0]))
      .attr("y", (d, i) => yScale(top10[i].paese))
      .attr("width", d => xScale(d[1]) - xScale(d[0]))
      .attr("height", yScale.bandwidth());
  }
  
  // Inizializza il grafico
  updateChart();
  
  d3.selectAll("#metric, #group").on("change", updateChart);
  
  });
}
StackbarChart();