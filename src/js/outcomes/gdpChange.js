import { datasets } from "../utils.js";

function gdpChange() {
  const unit = "Contribution to GDP growth, percentage point change compared to same period in previous year"
  const adj = "Seasonally and calendar adjusted data";
  const europe = "European Union - 27 countries (from 2020)"

  const gdpData = datasets.GDPData.filter(
    d => d["unit"] === unit && d["s_adj"] === adj && d["country"] === europe
  ).map(d => ({
    country: d["country"],
    gdp2019: d["2019-Q4"],
    gdp2023: d["2023-Q4"],
  }))[0]

  const change = ((gdpData.gdp2023 - gdpData.gdp2019) / gdpData.gdp2019) * 100;

  d3.select("#gdp-change-value")
    .style("color", change > 0 ? "lightgreen" : "lightcoral")
    .text(change.toFixed(2) + "%");
};

gdpChange()