import { datasets, europeGeoJson } from "../utils.js"

function mapBubble() {
  const width = 900;
  const height = 700;

  const dataSelector = document.getElementById("map-selector-2");
  const yearSlider = d3.select("#year-slider-2");

  const tooltip = d3.select("#map-container-bubble")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "2px solid #ccc")
    .style("border-radius", "10px")
    .style("color", "black")
    .style("padding", "10px")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("text-align", "center")
    .style("box-shadow", "2px 2px 10px rgba(0, 0, 0, 0.2)")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("transition", "opacity 0.3s ease-in-out");

  const projection = d3.geoMercator()
    .scale(600)
    .translate([width / 2.3, height * 1.5]);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select("#map-container-bubble")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const europeMap = svg.append("g");
  const bubbleLayer = svg.append("g");


  const getLastDayData = (data, metric) => {
    const excludedCountries = new Set(["Russia", "Vatican", "Bosnia and Herzegovina", "Cyprus", "Faroe Islands"]);
    const map = new Map();
    data.forEach(d => {
      if (excludedCountries.has(d.country)) return;
      const key = `${d.ISO3}-${d.year}-${d.month}`;
      map.set(key, {
        ISO3: d.ISO3,
        country: d.country,
        year: +d.year,
        month: +d.month,
        [metric]: +d[metric]
      });
    });
    return Array.from(map.values());
  };

  // Creiamo un Set con i paesi presenti nei dati giornalieri
  const validCountries = new Set(datasets.covidData.daily.cases.map(d => d.country));
  const excludedCountries = new Set(["Russia", "Vatican", "Bosnia and Herzegovina", "Cyprus", "Faroe Islands"]);

  // Filtriamo expendituresData per includere solo i paesi presenti nei dati di getLastDayData
  const expendituresData = datasets.expendituresData
    .filter(d => validCountries.has(d.country) && !excludedCountries.has(d.country))
    .map(d => ({
      country: d.country,
      year: +d.year,
      total: +d.total,
      health: +d.health,
      percentage: +d.percentage
    }));

  const processedData = {
    cases: getLastDayData(datasets.covidData.daily.cases, "cases"),
    deaths: getLastDayData(datasets.covidData.daily.deaths, "deaths"),
    vaccines: getLastDayData(datasets.covidData.daily.vaccines, "vaccines")
  };

  const minDate = d3.min(processedData.cases, d => new Date(d.year, d.month, 0));
  const maxDate = d3.max(processedData.cases, d => new Date(d.year, d.month, 0));

  // Definiamo la scala dei colori per la spesa sanitaria
  const healthValues = expendituresData.map(d => d.health);
  const minHealth = d3.min(healthValues);
  const maxHealth = d3.max(healthValues);

  // Creiamo una scala di colori per la leggenda
  const colorScale = d3.scaleLinear()
    .domain([minHealth, maxHealth])
    .range(["#f6e7e5", "#8B0000"]);


  // Definiamo i range per la legenda in base ai dati effettivi
  const legendRanges = [
    { label: `Not Available`, color: "white" },
    { label: `${minHealth.toFixed(0)} - ${(minHealth + (maxHealth - minHealth) * 0.25).toFixed(0)}`, color: colorScale(minHealth + (maxHealth - minHealth) * 0.125) },
    { label: `${(minHealth + (maxHealth - minHealth) * 0.25).toFixed(0)} - ${(minHealth + (maxHealth - minHealth) * 0.5).toFixed(0)}`, color: colorScale(minHealth + (maxHealth - minHealth) * 0.375) },
    { label: `${(minHealth + (maxHealth - minHealth) * 0.5).toFixed(0)} - ${(minHealth + (maxHealth - minHealth) * 0.75).toFixed(0)}`, color: colorScale(minHealth + (maxHealth - minHealth) * 0.625) },
    { label: `${(minHealth + (maxHealth - minHealth) * 0.75).toFixed(0)} - ${maxHealth.toFixed(0)}`, color: colorScale(minHealth + (maxHealth - minHealth) * 0.875) }
  ];

  // Creiamo il gruppo della legenda
  const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${width - 900}, ${height - 180})`);  // Aggiustato il margine a seconda della posizione

  // Aggiungiamo il titolo della legenda
  legend.append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("text-anchor", "start")
    .text("Health Spending")
    .style("font-size", "16px")
    .style("font-weight", "bold");

  // Aggiungiamo i rettangoli colorati per la legenda
  legend.selectAll("rect")
    .data(legendRanges)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)  // Posiziona i rettangoli in verticale
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", d => d.color)
    .attr("stroke", "#000")  // Colore del bordo (nero)
    .attr("stroke-width", 0.5);  // Larghezza del bordo (1px);

  // Aggiungiamo il testo accanto ai rettangoli
  legend.selectAll("text.legend-label")
    .data(legendRanges)
    .enter()
    .append("text")
    .attr("class", "legend-label")
    .attr("x", 30)
    .attr("y", (d, i) => i * 25 + 15)  // Posiziona il testo accanto ai rettangoli
    .text(d => d.label)
    .style("font-size", "14px")
    .attr("fill", "#333");



  let currentYear = maxDate.getFullYear();
  let currentMonth = maxDate.getMonth() + 1;

  yearSlider
    .attr("min", minDate.getTime())
    .attr("max", maxDate.getTime())
    .attr("value", maxDate.getTime())
    .property("value", maxDate.getTime());

  d3.select("#min-year-text-2").text(`${minDate.getMonth() + 1}/${minDate.getFullYear()}`);
  d3.select("#max-year-text-2").text(`${maxDate.getMonth() + 1}/${maxDate.getFullYear()}`);

  function updateMap() {
    const selectedMetric = dataSelector.value; // cases, deaths, vaccines
    const selectedData = processedData[selectedMetric];
    const filteredData = selectedData.filter(d => +d.year === currentYear && +d.month === currentMonth);

    europeMap.selectAll("path")
      .data(europeGeoJson.features.filter(d => !excludedCountries.has(d.properties.name)))
      .join("path")
      .attr("d", path)
      .attr("fill", "#eee")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5);

    // Creiamo una scala di colori per la spesa sanitaria
    const healthByCountry = new Map(expendituresData.map(d => [d.country, d.health]));
    const maxHealth = d3.max(expendituresData, d => d.health);
    const colorScale = d3.scaleLinear().domain([0, maxHealth]).range(["#f6e7e5", "#8B0000"]);

    const maxValue = d3.max(selectedData, d => d[selectedMetric]);
    const radiusScale = d3.scaleSqrt().domain([0, maxValue]).range([4, 30]);



    bubbleLayer.selectAll("circle")
      .data(filteredData, d => d.country)
      .join("circle")
      .attr("cx", d => {
        const country1 = europeGeoJson.features.find(c => c.properties.name === d.country);
        let x = projection(d3.geoCentroid(country1))[0];
        return d.country === "France" ? x + 100 : x;
      })
      .attr("cy", d => {
        const country2 = europeGeoJson.features.find(c => c.properties.name === d.country);
        let y = projection(d3.geoCentroid(country2))[1]
        return d.country === "France" ? y - 50 : y;
      })
      .attr("r", d => radiusScale(d[selectedMetric]))
      .attr("fill", d => {
        const healthValue = healthByCountry.get(d.country);
        return isNaN(healthValue) ? "white" : colorScale(healthValue);
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
      <div style="font-size: 14px; "> MM/YYYY: ${d.month}/${d.year} </div>
        <div style="font-size: 18px; font-weight: bold;">${d.country}  </div>

        <hr class="border-t border-gray-300 my-1">

        <div class="mh-5 mt-1 w-full">
      <div class="flex justify-between text-center gap-10">

        <!-- Colonna Sinistra: Number of selectedMetric -->
        <div class="flex flex-col items-center">
          <div style="font-weight: bold;">Number of ${selectedMetric}</div>
          <div style="font-size: 18px; font-weight: bold; color: black;">
            ${d[selectedMetric].toLocaleString()}
          </div>
          <div style="font-size: 16px; color: gray;">
            ${((d[selectedMetric] / maxValue) * 100).toFixed(2)}%
          </div>
        </div>

        <!-- Colonna Destra: Health Spending -->
        <div class="flex flex-col items-center">
          <div style="font-weight: bold;">Health Spending</div>
          <div style="font-size: 22px; font-weight: bold; color: black;">
            ${healthByCountry.get(d.country) || "N/A"}
          </div>
        </div>

      </div>
    </div>
      `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY}px`);
        //.html(`<strong>${d.country}</strong><br>${d[selectedMetric].toLocaleString()} ${selectedMetric}<br>Health Spending: ${healthByCountry.get(d.country) || "Not Available"}`)
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  }


  updateMap();

  dataSelector.addEventListener("change", updateMap);

  yearSlider.node().addEventListener("input", function () {
    const date = new Date(+this.value);
    currentYear = date.getFullYear();
    currentMonth = date.getMonth() + 1;
    updateMap();
  });
}

mapBubble();
