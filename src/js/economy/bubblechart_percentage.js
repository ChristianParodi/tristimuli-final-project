function BubbleChart() {
    Promise.all([
        d3.csv("./../../../dataset/TOURISM/clean/tourism_final.csv", d => {
            if (+d.year >= 2020 && +d.year <= 2022 &&  +d.inbound>=5) {  
                return {
                    country: d.country,
                    year: +d.year,
                    inbound: +d.inbound 
                };
            }
        }).then(data => data.filter(d => d)),  
    
        d3.csv("./../../../dataset/COVID/bubblechart/covid_cases_vacc_yearly.csv", d => {
            if (+d.year >= 2020 && +d.year <= 2022) {  
                return {
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
        const width = 900 ;
        const height = 420 ;

        const svg = d3.select("#bubblechart_container_2")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        const z = d3.scaleSqrt().range([4, 40]);

        // Crea un pattern per ogni bandiera
        const flagPatterns = svg.append("defs")
            .selectAll("pattern")
            .data(countries)
            .enter().append("pattern")
            .attr("id", d => "flag-" + d)
            .attr("width", 1)
            .attr("height", 1)
            .attr("patternContentUnits", "objectBoundingBox")
            .append("image")
            .attr("href", d => `https://www.countryflags.io/${d.toLowerCase()}/shiny/64.png`) // Modifica l'URL per adattarlo al formato delle bandiere
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1)
            .attr("height", 1);

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
            tooltip.html(`Country: ${d.country}<br>Year: ${d.year}<br>Total Cases (%): ${d.percentage_cases}<br>Vaccinated (%): ${d.percentage_vaccines}<br>Tourism Inbound: ${d.inbound}`)
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
        

        function updateChart(selectedYear) {
            const filteredData = combinedData.filter(d => d.year === +selectedYear);
        
            x.domain([d3.min(filteredData, d => d.percentage_vaccines - 0.02), d3.max(filteredData, d => d.percentage_vaccines)]);
            y.domain([d3.min(filteredData, d => d.percentage_cases - 0.1), d3.max(filteredData, d => d.percentage_cases)]);
            z.domain(d3.extent(filteredData, d => d.inbound));
        
            xAxis.transition().duration(500).call(d3.axisBottom(x));
            yAxis.transition().duration(500).call(d3.axisLeft(y));

            //grid
            svg.selectAll(".grid").remove();
            createGrid(svg, x, y, width, height);
            svg.selectAll(".grid").lower(); 
        
            const bubbles = svg.selectAll(".bubble").data(filteredData, d => d.country);

// Rimuove elementi non più necessari
bubbles.exit().remove();

// Aggiungi rettangoli per i bordi
const borders = svg.selectAll(".border").data(filteredData, d => d.country);

borders.exit().remove();

borders.enter()
    .append("rect")
    .attr("class", "border")
    .merge(borders)
    .transition()
    .duration(500)
    .attr("x", d => x(d.percentage_vaccines) - z(d.inbound) / 2 - 2)  // Margine per il bordo
    .attr("y", d => y(d.percentage_cases) - z(d.inbound) / 2 - 2)
    .attr("width", d => z(d.inbound) + 4)  // Aggiungi spessore del bordo
    .attr("height", d => z(d.inbound) + 4)
    .attr("fill", "white") // Colore del bordo
    .attr("fill-width", 0.5)
    .attr("stroke", "black") // Colore del bordo esterno
    .attr("stroke-width", 1);

// Usa <image> invece di <circle> per le bandiere
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
    .attr("xlink:href", d => `../html/components/flags/${d.country.toLowerCase()}.svg`);

           
        }
        

        d3.select("#selector_year_2").on("change", function () {
            updateChart(this.value);
        });

        updateChart(years[0]);
    });
}

BubbleChart();
