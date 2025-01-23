import { datasets } from "../utils";

function waffleChart() {
    const deaths = datasets.mentalHealthData;
    const width = 1200;
    const height = 600;
    const margin = { top: 50, right: 40, bottom: 40, left: 40 };

    const numericColumns = Object.keys(deaths[0]).filter(key => !isNaN(key));
    deaths.forEach(d => {
        numericColumns.forEach(col => {
            d[col] = +d[col];
        });
    });


    const ages = [...new Set(deaths.map(d => d.age))];

    const svg = d3.select("#waffle-chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    const colorMap = {
        "COVID-19": "lightblue",
        "Cancer": "lightgreen",
        "Heart disease": "lightcoral",
        "Stroke": "lightyellow",
        "Diabetes": "lightpink",
        "Alzheimer's disease": "lightgrey",
        "Influenza and pneumonia": "lightcyan",
        "Kidney disease": "lightgoldenrodyellow"
    }

    // Setting the values of the year selectors
    const year1Select = document.getElementById('waffle-year-1');
    const year2Select = document.getElementById('waffle-year-2');

    numericColumns.forEach(year => {
        const option1 = document.createElement('option');
        option1.value = year;
        option1.text = year;
        year1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = year;
        option2.text = year;
        year2Select.appendChild(option2);
    });

    year1Select.value = "2019";
    year2Select.value = "2021";

    // Getting the values of the selected categories
    const categories_checkbox = Array.from(document.querySelectorAll('input[name="waffle-metric"]'));


    // Initial draw of the waffles
    const gridSize = 40;
    const gap = 2; // Add a gap between squares
    const cols = 10;

    const xOffset = width * 0.05;
    const initialWaffleData = Array(cols * cols).fill(0);
    const chart1 = svg.append("g")
        .attr("transform", `translate(${xOffset}, ${margin.top})`);

    chart1.selectAll("rect")
        .data(initialWaffleData)
        .enter().append("rect")
        .attr("x", (d, i) => (i % cols) * (gridSize + gap))
        .attr("y", (d, i) => (cols - 1 - Math.floor(i / cols)) * (gridSize + gap))
        .attr("width", gridSize)
        .attr("height", gridSize)
        .attr("fill", "lightgrey")
        .attr("rx", 5)
        .attr("ry", 5);

    const chart2 = svg.append("g")
        .attr("transform", `translate(${width - xOffset - cols * (gridSize + gap)}, ${margin.top})`);

    chart2.selectAll("rect")
        .data(initialWaffleData)
        .enter().append("rect")
        .attr("x", (d, i) => (i % cols) * (gridSize + gap))
        .attr("y", (d, i) => (cols - 1 - Math.floor(i / cols)) * (gridSize + gap))
        .attr("width", gridSize)
        .attr("height", gridSize)
        .attr("fill", "lightgrey")
        .attr("rx", 5)
        .attr("ry", 5);


    // Update the waffle charts 
    function updateWaffleChart(year, chart) {

        let active_categories = categories_checkbox.filter(d => d.checked).map(d => d.value);

        const currentCountry = deaths[0].country;


        const category = "COVID-19";
        const sex = "Total";
        const age = "Total";

        // Find the columns "year" and "percentage_year"
        const yearColumns = Object.keys(deaths[0]).filter(col => col.includes(year));


        const filteredYearData = deaths
            .filter(d => d.country === currentCountry)
            .map(d => {
                const filteredData = { country: d.country, cause: d.cause, age: d.age, sex: d.sex };
                yearColumns.forEach(col => {
                    filteredData[col] = d[col];
                });
                return filteredData;
            });

        const percentage = filteredYearData.find(d => d.cause === category && d.sex == sex && d.age == age)[`percentage_${year}`];
        const numSquares = Math.round((percentage / 100) * (cols * cols));
        const waffleData = Array(cols * cols).fill(0).map((d, i) => i < numSquares ? 1 : 0);

        // svg.select(`g:nth-child(${number})`).remove();
        chart.selectAll("rect")
            .data(waffleData)
            .attr("fill", d => d === 1 ? "lightblue" : "lightgrey");

        chart.append("text")
            .attr("x", cols * (gridSize + gap) / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text(`Year: ${year}`);
    }

    updateWaffleChart(2019, chart1);
    updateWaffleChart(2021, chart2);
}

waffleChart();


