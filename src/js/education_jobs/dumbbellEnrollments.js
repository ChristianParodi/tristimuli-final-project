function dumbbellEnrollments() {
  d3.csv("../../../dataset/EDUCATION/clean/estat_educ_uoe_enrt02.csv")
    .then(data => {
      const MAX_ENROLLMENTS_COUNTRY = "Germany";
      const years = d3.range(2016, 2023);
      let selectedCountry = "Italy";
      let selectedLevel = "Tertiary education (levels 5-8)";
      let selectedAge = "Total";
      let sexIsTotal = false;

      // Country selector
      const selector = d3.select("#country-selector-dumbbell-enrollments");
      const allCountries = Array.from(new Set(data.map(d => d.country)));

      selector.selectAll("option")
        .data(allCountries)
        .enter()
        .append("option")
        .text(d => d)
        .property("selected", d => d === selectedCountry);

      // Data processing
      // transform to long format (year from columns to rows)
      const processedData = data.flatMap(d =>
        years.map(year => ({
          country: d.country,
          sex: d.sex, // males, females, total
          age: d.age, // < 15, 15 - 29, 30 - 44, 45 - 64, >= 65
          year: year,
          level: d.level,
          enrollments: +d[year]
        }))
      );

      // SVG setup
      const margin = { top: 20, right: 20, bottom: 40, left: 80 };
      const width = 800 - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      const svg = d3.select("#dumbbell-enrollments")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // X axis
      const xScale = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.2);

      // Y axis
      const getMaxEnrollments = () => {
        let targetCountry = "";

        if (selectedCountry === "Turkey" || selectedCountry === "European Union") {
          targetCountry = selectedCountry;
        } else {
          targetCountry = MAX_ENROLLMENTS_COUNTRY;
        }

        if (sexIsTotal) {
          const maxEnr = d3.max(years, year => {
            const yearData = processedData.filter(d => d.year === year && d.country === targetCountry && d.level === selectedLevel && d.age === selectedAge);
            return d3.max(yearData, d => d.enrollments);
          });
          return maxEnr
        } else {
          const maxEnr = d3.max(years, year => {
            const yearData = processedData.filter(d => d.year === year && d.country === targetCountry && d.level === selectedLevel && d.age === selectedAge);
            const maleEnrollments = d3.max(yearData.filter(d => d.sex === "Males"), d => d.enrollments);
            const femaleEnrollments = d3.max(yearData.filter(d => d.sex === "Females"), d => d.enrollments);
            return d3.max([maleEnrollments, femaleEnrollments]);
          });
          return maxEnr;
        }
      };

      const yScale = d3.scaleLinear()
        .domain([0, getMaxEnrollments(selectedCountry)])
        .range([height, 0]);

      // draw axes
      // X axis
      g.append("g")
        .attr("class", "xaxis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
          .tickFormat(d3.format("d"))
          .tickValues(years))
        .selectAll("text")
        .style("font-size", "14px");

      // Y axis
      g.append("g")
        .attr("class", "yaxis")
        .call(d3.axisLeft(yScale))

      function updateChart(country) {
        easeOutLines(g)
        // easeOutPoints(g, height, margin)

        const filteredData = processedData.filter(d => d.level === selectedLevel && d.country === country);
        const maleData = filteredData.filter(d => d.sex === "Males" && d.age === "Total");
        const femaleData = filteredData.filter(d => d.sex === "Females" && d.age === "Total");

        // Update Y scale
        yScale.domain([0, getMaxEnrollments(country)]);

        // Transition Y axis
        g.select(".yaxis")
          .transition()
          .duration(1000)
          .ease(d3.easeCubicInOut)
          .call(d3.axisLeft(yScale))
          .selectAll("text")
          .style("font-size", "14px");

        // Draw lines from the middle after a 2000ms delay
        femaleData.forEach((female, i) => {
          const male = maleData[i];
          drawLines(g, male, female, xScale, yScale)
        });

        // Draw male circles from below and transition to positions
        const maleDots = g.selectAll(".dot.male")
          .data(maleData);

        drawMalePoints(maleDots, xScale, yScale)

        // Draw female circles from below and transition to positions
        const femaleDots = g.selectAll(".dot.female")
          .data(femaleData);

        drawFemalePoints(femaleDots, xScale, yScale)
      }

      updateChart(selectedCountry)

      selector.on("change", function () {
        selectedCountry = this.value
        updateChart(this.value)
      });
    })
}

// Transition existing lines to shrink to the middle and fade out
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
    .attr("opacity", 1)
}

// Transition existing circles to move down and fade out
function easeOutPoints(g) {
  g.selectAll("circle")
    .transition()
    .delay((_, i) => i * 80)
    .duration(500)
    .remove();
}

dumbbellEnrollments();