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
    .scale(650)
    .translate([width / 2, 1100]);
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
  const maxDate = d3.max(processedData.cases, d => new Date(2022, 12, 0));

  // Set date labels for slider
  const dateRange = maxDate.getTime() - minDate.getTime();
  const dateStep = dateRange / 4;
  const dateTicks = Array.from({ length: 6 }, (_, i) => new Date(minDate.getTime() + (dateStep * i)));
  const dateTickLabels = dateTicks.map(date =>
    `${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}/${date.getFullYear()}`
  );

  d3.select("#min-year-text-2").text(dateTickLabels[0]);
  d3.select("#year-1-text-2").text(dateTickLabels[1]);
  d3.select("#year-2-text-2").text(dateTickLabels[2]);
  d3.select("#year-3-text-2").text(dateTickLabels[3]);
  d3.select("#max-year-text-2").text(dateTickLabels[4]);

  // Definiamo la scala dei colori per la spesa sanitaria
  const healthValues = expendituresData.map(d => d.health);
  const minHealth = d3.min(healthValues);
  const maxHealth = d3.max(healthValues);


  // Estendiamo il dominio per includere 4 intervalli extra
  // const extendedDomain = [...healthValues, 67952, 80000, 100000, 120000];  // Aggiungiamo i valori superiori, in base ai tuoi requisiti
  // console.log(extendedDomain);

