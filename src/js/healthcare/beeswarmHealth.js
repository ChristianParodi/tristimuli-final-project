// Data format example:
// const data = [
//   { year: 2020, country: 'Country1', deathsPercentage: 5.2, totalCases: 1200000 },
//   { year: 2021, country: 'Country2', deathsPercentage: 2.8, totalCases: 890000 },
//   ...
// ];

const width = 1000;
const height = 500;
const margin = { top: 50, right: 50, bottom: 100, left: 50 };

const svg = d3.select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const xScale = d3.scaleLinear()
  .domain([0, 100]) // Assuming percentages range from 0 to 100
  .range([0, width]);

const radiusScale = d3.scaleSqrt()
  .domain([0, d3.max(data, d => d.totalCases)]) // Map totalCases to circle size
  .range([3, 20]); // Circle radius range

let year = d3.min(data, d => d.year);
const years = [...new Set(data.map(d => d.year))];

const simulation = d3.forceSimulation()
  .force("x", d3.forceX(d => xScale(d.deathsPercentage)).strength(1))
  .force("y", d3.forceY(height / 2).strength(0.05))
  .force("collide", d3.forceCollide(d => radiusScale(d.totalCases) + 1))
  .stop();

function updateChart(year) {
  const filteredData = data.filter(d => d.year === year);

  simulation.nodes(filteredData);
  for (let i = 0; i < 300; i++) simulation.tick();

  const circles = svg.selectAll("circle").data(filteredData, d => d.country);

  circles.enter()
    .append("circle")
    .merge(circles)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => radiusScale(d.totalCases))
    .style("fill", "steelblue")
    .style("opacity", 0.8)
    .style("stroke", "#333");

  circles.exit().remove();
}

// Initial rendering
updateChart(year);

// Axes
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`));

svg.append("text")
  .attr("x", width / 2)
  .attr("y", height + 40)
  .style("text-anchor", "middle")
  .text("Percentage of Deaths Due to Mental Disorders");

// Slider
const slider = d3.select("body")
  .append("input")
  .attr("type", "range")
  .attr("min", d3.min(years))
  .attr("max", d3.max(years))
  .attr("step", 1)
  .attr("value", year);

slider.on("input", function () {
  year = +this.value;
  updateChart(year);
});

// Tooltips
const tooltip = d3.select("body").append("div")
  .style("position", "absolute")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "5px")
  .style("display", "none")
  .style("pointer-events", "none");

svg.selectAll("circle")
  .on("mouseover", (event, d) => {
    tooltip.style("display", "block")
      .html(`
        <strong>Country:</strong> ${d.country}<br>
        <strong>Deaths (%):</strong> ${d.deathsPercentage}<br>
        <strong>Total Cases:</strong> ${d3.format(",")(d.totalCases)}
      `);
  })
  .on("mousemove", (event) => {
    tooltip.style("top", `${event.pageY + 10}px`)
      .style("left", `${event.pageX + 10}px`);
  })
  .on("mouseout", () => tooltip.style("display", "none"));
