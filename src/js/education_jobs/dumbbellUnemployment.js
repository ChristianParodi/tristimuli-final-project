import { covidDates, datasets, customColors, unemploymentQuantiles } from '../utils.js'

function dumbbellUnemployment() {

  const unenmploymentData = datasets.unemploymentData;

  const MAX_UNEMPLOYMENT_COUNTRY = "European Union";
  const years = d3.range(2016, 2025);
  const months = d3.range(1, 13);

  let selectedCountry = "Italy";
  let selectedUnit = "Thousand persons";
  let selectedAge = "Total";
  let sexIsTotal = false;

  const selector = d3.select("#country-selector-dumbbell-unemployments");
  const allCountries = Array.from(new Set(unenmploymentData.map(d => d.country))).sort();

  selector.selectAll("option")
    .data(allCountries)
    .enter()
    .append("option")
    .text(d => d)
    .property("selected", d => d === selectedCountry);

  const processedData = unenmploymentData.flatMap(d =>
    years.map(year => {
      const monthlyValues = months.map(month => +d[`${year}-${month.toString().padStart(2, '0')}`]);
      const meanValue = d3.mean(monthlyValues);
      return {
        country: d.country,
        sex: d.sex,
        age: d.age,
        unit: d.unit,
        year: year,
        value: selectedUnit === "Thousand persons" ? meanValue * 1000 : meanValue
      };
    })
  );

  const margin = { top: 25, right: 100, bottom: 40, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3.select("#dumbbell-unemployments")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.2);

  const getMaxValue = (country) => {
    const currentCountry = unemploymentQuantiles.find(d => d.country === country);
    switch (currentCountry.unemployment_category) {
      case 'Extremely Low':
        return 58000;
      case 'Very Low':
        return 130400;
      case 'Low':
        return 218400;
      case 'Medium Low':
        return 266800;
      case 'Medium':
        return 301000;
      case 'Medium High':
        return 565000;
      case 'High':
        return 1064800;
      case 'Very High':
        return 1828800;
      default:
        return currentCountry.unemployment;
    }
  };

  const yScale = d3.scaleLinear()
    .domain([0, getMaxValue(selectedCountry)])
    .range([height, 0]);

  g.append("g")
    .attr("class", "xaxis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickFormat(d3.format("d"))
      .tickValues(years))
    .selectAll("text")
    .style("font-size", "14px")

  g.append("g")
    .attr("class", "yaxis")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "14px")

  // Draw vertical lines for COVID start and end dates
  const covidStartX = xScale(covidDates.start.getFullYear()) + xScale.bandwidth() / 2;
  const covidEndX = xScale(covidDates.end.getFullYear()) + xScale.bandwidth() / 2;

  // Y label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Unemployment [#people]");

  drawCovidLines(g, covidStartX, height, covidEndX);
  function updateChart(country) {
    easeOutLinesUnemploy(g);
    // covid lines
    // remove total
    g.selectAll('path')
      .filter(function () {
        return d3.select(this).attr('stroke') === customColors['green'];
      })
      .transition()
      .duration(200)
      .remove()

    const filteredData = processedData.filter(d => d.country === country && d.unit === selectedUnit && d.age === selectedAge);
    const maleData = filteredData.filter(d => d.sex === "Males");
    const femaleData = filteredData.filter(d => d.sex === "Females");
    const totalData = filteredData.filter(d => d.sex === "Total")

    yScale.domain([0, getMaxValue(country)]);

    g.select(".yaxis")
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")))
      .selectAll("text")
      .style("font-size", "14px")

    // vertical lines
    femaleData.forEach((female, i) => {
      const male = maleData[i];
      drawLinesUnemploy(g, male, female, xScale, yScale);
    });

    const maleDots = g.selectAll(".dot.male")
      .data(maleData);

    maleDots.enter().insert("circle", ":first-child")
      .attr("class", "dot male")
      .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr("r", 6)
      .attr("fill", customColors['blue'])
      .attr("opacity", d => d.value === 0 ? 0 : 1)
      .raise()
      .merge(maleDots)
      .on("mouseover", function (_, d) {
        tooltip
          .style("visibility", "visible")
          .html(`<span style='color: steelblue;'>${Math.round(d.value).toLocaleString()}</span>`)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .on("mousemove", function (_, d) {
        const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
        const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;

        tooltip
          .style('left', `${svgLeft + margin.left + xScale(d.year) - 10}px`)
          .style('top', `${svgTop + margin.top + yScale(d.value) - 50}px`)
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
      .attr("cy", d => yScale(d.value))
      .attr("opacity", d => d.value === 0 ? 0 : 1);

    const femaleDots = g.selectAll(".dot.female")
      .data(femaleData);

    femaleDots.enter().append("circle")
      .attr("class", "dot female")
      .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr("r", 6)
      .attr("fill", customColors['pink'])
      .attr("opacity", d => d.value === 0 ? 0 : 1)
      .raise()
      .merge(femaleDots)
      .on("mouseover", function (_, d) {
        tooltip
          .style("visibility", "visible")
          .style("opacity", 0)
          .html(`<span style='color: #FF69B4;'>${Math.round(d.value).toLocaleString()}</span>`)
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .on("mousemove", function (_, d) {
        const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
        const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;
        tooltip
          .style('left', `${svgLeft + margin.left + xScale(d.year) - 10}px`)
          .style('top', `${svgTop + margin.top + yScale(d.value) + 20}px`)
      })
      .on("mouseout", function () {
        tooltip
          .style("visibility", "hidden")
          .transition()
          .duration(300)
          .style("opacity", 1)
      })
      .transition()
      .delay((d, i) => i * 100)
      .duration(500)
      .ease(d3.easeCubicInOut)
      .attr("cy", d => yScale(d.value))
      .attr("opacity", d => d.value === 0 ? 0 : 1);

    // Connect totalData points under the dots
    const totalLine = d3.line()
      .defined(d => d.value !== 0)
      .x(d => xScale(d.year) + xScale.bandwidth() / 2)
      .y(d => yScale(d.value));

    g.insert("path", ":first-child")
      .attr("class", "unemployment-total-line")
      .datum(totalData)
      .attr("fill", "none")
      .attr("stroke", customColors["green"])
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
    // total dots
    const totalDots = g.selectAll(".dot.total").data(totalData);

    totalDots.enter()
      .append("circle")
      .attr("class", "dot total")
      .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr("r", 6)
      .attr("fill", customColors["green"])
      .attr("opacity", d => d.value === 0 ? 0 : 1)
      .raise()
      .merge(totalDots)
      .on("mouseover", function (_, d) {
        tooltip
          .style("visibility", "visible")
          .html(`<span style='color: ${customColors['green']};'>${Math.round(d.value).toLocaleString()}</span>`)
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
          .style('top', `${svgTop - margin.top + yScale(d.value)}px`)
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
      .attr("cy", d => yScale(d.value))
      .attr("opacity", d => d.value === 0 ? 0 : 1);
  }

  updateChart(selectedCountry);

  selector.on("change", function () {
    selectedCountry = this.value;
    updateChart(this.value);
  });
}

function drawCovidLines(g, covidStartX, height, covidEndX) {
  g.append("line")
    .attr("x1", covidStartX)
    .attr("x2", covidStartX)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4");

  // label
  g.append("text")
    .attr("x", covidStartX)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("COVID Starts");

  g.append("line")
    .attr("x1", covidEndX)
    .attr("x2", covidEndX)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4");

  // label
  g.append("text")
    .attr("x", covidEndX)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("COVID Ends");
}

function easeOutLinesUnemploy(g) {
  g.selectAll("line.male-female-line, path.enrollmenmts-total-line")
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

function drawLinesUnemploy(g, male, female, xScale, yScale) {
  const middleY = (yScale(male.value) + yScale(female.value)) / 2;

  g.insert("line", ":first-child")
    .attr("class", "male-female-line")
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
    .attr("y1", yScale(male.value))
    .attr("y2", yScale(female.value))
    .attr("opacity", 1);
}

const tooltip = d3.select("#dumbbell-unemployments")
  .append("div")
  .attr("class", "tooltip-dumbbell-unemployments")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px")
  .style("border-radius", "4px")
  .style("color", "black");

dumbbellUnemployment();
