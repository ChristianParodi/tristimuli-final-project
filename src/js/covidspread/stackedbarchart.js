import { datasets, population } from "../utils.js";

function groupedBarChart() {
  let isConfirmedCases = false;
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
  const top10 = data.sort((a, b) => b.cases - a.cases).slice(0, 10); // Adjust slice if needed

  const width = 800;
  const height = 600; // Increased height for more bins
  const margin = { top: 20, right: 20, bottom: 50, left: 120 };

  const svg = d3.select("#barchart-covid-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Y scale for countries
  const yScale = d3.scaleBand()
    .domain(top10.map(d => d.country))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  const subgroups = ["cases", "deaths"];

  // X scale 
  const xMaxDeaths = d3.max(top10, d => d.deaths);
  const xMaxCases = d3.max(top10, d => d.cases);

  const xScale = d3.scaleLinear()
    .domain([0, xMaxDeaths + 200000])
    .range([margin.left, width - margin.right]);

  // subGroup scale
  const subGroupScale = d3.scaleBand()
    .domain(subgroups)
    .range([0, yScale.bandwidth()])
    .padding(0.05);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .style("color", "black")
    .selectAll("text")
    .style("fill", "black")
    .style("font-size", "14px");

  // X label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left)
    .attr("y", height - 10)
    .text("Number of confirmed cases");

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .style("color", "black")
    .selectAll("text")
    .style("fill", "black")
    .style("font-size", "14px");

  const updateChart = (isConfirmedCases) => {
    // Remove existing cases bars
    if (!isConfirmedCases)
      svg.selectAll("rect")
        .filter(d => d.key === "cases")
        .transition()
        .duration(500)
        .delay((d, i) => i * 20)
        .attr("width", 0)
        .remove();

    if (isConfirmedCases) {
      xScale.domain([0, xMaxCases + 200000]);
      // Draw grouped bars with synchronized animation
      const dataGroup = svg.selectAll("g.data-group")
        .data(top10);

      const dataGroupEnter = dataGroup.enter()
        .append("g")
        .attr("class", "data-group")
        .attr("transform", d => `translate(0, ${yScale(d.country)})`);

      dataGroupEnter.merge(dataGroup)
        .selectAll("rect")
        .data(d => subgroups.map(key => ({ key, value: d[key] })))
        .join(
          enter => enter.append("rect")
            .attr("y", d => subGroupScale(d.key))
            .attr("x", xScale(0))
            .attr("height", subGroupScale.bandwidth())
            .attr("fill", d => color(d.key))
            .attr("width", 0)
            .call(enter => enter.transition()
              .duration(500)
              .attr("width", d => xScale(d.value) - xScale(0))
            ),
          update => update.transition()
            .duration(500)
            .attr("width", d => xScale(d.value) - xScale(0)),
          exit => exit.remove()
        );

      // redraw x axis with synchronized delay
      svg.select("g")
        .transition()
        .duration(500)
        .delay(0)
        .call(d3.axisBottom(xScale).ticks(10))
        .style("color", "#ccc")
        .selectAll("text")
        .style("fill", "black")
        .style("font-size", "14px");
      // Update deaths bars without additional delay
      svg.selectAll("rect")
        .filter(d => d.key === "deaths")
        .transition()
        .duration(500)
        .attr("width", d => xScale(d.value) - xScale(0));
    } else {
      xScale.domain([0, xMaxDeaths + 200000]);
      // Draw grouped bars with synchronized animation
      const dataGroup = svg.selectAll("g.data-group")
        .data(top10);

      const dataGroupEnter = dataGroup.enter()
        .append("g")
        .attr("class", "data-group")
        .attr("transform", d => `translate(0, ${yScale(d.country)})`);

      dataGroupEnter.merge(dataGroup)
        .selectAll("rect")
        .data(d => subgroups.map(key => ({ key, value: d[key] })))
        .join(
          enter => enter.append("rect")
            .attr("y", d => subGroupScale(d.key))
            .attr("x", xScale(0))
            .attr("height", subGroupScale.bandwidth())
            .attr("fill", d => color(d.key))
            .attr("width", 0)
            .transition()
            .duration(500)
            .attr("width", d => xScale(d.key === "deaths" ? d.value : 0) - xScale(0)),
          update => update.transition()
            .duration(500)
            .attr("width", d => xScale(d.key === "deaths" ? d.value : 0) - xScale(0)),
          exit => exit.remove()
        );

      // redraw x axis with synchronized delay
      svg.select("g")
        .transition()
        .duration(500)
        .delay(0)
        .call(d3.axisBottom(xScale).ticks(10))
        .style("color", "black")
        .selectAll("text")
        .style("fill", "black")
        .style("font-size", "14px");
      // Update deaths bars without additional delay
      svg.selectAll("rect")
        .filter(d => d.key === "deaths")
        .transition()
        .duration(500)
        .attr("width", d => xScale(d.key === "deaths" ? d.value : 0) - xScale(0));
    }
  }

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(["#ff514b", "#3f3f3f"]);

  // first visualization
  svg.append("g")
    .selectAll("g")
    .data(top10)
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
    .attr("width", 0)
    .attr("fill", d => color(d.key))
    .transition()
    .duration(500)
    .delay((d, i) => i * 20)
    .attr("width", d => xScale(d.key === "deaths" ? d.value : 0) - xScale(0));

  d3.select("#barchart-covid-button").on("click", (event) => {
    const newText = isConfirmedCases ? "Confirmed cases" : "Confirmed deaths";
    d3.select(event.target).text(newText);
    isConfirmedCases = !isConfirmedCases;
    updateChart(isConfirmedCases)
  })
}

groupedBarChart();
