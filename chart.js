// SVG container & chart
const width = 900;
const height = 450;
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const lineWidth = 2;
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);
const chart = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);
const vPad = 1.05;
const bins = 4;
const stepSize = 1 / bins;
const colors = ["orange", "darkgreen", "red", "purple", "tomato", "orchid"];
const lightenFactor = 0.925;
function lighten(color, factor) {
  color.l = factor;
  return color;
}

function genFullData(counts, format, bins) {
  const e = format.e;
  const m = format.m;
  const fn = format.fn;
  const countsBeforeBins = counts.slice(0, counts.length - bins);
  const countsAfterBins = Array.from(
    { length: (2 ** e - 1 - (fn ? 0 : 1)) * bins },
    (_, i) => counts[counts.length - bins + (i % bins)],
  );

  const newCounts = countsBeforeBins
    .concat(countsAfterBins)
    .map((v) => Math.max(v, 0.5));

  // Step 2: Modify last non-zero bin if `fn` is true
  if (fn) {
    for (let i = newCounts.length - 1; i >= 0; i--) {
      if (newCounts[i] !== 0) {
        newCounts[i] -= 1;
        break;
      }
    }
  }

  // Step 3: Compute min_norm_exp and min_sub_exp
  const minSubExp = 2 - 2 ** (e - 1) - m;
  const maxExp = 2 ** (e - 1) + (fn ? 1 : 0);

  // Step 4: Generate bin_exps array
  const binExps = [];
  for (let i = bins * minSubExp; i < bins * maxExp; i++) {
    binExps.push(i / bins);
  }

  // Zip to generate x-y pairs for horizontal bars
  const hData = binExps.map((x, i) => ({ x: x, y: newCounts[i] }));

  // Zip differences for vertical bars
  const hDataOffsetR = [
    ...hData,
    { x: hData[hData.length - 1].x + stepSize, y: 1 / 2 },
  ];
  const hDataOffsetL = [{ x: null, y: 1 / 2 }, ...hData];
  const vData = hDataOffsetR.map((e, i) => ({
    x: e.x,
    y1: e.y,
    y2: hDataOffsetL[i].y,
  }));

  return { hData: hData, vData: vData };
}

