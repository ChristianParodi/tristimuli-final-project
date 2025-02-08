import { datasets, europeanCountries, population } from "../utils.js"

function bubbleEnrollments() {
  // total number of lockdown days per country
  let lockdownData = datasets.lockdownData
    .filter(d => d.measure == "StayHomeOrder")
    .reduce((acc, d) => {
      if (!acc[d.country]) {
        acc[d.country] = { ISO2: d.ISO2, country: d.country, lockdownDays: 0 };
      }
      acc[d.country].lockdownDays += (new Date(d.date_end) - new Date(d.date_start)) / (1000 * 60 * 60 * 24);
      return acc;
    }, {});

  // population of the different countries present in lockdownData
  const lockdownPopulation = population.filter(d => lockdownData.hasOwnProperty(d.country));

  // put NaN when there's no data available
  europeanCountries.forEach(country => {
    if (!lockdownData[country]) {
      lockdownData[country] = { ISO2: null, country: country, lockdownDays: NaN };
    }
  });

  lockdownData = Object.values(lockdownData);

  // enrollment change for each country from 2019 to 2021
  const enrollmentChange = datasets.educationData
    .filter(d => d.age === "Total" && d.sex === "Total" && d.level === "Tertiary education (levels 5-8)")
    .map(d => {
      const change = ((d['2021'] - d['2019']) / d['2019']) * 100;
      return { country: d.country, enrollmentChange: change };
    });

  // merge lockdownData and enrollmentChange
  const data = europeanCountries.map(country => {
    const lockdown = lockdownData.find(d => d.country === country);
    const enrollment = enrollmentChange.find(d => d.country === country);
    const pop = lockdownPopulation.find(d => d.country === country && d.year === 2021);
    return {
      ISO2: lockdown?.ISO2 || null,
      country: country,
      lockdownDays: lockdown?.lockdownDays || NaN,
      enrollmentChange: enrollment?.enrollmentChange || NaN,
      population: pop?.population || NaN
    };
  }).filter(d => !isNaN(d.lockdownDays));

  // tooltip
  const tooltip = d3.select('#section3').append('div')
    .attr('class', 'tooltip-bubble-lockdown')
    .style('position', 'absolute')
    .style('background', '#fff')
    .style('padding', '8px')
    .style('border', '1px solid #000')
    .style('border-radius', '4px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('color', 'black');

  // dimensions
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select('#bubble-lockdown')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // X scale
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.lockdownDays)])
    .range([margin.left, width - margin.right])
    .nice();

  // Y scale
  const maxEnrChange = 10; // d3.max(data, d => d.enrollmentChange)
  const y = d3.scaleLinear()
    .domain([-maxEnrChange, maxEnrChange])
    .range([height - margin.bottom, margin.top]);

  // Bubble radius
  const r = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.population)])
    .range([0, 30]);

  // draw Y axis
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('fill', 'black')
    .style('font-size', '14px');

  // draw X axis
  svg.append('g')
    .attr('transform', `translate(0,${y(0)})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('fill', 'black')
    .style('font-size', '14px')
    .filter(d => d === 0) // Move the 0
    .attr('dx', '8px') // Shift right
    .attr('dy', '5px'); // Shift down

  svg.selectAll('.domain, .tick line')
    .attr('stroke', 'black');

  svg.selectAll("circle")
    .attr("fill", d => bubbleColorScale(d.population));

  // bubbles
  const bubbleGroups = svg.selectAll('.bubble-group')
    .data(data)
    .enter().append('g')
    .attr('class', 'bubble-group')
    .attr('transform', d => `translate(${x(d.lockdownDays)}, ${y(d.enrollmentChange)})`)
    .on('mouseover', (_, d) => {
      const svgTop = svg.node().getBoundingClientRect().top + window.scrollY;
      const svgLeft = svg.node().getBoundingClientRect().left + window.scrollX;
      tooltip.transition().duration(200).style('opacity', 0.9);
      const populationTooltip =
        d.population >= 1e9
          ? (d.population / 1e9).toFixed(1) + 'B'
          : d.population >= 1e6
            ? (d.population / 1e6).toFixed(1) + 'M'
            : d.population >= 1e5
              ? (d.population / 1e3).toFixed(0) + 'k'
              : d.population.toLocaleString();
      const enrollmentChangeTooltip =
        d.enrollmentChange.toFixed(2).startsWith("-") ?
          `<span style='color: red;'>${d.enrollmentChange.toFixed(2)}%</span>` :
          `<span style='color: green;'>+${d.enrollmentChange.toFixed(2)}%</span>`;

      tooltip.html(`
        <strong>${d.country}</strong><br/>
        Population: ${populationTooltip}<br/>
        Enrollment Change: ${enrollmentChangeTooltip}<br/>
        Lockdown days: ${d.lockdownDays}
      `)
        .style('left', `${svgLeft + x(d.lockdownDays) + r(d.population) + 10}px`)
        .style('top', `${svgTop + y(d.enrollmentChange) - tooltip.node().offsetHeight / 2}px`);
    })
    .on('mouseout', () => {
      tooltip.transition().duration(500).style('opacity', 0);
    });

  // flags
  const defs = svg.append("defs");

  // Create a clipPath for each country
  defs.selectAll("clipPath")
    .data(data)
    .enter()
    .append("clipPath")
    .attr("id", d => `clip-${d.country.replace(/\s+/g, '-').toLowerCase()}`) // Unique ID
    .append("circle")
    .attr("r", d => r(d.population)) // Radius based on population or any other scaling
    .attr("cx", 0)
    .attr("cy", 0);

  bubbleGroups.append('image')
    .attr('xlink:href', d => `https://cdn.jsdelivr.net/npm/flag-icon-css@4.1.7/flags/1x1/${d.ISO2.toLowerCase()}.svg`)
    .attr('width', d => r(d.population) * 3)
    .attr('height', d => r(d.population) * 3)
    .attr('x', d => -r(d.population) * 1.5)
    .attr('y', d => -r(d.population) * 1.5)
    .attr('clip-path', d => `url(#clip-${d.country.replace(/\s+/g, '-').toLowerCase()})`)
    .attr('preserveAspectRatio', 'xMidYMid slice');

  // Add border
  bubbleGroups.append('circle')
    .attr('r', d => r(d.population))
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-width', 1);

  // X label
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', 'black')
    .text('Lockdown Days');

  // Y label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', 'black')
    .text('Change in Tertiary Enrollments (%)');

  /**
   * LEGEND
   */
  drawLegend(lockdownPopulation);
}

