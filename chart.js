// First dataset
const data1 = [
    { x: -6, y: 5 },
    { x: -5, y: 15 },
    { x: -4, y: 30 },
    { x: -3, y: 50 },
    { x: -2, y: 70 },
    { x: -1, y: 85 },
    { x: 0, y: 100 },
    { x: 1, y: 85 },
    { x: 2, y: 70 },
    { x: 3, y: 50 },
    { x: 4, y: 30 },
    { x: 5, y: 15 },
    { x: 6, y: 0 }
];

// Second dataset (slightly different)
const data2 = data1.map(d => ({
    x: d.x,
    y: d.y * (Math.random() * 0.4) + 1
}));

const zip = (arr1, arr2) => arr1.map((e, i) => ({ x: e.x + 0.5, y1: e.y, y2: arr2[i].y }));
const data2b = zip([{ x: data2[0].x - 1, y: 1 / 2 }, ...data2], [...data2, { x: data2[data2.length - 1].x - 0.5, y: 1 / 2 }]);


// Dimensions of the SVG container
const width = 900;
const height = 450;
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

// Scales
xDomain1 = d3.extent(data1, d => d.x)
xDomain2 = d3.extent(data2, d => d.x)
xDomain = [Math.min(xDomain1[0], xDomain2[0]), Math.max(xDomain1[1], xDomain2[1])]
xDomain = [xDomain[0] - 0.5, xDomain[1] + 0.5]
const xScale = d3.scaleLinear()
    .domain(xDomain) // Automatically compute the domain from x values
    .range([0, chartWidth]);


const yScale = d3.scaleLog()
    .base(2)
    .domain([1 / 2, Math.max(d3.max(data1, d => d.y), d3.max(data2, d => d.y))])
    .range([chartHeight, 0])

// Create an SVG container
const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Create a chart group with margins
const chart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add a clipping path for the bars
svg.append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", chartWidth)
    .attr("height", chartHeight);

// Create a group for the bars and apply the clipping path
const barsGroup = chart.append("g")
    .attr("clip-path", "url(#clip)");

// Draw the bars inside the barsGroup
// Add the first set of bars
barsGroup.selectAll(".bar1")
    .data(data1)
    .enter()
    .append("rect")
    .attr("class", "bar1")
    .attr("x", d => xScale(d.x - 0.5)) // Slight offset for overlay
    .attr("y", d => yScale(d.y))
    .attr("width", xScale(1) - xScale(0)) // Narrower bars for overlap
    .attr("height", d => chartHeight - yScale(d.y))
    .attr("fill", "steelblue")
    .style("cursor", "grab");

// Add the second set of bars
barsGroup.selectAll(".line2")
    .data(data2)
    .enter()
    .append("line")
    .attr("class", "line2")
    .attr("x1", d => xScale(d.x - 0.5))
    .attr("x2", d => xScale(d.x + 0.5))
    .attr("y1", d => yScale(d.y))
    .attr("y2", d => yScale(d.y))
    .attr("stroke", "orange")
    .attr("stroke-width", 5)
    .style("cursor", "grab");

barsGroup.selectAll(".vertical-line")
    .data(data2b)
    .enter()
    .append("line")
    .attr("class", "vertical-line")
    .attr("x1", d => xScale(d.x))
    .attr("x2", d => xScale(d.x))
    .attr("y1", d => yScale(d.y1))
    .attr("y2", d => yScale(d.y2))
    .attr("stroke", "orange")
    .attr("stroke-width", 5)
    .style("cursor", "grab");


barsGroup.selectAll("rect")
    .on("mousedown", () => {
        d3.select(d3.event.target).style("cursor", "grabbing");
    })
    .on("mouseup", () => {
        d3.select(d3.event.target).style("cursor", "grab");
    });


const xAxis = d3.axisBottom(xScale)
    .ticks(data1.length)  // TODO: do properly for both datasets
    .tickFormat(d => d); // Display x values directly


const xAxisGroup = chart.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis);

// Add y-axis
const yAxis = d3.axisLeft(yScale).tickFormat((d, i) => (i == 0 ? 0 : d));

const yAxisGroup = chart.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add axis labels
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .text("Value Bin");

svg.append("text")
    .attr("x", 29)
    .attr("y", 15)
    // .attr("transform", "rotate(-90)")
    .attr("text-anchor", "right")
    .text("Count");


