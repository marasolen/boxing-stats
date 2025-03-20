let boxingData, temporalAnomalies;
const tooltipPadding = 15;

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#full-temporal-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("full-temporal-visualization-container").clientWidth, 1.3 * document.getElementById("full-temporal-visualization").clientHeight]));

    d3.selectAll("#watch-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("watch-visualization-container").clientWidth, 1.3 * document.getElementById("watch-visualization").clientHeight]));

    d3.selectAll("#hour-temporal-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("hour-temporal-visualization-container").clientWidth, 1.3 * document.getElementById("hour-temporal-visualization").clientHeight]));

    d3.selectAll("#instructor-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("instructor-visualization-container").clientWidth, 1.3 * document.getElementById("instructor-visualization").clientHeight]));

    d3.selectAll(".visualization-container")
        .style("border-radius", 0.06 * document.getElementById("full-temporal-visualization").clientHeight + "px")

    renderVisualization();

    d3.selectAll("text")
        .attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("full-temporal-visualization").clientWidth });

    d3.select("#tooltip")
        .style("border-radius", 0.02 * document.getElementById("full-temporal-visualization").clientHeight + "px")

    d3.select("#disclaimer")
        .style("display", +d3.select("svg").attr("width") > window.innerWidth ? "block" : "none");
};

window.onresize = resizeAndRender;

const setTooltip = (selection, innerHtml) => {
    selection
        .on('mouseover', (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px')
                .html(innerHtml(d));
        })
        .on("mousemove", (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px');
        })
        .on('mouseleave', () => {
            d3.select("#tooltip").style("display", "none");
        });
};

