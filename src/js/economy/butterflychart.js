function ButterflyChart() {
    // Data for countries and tourism
    const data = [
      { country: "USA", intourism: 120, outtourism: 80 },
      { country: "France", intourism: 150, outtourism: 110 },
      { country: "Germany", intourism: 100, outtourism: 75 },
      { country: "Japan", intourism: 90, outtourism: 60 },
      { country: "UK", intourism: 130, outtourism: 90 },
      // Add more countries and their tourism data
    ];

    const margin = { top: 40, right: 20, bottom: 40, left: 200 };
    const width = 800;
    const height = 500;

    const svg = d3.select("#butterflychart_container")
    .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Set up scales
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.country))
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.intourism, d.outtourism))])
      .range([margin.left, width - margin.right]);

    // Append axes
    svg.append("g")
      .selectAll(".y-axis")
      .data(data)
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
      .data(data)
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
      .data(data)
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
      .text("Tourism Comparison by Country (Intourism vs Outtourism)");

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


}

ButterflyChart();
