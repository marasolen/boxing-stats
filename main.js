let boxingData;

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#full-temporal-visualization").style("height", "60vh").attr("width", 1.8 * document.getElementById("full-temporal-visualization").clientHeight)
    d3.selectAll("#watch-temporal-visualization").style("height", "90vh").attr("width", 1.3 * document.getElementById("full-temporal-visualization").clientHeight)
    d3.selectAll("#instructor-visualization").style("height", "90vh").attr("width", 1.4 * document.getElementById("full-temporal-visualization").clientHeight)

    renderVisualization();

    d3.selectAll("text").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("full-temporal-visualization").clientWidth })
    d3.selectAll("tspan").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("full-temporal-visualization").clientWidth })

    d3.select("#disclaimer").style("display", +d3.select("svg").attr("width") > window.innerWidth ? "block" : "none");
};

window.onresize = resizeAndRender;

const setupFullTemporalVisualization = () => {
    const containerWidth = document.getElementById("full-temporal-visualization").clientWidth;
    const containerHeight = document.getElementById("full-temporal-visualization").clientHeight;

    const margin = {
        top: 0.08 * containerHeight,
        right: 0 * containerWidth,
        bottom: 0.05 * containerHeight,
        left: 0.085 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#full-temporal-visualization");
    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xAxisG = chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height})`);
    const yAxisG = chartArea.append('g')
        .attr('class', 'axis y-axis');

    chartArea.append('defs')
        .append('clipPath')
        .attr('id', 'chart-mask')
        .append('rect')
        .attr('width', width)
        .attr('height', height);

    const chart = chartArea.append("g")
        .attr('clip-path', 'url(#chart-mask)');

    const xScale = d3.scaleTime()
        .domain([new Date(2023, 0, 0), new Date(2025, 2, 31)])
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .range([height, 0]);

    const monthData = d3.rollups(boxingData, d => d.length, c => strftime("%Y-%m", c.datetime) + "-01 12:00");
    console.log(monthData)
    const weekData = d3.rollups(boxingData, d => d.length, c => strftime("%Y-%W", c.datetime));

    yScale.domain([0, d3.max(monthData.map(d => d[1]))]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    const getNextMonth = datestring => {
        const date = new Date(datestring);
        console.log(date, new Date(new Date(date).setMonth(date.getMonth() + 1)));
        return new Date(new Date(date).setMonth(date.getMonth() + 1));
    };

    chart.selectAll(".month-bars")
        .data(monthData)    
        .join("rect")
        .attr("class", "month-bars")
        .attr("fill", "lightgrey")
        .attr("stroke", "white")
        .attr("stroke-width", "2px")
        .attr("x", d => xScale(new Date(d[0])))
        .attr("y", d => yScale(d[1]))
        .attr("width", d => xScale(getNextMonth(d[0])) - xScale(new Date(d[0])))
        .attr("height", d => height - yScale(d[1]));

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    chartArea.selectAll(".axis text").attr("text-multiplier", 1);
};

const setupWatchTemporalVisualization = () => {
    const containerWidth = document.getElementById("watch-temporal-visualization").clientWidth;
    const containerHeight = document.getElementById("watch-temporal-visualization").clientHeight;

    const margin = {
        top: 0.08 * containerHeight,
        right: 0 * containerWidth,
        bottom: 0.01 * containerHeight,
        left: 0.085 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#watch-temporal-visualization");
    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
};

const setupInstructorVisualization = () => {
    const containerWidth = document.getElementById("instructor-visualization").clientWidth;
    const containerHeight = document.getElementById("instructor-visualization").clientHeight;

    const margin = {
        top: 0.01 * containerHeight,
        right: 0.01 * containerWidth,
        bottom: 0.01 * containerHeight,
        left: 0.05 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#instructor-visualization");
    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
};

const renderVisualization = () => {
    setupFullTemporalVisualization();
    setupWatchTemporalVisualization();
    setupInstructorVisualization();
};

Promise.all([d3.json('data/boxing-data.json')]).then(([_boxingData]) => {
    boxingData = _boxingData;
    boxingData.forEach(c => c.datetime = new Date(c.date + " " + c.time));
    boxingData.sort((a, b) => a.datetime - b.datetime);

    resizeAndRender();
});