function generateChart(baseData) {
  // FP data
  formats = [
    // { e: 8, m: 7, fn: false },
    { e: 5, m: 10, fn: false },
    { e: 4, m: 3, fn: true },
  ];
  formatData = formats.map((fmt, i) => ({
    fmt: fmt,
    data: genFullData(baseData.floatData[fmt.m], fmt, bins),
    color: colors[i],
  }));

  // Gaussian data
  initialNumSamples = 8192;
  gaussianData = baseData.gaussianData;
  gaussianData = gaussianData.map((d) => ({
    x: d.x,
    y: (d.y * initialNumSamples) / 2, // /2 as we only show +ves
  }));

  /// --- Axes ---
  xDomain = d3.extent(
    formatData.sort((a, b) => b.fmt.e - a.fmt.e)[0].data.hData,
    (d) => d.x,
  );
  xDomain = [xDomain[0] - 0.5, xDomain[1] + 1.5];
  const xScale = d3.scaleLinear().domain(xDomain).range([0, chartWidth]);
  const yScale = d3
    .scaleLog()
    .base(2)
    .domain([
      1 / 2,
      Math.max(
        d3.max(gaussianData, (d) => d.y),
        d3.max(
          formatData.sort((a, b) => b.fmt.m - a.fmt.m)[0].data.hData,
          (d) => d.y,
        ),
      ) * vPad,
    ])
    .range([chartHeight, 0]);

  // x-axis
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(20)
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

  function formatGroupName(fmt) {
    fmtName = `E${fmt.e}M${fmt.m}`;
    if (fmt.fn) {
      fmtName = `${fmtName}fn`;
    }
    return fmtName;
  }

  sortedFormatData = formatData.sort(
    (a, b) => b.fmt.e - a.fmt.e + (b.fmt.m - a.fmt.m) / 1000,
  );

  sortedFormatData.forEach((f) => {
    formatGroup = barsGroup.append("g");
    formatGroup.attr("class", formatGroupName(f.fmt));
    formatGroup
      .selectAll(".fp-light-bar")
      .data(f.data.hData)
      .enter()
      .append("rect")
      .attr("class", "fp-light-bar")
      .attr("x", (d) => xScale(d.x))
      .attr("y", (d) => yScale(d.y))
      .attr("width", stepSize * (xScale(1) - xScale(0)))
      .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)))
      .attr("fill", lighten(d3.hsl(f.color), lightenFactor));
  });

  barsGroup
    .selectAll(".gaussian-bar")
    .data(gaussianData)
    .enter()
    .append("rect")
    .attr("class", "gaussian-bar")
    .attr("x", (d) => xScale(d.x))
    .attr("y", (d) => yScale(d.y))
    .attr("width", stepSize * (xScale(1) - xScale(0)))
    .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)))
    .attr("opacity", 0.75)
    .attr("fill", "steelblue");

  sortedFormatData.forEach((f) => {
    formatGroup = barsGroup.append("g");
    formatGroup.attr("class", formatGroupName(f.fmt));
    // formatGroup = barsGroup.select(`g.${formatGroupName(f.fmt)}`);
    formatGroup
      .selectAll(".fp-horizontal-line")
      .data(f.data.hData)
      .enter()
      .append("line")
      .attr("class", "fp-horizontal-line")
      .attr("x1", (d) => xScale(d.x))
      .attr("x2", (d) => xScale(d.x + stepSize))
      .attr("y1", (d) => yScale(d.y))
      .attr("y2", (d) => yScale(d.y))
      .attr("stroke", d3.hsl(f.color))
      .attr("stroke-linecap", "round")
      .attr("stroke-width", lineWidth);
    formatGroup
      .selectAll(".fp-vertical-line")
      .data(f.data.vData)
      .enter()
      .append("line")
      .attr("class", "fp-vertical-line")
      .attr("x1", (d) => xScale(d.x))
      .attr("x2", (d) => xScale(d.x))
      .attr("y1", (d) => yScale(d.y1))
      .attr("y2", (d) => yScale(d.y2))
      .attr("stroke", d3.hsl(f.color))
      .attr("stroke-linecap", "round")
      .attr("stroke-width", lineWidth);
  });

  // --- Zoom ---

  let currentTransform = d3.zoomIdentity;

  // Define the zoom behavior
  const zoom = d3
    .zoom()
    .translateExtent([
      [-chartWidth, 0],
      [2 * chartWidth, chartHeight],
    ]) // Allow dragging beyond the bounds
    .scaleExtent([0.25, 10]) // Limit zoom levels
    .on("zoom", function (event) {
      currentTransform = event.transform;
      const newXScale = event.transform.rescaleX(xScale);
      xAxisGroup.call(xAxis.scale(newXScale));

      // Update positions and widths based on the new scale
      barsGroup
        .selectAll(".gaussian-bar")
        .attr("x", (d) => newXScale(d.x))
        .attr("width", stepSize * (newXScale(1) - newXScale(0)));

      barsGroup
        .selectAll(".fp-light-bar")
        .attr("x", (d) => newXScale(d.x))
        .attr("width", stepSize * (newXScale(1) - newXScale(0)));

      barsGroup
        .selectAll(".fp-horizontal-line")
        .attr("x1", (d) => newXScale(d.x))
        .attr("x2", (d) => newXScale(d.x + stepSize));

      barsGroup
        .selectAll(".fp-vertical-line")
        .attr("x1", (d) => newXScale(d.x))
        .attr("x2", (d) => newXScale(d.x));
    })
    .on("start", ({ sourceEvent }) => {
      if (sourceEvent?.type.match(/^(mousedown|touchstart)$/)) {
        svg.style("cursor", "grabbing");
      }
    })
    .on("end", ({ sourceEvent }) => {
      if (sourceEvent?.type.match(/^(mouseup|touchend)$/)) {
        svg.style("cursor", "grab");
      }
    });
  svg.call(zoom).style("cursor", "grab");

  // --- Sliders ---

  // Standard deviation

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
    .attr("min", Math.round(xDomain[0] - 3))
    .attr("max", Math.round(xDomain[1] + 10))
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

  // Number of samples

  const samplesSliderContainer = d3
    .select("body")
    .append("div")
    .style("text-align", "center")
    .style("margin-top", "20px");
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
    .attr("min", 0)
    .attr("max", 30)
    .attr("value", Math.round(Math.log2(initialNumSamples))) // start at 2^10
    .attr("step", 1)
    .on("input", function () {
      const exponent = +this.value;
      sliderValueDisplay.html(`2<sup>${exponent}</sup>`);

      gaussianData.forEach((d, i) => {
        d.y =
          (gaussianDataOriginal[i].y * Math.pow(2, exponent)) /
          initialNumSamples;
      });
      yScale.domain([
        1 / 2,
        Math.max(
          d3.max(gaussianData, (d) => d.y),
          d3.max(
            formatData.sort((a, b) => b.fmt.m - a.fmt.m)[0].data.hData,
            (d) => d.y,
          ),
        ) * vPad,
      ]);
      yAxisGroup.call(yAxis.scale(yScale));

      barsGroup
        .selectAll(".gaussian-bar")
        .attr("y", (d) => yScale(d.y))
        .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)));
      barsGroup.selectAll(".fp-light-bar").attr("y", (d) => yScale(d.y));
      barsGroup
        .selectAll(".fp-horizontal-line")
        .attr("y1", (d) => yScale(d.y))
        .attr("y2", (d) => yScale(d.y));
      barsGroup
        .selectAll(".fp-vertical-line")
        .attr("y1", (d) => yScale(d.y1))
        .attr("y2", (d) => yScale(d.y2));
    });
}

// --- Load ---

fetch("data.json")
  .then((response) => response.json())
  .then(generateChart);
