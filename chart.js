// --- CHART ---

// SVG container & chart
const width = 900;
const height = 450;
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);
const chart = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`)
  .style("cursor", "grab");

// Scales
xDomain = d3.extent(fakeFpData, (d) => d.x);
xDomain = [xDomain[0] - 0.5, xDomain[1] + 0.5];
const xScale = d3.scaleLinear().domain(xDomain).range([0, chartWidth]);
const yScale = d3
  .scaleLog()
  .base(2)
  .domain([
    1 / 2,
    Math.max(
      d3.max(gaussianData, (d) => d.y),
      d3.max(fakeFpData, (d) => d.y),
    ),
  ])
  .range([chartHeight, 0]);

// --- BARS ---

const barsGroup = chart.append("g");

// Add a clipping path for the bars, forcing cut-off to be chart bounds
svg
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", chartWidth)
  .attr("height", chartHeight);
barsGroup.attr("clip-path", "url(#clip)");

barsGroup
  .selectAll(".gaussian-bar")
  .data(gaussianData)
  .enter()
  .append("rect")
  .attr("class", "gaussian-bar")
  .attr("x", (d) => xScale(d.x))
  .attr("y", (d) => yScale(d.y))
  .attr("width", xScale(1) - xScale(0))
  .attr("height", (d) => chartHeight - yScale(d.y))
  .attr("fill", "steelblue");

barsGroup
  .selectAll(".fake-fp-horizontal-line")
  .data(fakeFpData)
  .enter()
  .append("line")
  .attr("class", "fake-fp-horizontal-line")
  .attr("x1", (d) => xScale(d.x - 1))
  .attr("x2", (d) => xScale(d.x))
  .attr("y1", (d) => yScale(d.y))
  .attr("y2", (d) => yScale(d.y))
  .attr("stroke", "orange")
  .attr("stroke-width", 5);

barsGroup
  .selectAll(".fake-fp-vertical-line")
  .data(fakeFpDataVertical)
  .enter()
  .append("line")
  .attr("class", "fake-fp-vertical-line")
  .attr("x1", (d) => xScale(d.x))
  .attr("x2", (d) => xScale(d.x))
  .attr("y1", (d) => yScale(d.y1))
  .attr("y2", (d) => yScale(d.y2))
  .attr("stroke", "orange")
  .attr("stroke-width", 5);

// Grab-and-move all rectangles
barsGroup
  .selectAll("rect")
  .on("mousedown", () => d3.select(d3.event.target).style("cursor", "grabbing"))
  .on("mouseup", () => d3.select(d3.event.target).style("cursor", "grab"));

/// --- Axes ---

// x-axis
const xAxis = d3
  .axisBottom(xScale)
  .ticks(fakeFpData.length)
  .tickFormat((d) => d);
const xAxisGroup = chart
  .append("g")
  .attr("transform", `translate(0, ${chartHeight})`)
  .call(xAxis);
svg
  .append("text")
  .attr("x", width / 2)
  .attr("y", height - 10)
  .attr("text-anchor", "middle")
  .text("representable values");

// y-axis
const yAxis = d3.axisLeft(yScale).tickFormat((d, i) => (i == 0 ? 0 : d));
const yAxisGroup = chart.append("g").attr("class", "y axis").call(yAxis);
svg
  .append("text")
  .attr("x", 29)
  .attr("y", 15)
  // .attr("transform", "rotate(-90)")
  .attr("text-anchor", "right")
  .text("bin count");

// --- Zoom ---

let currentTransform = d3.zoomIdentity;
const zoom = d3
  .zoom()
  .scaleExtent([0.25, 10]) // Limit zoom levels
  .translateExtent([
    [-chartWidth, 0],
    [2 * chartWidth, chartHeight],
  ]) // Allow dragging beyond the bounds
  .on("zoom", function (event) {
    currentTransform = event.transform;
    const newXScale = event.transform.rescaleX(xScale);
    xAxisGroup.call(xAxis.scale(newXScale));

    barsGroup
      .selectAll(".gaussian-bar")
      .attr("x", (d) => newXScale(d.x))
      .attr("width", newXScale(1) - newXScale(0));
    barsGroup
      .selectAll(".fake-fp-horizontal-line")
      .attr("x1", (d) => newXScale(d.x - 1))
      .attr("x2", (d) => newXScale(d.x));
    barsGroup
      .selectAll(".fake-fp-vertical-line")
      .attr("x1", (d) => newXScale(d.x))
      .attr("x2", (d) => newXScale(d.x));
  });
svg.call(zoom);

// --- Sliders ---

const samplesSliderContainer = d3
  .select("body")
  .append("div")
  .style("text-align", "center")
  .style("margin-top", "20px");

// Number of samples

samplesSliderContainer
  .append("label")
  .text("number of samples")
  .style("margin-right", "10px");
const sliderValueDisplay = samplesSliderContainer
  .append("span")
  .html(`2<sup>${Math.log2(initialNumSamples)}</sup>`);
const gaussianDataOriginal = gaussianData.map((d) => ({ ...d }));
samplesSliderContainer
  .append("input")
  .attr("type", "range")
  .attr("min", 4)
  .attr("max", 20)
  .attr("value", Math.round(Math.log2(initialNumSamples))) // start at 2^10
  .attr("step", 1)
  .on("input", function () {
    const exponent = +this.value;
    sliderValueDisplay.html(`2<sup>${exponent}</sup>`);

    gaussianData.forEach((d, i) => {
      d.y =
        (gaussianDataOriginal[i].y * Math.pow(2, exponent)) / initialNumSamples;
    });
    yScale.domain([
      1 / 2,
      Math.max(
        d3.max(gaussianData, (d) => d.y),
        d3.max(fakeFpData, (d) => d.y),
      ),
    ]);
    yAxisGroup.call(yAxis.scale(yScale));

    barsGroup
      .selectAll(".gaussian-bar")
      .attr("y", (d) => yScale(d.y))
      .attr("height", (d) => chartHeight - yScale(d.y));
    barsGroup
      .selectAll(".fake-fp-horizontal-line")
      .attr("y1", (d) => yScale(d.y))
      .attr("y2", (d) => yScale(d.y));
    barsGroup
      .selectAll(".fake-fp-vertical-line")
      .attr("y1", (d) => yScale(d.y1))
      .attr("y2", (d) => yScale(d.y2));
  });

const stdSliderContainer = d3
  .select("body")
  .append("div")
  .style("text-align", "center")
  .style("margin-top", "20px");
stdSliderContainer
  .append("label")
  .text("standard deviation")
  .style("margin-right", "10px");
const stdSliderValueDisplay = stdSliderContainer
  .append("span")
  .html("2<sup>0</sup>");
stdSliderContainer
  .append("input")
  .attr("type", "range")
  .attr("min", -20)
  .attr("max", 20)
  .attr("value", 0)
  .attr("step", 1)
  .on("input", function () {
    const offset = +this.value;
    stdSliderValueDisplay.html(`2<sup>${offset}</sup>`);

    gaussianData.forEach((d, i) => {
      d.x = gaussianDataOriginal[i].x + offset;
    });
    const newXScale = currentTransform.rescaleX(xScale);
    xAxisGroup.call(xAxis.scale(newXScale));
    barsGroup.selectAll(".gaussian-bar").attr("x", (d) => newXScale(d.x));
  });
