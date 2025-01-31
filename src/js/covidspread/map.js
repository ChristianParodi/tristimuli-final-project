import { datasets, europeGeoJson } from "../utils.js"

function mapMercator() {
  const width = 1000;
  const height = 800;

  const dataSelector = document.getElementById("map-selector");
  const yearSlider = d3.select("#year-slider");

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("font-size", "16px");

  const projection = d3.geoMercator()
    .scale(600)
    .translate([width / 2.3, height * 1.5]);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select("#map-container")
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

  let currentYear = maxDate.getFullYear();
  let currentMonth = maxDate.getMonth() + 1;

  yearSlider
    .attr("min", minDate.getTime())
    .attr("max", maxDate.getTime())
    .attr("value", maxDate.getTime())
    .property("value", maxDate.getTime());

  d3.select("#min-year-text").text(`${minDate.getMonth() + 1}/${minDate.getFullYear()}`);
  d3.select("#max-year-text").text(`${maxDate.getMonth() + 1}/${maxDate.getFullYear()}`);

  const colorMap = new Map([
    ["cases", ["#fdd0d0", "#a50f15"]],
    ["deaths", ["#c6dbef", "#08306b"]],
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
        return value ? colorScale(value) : "#ccc";
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
            .attr("fill", otherD => otherD === d ? colorScale(value) : "#ccc");

        let tooltipText;
        if (value == null)
          tooltipText = `<strong>${d.properties.name}</strong><br>No data available`;
        else
          tooltipText = `
        <strong>${countryData.country}</strong><br>
        ${value.toLocaleString()} ${selectedMetric} to ${currentYear}/${currentMonth}
        `;

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
            return value ? colorScale(value) : "#ccc";
          });
        tooltip.style("opacity", 0);
      })
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

mapMercator();
