import { datasets, customColors } from "../utils.js";

function groupedBarChart() {
  let isConfirmedCases = false;
  const covidCases = datasets.covidData.year_max.cases.filter(d => +d.year === 2024);
  const covidDeaths = datasets.covidData.year_max.deaths.filter(d => +d.year === 2024);

  const data = covidCases.map(caseItem => {
    const deathItem = covidDeaths.find(death => death.country === caseItem.country);
    return {
      country: caseItem.country,
      cases: +caseItem.cases,
      deaths: deathItem ? +deathItem.deaths : 0
    };
  });

  // top 10 countries by infected
  const top10 = data.sort((a, b) => b.deaths - a.deaths).slice(0, 10); // Adjust slice if needed

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
  const xMaxDeaths = d3.max(top10, d => d.deaths) + 200000;
  const xMaxCases = d3.max(top10, d => d.cases) + 200000;

  const xScale = d3.scaleLinear()
    .domain([0, xMaxDeaths])
    .range([margin.left, width - margin.right]);

  // subGroup scale
  const subGroupScale = d3.scaleBand()
    .domain(subgroups)
    .range([0, yScale.bandwidth()])
    .padding(0.05);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d3.format(".2s")))
    .style("color", "white")
    .selectAll("text")
    .style("font-size", "14px");

  // X label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left)
    .attr("y", height - 10)
    .text("Number of confirmed cases")

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .style("color", "white")
    .selectAll("text")
    .style("font-size", "14px");

  const updateChart = (isConfirmedCases) => {
    // Remove existing cases bars
    if (!isConfirmedCases)
      svg.selectAll("rect")
        .filter(d => d.key === "cases")
        .transition()
        .duration(500)
        .delay((_, i) => i * 20)
        .attr("width", 0)
        .remove();

    if (isConfirmedCases) { // Cases
      xScale.domain([0, xMaxCases]);
      // Draw grouped bars with synchronized animation
      const dataGroup = svg.selectAll("g.data-group")
        .data(top10);

      const dataGroupEnter = dataGroup.enter()
        .append("g")
        .attr("class", "data-group")
        .attr("transform", d => `translate(0, ${yScale(d.country)})`);

      dataGroupEnter.merge(dataGroup)
        .selectAll("rect")
        .data(d => subgroups.map(key => ({ country: d.country, key, value: d[key] })))
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
        ).on("mouseover", function (_, d) {
          const textUnit = d.key.charAt(0).toUpperCase() + d.key.slice(1)
          tooltip
            .style("visibility", "visible")
            .html(`
            <strong>${d.country}</strong><br/>
            ${textUnit}: ${Math.round(d.value).toLocaleString()}
          `)
            .style("opacity", 0)
            .transition()
            .duration(300)
            .style("opacity", 1)
        })
        .on("mousemove", function (event, d) {
          const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
          const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;

          const offset = d.key === "cases" ? -25 : 0;
          tooltip
            .style('left', `${svgLeft + xScale(d.value) + 10}px`)
            .style('top', `${svgTop + yScale(d.country) + offset}px`)
        })
        .on("mouseout", function () {
          tooltip
            .style("visibility", "hidden")
            .style("opacity", 1)
            .transition()
            .duration(300)
            .style("opacity", 0)
        });

      // redraw x axis with synchronized delay
      svg.select("g")
        .transition()
        .duration(500)
        .delay(0)
        .call(d3.axisBottom(xScale)
          .ticks(10)
          .tickFormat(d3.format(".2s")))
        .selectAll("text")
        .style("font-size", "14px");
      // Update deaths bars without additional delay
      svg.selectAll("rect")
        .filter(d => d.key === "deaths")
        .transition()
        .duration(500)
        .attr("width", d => xScale(d.value) - xScale(0));

      // cases label
      const casesLabels = svg.selectAll(".label-text-cases")
        .data(isConfirmedCases ? [top10[0]] : [], d => d.country);

      casesLabels.enter()
        .append("text")
        .attr("class", "label-text-cases")
        .style("font-size", "18px")
        .attr("text-anchor", "start")
        .style("fill", customColors['red'])
        // Start at the beginning of the bin
        .attr("x", xScale(0))
        .attr("y", d => yScale(d.country) + subGroupScale("cases") + subGroupScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .merge(casesLabels)
        .transition()
        .duration(500)
        // Update x to follow the end of its bin as its width expands
        .attr("x", d => xScale(d.cases))
        .attr("y", d => yScale(d.country) + subGroupScale("cases") + subGroupScale.bandwidth() / 2)
        .style("opacity", isConfirmedCases ? 1 : 0)
        .style("font-size", "18px")
        .text("cases");

      casesLabels.exit()
        .transition()
        .duration(500)
        .remove();
    } else { // we are on deaths
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
        .data(d => subgroups.map(key => ({ country: d.country, key, value: d[key] })))
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
        ).on("mouseover", function (_, d) {
          tooltip
            .style("visibility", "visible")
            .html(`
            <strong>${d.country}</strong><br/>
            Deaths: ${Math.round(d.value).toLocaleString()}
            `)
            .style("opacity", 0)
            .transition()
            .duration(300)
            .style("opacity", 1)
        })
        .on("mousemove", function (event, d) {
          const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
          const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;

          tooltip
            .style('left', `${svgLeft + xScale(d.value) + 10}px`)
            .style('top', `${svgTop + yScale(d.country)}px`)
        })
        .on("mouseout", function () {
          tooltip
            .style("visibility", "hidden")
            .style("opacity", 1)
            .transition()
            .duration(300)
            .style("opacity", 0)
        });

      // redraw x axis with synchronized delay
      svg.select("g")
        .transition()
        .duration(500)
        .delay(0)
        .call(d3.axisBottom(xScale)
          .ticks(10)
          .tickFormat(d3.format(".2s")))
        .style("color", "white")
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "14px");
      // Update deaths bars without additional delay
      svg.selectAll("rect")
        .filter(d => d.key === "deaths")
        .transition()
        .duration(500)
        .attr("width", d => xScale(d.key === "deaths" ? d.value : 0) - xScale(0));

      // deaths label
      const deathsLabels = svg.selectAll(".label-text-deaths")
        .data([top10[0]], d => d.country);

      const deathsLabelsUpdate = deathsLabels.enter()
        .append("text")
        .attr("class", "label-text-deaths")
        .attr("fill", "white")
        .style("font-size", "18px")
        // Start from the left edge so it can transition with the bin’s width
        .attr("x", xScale(0))
        .attr("y", d => yScale(d.country) + subGroupScale("deaths") + subGroupScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .merge(deathsLabels);

      deathsLabelsUpdate
        .transition()
        .duration(500)
        .style("opacity", 1)
        // Update x to follow the end of its bin as its width expands or shrinks
        .attr("x", d => xScale(d.deaths))
        .attr("y", d => yScale(d.country) + subGroupScale("deaths") + subGroupScale.bandwidth() / 2)
        .text("deaths");

      deathsLabels.exit()
        .remove();
    }
    // update deaths label
    d3.selectAll('.label-text-deaths')
      .transition()
      .duration(500)
      .attr('x', d => xScale(d.deaths) + 10);

    // update cases label
    d3.selectAll('.label-text-cases')
      .transition()
      .duration(500)
      .attr('x', d => xScale(d.cases) + 10);
  }

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(["#E94F37", "#c5c5c5"]);

  updateChart(false)

  d3.select("#barchart-covid-button").on("click", (event) => {
    const newText = isConfirmedCases ? "Confirmed cases" : "Confirmed deaths";
    d3.select(event.target).text(newText);
    isConfirmedCases = !isConfirmedCases;
    console.log(isConfirmedCases)
    updateChart(isConfirmedCases)
  })
}

const tooltip = d3.select("#section1")
  .append("div")
  .attr("class", "tooltip-stacked-barchart")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("color", "black");

groupedBarChart();
