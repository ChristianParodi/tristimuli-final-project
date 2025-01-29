function createGrid(svg, x, y, width, height) {
    svg.append("g")
        .attr("class", "grid horizontal")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .selectAll("line")
        .style("stroke", "#ccc")
        .style("stroke-opacity", 0.7)
        .style("shape-rendering", "crispEdges");

    svg.append("g")
        .attr("class", "grid vertical")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSize(-height).tickFormat(""))
        .selectAll("line")
        .style("stroke", "#ccc")
        .style("stroke-opacity", 0.7)
        .style("shape-rendering", "crispEdges");
}

function BubbleChart() {
    Promise.all([
        d3.csv("./../../../dataset/TOURISM/clean/tourism_final.csv", d => {
            if (+d.year >= 2020 && +d.year <= 2022) {  // Filtra anni 2020-2022
                return {
                    country: d.country,
                    year: +d.year,
                    inbound: +d.inbound || 0
                };
            }
        }).then(data => data.filter(d => d)),  // Rimuove eventuali undefined/null
    
        d3.csv("./../../../dataset/COVID/bubblechart/covid_cases_vacc_yearly.csv", d => {
            if (+d.year >= 2020 && +d.year <= 2022) {  // Filtra anni 2020-2022
                return {
                    country: d.country,
                    year: +d.year,
                    percentage_cases: +d.percentage_cases || 0, 
                    percentage_vaccines: +d.percentage_vaccines || 0
                };
            }
        }).then(data => data.filter(d => d))  // Rimuove eventuali undefined/null
    ]).then(([tourismData, covidData]) => {
        const combinedData = covidData.map(d => {
            const tourismMatch = tourismData.find(t => t.year === d.year && t.country === d.country);
            return {
                ...d,
                inbound: tourismMatch ? tourismMatch.inbound : 0
            };
        });

        const years = [...new Set(combinedData.map(d => d.year))];
        const countries = [...new Set(combinedData.map(d => d.country))];

        const margin = { top: 60, right: 25, bottom: 40, left: 50 };
        const width = 900 - margin.left - margin.right;
        const height = 420 - margin.top - margin.bottom;

        const svg = d3.select("#bubblechart_container_2")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(countries);

        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        const z = d3.scaleSqrt().range([4, 40]);

        const xAxis = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .style("color", "black");

        const yAxis = svg.append("g")
            .attr("class", "y axis")
            .style("color", "black");

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 30)
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .text('Positive Rate (%)');

        svg.append('text')
            .style('font-size', '10px')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .text('Total Cases (%)');

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("padding", "6px")
            .style("background", "rgba(0, 0, 0, 0.7)")
            .style("color", "#fff")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        const showTooltip = function (event, d) {
            d3.select(this)
                .raise()
                .transition().duration(200)
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`Country: ${d.country}<br>Year: ${d.year}<br>Total Cases (%): ${d.percentage_cases}<br>Positive Rate (%): ${d.percentage_vaccines}<br>Tourism Inbound: ${d.inbound}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        };

        const hideTooltip = function () {
            d3.select(this)
                .transition().duration(200)
                .attr("stroke", "none");

            tooltip.transition().duration(200).style("opacity", 0);
        };

        d3.select("#selector_year_2")
        .selectAll("option")
        .data(years.sort((a, b) => a - b))  // Ordina gli anni in ordine crescente
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

        function updateChart(selectedYear) {
            const filteredData = combinedData.filter(d => d.year === +selectedYear);

            x.domain([d3.min(filteredData, d => d.percentage_vaccines -0.02 ), d3.max(filteredData, d => d.percentage_vaccines)]);
            y.domain([d3.min(filteredData, d => d.percentage_cases -0.1), d3.max(filteredData, d => d.percentage_cases)]);
            z.domain(d3.extent(filteredData, d => d.inbound));

            xAxis.transition().duration(500).call(d3.axisBottom(x));
            yAxis.transition().duration(500).call(d3.axisLeft(y));

            const bubbles = svg.selectAll(".bubble").data(filteredData, d => d.country);

            bubbles.exit().remove();

            bubbles.enter()
                .append("circle")
                .attr("class", "bubble")
                .merge(bubbles)
                .on('mouseover', showTooltip)
                .on("mouseleave", hideTooltip)
                .transition()
                .duration(500)
                .attr("cx", d => x(d.percentage_vaccines))
                .attr("cy", d => y(d.percentage_cases))
                .attr("r", d => z(d.inbound))
                .style("fill", d => colorScale(d.country))
                .style('opacity', 0.7);

            svg.selectAll(".grid").remove();
            createGrid(svg, x, y, width, height);
        }

        d3.select("#selector_year_2").on("change", function () {
            updateChart(this.value);
        });

        updateChart(years[0]);
    });
}

BubbleChart();
