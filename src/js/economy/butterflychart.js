function ButterflyChart() {
  // Data for countries and tourism
  const data = [
      { country: "USA", intourism: 120, outtourism: 80, year: 2020 },
      { country: "France", intourism: 150, outtourism: 110, year: 2020 },
      { country: "Germany", intourism: 100, outtourism: 75, year: 2020 },
      { country: "Japan", intourism: 90, outtourism: 60, year: 2020 },
      { country: "UK", intourism: 130, outtourism: 90, year: 2020 },
      { country: "USA", intourism: 140, outtourism: 90, year: 2021 },
      { country: "France", intourism: 160, outtourism: 120, year: 2021 },
      { country: "Germany", intourism: 110, outtourism: 85, year: 2021 },
      { country: "Japan", intourism: 100, outtourism: 70, year: 2021 },
      { country: "UK", intourism: 135, outtourism: 95, year: 2021 },
  ];

  const margin = { top: 40, right: 20, bottom: 40, left: 200 };
  const width = 800;
  const height = 400;

  // Group data by year
  const dataByYear = d3.group(data, d => d.year);

  // Create a container for each year
  const container = d3.select("#butterflychart_container");

  dataByYear.forEach((yearData, year) => {
      const svg = container.append("div")
          .style("margin-bottom", "50px")
          .append("svg")
          .attr("width", width)
          .attr("height", height);

      // Set up scales
      const yScale = d3.scaleBand()
          .domain(yearData.map(d => d.country))
          .range([margin.top, height - margin.bottom])
          .padding(0.1);

      const xScale = d3.scaleLinear()
          .domain([0, d3.max(yearData, d => Math.max(d.intourism, d.outtourism))])
          .range([margin.left, width - margin.right]);

      // Append axes
      svg.append("g")
          .selectAll(".y-axis")
          .data(yearData)
          .enter()
          .append("text")
          .attr("class", "label")
          .attr("x", margin.left - 10)
          .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(d => d.country);

      // Left side bars (intourism)
      svg.selectAll(".bar-left")
          .data(yearData)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", margin.left)
          .attr("y", d => yScale(d.country))
          .attr("width", d => xScale(d.intourism) - margin.left)
          .attr("height", yScale.bandwidth())
          .attr("fill", "#ff8c00");

      // Right side bars (outtourism)
      svg.selectAll(".bar-right")
          .data(yearData)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => xScale(d.outtourism))
          .attr("y", d => yScale(d.country))
          .attr("width", d => xScale(d.intourism) - xScale(d.outtourism))
          .attr("height", yScale.bandwidth())
          .attr("fill", "#6a3d9a");

      // Title
      svg.append("text")
          .attr("class", "title")
          .attr("x", width / 2)
          .attr("y", margin.top / 2)
          .attr("text-anchor", "middle")
          .text(`Tourism Comparison by Country (${year})`);

      // Axis Labels
      svg.append("text")
          .attr("class", "label")
          .attr("x", width / 2)
          .attr("y", height - margin.bottom + 30)
          .attr("text-anchor", "middle")
          .text("Tourism Numbers");

      // Axis lines (optional)
      svg.append("g")
          .attr("transform", `translate(0, ${height - margin.bottom})`)
          .call(d3.axisBottom(xScale));
  });
}

ButterflyChart();