// Zoom only on x-axis
const zoom = d3.zoom()
    .scaleExtent([0.5, 10]) // Limit zoom levels
    .translateExtent([[-chartWidth, 0], [2 * chartWidth, chartHeight]]) // Allow dragging beyond the bounds
    .on("zoom", zoomed);


// Attach the zoom behavior to the SVG
svg.call(zoom);

function zoomed(event) {
    const newXScale = event.transform.rescaleX(xScale);

    xAxisGroup.call(xAxis.scale(newXScale));

    barsGroup.selectAll(".bar1,.bar2")
        .attr("x", d => newXScale(d.x - 0.5))
        .attr("width", newXScale(1) - newXScale(0));

    barsGroup.selectAll(".line2")
        .attr("x1", d => newXScale(d.x - 0.5))
        .attr("x2", d => newXScale(d.x + 0.5));

    barsGroup.selectAll(".vertical-line")
        .attr("x1", d => newXScale(d.x))
        .attr("x2", d => newXScale(d.x));
}

const data1Original = data1.map(d => ({ ...d })); // Keep a copy of the original data

// Add a slider
const sliderContainer = d3.select("body")
    .append("div")
    .style("text-align", "center")
    .style("margin-top", "20px");

sliderContainer.append("label")
    .text("number of samples")
    .style("margin-right", "10px");

const sliderValueDisplay = sliderContainer.append("span").text("1024"); // 2^10

sliderContainer.append("input")
    .attr("type", "range")
    .attr("min", 0)
    .attr("max", 20)
    .attr("value", 10) // start at 2^10
    .attr("step", 1)
    .on("input", function () {
        const exponent = +this.value;
        const factor = Math.pow(2, exponent);
        sliderValueDisplay.text(factor);

        data1.forEach((d, i) => {
            d.y = data1Original[i].y * factor;
        });

        yScale.domain([1 / 2, Math.max(d3.max(data1, d => d.y), d3.max(data2, d => d.y))]);
        yAxisGroup.call(yAxis.scale(yScale));

        barsGroup.selectAll(".bar1")
            .attr("y", d => yScale(d.y))
            .attr("height", d => chartHeight - yScale(d.y));

        barsGroup.selectAll(".bar2")
            .attr("y", d => yScale(d.y))
            .attr("height", d => chartHeight - yScale(d.y));

        barsGroup.selectAll(".line2")
            .attr("y1", d => yScale(d.y))
            .attr("y2", d => yScale(d.y));

        barsGroup.selectAll(".vertical-line")
            .attr("y1", d => yScale(d.y1))
            .attr("y2", d => yScale(d.y2));

    });

const xSliderContainer = d3.select("body")
    .append("div")
    .style("text-align", "center")
    .style("margin-top", "20px");

xSliderContainer.append("label")
    .text("standard deviation")
    .style("margin-right", "10px");

const xSliderValueDisplay = xSliderContainer.append("span").html("2<sup>0</sup>");

xSliderContainer.append("input")
    .attr("type", "range")
    .attr("min", -20)
    .attr("max", 20)
    .attr("value", 0)
    .attr("step", 1)
    .on("input", function () {
        const offset = +this.value;
        xSliderValueDisplay.html(`2<sup>${offset}</sup>`);


        data1.forEach((d, i) => {
            d.x = data1Original[i].x + offset;
        });

        // Update x domain
        const xDomain1 = d3.extent(data1, d => d.x);
        const xDomain2 = d3.extent(data2, d => d.x);
        let xDomain = [
            Math.min(xDomain1[0], xDomain2[0]) - 0.5,
            Math.max(xDomain1[1], xDomain2[1]) + 0.5
        ];
        xScale.domain(xDomain);

        xAxisGroup.call(xAxis.scale(xScale));

        barsGroup.selectAll(".bar1")
            .attr("x", d => xScale(d.x - 0.5));

        barsGroup.selectAll(".bar2")
            .attr("x", d => xScale(d.x - 0.5));

        barsGroup.selectAll(".line2")
            .attr("x1", d => xScale(d.x - 0.5))
            .attr("x2", d => xScale(d.x + 0.5));

        barsGroup.selectAll(".vertical-line")
            .attr("x1", d => xScale(d.x))
            .attr("x2", d => xScale(d.x));
    });
