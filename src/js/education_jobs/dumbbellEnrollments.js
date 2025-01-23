import { covidDates, datasets } from '../utils.js'

function dumbbellUnenployments() {

  const educationData = datasets.educationData;

  const MAX_ENROLLMENTS_COUNTRY = "Germany";
  const years = d3.range(2016, 2023);
  let selectedCountry = "Italy";
  let selectedLevel = "Tertiary education (levels 5-8)";
  let selectedAge = "Total";
  let sexIsTotal = false;

  const selector = d3.select("#country-selector-dumbbell-enrollments");
  const allCountries = Array.from(new Set(educationData.map(d => d.country)));

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

  const margin = { top: 20, right: 20, bottom: 40, left: 120 };
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

  const getMaxEnrollments = () => {
    const targetCountry = (selectedCountry === "Turkey" || selectedCountry === "European Union") ? selectedCountry : MAX_ENROLLMENTS_COUNTRY;

    const maxEnr = d3.max(years, year => {
      const yearData = processedData.filter(d => d.year === year && d.country === targetCountry && d.level === selectedLevel && d.age === selectedAge);
      if (sexIsTotal) {
        return d3.max(yearData, d => d.enrollments);
      } else {
        const maleEnrollments = d3.max(yearData.filter(d => d.sex === "Males"), d => d.enrollments);
        const femaleEnrollments = d3.max(yearData.filter(d => d.sex === "Females"), d => d.enrollments);
        return d3.max([maleEnrollments, femaleEnrollments]);
      }
    });
    return maxEnr;
  };

  const covidStartX = xScale(covidDates.start.getFullYear()) + xScale.bandwidth() / 2;
  const covidEndX = xScale(covidDates.end.getFullYear()) + xScale.bandwidth() / 2;

  const yScale = d3.scaleLinear()
    .domain([0, getMaxEnrollments()])
    .range([height, 0]);

  g.append("g")
    .attr("class", "xaxis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickFormat(d3.format("d"))
      .tickValues(years))
    .selectAll("text")
    .style("font-size", "14px")
    .style("fill", "black");

  g.append("g")
    .attr("class", "yaxis")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "14px")
    .style("fill", "black");

  // Y label
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

    // covid lines
    g.append("line")
      .attr("x1", covidStartX)
      .attr("x2", covidStartX)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4");

    // label
    g.append("text")
      .attr("x", covidStartX)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .style("font-size", "12px")
      .text("COVID Starts");

    // we do not have 2023
    // g.append("line")
    //   .attr("x1", covidEndX)
    //   .attr("x2", covidEndX)
    //   .attr("y1", 0)
    //   .attr("y2", height)
    //   .attr("stroke", "black")
    //   .attr("stroke-width", 2)
    //   .attr("stroke-dasharray", "4");

    // // label
    // g.append("text")
    //   .attr("x", covidEndX)
    //   .attr("y", -10)
    //   .attr("text-anchor", "middle")
    //   .attr("fill", "black")
    //   .style("font-size", "12px")
    //   .text("COVID Ends");

    const filteredData = processedData.filter(d => d.level === selectedLevel && d.country === country);
    const maleData = filteredData.filter(d => d.sex === "Males" && d.age === "Total");
    const femaleData = filteredData.filter(d => d.sex === "Females" && d.age === "Total");

    yScale.domain([0, getMaxEnrollments()]);

    g.select(".yaxis")
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "14px")
      .style("fill", "black");

    femaleData.forEach((female, i) => {
      const male = maleData[i];
      drawLines(g, male, female, xScale, yScale);
    });

    const maleDots = g.selectAll(".dot.male")
      .data(maleData);

    drawMalePoints(maleDots, xScale, yScale);

    const femaleDots = g.selectAll(".dot.female")
      .data(femaleData);

    drawFemalePoints(femaleDots, xScale, yScale);
  }

  updateChart(selectedCountry);

  selector.on("change", function () {
    selectedCountry = this.value;
    updateChart(this.value);
  });
}

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

function drawMalePoints(maleDots, xScale, yScale) {
  maleDots.enter().append("circle")
    .attr("class", "dot male")
    .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
    .attr("r", 6)
    .attr("fill", "steelblue")
    .attr("opacity", 0)
    .raise()
    .merge(maleDots)
    .transition()
    .delay((_, i) => i * 100)
    .duration(500)
    .ease(d3.easeCubicInOut)
    .attr("cy", d => yScale(d.enrollments))
    .attr("opacity", 1);
}

function drawFemalePoints(femaleDots, xScale, yScale) {
  femaleDots.enter().append("circle")
    .attr("class", "dot female")
    .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
    .attr("r", 6)
    .attr("fill", "pink")
    .attr("opacity", 0)
    .raise()
    .merge(femaleDots)
    .transition()
    .delay((d, i) => i * 100)
    .duration(500)
    .ease(d3.easeCubicInOut)
    .attr("cy", d => yScale(d.enrollments))
    .attr("opacity", 1);
}

dumbbellUnenployments();
