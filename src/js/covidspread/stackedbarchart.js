import { datasets } from "../utils.js";

function groupedBarChart() {
  const covidCases = datasets.covidData.cases.filter(d => d.year == 2024);
  const covidDeaths = datasets.covidData.deaths.filter(d => d.year == 2024);

  const data = covidCases.map(caseItem => {
    const deathItem = covidDeaths.find(death => death.country === caseItem.country);
    return {
      country: caseItem.country,
      cases: caseItem.cases,
      deaths: deathItem ? deathItem.deaths : 0
    };
  });

  // top 10 countries by infected
  const top20 = data.sort((a, b) => b.cases - a.cases).slice(0, 10); // Adjust slice if needed

  const width = 800;
  const height = 800; // Increased height for more bins
  const margin = { top: 20, right: 20, bottom: 50, left: 100 };

  const svg = d3.select("#barchart-covid-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Y scale for countries
  const yScale = d3.scaleBand()
    .domain(top20.map(d => d.country))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  // Subgroups for cases vs deaths
  const subgroups = ["cases", "deaths"];

  // X scale for absolute numbers
  const xMax = d3.max(top20, d => Math.max(d.cases, d.deaths));
  const xScale = d3.scaleLinear()
    .domain([0, xMax])
    .range([margin.left, width - margin.right]);

  // Scale to split bars within each band
  const subGroupScale = d3.scaleBand()
    .domain(subgroups)
    .range([0, yScale.bandwidth()])
    .padding(0.05);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .style("color", "#ccc")
    .selectAll("text")
    .style("fill", "black");

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .style("color", "#ccc")
    .selectAll("text")
    .style("fill", "black");

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(["#ff514b", "#3f3f3f"]);

  // Draw grouped bars
  svg.append("g")
    .selectAll("g")
    .data(top20)
    .enter()
    .append("g")
    .attr("transform", d => `translate(0, ${yScale(d.country)})`)
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
