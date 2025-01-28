import { covidDates, omicronRelease, datasets } from "../utils.js";

function LineChart() {
    // Actual plot
    const covidData = datasets.covidData.daily.cases;
    const groupedData = d3.group(covidData, d => d.country);
    const parsedData = Array.from(groupedData, ([country, values]) => {
        const monthlyGroups = d3.group(values, d => `${d.year}-${d.month}`);
        const lastValues = Array.from(monthlyGroups, ([, monthValues]) => monthValues[monthValues.length - 1])
            .map(d => ({
                date: new Date(d.year, d.month - 1),
                total_cases: +d.cases,
            }));
        return { country, values: lastValues };
    });

    const margin = { top: 80, right: 30, bottom: 80, left: 120 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#linechart-covid")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(covidData, d => new Date(d.year, d.month - 1)))
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
        const maxTotalCases = d3.max(countryData.values, d => d.total_cases);
        y.domain([0, maxTotalCases]).nice();

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
            .style("font-size", "14px");;

        svg.selectAll(".y-axis path, .y-axis line").style("stroke", "black");

        // Remove old path/points
        svg.selectAll(".line").remove();
        svg.selectAll(".point").remove();

        // Transition for horizontal grid
        horizontalGrid
            .transition()
            .duration(500)
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
            .selectAll("line")
            .style("stroke", "#ccc");

        // Draw line with left-to-right animation
        const path = svg.append("path")
            .datum(countryData.values)
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2);

        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        // Draw points every 3 months in sync
        svg.selectAll(".point")
            .data(countryData.values)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", 4)
            .attr("fill", "red")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.total_cases))
            .attr("opacity", 0)
            .transition()
            .delay(d => (x(d.date) / width) * 2000)
            .attr("opacity", 1);

        // Tooltip events
        svg.selectAll(".point")
            .on("mouseover", function (event, d) {
                tooltip
                    .style("display", "block")
                    .style("color", "black")
                    .html(`Date: ${d.date.toLocaleDateString()}<br>Total Cases: ${d.total_cases}`);
                d3.select(this).transition().attr("r", 6).attr("fill", "orange");
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
                d3.select(this).transition().attr("r", 4).attr("fill", "red");
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
