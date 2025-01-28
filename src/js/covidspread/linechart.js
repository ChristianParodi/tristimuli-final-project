import { covidDates, datasets } from "../utils.js";

function LineChart() {
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

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#linechart-covid")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleTime()
        .domain(d3.extent(covidData, d => new Date(d.year, d.month - 1)))
        .range([0, width]);
    const xAxis = d3.axisBottom(x)
        .ticks(d3.timeMonth.every(3))
        .tickFormat(d3.timeFormat("%b %Y"));

    // draw X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll(".domain, .tick line")
        .style("stroke", "black")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "black");

    // Y axis
    const y = d3.scaleLinear()
        .range([height, 0]);
    const yAxisGroup = svg.append("g").attr("class", "y-axis");
    const horizontalGrid = svg.append("g").attr("class", "grid-horizontal");

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

    // covid starts
    svg.append("line")
        .attr("x1", x(covidDates.start))
        .attr("y1", 0)
        .attr("x2", x(covidDates.start))
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4");

    // covid ends
    svg.append("line")
        .attr("x1", x(covidDates.end))
        .attr("y1", 0)
        .attr("x2", x(covidDates.end))
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4");

    function updateChart(country) {
        const countryData = parsedData.find(d => d.country === country);
        const maxTotalCases = d3.max(countryData.values, d => d.total_cases);
        y.domain([0, maxTotalCases]).nice();

        yAxisGroup.selectAll(".domain, .tick line").style("stroke", "black");
        yAxisGroup.call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "black");

        horizontalGrid
            .call(
                d3.axisLeft(y)
                    .tickSize(-width)
                    .tickFormat("")
            )
            .selectAll("line")
            .style("stroke", "#ccc")
            .style("stroke-opacity", 0.7);
        console.log(maxTotalCases)
        svg.selectAll(".line").remove();
        svg.selectAll(".point").remove();

        svg.append("path")
            .datum(countryData.values)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        svg.selectAll(".point")
            .data(countryData.values)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.total_cases))
            .attr("r", 4)
            .attr("fill", "steelblue")
            .on("mouseover", function (event, d) {
                tooltip
                    .style("display", "block")
                    .style("color", "black")
                    .html(`Date: ${d.date.toLocaleDateString()}<br>Total Cases: ${d.total_cases}`);
                d3.select(this).attr("r", 6).attr("fill", "orange");
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", function () {
                tooltip
                    .style("display", "none");
                d3.select(this).attr("r", 4).attr("fill", "steelblue");
            });
    }

    const selector = d3.select("#country-selector")
        .on("change", function () {
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
