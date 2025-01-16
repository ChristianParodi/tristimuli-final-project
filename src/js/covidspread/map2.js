function mapMercator() {
  const width = 1200;
  const height = 600;
  let zoomed = false;
  let clicked = false;
  let currentZoomLevel = d3.zoomIdentity.k;
  let previousZoomLevel = currentZoomLevel;

  // Select the reset button
  const resetButton = document.getElementById("reset");




  // Tooltip per mostrare informazioni
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Creare la proiezione e il path
  const projection = d3.geoMercator().scale(150).translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Zoom e panoramica
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      zoomed = event.transform.k > 4 || clicked;
      previousZoomLevel = currentZoomLevel;
      currentZoomLevel = event.transform.k;

      if (previousZoomLevel > currentZoomLevel)
        clicked = false;

      svg.selectAll("mappa").attr("transform", event.transform);
    });

  // Aggiungere SVG con sfondo
  const svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#fdfdfd") // Colore di sfondo visibile
    .style("border", "1px solid #ccc")
    .call(zoom);

  const mappa = svg.append("mappa");

  // Caricare i dati GeoJSON e il dataset
  Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // GeoJSON
    d3.csv("./../../dataset/covid_data.csv") // Dataset con dati COVID-19
  ]).then(([world, covidData]) => {
    // Creare una mappa per ogni dato del COVID-19
    const casesByCountry = new Map(covidData.map(d => [d.country_code, +d.cases]));
    const deathsByCountry = new Map(covidData.map(d => [d.country_code, +d.deaths]));
    const recoveredByCountry = new Map(covidData.map(d => [d.country_code, +d.recovered]));
    const dataSelector = document.getElementById("data-selector");
    // Colori per la scala
    const thresholds = [0, 1000, 10000, 50000, 100000, 500000, 1000000, 5000000];
    const colorScale = d3.scaleThreshold()
      .domain(thresholds)
      .range(d3.schemeReds[thresholds.length]);

    // Aggiornare la mappa
    function updateMap() {
      const selectedMetric = dataSelector.value;
      console.log("Dati selezionati:", selectedMetric);
      const dataMap = selectedMetric === "cases" ? casesByCountry :
        selectedMetric === "deaths" ? deathsByCountry :
        recoveredByCountry;

      mappa.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const value = dataMap.get(d.id);
          return value ? colorScale(value) : "#ccc";
        })
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .on("mousemove", (event, d) => {
          const value = dataMap.get(d.id) || "Data not available";
          tooltip.style("opacity", 1)
            .html(`<strong>${d.properties.name}</strong><br>${selectedMetric}: ${value}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });
    }
   
    updateMap();

    // Aggiungere un event listener per il selettore
    document.getElementById("data-selector").addEventListener("change", updateMap);
  });
}

mapMercator();
