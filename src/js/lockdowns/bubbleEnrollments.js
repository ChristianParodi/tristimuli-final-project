function bubbleEnrollments() {
  // Sample data structure (replace with your own dataset)
  const data = [
    { lockdownDays: 10, enrollmentChange: 5, population: 20000, avgEducation: 0.8 },
    { lockdownDays: 20, enrollmentChange: 10, population: 45000, avgEducation: 0.6 },
    { lockdownDays: 30, enrollmentChange: -5, population: 50000, avgEducation: 0.9 },
    { lockdownDays: 40, enrollmentChange: 0, population: 30000, avgEducation: 0.7 },
    { lockdownDays: 50, enrollmentChange: 15, population: 35000, avgEducation: 0.65 }
  ];

  // Set up dimensions
  const width = 600;
  const height = 400;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };

  // Create SVG
  const svg = d3.select('#bubble-enrollments-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.lockdownDays))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.enrollmentChange))
    .range([height - margin.bottom, margin.top]);

  const r = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.population)])
    .range([0, 20]);

  const color = d3.scaleSequential(d3.interpolateBlues)
    .domain(d3.extent(data, d => d.avgEducation));

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Bubbles
  svg.selectAll('circle')
    .data(data)
    .enter().append('circle')
    .attr('cx', d => x(d.lockdownDays))
    .attr('cy', d => y(d.enrollmentChange))
    .attr('r', d => r(d.population))
    .attr('fill', d => color(d.avgEducation))
    .attr('opacity', 0.7);

  // Labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .text('Lockdown Days');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .text('Change in Enrollments (%)');
}

bubbleEnrollments();