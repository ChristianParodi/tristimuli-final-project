import { datasets } from "../utils.js";

function groupedBarChart() {
  const covidCases = datasets.covidData.cases.filter(d => d.year === 2021);
  const covidDeaths = datasets.covidData.deaths.filter(d => d.year === 2021);

  const data = covidCases.map(caseItem => {
    const deathItem = covidDeaths.find(death => death.country === caseItem.country);
    return {
      country: caseItem.country,
      infected: caseItem.cases,
      deaths: deathItem ? deathItem.deaths : 0
    };
  });
  console.log(data)

  // Take top 10 by infected
  const top10 = data.sort((a, b) => b.infected - a.infected).slice(0, 10);

  const width = 800, height = 600;
  const margin = { top: 20, right: 20, bottom: 50, left: 100 };

  const svg = d3.select("#barchart-covid-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Y scale for countries
  const yScale = d3.scaleBand()
    .domain(top10.map(d => d.paese))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  // Subgroups for infected vs deaths
  const subgroups = ["infected", "deaths"];

  // X scale for absolute numbers
  const xMax = d3.max(top10, d => Math.max(d.infected, d.deaths));
  const xScale = d3.scaleLinear()
    .domain([0, xMax])
    .range([margin.left, width - margin.right]);

  // Scale to split bars within each band
  const subGroupScale = d3.scaleBand()
    .domain(subgroups)
    .range([0, yScale.bandwidth()])
    .padding(0.05);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .style("color", "#ccc")
    .selectAll("text")
    .style("fill", "black");

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .style("color", "#ccc")
    .selectAll("text")
    .style("fill", "black");

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(["steelblue", "#FF69B4"]);

  // Draw grouped bars
  svg.append("g")
    .selectAll("g")
    .data(top10)
    .enter()
    .append("g")
    .attr("transform", d => `translate(0, ${yScale(d.paese)})`)
    .selectAll("rect")
    .data(d => subgroups.map(key => ({ key, value: d[key] })))
    .enter()
    .append("rect")
    .attr("y", d => subGroupScale(d.key))
    .attr("x", xScale(0))
    .attr("height", subGroupScale.bandwidth())
    .attr("width", d => xScale(d.value) - xScale(0))
    .attr("fill", d => color(d.key));
}

groupedBarChart();
