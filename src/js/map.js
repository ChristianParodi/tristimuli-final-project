function mapMercator() {
    const width = 1200;
    const height = 600;
    let zoomed = false;
    let clicked = false;
    let currentZoomLevel = d3.zoomIdentity.k;
    let previousZoomLevel = currentZoomLevel;
  
    const resetButton = document.getElementById("reset");
    const svg = d3.select("#map-container-mercator")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#fdfdfd")
      .style("border", "1px solid #ccc");
  
    const g = svg.append("g");
    const legendSvg = createLegendSvg(width);
  
    const tooltip = createTooltip();
    const projection = d3.geoMercator().scale(150).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);
  
    const zoom = setupZoom(svg, g, width, height);
  
    resetButton.addEventListener("click", () => resetZoom(svg, zoom));
  
    Promise.all([
      d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
      d3.csv("./../../dataset/covid.csv")
    ]).then(([world, covidData]) => {
      const data = processCovidData(covidData);
      const colorScales = createCovidColorScales(data);
  
      setupSelectionBar(updateMap, updateLegend, data, colorScales, world, projection, path, g, tooltip);
  
      updateMap(world, data, colorScales, projection, path, g, tooltip, "deaths");
      updateLegend(colorScales.deaths);
    });
  
    function updateMap(world, data, colorScales, projection, path, g, tooltip, selectedMetric) {
      const scale = colorScales[selectedMetric];
      const metricMap = data[selectedMetric];
  
      g.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => getFillColor(d, scale, metricMap))
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .on("mousemove", (event, d) => handleMouseMove(event, d, tooltip, metricMap, selectedMetric))
        .on("mouseout", () => resetTooltip(g, tooltip))
        .on("click", (event, d) => handleCountryClick(event, d, projection, path, zoom));
  
      svg.call(zoom);
    }
  
    function updateLegend(scale) {
      renderLegend(scale, legendSvg);
    }
  
    // Additional helper functions for creating tooltip, zoom, resetting, etc.
  }
  
  function createTooltip() {
    return d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }
  
  function createLegendSvg(width) {
    const legendWidth = width + 30;
    const legendHeight = 100;
    return d3.select("#legend-container-mercator")
      .append("svg")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("background", "#fff");
  }
  
  function setupZoom(svg, g, width, height) {
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
  
    svg.call(zoom);
    return zoom;
  }
  
  function resetZoom(svg, zoom) {
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
  }
  
  function processCovidData(covidData) {
    return {
      deaths: new Map(covidData.map(d => [d.Country, +d.Deaths])),
      infected: new Map(covidData.map(d => [d.Country, +d.Infected])),
      recovered: new Map(covidData.map(d => [d.Country, +d.Recovered]))
    };
  }
  
  function createCovidColorScales(data) {
    const deathsScale = createColorScale(data.deaths);
    const infectedScale = createColorScale(data.infected);
    const recoveredScale = createColorScale(data.recovered);
  
    return { deaths: deathsScale, infected: infectedScale, recovered: recoveredScale };
  }
  
  function createColorScale(map) {
    const values = Array.from(map.values());
    const min = d3.min(values);
    const max = d3.max(values);
    return d3.scaleSequential(d3.interpolateReds).domain([min, max]);
  }
  
  function getFillColor(d, scale, metricMap) {
    const value = metricMap.get(d.properties.name);
    return value === undefined ? "#ccc" : scale(value);
  }
  
  function setupSelectionBar(updateMap, updateLegend, data, colorScales, world, projection, path, g, tooltip) {
    const selectionBar = d3.select("#selection-bar")
      .append("div")
      .attr("class", "selection-bar");
  
    ["deaths", "infected", "recovered"].forEach(metric => {
      selectionBar.append("button")
        .attr("class", "selection-button")
        .text(metric.charAt(0).toUpperCase() + metric.slice(1))
        .on("click", () => {
          updateMap(world, data, colorScales, projection, path, g, tooltip, metric);
          updateLegend(colorScales[metric]);
        });
    });
  }