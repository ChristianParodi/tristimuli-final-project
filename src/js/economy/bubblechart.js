function BubbleChart() {// Set the dimensions and margins of the graph

    // set the dimensions and margins of the graph
    var margin = { top: 60, right: 20, bottom: 40, left: 50 },
        width = 700,
        height = 420;

    // append the svg object to the body of the page
    var svg = d3.select("#bubblechart_container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const data = [
        { country: "Italia", yearMonth: "2020-01", infectedRate: 20, gdpPercap: 35000, tourism: 5000000, housePrices: 250000, inflation: 2 },
        { country: "Italia", yearMonth: "2021-02", infectedRate: 25, gdpPercap: 35500, tourism: 5500, housePrices: 252000, inflation: 2.5 },
        { country: "Germania", yearMonth: "2022-01", infectedRate: 15, gdpPercap: 40, tourism: 300000, housePrices: 300000, inflation: 1.8 },
        { country: "Germania", yearMonth: "2023-02", infectedRate: 18, gdpPercap: 100, tourism: 320000, housePrices: 305000, inflation: 2.2 },
        { country: "Germania", yearMonth: "2023-03", infectedRate: 1, gdpPercap: 400, tourism: 320000, housePrices: 305000, inflation: 2.2 }
    ];

    // Scala del tempo (asse x)
    const x = d3.scaleTime()
        .domain([new Date(2020, 0, 1), new Date(2024, 11, 31)])
        .range([0, width]);

    const xAxis = d3.axisBottom(x).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%b %Y"));
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "black");


    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(data.map(d => d.infectedRate))])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "black");

    //grid
    // Add horizontal grid lines
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, 0)`)
        .call(
            d3.axisLeft(y)
                .tickSize(-width) // Lunghezza delle linee di griglia
                .tickFormat("")   // Rimuove i valori dei tick
        )
        .selectAll("line")
        .style("stroke", "#ccc") // Colore della griglia
        .style("stroke-opacity", 0.7) // Opacità della griglia
        .style("shape-rendering", "crispEdges"); // Bordo definito

    // Add vertical grid lines
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height})`)
        .call(
            d3.axisBottom(x)
                .tickSize(-height) // Lunghezza delle linee di griglia
                .tickFormat("")    // Rimuove i valori dei tick
        )
        .selectAll("line")
        .style("stroke", "#ccc") // Colore della griglia
        .style("stroke-opacity", 0.7) // Opacità della griglia
        .style("shape-rendering", "crispEdges"); // Bordo definito



    // Add a scale for bubble color
    var myColor = d3.scaleOrdinal().range(d3.schemeSet2);

    // Tooltip
    var tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white")

    // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
    var showTooltip = function (event, d) {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 1);
        tooltip
            .html("Country: " + d.country)
            .style("left", (d3.mouse(this)[0] + 30) + "px")
            .style("top", (d3.mouse(this)[1] - 20) + "px")
    };

    var moveTooltip = function (event, d) {
        tooltip
            .style("left", (d3.mouse(this)[0] + 30) + "px")
            .style("top", (d3.mouse(this)[1] - 20) + "px")
    };

    var hideTooltip = function (d) {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
    }

    // Aggiungi listener per il cambio dei selettori
    d3.select("#contry_selector_bubble").on("change", updateChart);
    d3.select("#metric_selector_bubble").on("change", updateChart);

    // Funzione updateChart migliorata
    function updateChart() {
        // Ottieni la metrica e il paese selezionati
        var selectedMetric = d3.select("#metric_selector_bubble").property("value");
        var selectedCountry = d3.select("#contry_selector_bubble").property("value");

        // Filtra i dati per il paese selezionato
        var filteredData = data.filter(d => d.country === selectedCountry);

        // Add a scale for bubble size
        var z = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[selectedMetric])])
            .range([0, 600000]);

        // Calcola il dominio della scala z basato sulla metrica selezionata
        z.domain(d3.extent(filteredData, d => d[selectedMetric] || 0))
            .range([4, 40]); // Mantieni un range fisso per le dimensioni delle bolle



        // Seleziona tutte le bolle esistenti
        var bubbles = svg.selectAll(".bubbles")
            .data(filteredData, d => d.yearMonth); // Usa yearMonth come chiave unica

        // Rimuovi le bolle non necessarie
        bubbles.exit().remove();

        // Aggiungi le nuove bolle e aggiorna quelle esistenti
        bubbles.enter()
            .append("circle")
            .attr("class", "bubbles")
            .merge(bubbles) // Unisci con gli elementi esistenti
            .attr("cx", d => x(new Date(d.yearMonth))) // Posizione sull'asse X
            .attr("cy", d => y(d.infectedRate)) // Posizione sull'asse Y
            .attr("r", d => z(d[selectedMetric])) // Dimensione basata sulla metrica
            .style("fill", d => myColor(d.country)) // Colore in base al paese
            .style("opacity", 0.7)
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip);
    }


    // Populate the country selector
    d3.select("#contry_selector_bubble")
        .selectAll("option")
        .data([...new Set(data.map(d => d.country))])
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; });

    // metric select
    // Opzioni per il selettore
    const metrics = ["gdpPercap", "tourism", "housePrices", "inflation"];

    // Creazione del selettore
    d3.select("#metric_selector_bubble")
        .selectAll("option")
        .data(metrics)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Initial render
    updateChart();

}
BubbleChart()