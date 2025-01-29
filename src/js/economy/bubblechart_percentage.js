function createGrid(svg, x, y, width, height) {
    // Griglia orizzontale
    svg.append("g")
        .attr("class", "grid horizontal")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .selectAll("line")
        .style("stroke", "#ccc")
        .style("stroke-opacity", 0.7)
        .style("shape-rendering", "crispEdges");

    // Griglia verticale
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
    // Carica i dataset
    Promise.all([
        d3.csv("./../../../dataset/TOURISM/clean/tourism_final.csv", d => ({
            country: d.country,
            year: +d.year,
            inbound: +d.inbound
        })),
        d3.csv("./../../../dataset/COVID/bubblechart/covid_bubble_2.csv", d => ({
            country: d.country,
            year: +d.year,
            quarter: d.quarter,
            total_cases_percentage: +d.total_cases_percentage,
            positive_rate_trimestrale: +d.positive_rate_trimestrale
        }))
    ]).then(([tourismData, covidData]) => {
        // Aggrega i dati per anno
        const aggregatedData = d3.rollups(
            covidData,
            group => ({
                positive_rate_trimestrale: d3.mean(group, d => d.positive_rate_trimestrale),
                total_cases_percentage: group.find(d => d.quarter === "Q4")?.total_cases_percentage
                
            }),
            d => d.country,
            d => d.year
        ).map(([country, years]) => 
            years.map(([year, values]) => ({
                country,
                year,
                ...values
            }))
        ).flat();
        console.log("Topperiamissile",aggregatedData)
        // Combina dati aggregati di COVID e turismo
        const combinedData = aggregatedData.map(d => {
            const covidMatch = tourismData.find(t => 
                t.year === d.year && 
                t.country === d.country
            ); // Trova il match corrispondente tra COVID e turismo
            console.log('Tourism data match:', covidMatch);  // Log del match trovato in tourismData
            // Combina i dati
            return {
                ...d,
                inbound: covidMatch ? covidMatch.inbound : 0,  // Aggiungi il dato inbound per il turismo
                positive_rate_trimestrale: d.positive_rate_trimestrale,
                total_cases_percentage: d.total_cases_percentage
            };
        });

        console.log(combinedData)
        const years = [...new Set(combinedData.map(d => d.year))];
        const countries = [...new Set(combinedData.map(d => d.country))];

        // Dimensioni e margini del grafico
        const margin = { top: 60, right: 25, bottom: 40, left: 25 };
        const width = 900 - margin.left;
        const height = 420 ;

        // Crea l'elemento SVG
        const svg = d3.select("#bubblechart_container_2")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Crea la scala dei colori per i paesi
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(countries); // Mappa ogni paese a un colore


        // Crea le scale
        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        const z = d3.scaleSqrt().range([4, 40]);

        // Aggiungi assi
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("color", "black")
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", "black");

        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y))
            .style("color", "black")
            .selectAll("text")
            .style("text-anchor", "end")
            .style("fill", "black");
        // Labels
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .text('Lockdown Days');

        svg.append('text')
            .style('font-size','10px')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', 0.5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .text('Total Cases of Infection (%)');
  
    // Tooltip
    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

    // Funzioni tooltip
    const showTooltip = function (event, d) {
        d3.select(this)
        .raise() // Porta la bolla in primo piano
        .transition().duration(200)
        .style("opacity", 1) // Aumenta l'opacità temporaneamente
        .attr("stroke", "black") // Aggiunge un bordo per risaltare
        .attr("stroke-width", 0.5);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`Country: ${d.country}<br>year: ${d.year}<br>TotalCases(% respect to population): ${d.total_cases_percentage} <br>Positive Rate(%): ${d.positive_rate_trimestrale}<br>Tourism inbound: ${d.inbound}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    };

    const hideTooltip = function () {
        d3.select(this)
        .transition().duration(200)
        .style("opacity", 0.5) // Ripristina l'opacità originale
        .attr("stroke", "none"); // Rimuove il bordo
        tooltip.transition().duration(200).style("opacity", 0);
    };


        // Crea selettore per gli anni
        d3.select("#selector_year_2")
            .selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        // Funzione per aggiornare il grafico
        function updateChart(selectedYear) {
            const filteredData = combinedData.filter(d => d.year === +selectedYear);

            // Aggiorna scale
            x.domain(d3.extent(filteredData, d => d.positive_rate_trimestrale));
            y.domain(d3.extent(filteredData, d => d.total_cases_percentage));
            z.domain(d3.extent(filteredData, d => d.inbound));

            // Aggiorna bolle
            const bubbles = svg.selectAll(".bubble").data(filteredData, d => d.country);

            bubbles.exit().remove();

            const newBubbles = bubbles.enter()
                .append("circle")
                .attr("class", "bubble")
                .merge(bubbles)
                .on('mouseover', showTooltip)
                .on("mouseleave", hideTooltip)
                .transition()
                .duration(500)
                .attr("cx", d => x(d.positive_rate_trimestrale))
                .attr("cy", d => y(d.total_cases_percentage))
                .attr("r", d => z(d.inbound))
                .style("fill", d => colorScale(d.country)) 
                .style('opacity', '0.5');
                
            svg.selectAll(".grid").remove();
            createGrid(svg, x, y, width, height);
        }

        // Gestore eventi per il selettore degli anni
        d3.select("#selector_year_2").on("change", function() {
            updateChart(this.value);
        });

        // Inizializza il grafico
        updateChart(years[0]);
    });
}

BubbleChart();