// Creiamo una nuova scala di colori che va dal verde scuro al nero per gli intervalli extra  
  // const colorScale = d3.scaleQuantile()
  //   .domain(extendedDomain)  // Usa il dominio esteso
  //   .range([
  //     "#E3FCE8", "#C1EFC3", "#9FE29E", "#7DD579", "#5BC854", "#3BAA3A", "#1B8F20", "#007B44",
  //     "#006633", "#004D26", "#00321D", "#00170F", "#000000"  // Colori dal verde scuro al nero per gli intervalli più alti
  //   ]);

  // Otteniamo i quantili dalla scala estesa
  // const quantiles = colorScale.quantiles();

  // // Aggiungiamo i nuovi intervalli alla legenda
  // const legendRanges = [
  //   { label: "Not Available", color: "white" },
  //   ...quantiles.map((d, i, arr) => ({
  //     label: `${i === 0 ? d3.min(healthValues).toFixed(0) : arr[i - 1].toFixed(0)} - ${d.toFixed(0)}`,
  //     color: colorScale(d)
  //   })),
  //   { label: `>131696`, color: colorScale(quantiles[quantiles.length - 1]) } // Impostiamo l'ultima label come ">36144"
  // ];

  // const colorScale = d3.scaleQuantize()
  //   .domain([minHealth, maxHealth])
  //   .range(d3.schemeGreens[7]);

  // const thresholds = [...colorScale.thresholds(), maxHealth];
  // console.log(thresholds);
  // const legendRanges = [
  //   { label: "Not Available", color: "white" },
  //   ...thresholds.map((d, i, arr) => {
  //     console.log(d);
  //     return {
  //       label: `${i === 0 ? minHealth.toFixed(0) : arr[i - 1].toFixed(0)} - ${d.toFixed(0)}`,
  //       color: colorScale(d)
  //     };
  //   })
  // ];

  function formatNumber(number) {
    if (number >= 1000) {
      return `${(number / 1000).toFixed(2)} Bil €`;
    } else {
      return `${number} Mil €`;
    }
  }

  const quantileStep = 0.15;
  const quantiles = d3.scaleQuantile()
    .domain(healthValues.sort((a, b) => a - b)) // Ensure healthValues are sorted
    .range(d3.range(0, 1, quantileStep))
    .quantiles();


  const colorScale = d3.scaleThreshold()
    .domain([...quantiles, maxHealth])
    .range(d3.schemeGreens[(quantiles.length + 1) % 10]);


  const legendRanges = [
    { label: "Not Available", values: "Not Available", color: "lightgray" },
    ...quantiles.map((d, i) => {
      return {
        label: i === 0
          ? `< ${((i + 1) * quantileStep * 100).toFixed(0)}th`
          : `${((i) * quantileStep * 100).toFixed(0)}th - ${((i + 1) * quantileStep * 100).toFixed(0)}th`,
        values: i === 0
          ? `< ${formatNumber(d)}`
          : `${formatNumber(quantiles[i - 1])} - ${formatNumber(d)}`,
        color: i === 0 ? colorScale.range()[0] : colorScale.range()[i]
      };
    }),
    { label: `> ${((quantiles.length) * quantileStep * 100).toFixed(0)}th`, values: `> ${formatNumber(quantiles[quantiles.length - 1])}`, color: colorScale(maxHealth) }
  ];

  legendRanges.reverse();

  // Creiamo il gruppo della legenda
  const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${width - 900}, ${height - 400})`);  // Aggiustato il margine a seconda della posizione

  // Aggiungiamo il titolo della legenda
  legend.append("text")
    .attr("id", "legend-title")
    .attr("x", 0)
    .attr("y", -32)
    .attr("text-anchor", "start")
    .text("Health Spending (percentiles)")
    .style("font-size", "16px")
    .style("font-weight", "bold");
    


  legend.append("text")
  .attr("x", 0)
  .attr("y", -15)  // Posiziona il sottotitolo subito sotto il titolo
  .attr("text-anchor", "start")
  .text("(Mil/Bil)")  // Il testo del sottotitolo
  .style("font-size", "14px")  // Imposta una dimensione del font più piccola per il sottotitolo
  .style("font-weight", "normal"); 

  // Aggiungiamo il pulsante per cambiare la visualizzazione della legenda
  const legendButton = legend.append("g")
    .attr("transform", "translate(0, 210)");

  legendButton.append("rect")
    .attr("width", 150)
    .attr("height", 30)
    .attr("fill", "#ccc")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .attr("rx", 5)
    .attr("ry", 5)
    .style("cursor", "pointer")
    .on("click", () => {
      isPercentile = !isPercentile;
      updateLegend();
    });

  legendButton.append("text")
    .attr("x", 75)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Switch to Euros")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("pointer-events", "none")
    .style("fill", "#333");

  let isPercentile = true;

  function updateLegend() {
    legend.selectAll("rect.legend-box").remove();
    legend.selectAll("text.legend-label").remove();

    legend.selectAll("rect.legend-box")
      .data(legendRanges)
      .enter()
      .append("rect")
      .attr("class", "legend-box")
      .attr("x", 0)
      .attr("y", (d, i) => i * 25)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => d.color)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5);

    legend.selectAll("text.legend-label")
      .data(legendRanges)
      .enter()
      .append("text")
      .attr("class", "legend-label")
      .attr("x", 30)
      .attr("y", (d, i) => i * 25 + 15)
      .text(d => isPercentile ? d.label : d.values)
      .style("font-size", "14px")
      .attr("fill", "#333");

    legendButton.select("text")
      .text(isPercentile ? "Switch to Euros" : "Switch to Percentiles");

    legend.select("#legend-title")
      .text(isPercentile ? "Health Spending (Percentiles)" : "Health Spending (Euros)");
  }

  updateLegend();

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



  let currentYear = minDate.getFullYear();
  let currentMonth = minDate.getMonth() + 1;

  yearSlider
    .attr("min", minDate.getTime())
    .attr("max", maxDate.getTime())
    .attr("value", minDate.getTime())
    .property("value", minDate.getTime());


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


    const healthByCountry = new Map(
      datasets.expendituresData
        .filter(d => +d.year === currentYear) // Converte `d.year` in numero
        .map(d => [d.country, d.health])
    );



    const maxValue = d3.max(selectedData, d => d[selectedMetric]);
    const radiusScale = d3.scaleSqrt().domain([0, maxValue]).range([8, 35]);


    bubbleLayer.selectAll("circle")
      .data(filteredData, d => d.country)
      .join("circle")
      .attr("cx", d => {
        const country1 = europeGeoJson.features.find(c => c.properties.name === d.country);
        let x = projection(d3.geoCentroid(country1))[0];

        if (isNaN(x)) console.log(d.country)
        return d.country === "France" ? x + 100 : x;
      })
      .attr("cy", d => {
        const country2 = europeGeoJson.features.find(c => c.properties.name === d.country);
        let y = projection(d3.geoCentroid(country2))[1]
        return d.country === "France" ? y - 50 : y;
      })
      .attr("r", d => radiusScale(d[selectedMetric]))
      .attr("fill", d => {
        return isNaN(healthByCountry.get(d.country)) ? "lightgray" : colorScale(healthByCountry.get(d.country));
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
      <div style="font-size: 14px; "> ${d.month}/${d.year} </div>
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
          ${healthByCountry.get(d.country) && !isNaN(healthByCountry.get(d.country)) ?
              formatNumber(healthByCountry.get(d.country))
              : "N/A"}          </div>
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
  const mapLabel = d3.select("#number-date")
    .style("padding", "10px")
    .style("font-size", "24px")
    .style("border", "1px solid #fff")
    .style("border-radius", "5px")
    .text(`Date: ${minDate.getMonth() + 1 < 10 ? `0${minDate.getMonth() + 1}` : minDate.getMonth() + 1}/${minDate.getFullYear()}`);


  dataSelector.addEventListener("change", updateMap);

  yearSlider.node().addEventListener("input", function () {
    const date = new Date(+this.value);
    currentYear = date.getFullYear();
    currentMonth = date.getMonth() + 1;


    if (currentYear > 2022 || (currentYear === 2022 && currentMonth > 12)) {
      currentYear = 2022;
      currentMonth = 12;
      yearSlider.property("value", new Date(2022, 11, 1).getTime());
    }
    mapLabel.text(`Date: ${currentMonth < 10 ? `0${currentMonth}` : currentMonth}/${currentYear}`);

    updateMap();
  });
}

mapBubble();



