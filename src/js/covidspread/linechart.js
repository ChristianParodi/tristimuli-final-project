import { covidDates, omicronRelease, datasets } from "../utils.js";

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
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

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
        .style("fill", "black")
        .style("font-size", "14px");

    svg.selectAll(".x-axis path, .x-axis line").style("stroke", "black");

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

    // COVID lines
    svg.append("line")
        .attr("x1", x(covidDates.start))
        .attr("y1", 0)
        .attr("x2", x(covidDates.start))
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4");

    svg.append("text")
        .attr("x", x(covidDates.start))
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text("COVID Starts");

    svg.append("line")
        .attr("x1", x(covidDates.end))
        .attr("y1", 0)
        .attr("x2", x(covidDates.end))
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4");

    svg.append("text")
        .attr("x", x(covidDates.end))
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text("COVID Ends");

    // Omicron Release line
    svg.append("line")
        .attr("x1", x(omicronRelease))
        .attr("y1", 0)
        .attr("x2", x(omicronRelease))
        .attr("y2", height)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4");

    svg.append("text")
        .attr("x", x(omicronRelease))
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("fill", "steelblue")
        .style("font-weight", "bold")
        .text("Omicron Variant")

    function updateChart(country) {
        const countryData = parsedData.find(d => d.country === country);
        const maxTotalVaccines = d3.max(countryData.values, d => d.total_vaccines);
        y.domain([0, maxTotalVaccines]).nice();

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
            .style("fill", "black")
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
            .attr("stroke", "red")
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
            .attr("stroke", "green")
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
            .attr("fill", "red")
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
            .attr("fill", "green")
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
            .attr("fill", "red")
            .attr("font-size", "16px")
            .text("Infected")
            .attr("opacity", 0)
            .transition()
            .delay(d => (x(lastCase.date) / width) * 2000)
            .attr("opacity", 1);

        // Add label for Vaccines
        const lastVaccine = countryData.values.filter(d => d.total_vaccines > 0).slice(-1)[0];
        svg.append("text")
            .attr("x", x(lastVaccine.date) + 10)
            .attr("y", y(lastVaccine.total_vaccines))
            .attr("class", "label-vaccines")
            .attr("dy", "0.35em")
            .attr("fill", "green")
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
                        Date: ${d.date.toLocaleDateString()}<br>
                        Cases: ${d.total_cases}<br>
                        Vaccines: ${d.total_vaccines}
                    `);
                d3.select(this).transition().attr("r", 6).attr("fill", "orange");
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
                const fillColor = d3.select(this).classed("point-cases")
                    ? "red" : d3.select(this).classed("point-deaths")
                        ? "blue" : "green";
                d3.select(this).transition().attr("r", 4).attr("fill", fillColor);
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
