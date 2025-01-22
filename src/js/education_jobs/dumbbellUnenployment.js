import { covidDates } from '../utils.js'

function dumbbellUnenployments() {

  d3.csv("../../../dataset/UNENPLOYMENT/clean/estat_une_rt_m_filtered.csv")
    .then(unenmploymentData => {
      const MAX_ENROLLMENTS_COUNTRY = "European Union";
      const years = d3.range(2016, 2025);
      const months = d3.range(1, 13);

      let selectedCountry = "Italy";
      let selectedUnit = "Thousand persons";
      let selectedAge = "Total";
      let sexIsTotal = false;

      const selector = d3.select("#country-selector-dumbbell-unenmployments");
      const allCountries = Array.from(new Set(unenmploymentData.map(d => d.country)));

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
            value: meanValue
          };
        })
      );

      const margin = { top: 20, right: 20, bottom: 40, left: 80 };
      const width = 800 - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      const svg = d3.select("#dumbbell-unenployments")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const xScale = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.2);

      const getMaxValue = () => {
        if (selectedCountry === "United States")
          return 8000;
        if (selectedCountry === "Turkey")
          return 3500;
        if (selectedCountry !== MAX_ENROLLMENTS_COUNTRY)
          return 2000;

        const maxVal = d3.max(years, year => {
          const yearData = processedData.filter(d => d.year === year && d.country === selectedCountry && d.unit === selectedUnit && d.age === selectedAge);
          if (sexIsTotal) {
            return d3.max(yearData, d => d.value);
          } else {
            const maleValues = d3.max(yearData.filter(d => d.sex === "Males"), d => d.value);
            const femaleValues = d3.max(yearData.filter(d => d.sex === "Females"), d => d.value);
            return d3.max([maleValues, femaleValues]);
          }
        });
        return maxVal;
      };

      const yScale = d3.scaleLinear()
        .domain([0, getMaxValue()])
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

      // Set axis line and tick color to black
      g.selectAll(".xaxis path, .xaxis line, .yaxis path, .yaxis line")
        .style("stroke", "black");

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
        .style("fill", "black")
        .style("font-size", "18px")
        .text("Unemployment (thousands persons)");

      function updateChart(country) {
        easeOutLinesUnenmploy(g);

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

        g.append("line")
          .attr("x1", covidEndX)
          .attr("x2", covidEndX)
          .attr("y1", 0)
          .attr("y2", height)
          .attr("stroke", "black")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4");

        // label
        g.append("text")
          .attr("x", covidEndX)
          .attr("y", -10)
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .style("font-size", "12px")
          .text("COVID Ends");

        const filteredData = processedData.filter(d => d.country === country && d.unit === selectedUnit && d.age === selectedAge);
        const maleData = filteredData.filter(d => d.sex === "Males");
        const femaleData = filteredData.filter(d => d.sex === "Females");

        yScale.domain([0, getMaxValue()]);

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
          drawLinesUnenploy(g, male, female, xScale, yScale);
        });

        const maleDots = g.selectAll(".dot.male")
          .data(maleData);

        drawMalePointsUnenploy(maleDots, xScale, yScale);

        const femaleDots = g.selectAll(".dot.female")
          .data(femaleData);

        drawFemalePointsUnenploy(femaleDots, xScale, yScale);
      }

      updateChart(selectedCountry);

      selector.on("change", function () {
        selectedCountry = this.value;
        updateChart(this.value);
      });
    });
}

function easeOutLinesUnenmploy(g) {
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

function drawLinesUnenploy(g, male, female, xScale, yScale) {
  const middleY = (yScale(male.value) + yScale(female.value)) / 2;

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
    .attr("y1", yScale(male.value))
    .attr("y2", yScale(female.value))
    .attr("opacity", 1);
}

function drawMalePointsUnenploy(maleDots, xScale, yScale) {
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
    .attr("cy", d => yScale(d.value))
    .attr("opacity", 1);
}

function drawFemalePointsUnenploy(femaleDots, xScale, yScale) {
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
    .attr("cy", d => yScale(d.value))
    .attr("opacity", 1);
}

dumbbellUnenployments();
