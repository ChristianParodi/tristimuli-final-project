import { datasets } from "../utils.js";

function waffleChart() {
    const deaths = datasets.mentalHealthData;

    const numericColumns = Object.keys(deaths[0]).filter(key => !isNaN(key));
    deaths.forEach(d => {
        numericColumns.forEach(col => {
            d[col] = +d[col];
        });
    });

    const parentContainer = d3.select("#waffle-chart-container").node().parentNode;
    const width = parentContainer.getBoundingClientRect().width * 0.9;
    const height = 600;
    const margin = { top: 50, right: 40, bottom: 40, left: 40 };

    const svg = d3.select("#waffle-chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Getting the values of the selected categories
    const categories_checkbox = Array.from(document.querySelectorAll('input[name="waffle-metric"]'));
    const categories_number = categories_checkbox.length;

    const indexMap = new Map(
        categories_checkbox.map((checkbox, index) => [checkbox.value, index])
    );

    const colorMap = new Map(
        categories_checkbox.map((checkbox, index) => [index, { color: d3.schemeCategory10[index % 10], cause: checkbox.value }])
    );
    colorMap.set(categories_number, { color: "lightgrey", cause: "Empty" });


    function getCauseIndex(cause) {
        return indexMap.get(cause);
    }

    function fillColor(d) {
        return colorMap.get(d).color;
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

    function drawEmptyWaffle(chart) {
        chart.attr("transform", `translate(${chart == chart1 ? xOffset : width - xOffset - cols * (gridSize + gap)}, ${margin.top})`)
            .selectAll("rect")
            .data(initialWaffleData)
            .enter().append("rect")
            .attr("x", (d, i) => (i % cols) * (gridSize + gap))
            .attr("y", (d, i) => (cols - 1 - Math.floor(i / cols)) * (gridSize + gap))
            .attr("width", gridSize)
            .attr("height", gridSize)
            .attr("fill", d => fillColor(d))
            .attr("rx", 5)
            .attr("ry", 5);
    }

    // Initial draw of the waffles
    const gridSize = width * 0.04;
    const gap = 2; // Add a gap between squares
    const cols = 10;

    const xOffset = width * 0.05;
    const initialWaffleData = Array(cols * cols).fill(categories_number);
    const chart1 = svg.append("g");
    drawEmptyWaffle(chart1);
    const chart2 = svg.append("g");
    drawEmptyWaffle(chart2);


    // Update the waffle charts 
    function updateWaffleChart(year, chart) {

        let active_categories = categories_checkbox.filter(d => d.checked).map(d => d.value);

        const currentCountry = deaths[0].country;


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


        let waffleData = Array(cols * cols).fill(categories_number); // Initialize with "Empty" category

        active_categories.forEach(category => {
            const percentage = filteredYearData.find(d => d.cause === category && d.sex == sex && d.age == age)[`percentage_${year}`];
            const numSquares = Math.round((percentage / 100) * (cols * cols));
            const causeIndex = getCauseIndex(category);

            for (let i = 0; i < numSquares; i++) {
                const emptyIndex = waffleData.indexOf(categories_number); // Find the first empty slot
                if (emptyIndex !== -1) {
                    waffleData[emptyIndex] = causeIndex;
                }
            }
        });

        chart.selectAll("rect")
            .data(waffleData)
            .attr("fill", d => fillColor(d));
    }

    updateWaffleChart(2019, chart1);
    updateWaffleChart(2021, chart2);

    // Checkbox event listeners
    categories_checkbox.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCheckboxes = categories_checkbox.filter(d => d.checked);

            if (checkedCheckboxes.length === 1) {
                checkedCheckboxes[0].style.cursor = 'not-allowed';
            } else {
                categories_checkbox.forEach(d => d.style.cursor = 'pointer');
            }

            if (checkedCheckboxes.length === 0) {
                checkbox.checked = true;
                checkbox.style.cursor = 'not-allowed';
            }
            else {
                updateWaffleChart(year1Select.value, chart1);
                updateWaffleChart(year2Select.value, chart2);
            }

        });
    });

    /********** Year selectors event listeners **********/
    function disableYear1Options() {
        const selectedYear2 = year2Select.value;
        Array.from(year1Select.options).forEach(option => {
            option.disabled = option.value === selectedYear2;
        });
    }

    function disableYear2Options() {
        const selectedYear1 = year1Select.value;
        Array.from(year2Select.options).forEach(option => {
            option.disabled = option.value === selectedYear1;
        });
    }

    year1Select.addEventListener('change', () => {
        disableYear2Options();
        updateWaffleChart(year1Select.value, chart1);
    });

    year2Select.addEventListener('change', () => {
        disableYear1Options();
        updateWaffleChart(year2Select.value, chart2);
    });

    disableYear1Options();
    disableYear2Options();
    /****************************************************/

}

waffleChart();