const setupFullTemporalVisualization = () => {
    const containerWidth = document.getElementById("full-temporal-visualization").clientWidth;
    const containerHeight = document.getElementById("full-temporal-visualization").clientHeight;

    const margin = {
        top: 0 * containerHeight,
        right: 0.04 * containerWidth,
        bottom: 0.3 * containerHeight,
        left: 0.04 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#full-temporal-visualization");
    const topChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const bottomChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top + height + 0.2 * margin.bottom})`);

    const xAxisG = topChartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height})`);

    const xAxisYearG = bottomChartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${0.6 * margin.bottom})`);

    topChartArea.append('defs')
        .append('clipPath')
        .attr('id', 'top-chart-mask')
        .append('rect')
        .attr('width', width)
        .attr('height', height);

    const topChart = topChartArea.append("g")
        .attr('clip-path', 'url(#top-chart-mask)');

    bottomChartArea.append('defs')
        .append('clipPath')
        .attr('id', 'bottom-chart-mask')
        .append('rect')
        .attr('width', width)
        .attr('height', 0.6 * margin.bottom);

    const bottomChart = bottomChartArea.append("g")
        .attr('clip-path', 'url(#bottom-chart-mask)');

    const xScale = d3.scaleTime()
        .domain([new Date(2022, 11, 29), new Date(2025, 3, 4)])
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .range([height, 0]);
    const yScaleYear = d3.scaleLinear()
        .range([0.6 * margin.bottom, 0]);

    const yearData = d3.rollups(
        boxingData, 
        d => d.length, 
        c => dayjs(c.datetime).format("YYYY-01-01 12:00")
    );
    const monthData = d3.rollups(
        boxingData, 
        d => d.length, 
        c => dayjs(c.datetime).format("YYYY-MM-01 12:00")
    );
    const weekData = d3.rollups(
        boxingData, 
        d => d.length, 
        c => {
            let day = dayjs(c.datetime)
            day = day.subtract((+day.format("d") + 6) % 7, 'day')
            return day.format("YYYY-MM-DD");
        }
    );

    for (let i = 0; i < weekData.length - 1; i++) {
        let date = dayjs(weekData[i][0]).add(7, "day");
        if (weekData[i + 1][0] !== date.format("YYYY-MM-DD")) {
            weekData.splice(i + 1, 0, [date, 0]);
        }
    }

    yScale.domain([0, d3.max(monthData.map(d => d[1])) + 5]);
    yScaleYear.domain([0, d3.max(yearData.map(d => d[1]))]);

    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%B 1st'))
        .tickSizeOuter(0);

    const xAxisYear = d3.axisBottom(xScale)
        .ticks(3)
        .tickFormat(d3.timeFormat('%Y'))
        .tickSizeOuter(0);

    const getNextMonth = datestring => {
        const date = new Date(datestring);
        return new Date(new Date(date).setMonth(date.getMonth() + 1));
    };

    const monthBars = topChart.selectAll(".month-bars")
        .data(monthData)    
        .join("rect")
        .attr("class", "month-bars")
        .attr("fill", "#A54657")
        .attr("stroke", "white")
        .attr("stroke-width", "2px")
        .attr("x", d => xScale(new Date(d[0])))
        .attr("y", d => yScale(d[1]))
        .attr("rx", width * 0.007)
        .attr("ry", width * 0.007)
        .attr("width", d => xScale(getNextMonth(d[0])) - xScale(new Date(d[0])))
        .attr("height", d => 2 * (height - yScale(d[1])));
    setTooltip(monthBars, d => `<b>${dayjs(d[0]).format("MMMM, YYYY")}</b><br><i>${d[1]} classes</i>`);

    topChart.selectAll(".gridline")
        .data([
            ["2023-05-15", "2024-03-01", 36]
        ])    
        .join("line")
        .attr("class", "gridline")
        .attr("x1", d => xScale(new Date(d[0])))
        .attr("x2", d => xScale(new Date(d[1])))
        .attr("y1", d => yScale(d[2]))
        .attr("y2", d => yScale(d[2]))
        .attr("stroke", "#333333")
        .attr("stroke-width", width * 0.0015);

    topChart.selectAll(".gridtext")
        .data([
            ["2023-05-10", 35.6, "36 classes"]
        ])    
        .join("text")
        .attr("class", "gridtext")
        .attr("x", d => xScale(new Date(d[0])))
        .attr("y", d => yScale(d[1]))
        .attr("text-multiplier", 1.5)
        .attr("text-anchor", "end")
        .attr("cursor", "default")
        .text(d => d[2]);
        
    const line = d3.line().x(d => xScale(dayjs(d[0], "YYYY-WW"))).y(d => yScale(d[1]))
    
    topChartArea.selectAll(".week-line")
        .data([line(weekData)])    
        .join("path")
        .attr("class", "week-line")
        .attr("stroke", "#111111")
        .attr("stroke-width", width * 0.003)
        .attr("fill", "none")
        .attr("d", d => d);
    
    const weekCircles = topChartArea.selectAll(".week-circle")
        .data(weekData)    
        .join("circle")
        .attr("class", "week-circle")
        .attr("fill", "#111111")
        .attr("cx", d => xScale(new Date(d[0])))
        .attr("cy", d => yScale(d[1]))
        .attr("r", width * 0.004)
    setTooltip(weekCircles, d => `<b>${dayjs(d[0]).format("Week of MMMM D, YYYY")}</b><br><i>${d[1]} classes</i>`);
    
    const notableEventGroups = topChartArea.selectAll(".notable-event")
        .data(temporalAnomalies)    
        .join("g")
        .attr("class", "notable-event")
        .attr("transform", d => `translate(${xScale(new Date(d[0]))}, ${yScale(d[1])})`);
    
    const notableEventCircles = notableEventGroups.selectAll(".notable-event-circle")
        .data(d => [d])
        .join("circle")
        .attr("class", "notable-event-circle")
        .attr("fill", "#aaaaaa")
        .attr("fill-opacity", 0.8)
        .attr("r", Math.sqrt(width * 0.25))
    setTooltip(notableEventCircles, d => `<p>${d[2]}</p>`);
    
    const notableEventTexts = notableEventGroups.selectAll(".notable-event-text")
        .data(d => [d])
        .join("text")
        .attr("class", "notable-event-text")
        .attr("x", width * 0.0005)
        .attr("y", width * 0.005)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .attr("cursor", "default")
        .text("?");
    setTooltip(notableEventTexts, d => `<p>${d[2]}</p>`);

    const getNextYear = datestring => {
        const date = new Date(datestring);
        return date.getFullYear() === 2025 ? new Date(2025, 3, 1) : new Date(new Date(date).setYear(date.getFullYear() + 1));
    };

    const yearBars = bottomChart.selectAll(".year-bars")
        .data(yearData)    
        .join("rect")
        .attr("class", "year-bars")
        .attr("fill", "#A54657")
        .attr("stroke", "white")
        .attr("stroke-width", "2px")
        .attr("x", d => xScale(new Date(d[0])))
        .attr("y", d => yScaleYear(d[1]))
        .attr("rx", width * 0.007)
        .attr("ry", width * 0.007)
        .attr("width", d => xScale(getNextYear(d[0])) - xScale(new Date(d[0])))
        .attr("height", d => 2 * (0.6 * margin.bottom - yScaleYear(d[1])));
    setTooltip(yearBars, d => `<b>${dayjs(d[0]).format("YYYY")}</b><br><i>${d[1]} classes</i>`);

    xAxisG.call(xAxis);
    xAxisYearG.call(xAxisYear);

    topChartArea.selectAll(".axis text").attr("text-multiplier", 1.25);
    bottomChartArea.selectAll(".axis text").attr("text-multiplier", 1.25);
};

const setupWatchVisualization = () => {
    const containerWidth = document.getElementById("watch-visualization").clientWidth;
    const containerHeight = document.getElementById("watch-visualization").clientHeight;

    const margin = {
        top: 0.04 * containerHeight,
        right: 0.04 * containerWidth,
        bottom: 0.1 * containerHeight,
        left: 0.08 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#watch-visualization");
    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xAxisG = chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height})`);

    const yAxisG = chartArea.append('g')
        .attr('class', 'axis y-axis')

    const fitnessData = boxingData.filter(d => "calories" in d);

    const xScale = d3.scaleLinear()
        .domain([d3.min(fitnessData, d => d.calories) - 10, d3.max(fitnessData, d => d.calories) + 10])
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([d3.min(fitnessData, d => d.avghr) - 5, d3.max(fitnessData, d => d.avghr) + 5])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(8)
        .tickSize(-height)
        .tickSizeOuter(0)
        .tickPadding(10);
    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-width)
        .tickSizeOuter(0)
        .tickPadding(10);
    
    const points = chartArea.selectAll(".class-circle")
        .data(fitnessData)    
        .join("circle")
        .attr("class", "class-circle")
        .attr("fill", "#A54657")
        .attr("cx", d => xScale(d.calories))
        .attr("cy", d => yScale(d.avghr))
        .attr("fill-opacity", 0.7)
        .attr("r", width * 0.012);
    setTooltip(points, 
        d => `<b>${dayjs(d.date).format("MMMM D, YYYY")} at ${d.time}</b><br>
            <i>Instructor: ${d.instructor.split(" ").join(" & ")}</i><br>
            <i>Calories Burned: ${d.calories}</i><br>
            <i>Average Heart Rate: ${d.avghr} BPM</i>`);

    chartArea.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom * 0.75)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Calories Burned")

    chartArea.append("text")
        .attr("transform", `rotate(${-90})`)
        .attr("x", -height / 2)
        .attr("y", -margin.left * 0.5)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Average Heart Rate (BPM)")

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    chartArea.selectAll(".axis text").attr("text-multiplier", 1.25);
};

