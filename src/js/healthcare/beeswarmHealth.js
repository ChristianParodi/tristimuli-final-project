import { datasets } from "../utils.js";

function beeswarm() {
    const mentalDeaths = datasets.mentalHealthData
        .filter(d => d.cause === "Mental and behavioural disorders" && d.age == "Total" && d.sex == "Total" && d.deaths != null && !d.country.includes("Union"))
        .map(d => ({
            ISO2: d.ISO2,
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
                ISO2: md.ISO2,
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
    const height = 300;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3.select("#beeswarm-container")
        .insert("svg", ":first-child")
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
        .range([6, 50]); // Circle radius range


    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - 5})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`))
        .selectAll("text")
        .style("font-size", "14px");

    const tickss = xScale.ticks(10);

    tickss.forEach(tick => {
        svg.append("line")
            .attr("x1", xScale(tick))
            .attr("x2", xScale(tick))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4");
    });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("Percentage of Deaths Due to Mental Disorders")

    const years = Array.from(new Set(data.map(d => +d.year)));
    let currentYear = d3.min(years);

    // Slider
    const yearSlider = d3.select("#beeswarm-slider")
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("step", 1)
        .attr("value", currentYear);

    d3.select("#slider-ticks")
        .selectAll("p")
        .data(years)
        .enter()
        .append("p")
        .text(d => d);

    const simulation = d3.forceSimulation()
        .force("x", d3.forceX(d => xScale(d.percDeaths)).strength(1))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force("collide", d3.forceCollide(d => radiusScale(+d.healthExp) + 1))
        .stop();

    const tooltip = d3.select('#beeswarm-container').append('div')
        .attr('class', 'tooltip-beeswarm')
        .style('position', 'absolute')
        .style('background', '#fff')
        .style('padding', '8px')
        .style('border', '1px solid #000')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('color', 'black');

    function updateChart() {
        const filteredData = data.filter(d => +d.year === +currentYear);
        simulation.alpha(1).nodes(filteredData);

        for (let i = 0; i < filteredData.length; i++) simulation.tick();

        // Flags
        const flags = svg.selectAll(".flag-group").data(filteredData);

        // Define a group for each flag and circle
        const flagGroups = flags.enter()
            .append("g")
            .attr("class", "flag-group")
            .merge(flags);

        // Update positions of flag groups
        flagGroups.transition()
            .duration(750)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Define clip paths
        flagGroups.selectAll("clipPath").remove();
        flagGroups.append("clipPath")
            .attr("id", d => `clip-${d.country}-${d.year}`)
            .append("circle")
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .attr("r", d => d.percDeaths === 0 ? 0 : radiusScale(+d.healthExp));

        // Append flag images
        flagGroups.selectAll("image").remove();
        flagGroups.selectAll("image")
            .data(d => [d])
            .enter()
            .append("image")
            .attr("class", "flag-icon")
            .attr("xlink:href", d => `https://cdn.jsdelivr.net/npm/flag-icon-css@4.1.7/flags/1x1/${d.ISO2.toLowerCase()}.svg`)
            .attr("width", d => radiusScale(+d.healthExp) * 2)
            .attr("height", d => radiusScale(+d.healthExp) * 2)
            .attr("x", d => - (radiusScale(+d.healthExp)))
            .attr("y", d => - (radiusScale(+d.healthExp)))
            .attr("clip-path", d => `url(#clip-${d.country}-${d.year})`);

        // Circles with clipPath
        const circles = svg.selectAll(".circle-group").data(filteredData);

        const circlesEnter = circles.enter()
            .append("g")
            .attr("class", "circle-group");

        circlesEnter.append("clipPath")
            .attr("id", d => `circle-clip-${d.country}-${d.year}`)
            .append("circle")
            .style("stroke-width", "2px")
            .attr("r", d => d.percDeaths === 0 ? 0 : radiusScale(+d.healthExp));

        circlesEnter.append("circle")
            .attr("class", "circle")
            .attr("clip-path", d => `url(#circle-clip-${d.country}-${d.year})`)
            .style("opacity", 0.8)
            .style("stroke", "white")
            .style("stroke-width", "2px");

        circles.merge(circlesEnter)
            .transition()
            .duration(750)
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .select("circle")
            .style("stroke", "white")
            .style("stroke-width", "2px")
            .attr("r", d => d.percDeaths === 0 ? 0 : radiusScale(+d.healthExp));

        circles.exit().remove();

        svg.selectAll(".flag-icon")
            .on("mouseover", (_, d) => {
                tooltip.style("opacity", "0.9")
                    .html(`
                        <strong>Country:</strong> ${d.country}<br>
                        <strong>Deaths:</strong> ${d.percDeaths}%<br>
                        <strong>Health expenditure:</strong> ${(+d.healthExp > 1000) ? (d3.format(",")((+d.healthExp / 1000).toFixed(2)) + 'B€') : (d3.format(",")(+d.healthExp) + 'M€')}`)
                    .style("color", "black");
            })
            .on("mousemove", (event) => {
                tooltip.style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", "0"));
    }

    // Initial rendering
    updateChart();

    const playButton = document.getElementById('play-button');

    let playing = false;
    let goBack = false;
    let intervalId;

    playButton.addEventListener('click', () => {
        playing = !playing;
        playButton.textContent = playing ? '⏸︎' : '⏵︎';
        if (playing) {
            intervalId = setInterval(() => {
                yearSlider.node().stepUp();
                if (goBack) {
                    yearSlider.node().value = yearSlider.node().min;
                    goBack = false;
                }
                if (yearSlider.node().value === yearSlider.node().max)
                    goBack = true;

                currentYear = +yearSlider.node().value;
                updateChart();
            }, 800);
        } else {
            clearInterval(intervalId);
        }
    });

    yearSlider.on("input", function () {
        currentYear = +this.value;
        updateChart();
    });



    function drawLegend() {
        const legendData = [500, 10000, 50000, 100000, 200000]; // Example expenditure values

        let total = 0;
        legendData.forEach(d => {
            total += radiusScale(d);
        });
        console.log(total);

        const legendWidth = 435;
        const legendHeight = 120;

        const legendSvg = d3.select("#beeswarm-legend")
            .append("svg")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .append("g")
            .attr("transform", "translate(20,20)");

        const legendCircles = legendSvg.selectAll(".legend-circle")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-circle")
            .attr("transform", (d, i) => `translate(${i * 80}, 0)`);

        legendCircles.append("circle")
            .attr("r", d => radiusScale(d))
            .attr("cx", d => radiusScale(d))
            .attr("cy", d => legendHeight - radiusScale(d) - 30) // Align to the bottom
            .style("fill", "none")
            .attr('stroke', 'white');

        legendCircles.append("line")
            .attr("x1", d => radiusScale(d) - radiusScale(d))
            .attr("x2", d => radiusScale(d) + radiusScale(d))
            .attr("y1", d => legendHeight - radiusScale(d) - 30)
            .attr("y2", d => legendHeight - radiusScale(d) - 30)
            .attr("stroke", "white")
            .attr("stroke-width", 1);

        legendCircles.append("text")
            .attr("x", d => radiusScale(d))
            .attr("y", d => legendHeight - radiusScale(d) * 2 - 40)
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .style("text-anchor", "middle")
            .text(d => `${(+d > 1000) ? (d3.format(",")((+d / 1000).toFixed(2)) + 'B€') : (d3.format(",")(+d) + 'M€')}`);

        legendSvg.append("text")
            .attr("x", -10)
            .attr("y", 0)
            .style("font-size", "16px")
            .text("Health Expenditure (€)");

    }
    drawLegend();
}

beeswarm();