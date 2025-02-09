async function loadMentalDeathsChange() {
  return await d3.csv("./../../../dataset/MENTAL_HEALTH/clean/melted_estat_hlth_cd_aro_ISO2_NEW.csv");
}

async function computeChange() {
  const age = "Total";
  const sex = "Total";
  const cause = "Mental and behavioural disorders"
  const mentalData = await loadMentalDeathsChange();
  const filteredData = mentalData.filter(d =>
    d.age === age &&
    d.sex === sex &&
    d.cause === cause &&
    (+d.year === 2019 || +d.year === 2020)
  );

  const mentalData2019 = filteredData.filter(d => +d.year === 2019).map(d => +d.deaths)
  const mentalData2021 = filteredData.filter(d => +d.year === 2020).map(d => +d.deaths)

  const meanMentalData2019 = mentalData2019.reduce((sum, value) => sum + value, 0) / mentalData2019.length;
  const meanMentalData2021 = mentalData2021.reduce((sum, value) => sum + value, 0) / mentalData2021.length;

  return (meanMentalData2021 - meanMentalData2019) / meanMentalData2019 * 100;
}

async function mentalDeathsChange() {
  const change = await computeChange();

  d3.select("#mental-deaths-change-value")
    .style("color", change > 0 ? "lightcoral" : "lightgreen")
    .text((change > 0 ? '+' : "") + change.toFixed(2) + "%");
};

await mentalDeathsChange()