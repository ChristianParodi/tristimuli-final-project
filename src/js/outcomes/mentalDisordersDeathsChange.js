async function loadMentalDeathsChange() {
  return await d3.csv("./../../../dataset/MENTAL_HEALTH/clean/mental_grouped_only.csv");
}

async function mentalDisordersDeathsChange() {
  const age = "Total"
  const sex = "Total"
  const cause = "Mental and behavioural disorders"
  const europe = "European Union - 27 countries (from 2020)"

  const mentalData = await loadMentalDeathsChange()
  const filteredData = mentalData.filter(
    d => d.age === age && d.sex === sex && d.country === europe && d.cause === cause
  ).map(d => ({
    country: d["country"],
    deaths2019: d["2019"],
    deaths2021: d["2021"],
  }))[0]

  console.log(filteredData)
  const change = ((filteredData.deaths2019 - filteredData.deaths2021) / filteredData.deaths2019) * 100;

  d3.select("#mental-disorders-deaths-change-value")
    .style("color", change > 0 ? "lightcoral" : "lightgreen")
    .text((change > 0 ? '+' : "") + change.toFixed(2) + "%");
};

await mentalDisordersDeathsChange()