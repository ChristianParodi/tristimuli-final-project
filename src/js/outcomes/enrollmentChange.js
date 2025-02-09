import { datasets } from "../utils.js";

function enrollmentChange() {
  const age = "Total"
  const sex = "Total"
  const level = "Tertiary education (levels 5-8)"
  const europe = "European Union"

  const enrollmentData = datasets.educationData.filter(
    d => d.age === age && d.sex === sex && d.country === europe && d.level === level
  ).map(d => ({
    country: d["country"],
    enrollments2019: d["2019"],
    enrollments2022: d["2022"],
  }))[0]

  const change = ((enrollmentData.enrollments2022 - enrollmentData.enrollments2019) / enrollmentData.enrollments2019) * 100;

  d3.select("#enrollment-change-value")
    .text(change.toFixed(2) + "%");
};

enrollmentChange()