import { datasets } from "../utils.js";

function beeswarm() {
    const mentalDeaths = datasets.mentalHealthData
        .filter(d => d.cause === "Mental and behavioural disorders" && d.age == "Total" && d.sex == "Total" && d.deaths != null && !d.country.includes("Union"))
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
        .attr("class", "text-black")
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
            .attr("xlink:href", d => `../html/components/flags/${d.country.toLowerCase()}.svg`)
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
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .attr("r", d => d.percDeaths === 0 ? 0 : radiusScale(+d.healthExp));

        circlesEnter.append("circle")
            .attr("class", "circle")
            .attr("clip-path", d => `url(#circle-clip-${d.country}-${d.year})`)
            .style("fill", "black")
            .style("opacity", 0.8)
            .style("stroke", "black")
            .style("stroke-width", "2px");

        circles.merge(circlesEnter)
            .transition()
            .duration(750)
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .select("circle")
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .attr("r", d => d.percDeaths === 0 ? 0 : radiusScale(+d.healthExp));

        circles.exit().remove();

        svg.selectAll(".flag-icon")
            .on("mouseover", (_, d) => {
                tooltip.style("opacity", "0.9")
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
        playButton.textContent = playing ? 'Pause' : 'Play';
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
}

beeswarm();