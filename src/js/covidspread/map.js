function mapMercator() {
  const width = 900;
  const height = 600;
  let zoomed = false;
  let clicked = false;
  let currentZoomLevel = d3.zoomIdentity.k;
  let previousZoomLevel = currentZoomLevel;

  // Select the reset button
  const resetButton = document.getElementById("reset");
  resetButton.addEventListener("click", () => {
    svg.call(zoom.transform, d3.zoomIdentity);
  });
  const dataSelector = document.getElementById("map-selector");
  const yearSlider = d3.select("#year-slider");

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
  const projection = d3.geoMercator().scale(500).translate([width / 2, height * 1.5]);
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
    .call(zoom);

  const mappa = svg.append("g");

  // Caricare i dati GeoJSON e il dataset
  Promise.all([
    d3.json("https://raw.githubusercontent.com/leakyMirror/map-of-europe/refs/heads/master/GeoJSON/europe.geojson"), // GeoJSON
    d3.csv("./../../../dataset/COVID/covid_test.csv") // Dataset con dati COVID-19
  ]).then(([world, covidData]) => {

    const minDate = d3.min(covidData, d => new Date(d.year, d.month - 1, d.day));
    const maxDate = d3.max(covidData, d => new Date(d.year, d.month - 1, d.day));

    const minYear = minDate.getFullYear();
    const minMonth = minDate.getMonth() + 1;
    const minDay = minDate.getDate();

    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth() + 1;
    const maxDay = maxDate.getDate();

    yearSlider
      .attr("min", minDate.getTime())
      .attr("max", maxDate.getTime())
      .attr("value", maxDate.getTime())
      .property("value", maxDate.getTime());

    // correct the two values of the slider text
    d3.select("#min-year-text").text(`${minDay}/${minMonth}/${minYear}`);
    d3.select("#max-year-text").text(`${maxDay}/${maxMonth}/${maxYear}`);

    let currentYear = maxYear;
    let currentMonth = maxMonth;
    let currentDay = maxDay;

    // Dati COVID-19
    const data = covidData.map(d => ({
      country: d.country,
      code: d.code,
      year: +d.year,
      month: +d.month,
      day: +d.day,
      cases: +d.total_cases,
      deaths: +d.total_deaths,
      vaccined: +d.people_vaccinated,
      hosp_patients: +d.hosp_patients
    }));

    // Colori per la scala
    const colorMap = new Map([
      ["cases", d3.schemeReds[9]],
      ["deaths", d3.schemeGreys[9]],
      ["vaccined", d3.schemeBlues[9]],
      ["hosp_patients", d3.schemeOranges[9]]
    ]);



    // Aggiornare la mappa
    function updateMap() {
      const filteredData = data.filter(d => d.year === currentYear && d.month === currentMonth && d.day === currentDay);

      const colorScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[dataSelector.value])])
        .range(colorMap.get(dataSelector.value));

      const selectedMetric = dataSelector.value;
      mappa.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          currentCountry = d.properties.ISO3;
          const countryData = filteredData.find(d => d.code === currentCountry);
          const value = countryData ? countryData[selectedMetric] : null;
          return value ? colorScale(value) : "#ccc";
        })
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .on("mousemove", (event, d) => {
          currentCountry = d.properties.ISO3;
          const countryData = filteredData.find(d => d.code === currentCountry);
          const value = countryData ? countryData[selectedMetric] : null;

          if (value == null)
            tooltipText = `<strong>${d.properties.NAME}</strong><br>No data available`
          else
            tooltipText = `<strong>${countryData.country}</strong><br>${selectedMetric == "cases" ? "Total infected" :
              selectedMetric == "deaths" ? "Total deaths" :
                selectedMetric == "vaccined" ? "People vaccinated" :
                  "Hospitalized patients"
              }: ${value}`


          tooltip.style("opacity", 1)
            .html(tooltipText)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });
    }

    updateMap();

    // Aggiungere un event listener per il selettore
    dataSelector.addEventListener("change", updateMap);

    // Aggiungere un event listener per il selettore

    yearSlider.node().addEventListener("input", function () {
      const date = new Date(+this.value);
      currentYear = date.getFullYear();
      currentMonth = date.getMonth() + 1;
      currentDay = date.getDate();
      updateMap();
    });
  });
}

mapMercator();
