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

// Funzione per aggiornare la Y all'inizio
function initializeYScale(selectedMetric) {
    // Filtra i dati per la metrica selezionata e il paese selezionato
    const currentData = dataMap[selectedMetric];

    // Calcola il dominio per la scala Y in base al valore massimo
    const yDomain = [0, d3.max(currentData, d => d.value)];

    const y = d3.scaleLinear()
        .domain(yDomain)
        .range([height, 0]);

    return y;
}


function BubbleChart() {
    // Carica i dataset
    Promise.all([
        d3.csv("./../../../dataset/GDP/clean/gdp_final.csv", d => ({
            country: d.country,
            year: +d.year,
            quarter: d.quarter,
            value: +parseFloat(d.value.replace(/[^\d.-]/g, ''))
        })),
        d3.csv("./../../../dataset/HOUSE_PRICE/clean/house_price_final.csv", d => ({
            country: d.country,
            year: +d.year,
            quarter: d.quarter,
            value: +parseFloat(d.value.replace(/[^\d.-]/g, ''))
        })),
        d3.csv("./../../../dataset/COVID/bubblechart/covid_bubble.csv", d => ({
            country: d.country,
            year: +d.year,
            quarter: d.quarter,
            new_cases: +d.new_cases,
            percentage: +d.percentage
        })),
    ]).then(([gdpData, housePriceData, covidData]) => {
        const filteredGdpData = gdpData.filter(d => d.year === 2020 || d.year === 2021 || d.year === 2022 || d.year === 2023);
        const filteredHousePriceData = housePriceData.filter(d => d.year === 2020 || d.year === 2021 || d.year === 2022 || d.year === 2023);
        const filteredCovidData = covidData.filter(d => d.year === 2020 || d.year === 2021 || d.year === 2022 || d.year === 2023);       



        // Associa le metriche ai rispettivi dataset
        const metrics = ["gdpPercap", "housePrices"];
        const dataMap = {
            gdpPercap: filteredGdpData,
            housePrices: filteredHousePriceData
        };

        // Dimensioni e margini del grafico
        const margin = { top: 60, right: 40, bottom: 80, left: 75 };
        const width = 700;
        const height = 450;

        // Crea l'elemento SVG
        const svg = d3.select("#bubblechart_container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);


        // Inizializzazione della scala Y con la metrica di default (es. "gdpPercap")
        let y = d3.scaleLinear()
            .domain([d3.min(filteredGdpData, d => d.value), d3.max(filteredGdpData, d => d.value)]) // Imposta il dominio con i dati di gdpPercap
            .range([height, 0]);

        // Creazione iniziale dell'asse Y
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y))
            .selectAll("text")

        // Scala per i colori
        const myColor = d3.scaleOrdinal().range(d3.schemeSet2);

        // Tooltip
        const tooltip = d3.select("#bubblechart_container")
            .append("div")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("color", "black")
            .style("border", "2px solid #ccc")
            .style("border-radius", "10px")
            .style("padding", "10px")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("text-align", "center")
            .style("box-shadow", "2px 2px 10px rgba(0, 0, 0, 0.2)")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("transition", "opacity 0.3s ease-in-out");

        // Funzioni tooltip
        const showTooltip = function (event, d) {
            const selectedMetric = d3.select("#metric_selector_bubble").property("value");
            d3.select(this)
                .raise() // Porta la bolla in primo piano
                .transition().duration(200)
                .style("opacity", 1) // Aumenta l'opacità temporaneamente
                .attr("stroke", "black") // Aggiunge un bordo per risaltare
                .attr("stroke-width", 0.5);
            tooltip.transition().duration(200).style("opacity", 1);

            tooltip.html(`
                <div style="font-size: 14px;">${d.quarter} - ${d.year}</div>
                <div style="font-size: 18px; font-weight: bold;">${d.country}</div>
                <hr class="border-t border-gray-300 my-1">
                <div class="mh-5 mt-1 w-full">
                    <div class="flex justify-between text-center gap-10">
                        <!-- Colonna Sinistra: Number of selectedMetric -->
                        <div class="flex flex-col items-center">
                            <div style="font-weight: bold;">${selectedMetric === 'gdpPercap' ? 'GDP Value' : 'House Price'} </div>
                            <div style="font-size: 18px; font-weight: bold; color: black;">
                                ${d.value.toLocaleString()}%
                            </div>
                        </div>
        
                        <!-- Colonna Destra: New Cases -->
                        <div class="flex flex-col items-center">
                            <div style="font-weight: bold;">Covid cases</div>
                            <div style="font-size: 22px; font-weight: bold; color: black;">
                                ${d.new_cases.toLocaleString()}
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
                .style("opacity", 0.9) // Ripristina l'opacità originale
                .attr("stroke", "none"); // Rimuove il bordo
            tooltip.transition().duration(200).style("opacity", 0);
        };

        const metricLabels = {
            gdpPercap: "GDP",
            housePrices: "House Price"
        };
        
        // Popola il selettore delle metriche con nomi leggibili
        d3.select("#metric_selector_bubble")
            .selectAll("option")
            .data(metrics)
            .enter()
            .append("option")
            .text(d => metricLabels[d])  // Mostra "GDP" e "House Prices" nel menu a tendina
            .attr("value", d => d);


        //slider

        // Preprocessa i dati per ottenere un array di combinazioni "QX-YYYY" (ad esempio "Q1-2020", "Q2-2020")
        const tickValues = filteredCovidData.map(d => `${d.quarter}-${d.year}`).filter((value, index, self) => self.indexOf(value) === index);

        // Funzione per convertire una combinazione "QX-YYYY" in un valore ordinabile senza numeri tra trimestre e anno
        const parseQuarterYearString = (quarterYear) => {
            const [quarter, year] = quarterYear.split('-');
            const quarterNum = parseInt(quarter.substring(1));  // Ottieni il numero del trimestre (Q1 -> 1, Q2 -> 2, ...)
            return { quarterYear, quarterNum, year };  // Restituiamo un oggetto che contiene la stringa originale e i valori numerici
        };

        // Ordinare le stringhe "QX-YYYY" in base ai valori numerici (per l'ordinamento)
        const sortedTickValues = tickValues
            .map(tick => parseQuarterYearString(tick))
            .sort((a, b) => {
                if (a.year === b.year) {
                    return a.quarterNum - b.quarterNum;  // Ordina per trimestre
                } else {
                    return a.year - b.year;  // Ordina per anno
                }
            })
            .map(d => d.quarterYear);  // Ripristina solo la stringa "QX-YYYY" dopo l'ordinamento

        // Scala X (tempo)
        const x = d3.scaleBand()
            .domain(sortedTickValues.slice(0, 4))  // Imposta il dominio iniziale con Q1-2020 a Q4-2020
            .range([0, width])
            .padding(0.1);

        // Crea l'asse X
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
        //Label
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 70)
            .attr('text-anchor', 'middle')
            .text('Trimester-Year')
            .style("font-size", "16px");


        svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .text("GDP Value (%)")
            .style("font-size", "16px");


        // Slider
        const sliderRange = d3
            .sliderBottom()
            .min(0)  // Minimo, non ha più bisogno di numeri specifici
            .max(sortedTickValues.length - 1)  // Massimo basato sull'indice dell'array ordinato
            .width(800)
            .tickValues(sortedTickValues.map((tick, index) => index))  // Usa gli indici per i valori delle tacche
            .tickFormat((d) => sortedTickValues[d])  // Usa l'indice per mappare la stringa "QX-YYYY"
            .default([0, 3])  // Impostazioni di default
            .fill('#85bb65');

            const sliderWidth = 770; 
        // Aggiungi lo slider al DOM
        const gRange = d3
            .select('#slider-range')
            .append('svg')
            .attr('width', 1400) // Imposta una larghezza maggiore per l'area dello slider
            .append('g') // Posiziona lo slider
            .attr('transform', `translate(${(1400 - sliderWidth) / 2}, 50)`);

        gRange.call(sliderRange)
            // Modifica la dimensione del testo delle etichette
            .selectAll('.tick text')  // Seleziona tutte le etichette
            .style('font-size', '12px');

        //sliderend


        // Funzione per aggiornare il selettore delle nazioni
        function updateCountrySelector(selectedMetric) {
            const currentData = dataMap[selectedMetric];
            const countries = [...new Set(currentData.map(d => d.country))];
            const countrySelector = d3.select("#contry_selector_bubble");
        
            // Ottieni il paese attualmente selezionato
            let selectedCountry = countrySelector.property("value");
        
            // Se il paese selezionato non è presente nei nuovi dati, sceglie il primo paese disponibile
            if (!countries.includes(selectedCountry)) {
                selectedCountry = countries[0]; 
            }
        
            // Aggiorna il selettore con i nuovi paesi
            countrySelector.selectAll("option").remove();
            
            countrySelector
                .selectAll("option")
                .data(countries)
                .enter()
                .append("option")
                .text(d => d)
                .attr("value", d => d);
        
            // Mantieni il paese selezionato
            countrySelector.property("value", selectedCountry);
        }
        



        // Funzione per aggiornare il grafico
        function updateChart() {
            const selectedMetric = d3.select("#metric_selector_bubble").property("value");
            const selectedCountry = d3.select("#contry_selector_bubble").property("value");

            // Filtra i dati per la metrica selezionata e il paese selezionato
            const currentData = dataMap[selectedMetric].filter(d => d.country === selectedCountry);
            const covidCountryData = filteredCovidData.filter(d => d.country === selectedCountry);

            // Quando lo slider cambia
            const filterData = sortedTickValues.slice(Math.floor(sliderRange.value()[0]), Math.floor(sliderRange.value()[1] + 1));

            // Combina i dati
            const combinedData = currentData
                .filter(d => filterData.includes(`${d.quarter}-${d.year}`)) // Filtra per date selezionate
                .map(d => {
                    const covidMatch = covidCountryData.find(c =>
                        c.year === d.year &&
                        c.quarter === d.quarter &&
                        filterData.includes(`${c.quarter}-${c.year}`)
                    );
                    return {
                        ...d,
                        new_cases: covidMatch ? covidMatch.new_cases : 0, // Aggiungi i nuovi casi
                        value: d.value,
                    };
                });



            // Aggiorna il grafico
            updateGraph(combinedData, filterData, selectedCountry, selectedMetric);
        }

        // Funzione per aggiornare il grafico (scales e bubbles)
        function updateGraph(combinedData, filterData, selectedCountry, selectedMetric) {


            // Scala X (in base ai dati filtrati)
            x
                .domain(filterData)  // Limita la scala X ai valori selezionati dallo slider
                .range([0, width])
                .padding(0.1);

            // Aggiorna l'asse X
            svg.select(".x.axis")
                .transition()
                .duration(300)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end")
                .style("font-size", "14px");



            // Scala Y (aggiornata in base alla metrica selezionata)
            const yDomain = [d3.min(combinedData, d => d.value - 1.5), d3.max(combinedData, d => d.value)];
            y.domain(yDomain);

            let textValue;
            if (selectedMetric === "gdpPercap") {
                textValue = "GDP Value (%)";
            } else {
                textValue = "House Price (%)";
            }

            svg.select(".y.axis")
                .transition()
                .duration(300)
                .call(d3.axisLeft(y))
                .style("font-size", "14px");

            svg.select(".y-axis-label")
                .transition()
                .duration(300)
                .text(textValue);
            // Scala per il raggio delle bolle
            const z = d3.scaleSqrt()
                .domain([0, d3.max(combinedData, d => d.new_cases)])
                .range([4, 40]);

            // Unione dei dati con le bolle esistenti
            const bubbles = svg.selectAll(".bubbles").data(combinedData, d => `${d.country}-${d.year}-${d.quarter}`);

            // Rimuovi bolle non più pertinenti
            bubbles.exit().remove();

            // Aggiungi o aggiorna le bolle
            bubbles.enter()
                .append("circle")
                .attr("class", "bubbles")
                .merge(bubbles)
                .on("mouseover", showTooltip)
                .on("mouseleave", hideTooltip)
                .transition()
                .duration(500)
                .attr("cx", d => x(`${d.quarter}-${d.year}`) + x.bandwidth() / 2)
                .attr("cy", d => y(d.value))  // Usa d.value per l'asse Y
                .attr("r", d => z(d.new_cases))
                .style("fill", myColor(selectedCountry))
                .style('opacity', 0.9);

            svg.selectAll(".grid").remove();
            createGrid(svg, x, y, width, height);
            svg.selectAll(".grid").lower();


        }


        // Gestore evento per lo slider
        sliderRange.on('onchange', val => {

            updateChart();  // Aggiorna il grafico quando lo slider cambia
        });

        // Eventi per il cambio selettore
        d3.select("#metric_selector_bubble").on("change", () => {
            updateCountrySelector(d3.select("#metric_selector_bubble").property("value"));
            updateChart();
        });

        d3.select("#contry_selector_bubble").on("change", updateChart);

        // Inizializzazione
        updateCountrySelector(metrics[0]);
        updateChart();
    });
}

BubbleChart();

