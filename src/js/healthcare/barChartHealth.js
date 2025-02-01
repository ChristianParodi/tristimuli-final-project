import { datasets } from "../utils.js";

function barChartHealth() {

    const data = datasets.mentalHealthData.map(d => ({
        ...d,
        year: +d.year,
        deaths: +d.deaths,
        percentage: +d.percentage
    })).filter(d => (d.cause === "Mental and behavioural disorders" || d.cause === "Intentional self-harm") &&
        d.age === "Total" && d.sex === "Total" &&
        !d.country.includes("Union") &&
        !d.country.includes("Metropolitan"));

    const parentContainer = d3.select("#bar-chart-health-container").node().parentNode;
    const width = parentContainer.getBoundingClientRect().width * 0.9;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };

    const svg = d3.select("#bar-chart-health-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const top10Countries = data.reduce((acc, d) => {
        if (!acc[d.country]) {
            acc[d.country] = { pre2020: [], post2020: [] };
        }
        if (d.year < 2020) {
            acc[d.country].pre2020.push(d.deaths);
        } else {
            acc[d.country].post2020.push(d.deaths);
        }
        return acc;
    }, {});

    const avgDeaths = Object.entries(top10Countries).map(([country, values]) => ({
        country,
        pre2020: d3.mean(values.pre2020),
        post2020: d3.mean(values.post2020)
    }));

    const top10 = avgDeaths.sort((a, b) => d3.descending(a.pre2020, b.pre2020)).slice(0, 10);

    const years = data.map(d => d.year);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    const x0 = d3.scaleBand()
        .domain(top10.map(d => d.country))
        .range([0, width])
        .padding(0.1);

    const x1 = d3.scaleBand()
        .domain(["pre2020", "post2020"])
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(top10, d => Math.max(d.pre2020, d.post2020))])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(["pre2020", "post2020"])
        .range(["#1f77b4", "#ff7f0e"]);

    const tooltip = d3.select('#bar-chart-health-container').append('div')
        .attr('class', 'tooltip-bar-health')
        .style('position', 'absolute')
        .style('background', '#fff')
        .style('padding', '8px')
        .style('border', '1px solid #000')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('color', 'black')
        .style('box-shadow', '0px 4px 15px rgba(0, 0, 0, 0.2)');

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Add X axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Country");

    // Add Y axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .text("Average Deaths");

    // Add Y axis line
    svg.append("line")
        .attr("class", "y-axis-line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black");

    // Add horizontal grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", "lightgrey")
        .style("stroke-opacity", "1")
        .style("shape-rendering", "crispEdges");

    // Add X axis line
    svg.append("line")
        .attr("class", "x-axis-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", height)
        .attr("y2", height)
        .attr("stroke", "black");

    svg.append("defs")
        .append("pattern")
        .attr("id", "diagonalHatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 4)
        .attr("height", 4)
        .append("path")
        .attr("d", "M0,4 l4,-4")
        .attr("stroke", "red")
        .attr("stroke-width", 1);

    svg.append("g")
        .selectAll("g")
        .data(top10)
        .enter().append("g")
        .attr("transform", d => `translate(${x0(d.country)},0)`)
        .selectAll("rect")
        .data(d => ["pre2020", "post2020"].map(key => ({ country: d.country, key, value: d[key], otherValue: key === "pre2020" ? d.post2020 : d.pre2020 })))
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.key))
        .on("mouseover", (_, d) => {
            const firstValue = (d.key === "pre2020" ? +d.value.toFixed(0) : +d.otherValue.toFixed(0));
            const secondValue = (d.key === "pre2020" ? +d.otherValue.toFixed(0) : +d.value.toFixed(0));
            const percVar = (((secondValue - firstValue) / firstValue) * 100).toFixed(2);
            const tooltipText = `<h2 class="text-center m-0">${d.country}: deaths due to <b>mental</b></h2>
                                <h2 class="text-center font-bold m-0">disorders or intentional self-harm</h2>
                                <div class="mh-5 mt-1 w-full flex justify-between">
                                    <div class="flex flex-col items-left w-[60%]">
                                        <h2 class="text-left m-0 w-fit">Average deaths</h2>
                                        <p class="text-left text-md">${minYear}-2020: ${firstValue}</p>
                                        <p class="text-left text-md">2020-${maxYear}: ${secondValue}</p>
                                    </div>
                                    <div class="flex flex-col items-center justify-center border-2 border-black rounded-lg w-[40%] mx-1">
                                        <p class="text-center">% variation</p>
                                        <p class="font-bold text-center">${percVar >= 0 ? "+" : ""}${percVar}%</p>
                                    </div>
                                </div>`;
            tooltip.style("opacity", "0.9")
                .html(tooltipText);

            svg.selectAll("rect.bar")
                .filter(rect => rect.country !== d.country)
                .style("opacity", 0.3);

            svg.selectAll("rect.bar")
                .filter(rect => rect.country === d.country);

            [d.value, d.otherValue].forEach(v => {
                svg.append("line")
                    .attr("class", "hover-line")
                    .attr("x1", 0)
                    .attr("x2", x0(d.country) + ((d.key === "pre2020" && v == d.value) || (d.key === "post2020" && v == d.otherValue) ? x1.bandwidth() : x0.bandwidth() - 2 * x0.padding()))
                    .attr("y1", y(v))
                    .attr("y2", y(v))
                    .attr("stroke", "red")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-dasharray", "4 4")
            });

            svg.append("rect")
                .attr("class", "highlight-rect")
                .attr("x", x0(d.country) + 2)
                .attr("width", x0.bandwidth() / 2 - 3)
                .attr("y", y(Math.max(d.value, d.otherValue)))
                .attr("height", 0)
                .attr("fill", "url(#diagonalHatch)")
                .attr("opacity", 0.5)
                .transition()
                .duration(500)
                .attr("height", y(Math.min(d.value, d.otherValue)) - y(Math.max(d.value, d.otherValue)));
        })
        .on("mousemove", function (event, d) {
            const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;
            const yAxisPosition = svg.select(".x-axis").node().getBoundingClientRect().top + window.scrollY;
            const tooltipHeight = tooltip.node().getBoundingClientRect().height;
            tooltip
                .style('left', `${svgLeft + x0(d.country) + 3 * x1("post2020") + 10}px`)
                .style('top', `${yAxisPosition - tooltipHeight - 5}px`);

        })
        .on("mouseout", function (event, d) {
            tooltip.style("opacity", "0");
            svg.selectAll("rect.bar").style("opacity", 1);
            svg.selectAll(".highlight-rect").interrupt().remove();
            svg.selectAll(".hover-line").remove();
        });
}

barChartHealth();