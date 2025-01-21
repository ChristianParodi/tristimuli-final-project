function LineChart() {
  d3.csv("./../../../dataset/COVID/covid_test.csv", d => ({
      country: d.country,
      year: +d.year,
      month: +d.month,
      total_cases: +d.total_cases,
  })).then(covidData => {
      const groupedData = d3.group(covidData, d => d.country);

      const parsedData = Array.from(groupedData, ([country, values]) => ({
          country,
          values: values.map(d => ({
              date: new Date(d.year, d.month - 1),
              total_cases: d.total_cases,
          })),
      }));

      const margin = { top: 20, right: 30, bottom: 50, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3.select("#chart-container")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleTime()
          .domain(d3.extent(covidData, d => new Date(d.year, d.month - 1)))
          .range([0, width]);

      const xAxis = d3.axisBottom(x)
          .ticks(d3.timeMonth.every(3))
          .tickFormat(d3.timeFormat("%b %Y"));

      svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis)
          .style("color", "#ccc")
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .style("fill", "black");

      const y = d3.scaleLinear()
          .range([height, 0]);

      const yAxisGroup = svg.append("g").attr("class", "y-axis");
      const horizontalGrid = svg.append("g").attr("class", "grid-horizontal");

      const line = d3.line()
          .x(d => x(d.date))
          .y(d => y(d.total_cases));

      const tooltip = d3.select("body")
          .append("div")
          .style("position", "absolute")
          .style("background-color", "white")
          .style("padding", "5px")
          .style("border", "1px solid #ccc")
          .style("border-radius", "5px")
          .style("pointer-events", "none")
          .style("display", "none")
          .style("font-size", "12px");

      function updateChart(country) {
          const countryData = parsedData.find(d => d.country === country);

          const maxTotalCases = d3.max(countryData.values, d => d.total_cases);
          y.domain([0, maxTotalCases]).nice();

          yAxisGroup.call(d3.axisLeft(y))
              .selectAll("text")
              .style("fill", "black");

          horizontalGrid.call(
              d3.axisLeft(y)
                  .tickSize(-width)
                  .tickFormat("")
          ).selectAll("line")
              .style("stroke", "#ccc")
              .style("stroke-opacity", 0.7)
              .style("shape-rendering", "crispEdges");

          svg.selectAll(".line").remove();
          svg.selectAll(".point").remove();

          svg.append("path")
              .datum(countryData.values)
              .attr("class", "line")
              .attr("fill", "none")
              .attr("stroke", "steelblue")
              .attr("stroke-width", 2)
              .attr("d", line);

          svg.selectAll(".point")
              .data(countryData.values)
              .enter()
              .append("circle")
              .attr("class", "point")
              .attr("cx", d => x(d.date))
              .attr("cy", d => y(d.total_cases))
              .attr("r", 4)
              .attr("fill", "steelblue")
              .on("mouseover", function (event, d) {
                  tooltip.style("display", "block")
                        .style("color","black")
                      .html(`Date: ${d.date.toLocaleDateString()}<br>Total Cases: ${d.total_cases}`);
                  d3.select(this).attr("r", 6).attr("fill", "orange");
              })
              .on("mousemove", function (event) {
                  tooltip.style("left", `${event.pageX + 10}px`)
                      .style("top", `${event.pageY - 20}px`);
              })
              .on("mouseout", function () {
                  tooltip.style("display", "none");
                  d3.select(this).attr("r", 4).attr("fill", "steelblue");
              });
      }

      const selector = d3.select("#country-selector")
          .on("change", function () {
              updateChart(this.value);
          });

      selector.selectAll("option")
          .data(parsedData.map(d => d.country))
          .enter()
          .append("option")
          .text(d => d);

      updateChart(parsedData[0].country);
  });
}

LineChart();
