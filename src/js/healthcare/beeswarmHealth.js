import { datasets } from "../utils.js";

function beeswarm() {
    const mentalDeaths = datasets.mentalHealthData
        .filter(d => d.cause === "Mental and behavioural disorders" && d.age == "Total" && d.sex == "Total" && d.deaths != null)
        .map(d => ({
            country: d.country,
            year: +d.year,
            deaths: +d.deaths,
            percDeaths: +d.percentage
        }));

    const expendituresData = datasets.expendituresData;

    const data = [];

    mentalDeaths.forEach(md => {
        const entry = expendituresData.find(ed => ed.country === md.country && +ed.year === +md.year);
        if (entry) {
            data.push({
                country: md.country,
                year: +md.year,
                deaths: +md.deaths,
                percDeaths: +md.percDeaths.toFixed(2),
                healthExp: +entry.health,
                totalExp: +entry.total,
                percExp: +entry.percentage
            });
        }
    });

    const width = 1000;
    const height = 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3.select("#beeswarm-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data.map(d => +d.percDeaths))]) // Assuming percentages range from 0 to 100
        .range([0, width]);


    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => +d.healthExp)]) // Map totalCases to circle size
        .range([3, 40]); // Circle radius range


    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("Percentage of Deaths Due to Mental Disorders")
        .style("color", "black");

    svg.selectAll("path, line").style("stroke", "black").style("color", "black");
    svg.selectAll(" .tick").style("color", "black");

    const years = Array.from(new Set(data.map(d => +d.year)));
    let year = d3.min(years);

    const simulation = d3.forceSimulation()
        .force("x", d3.forceX(d => xScale(d.percDeaths)).strength(1))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force("collide", d3.forceCollide(d => radiusScale(+d.healthExp) + 1))
        .stop();

    const tooltip = d3.select('#waffle-chart-container').append('div')
        .attr('class', 'tooltip-waffle-health flex flex-col items-center')
        .style('position', 'absolute')
        .style('background', '#fff')
        .style('padding', '8px')
        .style('border', '1px solid #000')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('color', 'black');

    function updateChart(year) {
        const filteredData = data.filter(d => +d.year === +year);

        simulation.nodes(filteredData);
        for (let i = 0; i < filteredData.length; i++) simulation.tick();

        const circles = svg.selectAll("circle").data(filteredData);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => radiusScale(+d.healthExp))
            .style("fill", "steelblue")
            .style("opacity", 0.8)
            .style("stroke", "#333");

        circles.exit().remove();

        svg.selectAll("circle")
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .html(`
                        <strong>Country:</strong> ${d.country}<br>
                        <strong>Deaths (%):</strong> ${d.percDeaths}<br>
                        <strong>Health expenditure:</strong> ${d3.format(",")(+d.healthExp)}`)
                    .style("color", "black");
            })
            .on("mousemove", (event) => {
                tooltip.style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => tooltip.style("display", "none"));
    }

    // Initial rendering
    updateChart(year);

    // Slider
    // const slider = d3.select("body")
    //     .append("input")
    //     .attr("type", "range")
    //     .attr("min", d3.min(years))
    //     .attr("max", d3.max(years))
    //     .attr("step", 1)
    //     .attr("value", year);

    // slider.on("input", function () {
    //     year = +this.value;
    //     updateChart(year);
    // });
}

beeswarm();