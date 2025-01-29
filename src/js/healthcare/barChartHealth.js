function barChartHealth() {
    const width = 900;
    const height = 600;

    d3.csv("./../../../dataset/HEALTHCARE/MENTAL_HEALTH/clean/hlth_sha11_hc.csv", d => ({
        country: d.country,
        year: +d.year,
        month: +d.month,
        total_cases: +d.total_cases,
    })).then(expenditures => {
        console.log(expenditures);
    });
}

barChartHealth();