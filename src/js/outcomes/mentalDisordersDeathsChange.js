async function loadMentalDeathsChange() {
  return await d3.csv("./../../../dataset/MENTAL_HEALTH/clean/melted_estat_hlth_cd_aro_ISO2_NEW.csv");
}

async function computeChange() {
  const age = "Total";
  const sex = "Total";
  const cause = [
    "Drug dependence",
    "Intentional self-harm",
    "Use of alcohol"
  ];

  const mentalData = await loadMentalDeathsChange();
  const filteredData = mentalData.filter(d =>
    d.age === age &&
    d.sex === sex &&
    cause.includes(d.cause) &&
    (+d.year === 2019 || +d.year === 2021)
  );

  const mentalData2019 = filteredData.filter(d => +d.year === 2019).map(d => ({
    country: d.country,
    cause: d.cause,
    deaths: +d.deaths
  }))
  const mentalData2021 = filteredData.filter(d => +d.year === 2021).map(d => ({
    country: d.country,
    cause: d.cause,
    deaths: +d.deaths
  }))

  // Compute mean mental deaths for each cause for 2019 and 2021
  const causeMeans2019 = {};
  const causeMeans2021 = {};

  cause.forEach(c => {
    const data2019 = mentalData2019.filter(d => d.cause === c);
    const data2021 = mentalData2021.filter(d => d.cause === c);
    causeMeans2019[c] = d3.mean(data2019, d => d.deaths);
    causeMeans2021[c] = d3.mean(data2021, d => d.deaths);
  });

  const changes = cause.map(c => (causeMeans2021[c] - causeMeans2019[c]) / causeMeans2019[c]);
  return d3.mean(changes);
}

async function mentalDisordersDeathsChange() {
  const meanChange = await computeChange();
  const change = meanChange * 100;

  d3.select("#mental-disorders-deaths-change-value")
    .style("color", change > 0 ? "lightcoral" : "lightgreen")
    .text((change > 0 ? '+' : "") + change.toFixed(2) + "%");
};

await mentalDisordersDeathsChange()
