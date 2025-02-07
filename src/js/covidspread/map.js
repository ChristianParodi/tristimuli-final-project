import { datasets, europeGeoJson, customColors } from "../utils.js"

function mapMercator() {
  const width = 1000;
  const height = 800;

  const dataSelector = document.getElementById("map-selector");
  const yearSlider = d3.select("#covid-map-year-slider");

  const tooltip = d3.select("#map-covid-container")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("font-size", "16px")
    .style("opacity", 0)
    .style("color", "black");

  const projection = d3.geoMercator()
    .scale(600)
    .translate([width / 2.3, height * 1.5]);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select("#map-covid-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  const europeMap = svg.append("g");

  const getLastDayData = (data, metric) => {
    const map = new Map();
    data.forEach(d => {
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

  const processedData = {
    cases: getLastDayData(datasets.covidData.daily.cases, "cases"),
    deaths: getLastDayData(datasets.covidData.daily.deaths, "deaths"),
    vaccines: getLastDayData(datasets.covidData.daily.vaccines, "vaccines")
  };

  const minDate = d3.min(processedData.cases, d => new Date(d.year, d.month, 0));
  const maxDate = d3.max(processedData.cases, d => new Date(d.year, d.month, 0));

  // set the intermediate years and months
  const dateRange = maxDate.getTime() - minDate.getTime();
  const dateStep = dateRange / 4;

  const dateTicks = Array.from({ length: 6 }, (_, i) => new Date(minDate.getTime() + (dateStep * i)));

  const dateTickLabels = dateTicks.map(date =>
    `${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}/${date.getFullYear()}`
  );

  d3.select("#min-year-text").text(dateTickLabels[0]);
  d3.select("#year-1-text").text(dateTickLabels[1]);
  d3.select("#year-2-text").text(dateTickLabels[2]);
  d3.select("#year-3-text").text(dateTickLabels[3]);
  d3.select("#max-year-text").text(dateTickLabels[4]);

  let currentYear = minDate.getFullYear();
  let currentMonth = minDate.getMonth() + 1;

  const sliderStep = 2592000000; // 30 days in milliseconds

  yearSlider
    .attr("min", minDate.getTime())
    .attr("max", maxDate.getTime())
    .attr("value", minDate.getTime())
    .property("value", minDate.getTime())
    .attr("step", sliderStep);


  const colorMap = new Map([
    ["cases", customColors['red-gradient']],
    ["deaths", customColors['blue-gradient']],
    ["vaccines", ["#bae4b3", "#005a32"]],
  ]);

  function updateMap() {
    const selectedMetric = dataSelector.value // cases, deaths, vaccines
    const selectedData = processedData[selectedMetric]
    const filteredData = selectedData.filter(d => +d.year === currentYear && +d.month === currentMonth);

    const colorScale = d3.scaleLinear()
      .domain([0, d3.max(selectedData, d => d[selectedMetric])])
      .range(colorMap.get(selectedMetric));

    europeMap.selectAll("path")
      .data(europeGeoJson.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const currentCountry = d.properties.wb_a3;
        const countryData = filteredData.find(d => d.ISO3 === currentCountry);
        const value = countryData ? countryData[selectedMetric] : null;
        if (value === null) return "#ccc";
        if (value === 0) return "#f1f1f1";
        return colorScale(value);
      })
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        const currentCountry = d.properties.wb_a3;
        const countryData = filteredData.find(d => d.ISO3 === currentCountry);
        const value = countryData ? countryData[selectedMetric] : null;

        if (value != null)
          // gray out the other countries
          europeMap.selectAll("path")
            .transition()
            .duration(200)
            .attr("opacity", feature => feature.properties.wb_a3 === currentCountry ? 1 : 0.3);

        let tooltipText;
        if (value == null)
          tooltipText = `<strong>${d.properties.name}</strong><br>No data available`;
        else
          tooltipText = `
        <strong>${countryData.country}</strong><br>
        ${value.toLocaleString()} ${selectedMetric} to ${currentYear}/${currentMonth}
        `;

        tooltip.style("opacity", 1);
        tooltip
          .style("opacity", 1)
          .html(tooltipText)
          .style("left", `${event.pageX + 50}px`)
          .style("top", `${event.pageY}px`);
      })
      .on("mouseout", () => {
        europeMap.selectAll("path")
          .transition()
          .duration(200)
          .attr("fill", d => {
            const currentCountry = d.properties.wb_a3;
            const countryData = filteredData.find(data => data.ISO3 === currentCountry);
            const value = countryData ? countryData[selectedMetric] : null;
            if (value === null) return "#ccc";
            if (value === 0) return "#f1f1f1";
            return colorScale(value);
          });

        tooltip.style("opacity", 0);
        europeMap.selectAll("path")
          .transition()
          .duration(200)
          .attr("opacity", 1);
      })
    // Legend update
    // Remove any previously created legend
    svg.selectAll(".legend").remove();
    svg.selectAll("defs").remove();

    // Define legend dimensions
    const legendThickness = 20;
    const legendLength = 200;

    const legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, ${height - legendLength - 300})`);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")  // start at the top
      .attr("x2", "0%")
      .attr("y2", "100%"); // go to the bottom

    // Use d3.interpolate to create a color interpolator from the selected colorScale range
    // Remove any existing stops before appending new ones
    gradient.selectAll("stop").remove();

    const interpolator = d3.interpolate(colorMap.get(selectedMetric)[0], colorMap.get(selectedMetric)[1]);

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", interpolator(0));

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", interpolator(1));

    // Remove any existing legend rect before adding the new one
    legendGroup.selectAll("rect").remove();

    legendGroup.append("rect")
      .attr("width", legendThickness)
      .attr("height", legendLength)
      .style("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(selectedData, d => d[selectedMetric])])
      .range([0, legendLength]); // 0 at top, max at bottom

    const legendAxis = d3.axisRight(legendScale)
      .tickFormat(d3.format(".2s"));

    // Remove any existing axis groups before adding the new one
    legendGroup.selectAll(".axis").remove();

    legendGroup.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${legendThickness}, 0)`)
      .call(legendAxis);
  }

  updateMap();

  const mapLabel = d3.select("#map-label")
    .style("padding", "10px")
    .style("font-size", "24px")
    .style("border", "1px solid #fff")
    .style("border-radius", "5px")
    .text(`Date: ${minDate.getMonth() + 1 < 10 ? `0${minDate.getMonth() + 1}` : minDate.getMonth() + 1}/${minDate.getFullYear()}`);

  dataSelector.addEventListener("change", () => {
    const selectedColor =
      dataSelector.value === 'cases' ?
        customColors['red'] :
        dataSelector.value === 'deaths' ?
          customColors['blue'] : customColors['green']

    d3.select("#play-button-covid-map").style("background-color", selectedColor);
    d3.select("#covid-map-year-slider").style("accent-color", selectedColor);
    updateMap()
  });

  yearSlider.node().addEventListener("input", function () {
    const date = new Date(+this.value);
    currentYear = date.getFullYear();
    currentMonth = date.getMonth() + 1;
    mapLabel.text(`Date: ${currentMonth < 10 ? `0${currentMonth}` : currentMonth}/${currentYear}`);
    updateMap();
  });

  const playButton = document.getElementById('play-button-covid-map');

  let playing = false;
  let goBack = false;
  let intervalId;

  playButton.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? '⏸︎' : '⏵︎';
    if (playing) {
      intervalId = setInterval(() => {
        if (goBack) {
          yearSlider.node().value = yearSlider.node().min;
          goBack = false;
        }
        else yearSlider.node().stepUp();
        if ((yearSlider.node().value + sliderStep) >= yearSlider.node().max)
          goBack = true;

        const date = new Date(+yearSlider.node().value);
        currentYear = date.getFullYear();
        currentMonth = date.getMonth() + 1;
        mapLabel.text(`Date: ${currentMonth < 10 ? `0${currentMonth}` : currentMonth}/${currentYear}`);
        updateMap();
      }, 100);
    } else {
      clearInterval(intervalId);
    }
  });

}

mapMercator();
