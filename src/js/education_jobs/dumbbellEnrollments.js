import { covidDates, datasets, enrollemntQuantiles } from '../utils.js';

// Renamed for clarity
function dumbbellEnrollments() {
  const educationData = datasets.educationData;
  const years = d3.range(2016, 2023);
  let selectedCountry = "Italy";
  let selectedLevel = "Tertiary education (levels 5-8)";
  let selectedAge = "Total";

  const selector = d3.select("#country-selector-dumbbell-enrollments");
  const allCountries = Array.from(new Set(educationData.map(d => d.country))).sort();

  selector.selectAll("option")
    .data(allCountries)
    .enter()
    .append("option")
    .text(d => d)
    .property("selected", d => d === selectedCountry);

  const processedData = educationData.flatMap(d =>
    years.map(year => ({
      country: d.country,
      sex: d.sex,
      age: d.age,
      year: year,
      level: d.level,
      enrollments: +d[year]
    }))
  );

  const margin = { top: 25, right: 20, bottom: 40, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3.select("#dumbbell-enrollments")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.2);

  const getMaxEnrollments = (country) => {
    const currentCountry = enrollemntQuantiles.find(d => d.country === country);
    switch (currentCountry.enrollment_category) {
      case 'Extremely Low':
        return 20000;
      case 'Very Low':
        return 50000;
      case 'Low':
        return 100000;
      case 'Medium Low':
        return 300000;
      case 'Medium':
        return 500000;
      case 'Medium High':
        return 1000000;
      case 'High':
        return 3000000;
      case 'Very High':
        return 8000000;
      default:
        return currentCountry.enrollments;
    }
  };

  const covidStartX = xScale(covidDates.start.getFullYear()) + xScale.bandwidth() / 2;
  // We don't really use covidEndX since 2023 data is missing
  // const covidEndX = xScale(covidDates.end.getFullYear()) + xScale.bandwidth() / 2;

  const yScale = d3.scaleLinear()
    .domain([0, getMaxEnrollments(selectedCountry)])
    .range([height, 0]);

  g.append("g")
    .attr("class", "xaxis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).tickValues(years))
    .selectAll("text")
    .style("font-size", "14px")
    .style("fill", "black");

  g.append("g")
    .attr("class", "yaxis")
    .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")))
    .selectAll("text")
    .style("font-size", "14px")
    .style("fill", "black");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("fill", "black")
    .style("font-size", "18px")
    .text("Tertiary education enrollments");

  function updateChart(country) {
    easeOutLines(g);
    // remove total
    g.selectAll('path')
      .filter(function () {
        return d3.select(this).attr('stroke') === 'green';
      })
      .transition()
      .duration(200)
      .remove()

    // Mark covid start
    g.append("line")
      .attr("x1", covidStartX)
      .attr("x2", covidStartX)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4");

    g.append("text")
      .attr("x", covidStartX)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .style("font-size", "12px")
      .text("COVID Starts");

    const filteredData = processedData.filter(d =>
      d.level === selectedLevel && d.country === country && d.age === selectedAge
    );
    const maleData = filteredData.filter(d => d.sex === "Males");
    const femaleData = filteredData.filter(d => d.sex === "Females");
    const totalData = filteredData.filter(d => d.sex === "Total")

    if (totalData.map(d => d.enrollments).reduce((a, b) => a + b, 0) === 0) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "red")
        .style("font-size", "16px")
        .text("No data available");
      return;
    }

    yScale.domain([0, getMaxEnrollments(country)]);
    g.select(".yaxis")
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")))
      .selectAll("text")
      .style("font-size", "14px")
      .style("fill", "black");

    svg.selectAll('.domain, .tick line').attr('stroke', 'black');

    femaleData.forEach((female, i) => {
      const male = maleData[i];
      if (male && female) drawLines(g, male, female, xScale, yScale);
    });

    const maleDots = g.selectAll(".dot.male").data(maleData);
    // male dots
    maleDots.enter()
      .append("circle")
      .attr("class", "dot male")
      .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr("r", 6)
      .attr("fill", "steelblue")
      .attr("opacity", 0)
      .raise()
      .merge(maleDots)
      .on("mouseover", function (_, d) {
        tooltip
          .style("visibility", "visible")
          .html(`<span style='color: steelblue;'>${d.enrollments.toLocaleString()}</span>`)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .on("mousemove", function (_, d) {
        const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
        const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;

        tooltip
          .style('left', `${svgLeft + margin.left + xScale(d.year)}px`)
          .style('top', `${svgTop + margin.bottom + yScale(d.enrollments)}px`)
      })
      .on("mouseout", function () {
        tooltip
          .style("visibility", "hidden")
          .style("opacity", 1)
          .transition()
          .duration(300)
          .style("opacity", 0)
      })
      .transition()
      .delay((_, i) => i * 100)
      .duration(500)
      .ease(d3.easeCubicInOut)
      .attr("cy", d => yScale(d.enrollments))
      .attr("opacity", 1);

    // female dots
    const femaleDots = g.selectAll(".dot.female").data(femaleData);
    femaleDots.enter()
      .append("circle")
      .attr("class", "dot female")
      .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr("r", 6)
      .attr("fill", "#FF69B4")
      .attr("opacity", 0)
      .raise()
      .merge(femaleDots)
      .on("mouseover", function (_, d) {
        tooltip
          .style("visibility", "visible")
          .style("opacity", 0)
          .html(`<span style='color: #FF69B4;'>${d.enrollments.toLocaleString()}</span>`)
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .on("mousemove", function (_, d) {
        const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
        const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;
        tooltip
          .style('left', `${svgLeft + margin.left + xScale(d.year)}px`)
          .style('top', `${svgTop - margin.top + yScale(d.enrollments)}px`)
      })
      .on("mouseout", function () {
        tooltip
          .style("visibility", "hidden")
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .transition()
      .delay((_, i) => i * 100)
      .duration(500)
      .ease(d3.easeCubicInOut)
      .attr("cy", d => yScale(d.enrollments))
      .attr("opacity", 1);

    // total dots
    const totalDots = g.selectAll(".dot.total").data(totalData);
    totalDots.enter()
      .append("circle")
      .attr("class", "dot total")
      .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr("r", 6)
      .attr("fill", "green")
      .attr("opacity", 0)
      .raise()
      .merge(totalDots)
      .on("mouseover", function (_, d) {
        tooltip
          .style("visibility", "visible")
          .html(`<span style='color: green;'>${d.enrollments.toLocaleString()}</span>`)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .on("mousemove", function (_, d) {
        const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
        const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;
        tooltip
          .style('left', `${svgLeft + margin.left + xScale(d.year)}px`)
          .style('top', `${svgTop - margin.top + yScale(d.enrollments)}px`)
      })
      .on("mouseout", function () {
        tooltip
          .style("visibility", "hidden")
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .transition()
      .delay((_, i) => i * 100)
      .duration(500)
      .ease(d3.easeCubicInOut)
      .attr("cy", d => yScale(d.enrollments))
      .attr("opacity", 1);

    // Connect totalData points
    const totalLine = d3.line()
      .x(d => xScale(d.year) + xScale.bandwidth() / 2)
      .y(d => yScale(d.enrollments));

    g.append("path")
      .datum(totalData)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 2)
      .attr("d", totalLine)
      .attr("stroke-dasharray", function () { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(200)
      .attr("stroke-dashoffset", 0)
      .attr("opacity", 1);
  }

  updateChart(selectedCountry);

  selector.on("change", function () {
    selectedCountry = this.value;
    updateChart(this.value);
  });
}

// Removes old lines nicely
function easeOutLines(g) {
  g.selectAll("line")
    .transition()
    .duration(200)
    .attr("x1", function () {
      const x1 = +d3.select(this).attr("x1");
      const x2 = +d3.select(this).attr("x2");
      return (x1 + x2) / 2;
    })
    .attr("x2", function () {
      const x1 = +d3.select(this).attr("x1");
      const x2 = +d3.select(this).attr("x2");
      return (x1 + x2) / 2;
    })
    .attr("y1", function () {
      const y1 = +d3.select(this).attr("y1");
      const y2 = +d3.select(this).attr("y2");
      return (y1 + y2) / 2;
    })
    .attr("y2", function () {
      const y1 = +d3.select(this).attr("y1");
      const y2 = +d3.select(this).attr("y2");
      return (y1 + y2) / 2;
    })
    .remove();
}

function drawLines(g, male, female, xScale, yScale) {
  const middleY = (yScale(male.enrollments) + yScale(female.enrollments)) / 2;
  g.insert("line", ":first-child")
    .attr("x1", xScale(male.year) + xScale.bandwidth() / 2)
    .attr("y1", middleY)
    .attr("x2", xScale(female.year) + xScale.bandwidth() / 2)
    .attr("y2", middleY)
    .attr("stroke", "gray")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0)
    .transition()
    .delay(1000)
    .duration(500)
    .ease(d3.easeCubicInOut)
    .attr("y1", yScale(male.enrollments))
    .attr("y2", yScale(female.enrollments))
    .attr("opacity", 1);
}

const tooltip = d3.select("#dumbbell-enrollments")
  .append("div")
  .attr("class", "tooltip-dumbbell-enrollments")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px")
  .style("border-radius", "4px")
  .style("color", "black");

// Call renamed function
dumbbellEnrollments();
