import { datasets } from "../utils.js";

function inflationChange() {
  const coicop = "All-items HICP"

  const inflationData = datasets.inflationData.filter(
    d => d.coicop === coicop && d.year >= "2019" && d.year <= "2023" && d.month === "12"
  ).map(d => ({
    country: d.country,
    year: d.year,
    value: d.value
  }));

  const changes = [];
  const grouped = inflationData.reduce((acc, curr) => {
    if (!acc[curr.country]) acc[curr.country] = {};
    acc[curr.country][curr.year] = parseFloat(curr.value);
    return acc;
  }, {});

  Object.keys(grouped).forEach(country => {
    const data = grouped[country];
    if (data["2019"] && data["2023"]) {
      const change = ((data["2023"] - data["2019"]) / data["2019"]) * 100;
      changes.push(change);
    }
  });

  const averageForEurope = changes.reduce((sum, val) => sum + val, 0) / changes.length;

  d3.select("#inflation-change-value")
    .style("color", averageForEurope < 0 ? "lightgreen" : "lightcoral")
    .text((averageForEurope > 0 ? '+' : '-') + averageForEurope.toFixed(2) + "%");
};

inflationChange()