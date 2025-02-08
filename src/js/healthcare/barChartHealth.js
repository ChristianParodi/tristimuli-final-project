import { datasets } from "../utils.js";

function barChartHealth() {
    const originalData = datasets.mentalHealthData.map(d => ({
        ...d,
        year: +d.year,
        deaths: +d.deaths,
        percentage: +d.percentage
    })).filter(d => (d.cause === "Mental and behavioural disorders" || d.cause === "Intentional self-harm") &&
        !d.country.includes("Union") &&
        !d.country.includes("Metropolitan"));

    let currentCategory = "Total";
    const data = originalData.filter(d => d.age === "Total" && d.sex === "Total");
    const parentContainer = d3.select("#bar-chart-health-container").node().parentNode;
    const width = 1000;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 80, left: 100 };

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
    const top10CountriesArray = top10.map(d => d.country);

    const sexData = originalData.filter(d => d.age === "Total" && top10CountriesArray.includes(d.country));
    const ageData = originalData.filter(d => d.sex === "Total" && top10CountriesArray.includes(d.country));

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

    const tooltip = d3.select('#bar-chart-health-container')
        .append('div')
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

    svg.select(".x-axis").selectAll("text")
        .style("font-size", "14px"); // or any desired size

    svg.select(".y-axis").selectAll("text")
        .style("font-size", "14px"); // or any desired size

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
        .text("Average annual deaths");

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

    const firstCountry = top10[0].country;

    const preText = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", x0(firstCountry) + x1("pre2020") + x1.bandwidth() / 2)
        .attr("y", 22)
        .style("font-size", "12px")
        .style("font-weight", "bold");

    preText.append("tspan")
        .text("pre");

    preText.append("tspan")
        .attr("x", x0(firstCountry) + x1("pre2020") + x1.bandwidth() / 2)
        .attr("dy", "1.2em")
        .text("2020");

    const postText = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", x0(firstCountry) + x1("post2020") + x1.bandwidth() / 2)
        .attr("y", 98)
        .attr("fill", "#000")
        .style("font-size", "12px")
        .style("font-weight", "bold");

    postText.append("tspan")
        .text("post")
        .attr("x", x0(firstCountry) + x1("post2020") + x1.bandwidth() / 2);

    postText.append("tspan")
        .attr("x", x0(firstCountry) + x1("post2020") + x1.bandwidth() / 2)
        .attr("dy", "1.2em")
        .text("2020");

    const bars = svg.append("g")
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
                                        <h2 class="text-left m-0 w-fit">Average annual deaths</h2>
                                        <p class="text-left text-md text-black">${minYear}-2019: ${firstValue}</p>
                                        <p class="text-left text-md text-black">2020-${maxYear}: ${secondValue}</p>
                                    </div>
                                    <div class="flex flex-col items-center justify-center border-2 border-black rounded-lg w-[40%] mx-1">
                                        <p class="text-center text-black">% variation</p>
                                        <p class="font-bold text-center text-black">${percVar >= 0 ? "+" : ""}${percVar}%</p>
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
            let tooltipLeft = svgLeft + x0(d.country) + 4 * x1("post2020") + 5;
            let tooltipTop = yAxisPosition - tooltipHeight - 5;

            // Check if tooltip exceeds the right edge of the page
            const tooltipWidth = tooltip.node().getBoundingClientRect().width;
            const pageWidth = window.innerWidth;
            if (tooltipLeft + tooltipWidth > pageWidth) {
                tooltipLeft = svgLeft + x0(d.country) - 4 * x1("post2020"); // Adjust to fit within the page
            }

            tooltip
                .style('left', `${tooltipLeft}px`)
                .style('top', `${tooltipTop}px`);

        })
        .on("mouseout", function (event, d) {
            tooltip.style("opacity", "0");
            svg.selectAll("rect.bar").style("opacity", 1);
            svg.selectAll(".highlight-rect").interrupt().remove();
            svg.selectAll(".hover-line").remove();
        });

    const overlay = d3.select('#overlay').node();
    const totalButton = d3.select('#total-button').node();
    const sexButton = d3.select('#sex-button').node();
    const ageButton = d3.select('#age-button').node();

    function removeClassesSex() {
        Array.from(sexButton.classList).forEach(className => {
            if (className.startsWith('border')) {
                sexButton.classList.remove(className);
            }
        });
    }

    function updateChart() {
        // Remove existing split rects
        svg.selectAll(".split-rect")
            .transition()
            .duration(500)
            .attr("height", 0)
            .remove();

        if (currentCategory === "total") {
            return;
        }

        const currentData = currentCategory === "sex" ? sexData : ageData;

        const splitByCountry = currentData.reduce((acc, d) => {
            if (!acc[d.country]) {
                acc[d.country] = { pre2020: [], post2020: [] };
            }
            if (d.year < 2020) {
                acc[d.country].pre2020.push(d);
            } else {
                acc[d.country].post2020.push(d);
            }
            return acc;
        }, {});

        const splitAvgDeaths = Object.entries(splitByCountry).map(([country, values]) => {
            const pre2020 = d3.groups(values.pre2020, d => d[currentCategory]).map(([key, group]) => ({
                key,
                value: d3.mean(group, d => d.deaths)
            }));
            const post2020 = d3.groups(values.post2020, d => d[currentCategory]).map(([key, group]) => ({
                key,
                value: d3.mean(group, d => d.deaths)
            }));

            const pre2020Total = pre2020.find(d => d.key === "Total").value;
            const post2020Total = post2020.find(d => d.key === "Total").value;

            if (pre2020.length > 1) {
                pre2020[1].value = pre2020Total - pre2020[0].value;
            }
            if (post2020.length > 1) {
                post2020[1].value = post2020Total - post2020[0].value;
            }

            return {
                country,
                pre2020: pre2020Total,
                post2020: post2020Total,
                pre2020Split: pre2020.filter(d => d.key !== "Total").sort((a, b) => d3.ascending(a.key, b.key)),
                post2020Split: post2020.filter(d => d.key !== "Total").sort((a, b) => d3.ascending(a.key, b.key))
            };
        });

        const splitColor = d3.scaleOrdinal()
            .domain(currentCategory === "sex" ? ["Males", "Females"] : ["15-64", "65"])
            .range(currentCategory === "sex" ? ["steelblue", "#FF69B4"] : ["#673AB7", "#FFC107"]);

        splitAvgDeaths.forEach(d => {
            ["pre2020", "post2020"].forEach(key => {
                const splitValues = d[`${key}Split`];
                let yOffset = 0;
                splitValues.forEach(split => {
                    svg.append("rect")
                        .datum({ country: d.country, key: split.key, value: split.value, period: key, perc: (split.value / d[key] * 100).toFixed(2) })
                        .attr("class", "split-rect")
                        .attr("x", x0(d.country) + x1(key))
                        .attr("y", y(d[key]) - yOffset)
                        .attr("width", x1.bandwidth())
                        .attr("height", 0)
                        .attr("fill", splitColor(split.key))
                        .attr("opacity", 1)
                        .transition()
                        .duration(500)
                        .attr("height", y(d[key] - split.value) - y(d[key]));
                    yOffset += y(d[key]) - y(d[key] - split.value);
                });
            });
        });

        svg.selectAll(".split-rect")
            .on("mouseover", function (event, d) {
                console.log(d)
                const tooltipText = `<h2 class="text-center m-0 font-bold">${d.country}</h2>
                         <div class="flex flex-col items-center">
                            <p class="m-0 text-black">Average annual ${d.key.toLowerCase()}
                            deaths from ${d.period === "pre2020" ? "2016 to 2019" : "2020 to 2023"}</p>
                            <p class="m-0 text-black"><b>${d.value.toFixed(0)}</b> - ${d.perc}% of all deaths</p>
                         </div>`;

                tooltip.style("opacity", "0.9")
                    .html(tooltipText);

                svg.selectAll(".bar").style("opacity", 0);

                svg.selectAll(".split-rect")
                    .filter(rect => rect.country !== d.country)
                    .style("opacity", 0.3);
            })
            .on("mousemove", function (event, d) {
                const hoveredRect = d3.select(this);
                const hoveredRectY = hoveredRect.node().getBoundingClientRect().bottom + window.scrollY;
                const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;
                const tooltipHeight = tooltip.node().getBoundingClientRect().height;
                tooltip
                    .style('left', `${svgLeft + x0(d.country) + (d.period === "pre2020" ? 3 : 4) * x1("post2020") + 5}px`)
                    .style('top', `${hoveredRectY - tooltipHeight - 2}px`);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", "0");
                svg.selectAll(".split-rect").style("opacity", 1);
                svg.selectAll(".bar").style("opacity", 1);
            });
    }

    totalButton.addEventListener('click', () => {
        overlay.style.transform = 'translateX(0%)';
        removeClassesSex();
        sexButton.classList.add('border-r', 'border-[#ffffff7d]');
        if (currentCategory != "total") {
            currentCategory = "total"
            updateChart();
        }
    });

    sexButton.addEventListener('click', () => {
        overlay.style.transform = 'translateX(100%)';
        removeClassesSex();
        if (currentCategory != "sex") {
            currentCategory = "sex";
            updateChart();
        }
    });

    ageButton.addEventListener('click', () => {
        overlay.style.transform = 'translateX(200%)';
        removeClassesSex();
        sexButton.classList.add('border-l', 'border-[#ffffff7d]');
        if (currentCategory != "age") {
            currentCategory = "age";
            updateChart();
        }
    });
}

barChartHealth();