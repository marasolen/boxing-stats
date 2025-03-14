let boxingData;

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#full-temporal-visualization").style("height", "90vh").attr("width", 1.3 * document.getElementById("temporal-visualization").clientHeight)
    d3.selectAll("#watch-temporal-visualization").style("height", "90vh").attr("width", 1.3 * document.getElementById("temporal-visualization").clientHeight)
    d3.selectAll("#instructor-visualization").style("height", "90vh").attr("width", 1.4 * document.getElementById("temporal-visualization").clientHeight)

    renderVisualization();

    d3.selectAll("text").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("temporal-visualization").clientWidth })
    d3.selectAll("tspan").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("temporal-visualization").clientWidth })

    d3.select("#disclaimer").style("display", +d3.select("svg").attr("width") > window.innerWidth ? "block" : "none");
};

window.onresize = resizeAndRender;

const setupFullTemporalVisualization = () => {
    const containerWidth = document.getElementById("full-temporal-visualization").clientWidth;
    const containerHeight = document.getElementById("full-temporal-visualization").clientHeight;

    const margin = {
        top: 0.08 * containerHeight,
        right: 0 * containerWidth,
        bottom: 0.01 * containerHeight,
        left: 0.085 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#full-temporal-visualization");
    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
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

    resizeAndRender();
});