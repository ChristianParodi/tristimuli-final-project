function ButterflyChart() {
  d3.csv("./../../../dataset/INFLATION/clean/inflation_finale.csv", d => ({
    country: d.country,
    year: +d.year,
    month: +d.month,
    coicop: d.coicop,
    value: +d.value
  })).then(inflation => {
    const margin = { top: 40, right: 40, bottom: 40, left: 90 };
    const width = 400;
    const height = 800;

    const container = d3.select("#butterflychart_container")
      .style("display", "flex")
      .style("flex-wrap", "wrap")
      .style("gap", "70px");

    const selectYear1 = d3.select("#selector-butt-1").property("value", 2018);
    const selectYear2 = d3.select("#selector-butt-2").property("value", 2019);
    // Inizializzazione: disabilita le opzioni corrispondenti
    let optionsYear1 = selectYear1.selectAll("option");
    let optionsYear2 = selectYear2.selectAll("option");

    optionsYear1.each(function(d) {
      const option = d3.select(this);
      if (+option.property("value") === 2019) {
        option.property("disabled", true); // Disabilita 2019 in selectYear1
      } else {
        option.property("disabled", false);
      }
    });

    optionsYear2.each(function(d) {
      const option = d3.select(this);
      if (+option.property("value") === 2018) {
        option.property("disabled", true); // Disabilita 2018 in selectYear2
      } else {
        option.property("disabled", false);
      }
    });



    const dataByYear = d3.group(inflation, d => d.year);
    const svgMap = new Map();

    function createSVG(year) {
      const svg = container
        .append("div")
        .style("margin-bottom", "30px")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .text(`Inflation Comparison by Country (${year})`);

      svg.append("g").attr("class", "y-axis");

      
      svg.append("g").attr("class", "bars");
      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .style("color", "grey");

      return svg;
    }

    function updateChart(month, metric) {
      const selectedYears = [
        +selectYear1.property("value"),
        +selectYear2.property("value")
      ];

      container.selectAll("div").remove();
      svgMap.clear();

      selectedYears.forEach(year => {
        if (!dataByYear.has(year)) return;

        const yearData = dataByYear.get(year);
        const filteredData = yearData.filter(d => d.month === month && d.coicop === metric);

        const svg = createSVG(year);
        svgMap.set(year, svg);

        if (filteredData.length === 0) {
          svg.select(".bars").selectAll("*").remove();
          svg.select(".x-axis").selectAll("*").remove();
          svg.select(".y-axis").selectAll("*").remove();

          svg.append("text")
            .attr("class", "no-data-text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Data not available");
          return;
        }

        const yScale = d3.scaleBand()
          .domain(filteredData.map(d => d.country))
          .range([margin.top, height - margin.bottom])
          .padding(0.1);

        const maxValue = d3.max(filteredData, d => Math.abs(d.value));

        const xScale = d3.scaleLinear()
          .domain([-maxValue, maxValue])
          .range([margin.left, width - margin.right]);

        svg.select(".y-axis")
          .attr("transform", `translate(${margin.left }, 0)`)
          .call(d3.axisLeft(yScale))
          .selectAll("path, line")  // Rimuovi la barra vuota
          .remove()
          .selectAll("text")
          .style("color", "black")
          .style("font-size", "13px")
          .style("text-anchor", "start");

        const bars = svg.select(".bars").selectAll("rect").data(filteredData, d => d.country);

        bars.enter()
          .append("rect")
          .merge(bars)
          .attr("x", d => d.value > 0 ? xScale(0) : xScale(d.value))
          .attr("y", d => yScale(d.country))
          .attr("width", d => Math.abs(xScale(d.value) - xScale(0)))
          .attr("height", yScale.bandwidth())
          .attr("fill", d => d.value > 0 ? "#11AD39" : "#CC2D28");

        const labels = svg.select(".bars").selectAll(".country-label").data(filteredData, d => d.country);

        labels.enter()
          .append("text")
          .merge(labels)
          .attr("class", "country-label")
          .attr("x", d => d.value > 0 ? xScale(d.value) + 5 : xScale(0) - 5)
          .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2)
          .attr("dy", ".35em")
          .attr("text-anchor", d => d.value > 0 ? "start" : "end")
          .text(d => d.value);

        labels.exit().remove();

        svg.select(".x-axis").call(d3.axisBottom(xScale));
      });
    }

    const monthSlider = d3.select("#month-slider-butt");
    const dataSelector = d3.select("#data-selector-butt");

    monthSlider.on("input", () => {
      const monthValue = monthSlider.property("value");
      d3.select("#number-month").text(monthValue.padStart(2, "0"));
      updateChart(+monthValue, dataSelector.property("value"));
    });

    dataSelector.on("change", () => {
      updateChart(+monthSlider.property("value"), dataSelector.property("value"));
    });

    selectYear1.on("change", () => {
      const year1 = +selectYear1.property("value");
      

      // Disable the corresponding option in selectYear2
      optionsYear2 = selectYear2.selectAll("option");
      optionsYear2.each(function(d) {
        const option = d3.select(this);
        if (+option.property("value") === year1) {
          option.property("disabled", true); // Disable option for year1
        } else {
          option.property("disabled", false); // Enable all other options
        }
      });

      updateChart(+monthSlider.property("value"), dataSelector.property("value"));
    });

    selectYear2.on("change", () => {
      
      const year2 = +selectYear2.property("value");

      // Disable the corresponding option in selectYear1
      optionsYear1 = selectYear1.selectAll("option");
      optionsYear1.each(function(d) {
        const option = d3.select(this);
        if (+option.property("value") === year2) {
          option.property("disabled", true); // Disable option for year2
        } else {
          option.property("disabled", false); // Enable all other options
        }
      });

      updateChart(+monthSlider.property("value"), dataSelector.property("value"));
    });

    updateChart(1, "All-items HICP");
  });
}

ButterflyChart();