const setupHourTemporalVisualization = () => {
    const containerWidth = document.getElementById("hour-temporal-visualization").clientWidth;
    const containerHeight = document.getElementById("hour-temporal-visualization").clientHeight;

    const margin = {
        top: 0.12 * containerHeight,
        center: 0.04 * containerWidth,
        right: 0.05 * containerWidth,
        bottom: 0.08 * containerHeight,
        left: 0.05 * containerWidth
    };

    const leftWidthPortion = 0.3;

    const leftWidth = leftWidthPortion * (containerWidth - (margin.right + margin.left + margin.center));
    const rightWidth = (1 - leftWidthPortion) * (containerWidth - (margin.right + margin.left + margin.center));
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#hour-temporal-visualization");
    const leftChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const rightChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left + leftWidth + margin.center},${margin.top})`);

    const xAxisGL = leftChartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height})`);

    const xAxisGR = rightChartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height})`);

    const yAxisGL = leftChartArea.append('g')
        .attr('class', 'axis y-axis');

    const yAxisGR = rightChartArea.append('g')
        .attr('class', 'axis y-axis');

    leftChartArea.append('defs')
        .append('clipPath')
        .attr('id', 'left-chart-mask')
        .append('rect')
        .attr('width', leftWidth)
        .attr('height', height);

    rightChartArea.append('defs')
        .append('clipPath')
        .attr('id', 'right-chart-mask')
        .append('rect')
        .attr('width', rightWidth)
        .attr('height', height);

    const leftChart = leftChartArea.append("g")
        .attr('clip-path', 'url(#left-chart-mask)');

    const rightChart = rightChartArea.append("g")
        .attr('clip-path', 'url(#right-chart-mask)');

    let dayOfWeek = {
        "Monday": 0,
        "Tuesday": 0,
        "Wednesday": 0,
        "Thursday": 0,
        "Friday": 0,
        "Saturday": 0,
        "Sunday": 0
    }
    const xScaleL = d3.scaleBand()
        .domain(Object.keys(dayOfWeek))
        .range([0, leftWidth])
        .paddingOuter(0.3);
    
    let fiveMinuteIntervals = {};
    let currentTime = dayjs("2024-03-19 9:00")
    while (currentTime.isBefore(dayjs("2024-03-19 20:25"))) {
        fiveMinuteIntervals[currentTime.format("HH:mm")] = 0;
        currentTime = currentTime.add(5, "minute");
    }

    const xScaleR = d3.scaleTime()
        .domain([dayjs("2025-03-19 9:00").toDate(), dayjs("2025-03-19 20:30").toDate()])
        .range([0, rightWidth]);

    boxingData.forEach(d => {
        let datetime = dayjs(d.date + " " + d.time);
        dayOfWeek[datetime.format("dddd")]++;
        for (let i = 0; i < 10; i++) {
            fiveMinuteIntervals[datetime.format("HH:mm")]++;
            datetime = datetime.add(5, "minute");
        }
    });

    dayOfWeek = Object.entries(dayOfWeek);
    fiveMinuteIntervals = Object.entries(fiveMinuteIntervals);
    
    const yScaleL = d3.scaleLinear()
        .domain([0, d3.max(dayOfWeek.map(d => d[1]))])
        .range([height, 0]);
    const yScaleR = d3.scaleLinear()
        .domain([0, d3.max(fiveMinuteIntervals.map(d => d[1]))])
        .range([height, 0]);

    const xAxisL = d3.axisBottom(xScaleL)
        .tickFormat(d => d.slice(0, 3))
        .tickSizeOuter(0);
    const xAxisR = d3.axisBottom(xScaleR)
        .tickFormat(d => dayjs(d).format("H:mm"))
        .ticks(12)
        .tickSizeOuter(0);

    const yAxisL = d3.axisLeft(yScaleL)
        .tickSize(-leftWidth);
    const yAxisR = d3.axisLeft(yScaleR)
        .tickSize(-rightWidth);

    const dayBars = leftChart.selectAll(".day-bars")
        .data(dayOfWeek)    
        .join("rect")
        .attr("class", "day-bars")
        .attr("fill", "#A54657")
        .attr("stroke", "white")
        .attr("stroke-width", "2px")
        .attr("x", d => xScaleL(d[0]))
        .attr("y", d => yScaleL(d[1]))
        .attr("rx", (containerWidth - margin.left - margin.right) * 0.007)
        .attr("ry", (containerWidth - margin.left - margin.right) * 0.007)
        .attr("width", xScaleL.bandwidth())
        .attr("height", 2 * height);
    setTooltip(dayBars, d => `<b>${d[0]}</b><br><i>${d[1]} classes</i>`);

    const timeBars = rightChart.selectAll(".time-bars")
        .data(fiveMinuteIntervals)    
        .join("rect")
        .attr("class", "time-bars")
        .attr("fill", "#A54657")
        .attr("x", d => xScaleR(dayjs("2025-03-19 " + d[0]).toDate()))
        .attr("y", d => yScaleR(d[1]))
        .attr("width", 1.1 * rightWidth / fiveMinuteIntervals.length)
        .attr("height", 2 * height);
    setTooltip(timeBars, d => `<b>${d[0]}-${dayjs("2025-03-19 " + d[0]).add(5, "minute").format("HH:mm")}</b><br><i>${d[1]} classes</i>`);

    leftChartArea.append("text")
        .attr("x", leftWidth / 2)
        .attr("y", -0.5 * margin.top)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Classes per Day of Week")

    rightChartArea.append("text")
        .attr("x", rightWidth / 2)
        .attr("y", -0.5 * margin.top)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Classes per Time of Day")

    xAxisGL.call(xAxisL);
    xAxisGR.call(xAxisR);

    yAxisGL.call(yAxisL);
    yAxisGR.call(yAxisR);

    leftChartArea.selectAll(".axis text").attr("text-multiplier", 1.25);
    leftChartArea.selectAll(".y-axis .domain").remove();
    rightChartArea.selectAll(".axis text").attr("text-multiplier", 1.25);
    rightChartArea.selectAll(".y-axis .domain").remove();
};

const setupInstructorVisualization = () => {
    const containerWidth = document.getElementById("instructor-visualization").clientWidth;
    const containerHeight = document.getElementById("instructor-visualization").clientHeight;

    const margin = {
        top: 0.08 * containerHeight,
        right: 0.04 * containerWidth,
        bottom: 0.1 * containerHeight,
        left: 0.08 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#instructor-visualization");
    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xAxisG = chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height})`);

    const yAxisG = chartArea.append('g')
        .attr('class', 'axis y-axis')

    const fitnessData = boxingData.filter(d => "calories" in d);
    const duplicates = [];
    fitnessData.forEach((d, i) => {
        d.realInstructor = d.instructor;
        if (d.instructor.split(" ").length > 1) {
            duplicates.push(i);
        }
    });
    duplicates.sort((a, b) => b - a);

    duplicates.forEach(d => {
        const duplicate = fitnessData.splice(d, 1)[0];
        duplicate.instructor.split(" ").forEach(i => {
            const duplicateCopy = JSON.parse(JSON.stringify(duplicate));
            duplicateCopy.instructor = i;
            fitnessData.push(duplicateCopy);
        });
    });

    const instructors = d3.rollups(fitnessData, d => d.length, d => d.instructor)
        .sort((a, b) => b[1] - a[1])
        .map(d => d[0]);
    const xScale = d3.scaleBand()
        .domain(instructors)
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([400, 700])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale)
        .tickSizeOuter(0)
        .tickPadding(10);
    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-width)
        .tickSizeOuter(0)
        .tickPadding(10);

    let simulation = d3.forceSimulation(fitnessData)
        .force("x", d3.forceX(d => xScale(d.instructor) + xScale.bandwidth() / 2))
        .force("y", d3.forceY(d => yScale(d.calories)).strength(2))
        .force("collide", d3.forceCollide(0.01 * width))
        .stop();

    for (let i = 0; i < fitnessData.length; ++i) {
        simulation.tick(10);
    }
    
    const points = chartArea.selectAll(".class-circle")
        .data(fitnessData)    
        .join("circle")
        .attr("class", "class-circle")
        .attr("fill", "#A54657")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill-opacity", 0.7)
        .attr("r", width * 0.01);
    setTooltip(points, 
        d => `<b>${dayjs(d.date).format("MMMM D, YYYY")} at ${d.time}</b><br>
            <i>Instructor: ${d.realInstructor.split(" ").join(" & ")}</i><br>
            <i>Calories Burned: ${d.calories}</i><br>
            <i>Average Heart Rate: ${d.avghr} BPM</i>`);

    chartArea.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom * 0.75)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Instructor")

    chartArea.append("text")
        .attr("transform", `rotate(${-90})`)
        .attr("x", -height / 2)
        .attr("y", -margin.left * 0.5)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Calories Burned")

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    chartArea.selectAll(".axis text").attr("text-multiplier", 1.25);
    chartArea.selectAll(".axis .domain").remove();
};

const renderVisualization = () => {
    setupFullTemporalVisualization();
    setupWatchVisualization();
    setupHourTemporalVisualization();
    setupInstructorVisualization();
};

Promise.all([d3.json('data/boxing-data.json'), d3.json("data/temporal-anomalies.json")]).then(([_boxingData, _temporalAnomalies]) => {
    boxingData = _boxingData;
    boxingData.forEach(c => c.datetime = new Date(c.date + " " + c.time));
    boxingData.sort((a, b) => a.datetime - b.datetime);

    temporalAnomalies = _temporalAnomalies;

    resizeAndRender();
});