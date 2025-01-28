import { datasets } from "../utils.js";

function waffleChart() {
    // Importing the data
    const data = datasets.mentalHealthData.map(d => ({
        ...d,
        year: +d.year,
        deaths: +d.deaths,
        percentage: +d.percentage
    }));


    // Dimensions and SVG setup
    const parentContainer = d3.select("#waffle-chart-container").node().parentNode;
    const width = parentContainer.getBoundingClientRect().width * 0.9;
    const height = 400;
    const margin = { top: 0, right: 40, bottom: 40, left: 40 };
    const svg = d3.select("#waffle-chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Grid settings
    const gridSize = 15;
    const gap = 2;
    const cols = Math.min(Math.floor(width / (gridSize + gap)), 25);
    const maxRows = Math.floor((height - 10) / (gridSize + gap)); // max number of rows
    const xOffset1 = (width / 4) - (cols * (gridSize + gap)) / 2; // Center the first waffle in the left half
    const xOffset2 = (3 * width / 4) - (cols * (gridSize + gap)) / 2; // Center the second waffle in the right half

    // Causes checkboxes
    const categories_checkbox = Array.from(document.querySelectorAll('input[name="waffle-metric"]'));
    categories_checkbox.forEach((checkbox, index) => {
        const color = d3.schemeCategory10[index % 10];
        checkbox.style.accentColor = color;
    });

    // Country selector
    const countrySelect = document.getElementById('waffle-country-selector');
    const countries = [...new Set(data.map(d => d.country))];
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.text = country;
        countrySelect.appendChild(option);
    });

    // Year selectors
    const yearSelector1 = document.getElementById('waffle-year-1');
    const yearSelector2 = document.getElementById('waffle-year-2');
    const years = [...new Set(data.map(d => d.year))];
    years.forEach(year => {
        const option1 = document.createElement('option');
        option1.value = year;
        option1.text = year;
        yearSelector1.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = year;
        option2.text = year;
        yearSelector2.appendChild(option2);
    });

    yearSelector1.value = "2019";
    yearSelector2.value = "2021";

    disableYearOptions(yearSelector1);
    disableYearOptions(yearSelector2);

    // Color and Index Map
    const indexMap = new Map(
        categories_checkbox.map((checkbox, index) => [checkbox.value, index])
    );
    const colorMap = new Map(
        categories_checkbox.map((checkbox, index) => [index, { color: d3.schemeCategory10[index % 10], cause: checkbox.value }])
    );
    colorMap.set(categories_checkbox.length, { color: "lightgrey", cause: "Empty" });

    function getCauseIndex(cause) {
        return indexMap.get(cause);
    }

    function fillColor(d) {
        return colorMap.get(d).color;
    }

    // tooltip
    const tooltip = d3.select('#waffle-chart-container').append('div')
        .attr('class', 'tooltip-waffle-health flex flex-col items-center')
        .style('position', 'absolute')
        .style('background', '#fff')
        .style('padding', '8px')
        .style('border', '1px solid #000')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('color', 'black');


    // Initial draw
    const chart1 = svg.append("g");
    const chart2 = svg.append("g");

    let currentCountry, currentYear1, currentYear2, yearData1, yearData2, countryData, deathsPerDot;
    const currentAge = "Total";
    const currentSex = "Total";

    function updateWaffles(year1, year2) {
        deathsPerDot = 10;
        countryData = data.filter(d => d.country == currentCountry && d.sex === currentSex && d.age === currentAge);

        yearData1 = countryData.filter(d => +d.year === +year1);
        yearData2 = countryData.filter(d => +d.year === +year2);

        const totalDeaths1 = yearData1.find(d => d.cause === "Total").deaths;
        const totalDeaths2 = yearData2.find(d => d.cause === "Total").deaths;
        const maxDeaths = Math.max(totalDeaths1, totalDeaths2);
        do {
            let maxDots = Math.ceil(maxDeaths / deathsPerDot);
            if (maxDots / cols <= maxRows) break;
            deathsPerDot += 100;
        } while (true);


        updateWaffleChart(chart1);
        updateWaffleChart(chart2);
    }


    // Update waffle chart

    function updateWaffleChart(chart) {
        const yearData = (chart === chart1) ? yearData1 : yearData2;
        const totalDeaths = yearData.find(d => d.cause === "Total").deaths;
        const totalDots = Math.ceil(totalDeaths / deathsPerDot);
        if (totalDots == 0) {
            chart.selectAll("*")
                .transition()
                .duration(500)
                .style("opacity", 0)
                .remove();

            chart.append("text")
                .attr("x", (chart === chart1 ? xOffset1 : xOffset2) + (cols * (gridSize + gap)) / 2)
                .attr("y", 40)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("fill", "red")
                .text(`No data available for ${currentCountry} for ${(chart === chart1) ? currentYear1 : currentYear2}`);
        }
        else {
            // Build waffle data
            let waffleData = Array(totalDots).fill(categories_checkbox.length); // Start with empty
            categories_checkbox.filter(d => d.checked)
                .map(d => d.value)
                .forEach(category => {
                    const categoryDeaths = yearData.find(d => d.cause === category).deaths;
                    const categoryDots = Math.floor(categoryDeaths / deathsPerDot);

                    let filled = 0;
                    for (let i = 0; i < totalDots && filled < categoryDots; i++) {
                        if (waffleData[i] === categories_checkbox.length) {
                            waffleData[i] = getCauseIndex(category);
                            filled++;
                        }
                    }
                });

            // Ensure chart is a valid D3 selection
            if (chart.selectAll === undefined) {
                chart = d3.select(chart.node());
            }

            // Update chart
            chart.selectAll("text")
                .transition()
                .duration(500)
                .style("opacity", 0)
                .remove();

            chart.selectAll("rect")
                .data(waffleData)
                .join(
                    enter => enter.append("rect")
                        .attr("x", (d, i) => (i % cols) * (gridSize + gap) + (chart === chart1 ? xOffset1 : xOffset2))
                        .attr("y", (d, i) => Math.floor(i / cols) * (gridSize + gap) + margin.top)
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .transition()
                        .duration(500)
                        .attr("width", gridSize)
                        .attr("height", gridSize)
                        .attr("fill", d => fillColor(d)),
                    update => update
                        .attr("x", (d, i) => (i % cols) * (gridSize + gap) + (chart === chart1 ? xOffset1 : xOffset2))
                        .attr("y", (d, i) => Math.floor(i / cols) * (gridSize + gap) + margin.top)
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .transition()
                        .duration(500)
                        .attr("width", gridSize)
                        .attr("height", gridSize)
                        .attr("fill", d => fillColor(d)),
                    exit => exit
                        .transition()
                        .duration(500)
                        .style("opacity", 0)
                        .remove()
                )
            // .on("mouseover", function (event, d) {
            //     const cause = colorMap.get(d).cause;
            //     const deaths = yearData.find(data => data.cause === cause).deaths;
            //     const perc = yearData.find(data => data.cause === cause).percentage;
            //     tooltip.html(`
            //             <div class="flex items-center">
            //                 <h2 class="font-bold" style="margin-right: 10px; font-size: 24px;">${deaths}</h2>
            //             </div>
            //             <div>
            //                 <p class="w-full">People dead in ${currentCountry} in ${chart === chart1 ? currentYear1 : currentYear2} due to <i>${cause}</i>.</p>
            //                 <p class="w-full">They represent the <strong>${perc.toFixed(2)}%</strong> of all deaths in ${currentCountry} that year.</p>
            //             </div>
            //     `)
            //         .style("left", (event.pageX - 30) + "px")
            //         .style("top", (event.pageY + 20) + "px")
            //         .style("opacity", .9);
            // })
            // .on("mouseout", function () {
            //     tooltip.transition()
            //         .duration(500)
            //         .style("opacity", 0);
            // });

            chart.selectAll("rect")
                .on("mouseover", function (event, d) {
                    const cause = colorMap.get(d).cause;
                    const deaths1 = yearData1.find(data => data.cause === cause)?.deaths ?? "---";
                    const perc1 = yearData1.find(data => data.cause === cause)?.percentage ?? "---";
                    const deaths2 = yearData2.find(data => data.cause === cause)?.deaths ?? "---";
                    const perc2 = yearData2.find(data => data.cause === cause)?.percentage ?? "---";
                    tooltip.html(`
                                    <h2 class="text-lg">People dead in ${currentCountry} due to</h2>
                                    <span class="font-bold text-xl">${cause}</span>
                                    <div class="mh-5 mt-1 w-full">
                                        <div class="flex items-center justify-between">
                                            <h2 class="text-xl text-center w-[20%]">${currentYear1}</h2>
                                            <h2 class="text-xl text-center w-[20%]">${currentYear2}</h2>
                                        </div>

                                        <hr class="border-t border-gray-300 my-1">

                                        <div class="flex items-center justify-between">
                                            <p class="font-bold text-center w-[20%]">${deaths1}</p>
                                            <p class="font-bold text-center w-[60%]">Number of deaths</p>
                                            <p class="font-bold text-center w-[20%]">${deaths2}</p>
                                        </div>

                                        <hr class="border-t border-gray-300 my-1">
                                        
                                        <div class="flex items-center justify-between">
                                            <p class="font-bold text-center w-[20%]">${perc1.toFixed(2)}%</p>
                                            <p class="font-bold text-center w-[60%]">% over total deaths</p>
                                            <p class="font-bold text-center w-[20%]">${perc2.toFixed(2)}%</p>
                                        </div>
                                    </div>

                        `)
                        .style("left", (event.pageX - 30) + "px")
                        .style("top", (event.pageY + 20) + "px")
                        .style("opacity", .9);

                    d3.selectAll("rect")
                        .filter(rect => rect !== d)
                        .transition()
                        .duration(200)
                        .style("opacity", 0.3);
                })
                .on("mouseout", function () {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);

                    d3.selectAll("rect")
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                });
        }
    }

    currentCountry = countrySelect.value;
    currentYear1 = yearSelector1.value;
    currentYear2 = yearSelector2.value;
    updateWaffles(2019, 2021);

    // Event listeners
    categories_checkbox.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCheckboxes = categories_checkbox.filter(d => d.checked);
            if (checkedCheckboxes.length === 0) {
                checkbox.checked = true;
                checkbox.style.cursor = 'not-allowed';
            } else {
                if (checkedCheckboxes.length === 1) {
                    checkedCheckboxes[0].style.cursor = 'not-allowed';
                    checkedCheckboxes[0].previousElementSibling.style.cursor = 'not-allowed';
                }
                else
                    categories_checkbox.forEach(d => {
                        d.style.cursor = 'pointer';
                        d.previousElementSibling.style.cursor = 'pointer'
                    });;

                updateWaffleChart(chart1);
                updateWaffleChart(chart2);
            }
        });
    });


    function disableYearOptions(selector) {
        const yearToDisable = (selector == yearSelector1) ? yearSelector2.value : yearSelector1.value;
        Array.from(selector.options).forEach(option => {
            option.disabled = (selector == yearSelector1) ? option.value >= yearToDisable : option.value <= yearToDisable;
        });
    }

    yearSelector1.addEventListener('change', () => {
        currentYear1 = +yearSelector1.value;
        yearData1 = countryData.filter(d => +d.year === currentYear1);
        disableYearOptions(yearSelector2);
        updateWaffleChart(chart1);
    });

    yearSelector2.addEventListener('change', () => {
        currentYear2 = +yearSelector2.value
        yearData2 = countryData.filter(d => +d.year === currentYear2);
        disableYearOptions(yearSelector1);
        updateWaffleChart(chart2);
    });

    countrySelect.addEventListener('change', () => {
        currentCountry = countrySelect.value;
        countryData = data.filter(d => d.country === currentCountry && d.sex === currentSex && d.age === currentAge);


        updateWaffles(currentYear1, currentYear2);
    });
}

waffleChart();