function drawLegend(lockdownPopulation) {
  const legendWidth = 200;
  const legendHeight = 200;
  const legendMargin = 15;
  const legendRadius = 30;
  const svgLegend = d3.select('#bubble-lockdown-legend')
    .append('svg')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('border', '1px solid white')
    .style("border-radius", '0.3rem')

  svgLegend.append('text')
    .attr('x', legendWidth / 2)
    .attr('y', legendMargin + 15)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .style('font-size', '16px')
    .style("font-weight", "bold")
    .text('Country population');

  const legendGroup = svgLegend.append('g')
    .attr("transform", `translate(${legendRadius + legendMargin}, ${legendHeight / 5 + 20})`);

  const legendData = [
    { scale: 1 / 3, y: 0 },
    { scale: 1 / 2, y: legendRadius * 1.2 },
    { scale: 1, y: legendRadius * 3.12 }
  ];

  legendData.forEach(d => {
    const population = d3.max(lockdownPopulation, d => d.population) * d.scale;
    let populationText;
    if (population >= 1e9) {
      populationText = `${(population / 1e9).toFixed(1)}B people`;
    } else if (population >= 1e6) {
      populationText = `${(population / 1e6).toFixed(1)}M people`;
    } else if (population >= 1e3) {
      populationText = `${(population / 1e3).toFixed(1)}k people`;
    } else {
      populationText = `${population.toLocaleString()} people`;
    }

    legendGroup.append('circle')
      .attr('cx', 0)
      .attr('cy', d.y)
      .attr('r', legendRadius * d.scale)
      .attr('fill', 'none')
      .attr('stroke', 'white');

    legendGroup.append('line')
      .attr('x1', 0)
      .attr('y1', d.y)
      .attr('x2', legendRadius * d.scale)
      .attr('y2', d.y)
      .attr('stroke', 'white');

    legendGroup.append('text')
      .attr('x', legendRadius * d.scale + 10)
      .attr('y', d.y)
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .text(populationText);
  });
}

bubbleEnrollments();
