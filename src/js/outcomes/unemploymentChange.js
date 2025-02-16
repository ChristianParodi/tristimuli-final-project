import { datasets } from "../utils.js";

function unemploymentChange() {
  const age = "Total"
  const sex = "Total"
  // const adj = "Seasonally adjusted data, not calendar adjusted data"
  const unit = "Thousand persons"
  const europe = "European Union"

  const unemploymentData = datasets.unemploymentData.filter(
    d => d.age === age && d.sex === sex && d.country === europe && d.unit === unit
  ).map(d => ({
    country: d["country"],
    unemployment2019: d["2019-12"],
    unemployment2020: d["2020-12"],
  }))[0]

  const change = ((unemploymentData.unemployment2020 - unemploymentData.unemployment2019) / unemploymentData.unemployment2019) * 100;

  d3.select("#unemployment-change-value")
    .style("color", change > 0 ? "lightcoral" : "lightgreen")
    .text((change > 0 ? '+' : "") + change.toFixed(2) + "%");
};

unemploymentChange()