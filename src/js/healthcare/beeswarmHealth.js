import { datasets } from "../utils.js";

function beeswarm() {
    const mentalDeaths = datasets.mentalHealthData
        .filter(d => d.cause === "Mental and behavioural disorders" && d.age == "Total" && d.sex == "Total")
        .map(d => ({
            country: d.country,
            year: +d.year,
            deaths: +d.deaths,
            percentage: +d.percentage
        }));


    const covidData = datasets.covidData.year_new.cases.map(d => ({
        country: d.country,
        year: +d.year,
        newCases: +d.new_cases
    })).filter(d => d.year >= 2020 && d.year <= 2024);

    const countriesMental = [...new Set(mentalDeaths.map(d => `${d.country}-${d.year}`))];
    const countriesCovid = [...new Set(covidData.map(d => `${d.country}-${d.year}`))];
    const countries = countriesMental.filter(c => countriesCovid.includes(c)).map(c => {
        const [country, year] = c.split("-");
        return { country, year: +year };
    });

    console.log(countries)

    const data = countries.map((country, year) => {
        const mentalEntry = mentalDeaths.find(md => md.country === country && +md.year === +year);
        const covidEntry = covidData.find(cd => cd.country === country && +cd.year === +year);
        console.log(mentalEntry, covidEntry);
        return {
            country: country,
            year: +year,
            newCases: +covidEntry.newCases,
            deaths: +mentalEntry.deaths,
            deathsPercentage: +mentalEntry.percentage
        };
    });

    console.log(data);

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
        .domain([0, d3.max(mentalDeaths.map(d => d.percentage))]) // Assuming percentages range from 0 to 100
        .range([0, width]);

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(covidData, d => d.newCases)]) // Map totalCases to circle size
        .range([3, 20]); // Circle radius range

    const years = [...new Set(mentalDeaths.map(d => d.year))];
    let year = d3.min(years);

    const simulation = d3.forceSimulation()
        .force("x", d3.forceX(d => xScale(d.percentage)).strength(1))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force("collide", d3.forceCollide(d => radiusScale(d.totalCases) + 1))
        .stop();

    function updateChart(year) {
        const filteredData = data.filter(d => d.year === year);

        simulation.nodes(filteredData);
        for (let i = 0; i < 300; i++) simulation.tick();

        const circles = svg.selectAll("circle").data(filteredData, d => d.country);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => radiusScale(d.totalCases))
            .style("fill", "steelblue")
            .style("opacity", 0.8)
            .style("stroke", "#333");

        circles.exit().remove();
    }

    // Initial rendering
    updateChart(year);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("Percentage of Deaths Due to Mental Disorders");

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

    // Tooltips
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("display", "none")
        .style("pointer-events", "none");

    svg.selectAll("circle")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
        <strong>Country:</strong> ${d.country}<br>
        <strong>Deaths (%):</strong> ${d.deathsPercentage}<br>
        <strong>Total Cases:</strong> ${d3.format(",")(d.totalCases)}
      `);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));
}

beeswarm();