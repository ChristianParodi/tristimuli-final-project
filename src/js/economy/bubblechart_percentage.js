

function BubbleChart() {
    Promise.all([
        d3.csv("./../../../dataset/TOURISM/clean/tourism_final.csv", d => {
            if (+d.year >= 2020 && +d.year <= 2022 && +d.inbound >= 5) {
                return {
                    country: d.country,
                    year: +d.year,
                    inbound: +d.inbound
                };
            }
        }).then(data => data.filter(d => d)),

        d3.csv("./../../../dataset/COVID/bubblechart/covid_cases_vacc_yearly_ISO2.csv", d => {
            if (+d.year >= 2020 && +d.year <= 2022) {
                return {
                    ISO2: d.ISO2,
                    country: d.country,
                    year: +d.year,
                    percentage_cases: +d.percentage_cases || 0,
                    percentage_vaccines: +d.percentage_vaccines || 0
                };
            }
        }).then(data => data.filter(d => d))
    ]).then(([tourismData, covidData]) => {
        const combinedData = covidData.map(d => {
            const tourismMatch = tourismData.find(t => t.year === d.year && t.country === d.country);
            return {
                ...d,
                inbound: tourismMatch ? tourismMatch.inbound : 0
            };
        }).filter(d => !isNaN(d.inbound) && d.inbound >= 5);

        const years = [...new Set(combinedData.map(d => d.year))];
        const countries = [...new Set(combinedData.map(d => d.country))];

        const margin = { top: 60, right: 25, bottom: 50, left: 65 };
        const width = 900;
        const height = 420;



        const svg = d3.select("#bubblechart_container_2")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        const z = d3.scaleSqrt().range([1, 100]);

        // // Crea un pattern per ogni bandiera
        // const flagPatterns = svg.append("defs")
        //     .selectAll("pattern")
        //     .data(countries)
        //     .enter().append("pattern")
        //     .attr("id", d => "flag-" + d)
        //     .attr("width", 1)
        //     .attr("height", 1)
        //     .attr("patternContentUnits", "objectBoundingBox")
        //     .append("image")
        //     .attr("href", d => `https://cdn.jsdelivr.net/npm/flag-icon-css@4.1.7/flags/1x1/${d.ISO2.toLowerCase()}.svg`) // Modifica l'URL per adattarlo al formato delle bandiere
        //     .attr("x", 0)
        //     .attr("y", 0)
        //     .attr("width", 1)
        //     .attr("height", 1);

        const xAxis = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .style("color", "black")
            .style("font-size", "14px");

        const yAxis = svg.append("g")
            .attr("class", "y axis")
            .style("color", "black")
            .style("font-size", "14px");

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .text('Vaccinated (%)')
            .style("font-size", "16px");

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .text('Total Cases (%)')
            .style("font-size", "16px");

            const tooltip = d3.select("#bubblechart_container_2")
            .append("div")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "2px solid #ccc")
            .style("border-radius", "10px")
            .style("padding", "10px")
            .style("color", "black")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("text-align", "center")
            .style("box-shadow", "2px 2px 10px rgba(0, 0, 0, 0.2)")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("transition", "opacity 0.3s ease-in-out");

        const showTooltip = function (event, d) {
            d3.select(this)
                .raise()
                .transition().duration(200)
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
            
            <div style="font-size: 14px; "> Year: ${d.year} </div>
        <div style="font-size: 18px; font-weight: bold;">${d.country}  </div>

        <hr class="border-t border-gray-300 my-1">

        <div class="mh-5 mt-1 w-full">
      <div class="flex justify-between text-center gap-10">

        <!-- Colonna Sinistra: Number of selectedMetric -->
        <div class="flex flex-col items-center">
          <div style="font-weight: bold;">Total Cases</div>
          <div style="font-size: 16px; color: gray;">
            ${d.percentage_cases.toLocaleString()}%
          </div>

          <div style="font-weight: bold;">Vaccinated</div>
          <div style="font-size: 16px; color: gray;">
            ${d.percentage_vaccines.toLocaleString()}%
          </div>
        </div>

        <!-- Colonna Destra: Health Spending -->
        <div class="flex flex-col items-center">
          <div style="font-weight: bold;">Inbound tourists</div>
          <div style="font-size: 22px; font-weight: bold; color: black;">
          ${d.inbound.toLocaleString()} 
          </div>
        </div>

      </div>
    </div>
            
            `)
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
            .data(years.sort((a, b) => a - b))
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

            const filteredData = combinedData.filter(d => d.year === 2021);

            x.domain([-5, d3.max(filteredData, d => d.percentage_vaccines)]);
            // Calcola il massimo di inbound sull'intero dataset (tutti gli anni)
const maxInbound = d3.max(combinedData, d => d.inbound);

// Imposta il dominio della scala z una volta sola
z.domain([4, maxInbound]);

function updateChart(selectedYear) {
    let filteredData = combinedData.filter(d => d.year === +selectedYear);

    // Ordina i dati in modo che i bubble con dimensioni maggiori vengano disegnati per primi
    // e quelli piccoli (z più piccoli) in seguito, apparendo in primo piano.
    filteredData.sort((a, b) => d3.descending(z(a.inbound), z(b.inbound)));

    x.domain([-0.01, d3.max(filteredData, d => d.percentage_vaccines)]);
    y.domain([
      d3.min(filteredData, d => d.percentage_cases - 2),
      d3.max(filteredData, d => d.percentage_cases)
    ]);


    xAxis.transition().duration(500).call(d3.axisBottom(x));
    yAxis.transition().duration(500).call(d3.axisLeft(y));

    // Aggiorna la griglia
    svg.selectAll(".grid").remove();
    createGrid(svg, x, y, width, height);
    svg.selectAll(".grid").lower();

    const bubbles = svg.selectAll(".bubble").data(filteredData, d => d.country);
    bubbles.exit().remove();

    const borders = svg.selectAll(".border").data(filteredData, d => d.country);
    borders.exit().remove();

    borders.enter()
        .append("rect")
        .attr("class", "border")
        .merge(borders)
        .transition()
        .duration(500)
        .attr("x", d => x(d.percentage_vaccines) - z(d.inbound) / 2 - 2)
        .attr("y", d => y(d.percentage_cases) - z(d.inbound) / 2 - 2)
        .attr("width", d => z(d.inbound) + 4)
        .attr("height", d => z(d.inbound) + 4)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    bubbles.enter()
        .append("image")
        .attr("class", "bubble")
        .merge(bubbles)
        .on('mouseover', showTooltip)
        .on("mouseleave", hideTooltip)
        .transition()
        .duration(500)
        .attr("x", d => x(d.percentage_vaccines) - z(d.inbound) / 2)
        .attr("y", d => y(d.percentage_cases) - z(d.inbound) / 2)
        .attr("width", d => z(d.inbound))
        .attr("height", d => z(d.inbound))
        .attr("xlink:href", d => `https://cdn.jsdelivr.net/npm/flag-icon-css@4.1.7/flags/1x1/${d.ISO2.toLowerCase()}.svg`);
}



        d3.select("#selector_year_2").on("change", function () {
            updateChart(this.value);
        });

        updateChart(years[0]);
    });
}

BubbleChart();
