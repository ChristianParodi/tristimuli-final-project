import { covidDates, omicronRelease, datasets, customColors } from "../utils.js";

function LineChart() {
    // Actual plot
    const covidCases = datasets.covidData.daily.cases;
    const covidVaccines = datasets.covidData.daily.vaccines;

    const groupedCases = d3.group(covidCases, d => d.country);
    const groupedVaccines = d3.group(covidVaccines, d => d.country);

    const parsedData = Array.from(groupedCases, ([country, cases]) => {
        const vaccines = groupedVaccines.get(country) || [];

        const monthlyGroupsCases = d3.group(cases, d => `${d.year}-${d.month}`);
        const monthlyGroupsVaccines = d3.group(vaccines, d => `${d.year}-${d.month}`);

        const lastValues = Array.from(monthlyGroupsCases, ([key, monthValues]) => {
            const lastCase = monthValues[monthValues.length - 1];
            const vaccineValues = monthlyGroupsVaccines.get(key) || [{ vaccines: 0 }];
            const lastVaccine = vaccineValues[vaccineValues.length - 1];
            return {
                date: new Date(lastCase.year, lastCase.month - 1),
                total_cases: +lastCase.cases,
                total_vaccines: +lastVaccine.vaccines,
            };
        });

        return { country, values: lastValues };
    });

    const margin = { top: 80, right: 100, bottom: 80, left: 100 };
    const width = 900;
    const height = 500;

    const svg = d3.select("#linechart-covid")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(covidCases, d => new Date(d.year, d.month - 1)))
        .range([0, width]);
    const xAxis = d3.axisBottom(x)
        .ticks(d3.timeMonth.every(3))
        .tickFormat(d3.timeFormat("%b %Y"));

    // Y scale (domain will be set in updateChart)
    const y = d3.scaleLinear().range([height, 0]);

    // Grid group
    const horizontalGrid = svg.append("g").attr("class", "grid-horizontal");

    // Draw X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "x-axis")
        .call(xAxis)
        .style("color", "black")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "14px");

    svg.selectAll(".x-axis path, .x-axis line").style("stroke", "black");

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.total_cases));

    const tooltip = d3.select("#linechart-covid")
        .append("div")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("display", "none")
        .style("font-size", "16px");

    // Add a group and line for the hover effect
    const highlightGroup = svg.append("g")
        .attr("class", "highlight-group")
        .style("display", "none");

    const highlightLine = highlightGroup.append("line")
        .attr("stroke", "gray")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");


    // COVID lines
    svg.append("line")
        .attr("x1", x(covidDates.start))
        .attr("y1", 0)
        .attr("x2", x(covidDates.start))
        .attr("y2", height)
        .attr("stroke-dasharray", "4");

    svg.append("text")
        .attr("x", x(covidDates.start))
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-weight", "bold")
        .text("COVID Starts");

    svg.append("line")
        .attr("x1", x(covidDates.end))
        .attr("y1", 0)
        .attr("x2", x(covidDates.end))
        .attr("y2", height)
        .attr("stroke-dasharray", "4");

    svg.append("text")
        .attr("x", x(covidDates.end))
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-weight", "bold")
        .text("COVID Ends");

    // Omicron Release line
    svg.append("line")
        .attr("x1", x(omicronRelease))
        .attr("y1", 0)
        .attr("x2", x(omicronRelease))
        .attr("y2", height)
        .attr("stroke", customColors['blue'])
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4");

    svg.append("text")
        .attr("x", x(omicronRelease))
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("fill", customColors['blue'])
        .style("font-weight", "bold")
        .text("Omicron Variant")

    function updateChart(country) {
        const countryData = parsedData.find(d => d.country === country);
        const yMax = Math.max(d3.max(countryData.values, d => d.total_vaccines), d3.max(countryData.values, d => d.total_cases));
        y.domain([0, yMax]).nice();

        // Update Y axis instantly
        const yAxis = svg.selectAll(".y-axis").data([null]);
        yAxis.enter()
            .append("g")
            .attr("class", "y-axis")
            .merge(yAxis)
            .transition()
            .duration(500)
            .call(d3.axisLeft(y).tickFormat(d3.format(".2s")))
            .selectAll("text")
            .style("font-size", "14px");

        svg.selectAll(".y-axis path, .y-axis line").style("stroke", "black");

        // Remove old path/points
        svg.selectAll("[class^='line-'], [class^='point-'], [class^='label-']").remove();

        // Transition for horizontal grid
        horizontalGrid
            .transition()
            .duration(500)
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
            .selectAll("line")
            .style("stroke", "#ccc");

        // Reuse existing line generator or define separate ones for each metric
        const lineCases = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.total_cases));
        const lineVaccines = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.total_vaccines));

        // Draw line for Cases
        const pathCases = svg.append("path")
            .datum(countryData.values)
            .attr("class", "line-cases")
            .attr("d", lineCases)
            .attr("fill", "none")
            .attr("stroke", customColors["red"])
            .attr("stroke-width", 2);

        const totalLengthCases = pathCases.node().getTotalLength();
        pathCases
            .attr("stroke-dasharray", `${totalLengthCases} ${totalLengthCases}`)
            .attr("stroke-dashoffset", totalLengthCases)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        // Draw line for Vaccines
        const pathVaccines = svg.append("path")
            .datum(countryData.values.filter(d => d.total_vaccines > 0))
            .attr("class", "line-vaccines")
            .attr("d", lineVaccines)
            .attr("fill", "none")
            .attr("stroke", customColors["green"])
            .attr("stroke-width", 2);

        const totalLengthVaccines = pathVaccines.node().getTotalLength();
        pathVaccines
            .attr("stroke-dasharray", `${totalLengthVaccines} ${totalLengthVaccines}`)
            .attr("stroke-dashoffset", totalLengthVaccines)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        // Points for Cases
        svg.selectAll(".point-cases")
            .data(countryData.values)
            .enter()
            .append("circle")
            .attr("class", "point-cases")
            .attr("r", 4)
            .attr("fill", customColors["red"])
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.total_cases))
            .attr("opacity", 0)
            .transition()
            .delay(d => (x(d.date) / width) * 2000)
            .attr("opacity", 1);

        // Points for Vaccines
        svg.selectAll(".point-vaccines")
            .data(countryData.values.filter(d => d.total_vaccines > 0))
            .enter()
            .append("circle")
            .attr("class", "point-vaccines")
            .attr("r", 4)
            .attr("fill", customColors["green"])
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.total_vaccines))
            .attr("opacity", 0)
            .transition()
            .delay(d => (x(d.date) / width) * 2000)
            .attr("opacity", 1);

        // Add label for Infected (Cases)
        const lastCase = countryData.values[countryData.values.length - 1];
        svg.append("text")
            .attr("x", x(lastCase.date) + 10)
            .attr("y", y(lastCase.total_cases))
            .attr("class", "label-cases")
            .attr("dy", "0.35em")
            .style("fill", customColors["red"])
            .attr("font-size", "16px")
            .text("Infected")
            .attr("opacity", 0)
            .transition()
            .delay(d => (x(lastCase.date) / width) * 2000)
            .attr("opacity", 1);

        // Add label for Vaccines
        const lastVaccine = countryData.values.filter(d => d.total_vaccines > 0).slice(-1)[0];
        if (lastVaccine)
            svg.append("text")
                .attr("x", x(lastVaccine.date) + 10)
                .attr("y", y(lastVaccine.total_vaccines))
                .attr("class", "label-vaccines")
                .attr("dy", "0.35em")
                .style("fill", customColors["green"])
                .attr("font-size", "16px")
                .text("Vaccines")
                .attr("opacity", 0)
                .transition()
                .delay(d => (x(lastVaccine.date) / width) * 2000)
                .attr("opacity", 1);

        // Tooltip behavior for all circles
        svg.selectAll("circle")
            .on("mouseover", function (event, d) {
                tooltip
                    .style("display", "block")
                    .style("color", "black")
                    .html(`
                        <strong>${d.date.toLocaleDateString()}</strong><br />
                        <hr style="border-top: 1px solid gray;" />
                        Cases: ${d.total_cases.toLocaleString()}<br />
                        Vaccines: ${d.total_vaccines.toLocaleString()}
                    `);

                // Gray out everything and highlight the hovered circle
                d3.selectAll("[class^='line-'], [class^='point-'], [class^='label-']")
                    .style("opacity", 0.2);

                d3.select(this)
                    .style("opacity", 1)
                    .attr("r", 6)
                    .attr("fill", "orange");

                const isCases = d3.select(this).classed("point-cases");
                const partnerClass = isCases ? "point-vaccines" : "point-cases";

                // Highlight partner circle
                const partnerData = svg.selectAll(`.${partnerClass}`)
                    .filter(pd => +pd.date === +d.date);

                partnerData
                    .style("opacity", 1)
                    .attr("r", 6)
                    .attr("fill", "orange");

                // Add a vertical line
                const partnerDatum = partnerData.data()[0];
                if (partnerDatum) {
                    highlightGroup.selectAll(".vertical-connection-line").remove();
                    highlightGroup.append("line")
                        .attr("class", "vertical-connection-line")
                        .attr("stroke", "orange")
                        .attr("stroke-width", 2)
                        .attr("x1", x(d.date))
                        .attr("x2", x(d.date))
                        .attr("y1", y(isCases ? d.total_cases : d.total_vaccines))
                        .attr("y2", y(isCases ? partnerDatum.total_vaccines : partnerDatum.total_cases));
                }

                // Show vertical line and connect if vaccines/cases match
                highlightGroup.style("display", "block");
                highlightLine
                    .attr("x1", x(d.date))
                    .attr("x2", x(d.date))
                    .attr("y1", 0)
                    .attr("y2", height);

                if (d.total_vaccines > 0) {
                    // If there's a matching vaccines/cases for that date, connect them
                    const partnerValue = d.total_cases;

                    let yMin = y(Math.min(d.total_cases, partnerValue));
                    let yMax = y(Math.max(d.total_cases, partnerValue));
                    highlightLine.attr("y1", yMax).attr("y2", yMin);
                } else
                    highlightGroup.style("display", "none");
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", function (event, d) {
                tooltip.style("display", "none");
                // Restore styles
                d3.selectAll("[class^='line-'], [class^='point-'], [class^='label-']")
                    .style("opacity", 1);

                d3.select(this)
                    .attr("r", 4)
                    .attr("fill", d3.select(this).classed("point-cases") ? customColors["red"] : customColors["green"]);

                if (d3.select(this).classed("point-cases")) {
                    svg.selectAll(".point-vaccines")
                        .filter(pd => +pd.date === +d.date)
                        .attr("r", 4)
                        .attr("fill", customColors["green"]);
                } else {
                    svg.selectAll(".point-cases")
                        .filter(pd => +pd.date === +d.date)
                        .attr("r", 4)
                        .attr("fill", customColors["red"]);
                }

                highlightGroup.style("display", "none");
            });
    }

    const selector = d3.select("#country-selector").on("change", function () {
        updateChart(this.value);
    });

    selector.selectAll("option")
        .data(parsedData.map(d => d.country))
        .enter()
        .append("option")
        .text(d => d)
        .property("selected", d => d === "Italy");

    updateChart("Italy");
}

LineChart();
