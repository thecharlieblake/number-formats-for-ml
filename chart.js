// --- Setup ---

// Layout
const width = 900;
const height = 450;
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const lineWidth = 1;
const vPad = 1.05;
const bins = 4;
const stepSize = 1 / bins;
const colors = [
  // "#A1C9F4",
  "#FFB482",
  "#8DE5A1",
  "#FF9F9B",
  "#D0BBFF",
  "#DEBB9B",
  "#FAB0E4",
  "#CFCFCF",
  "#FFFEA3",
  "#B9F2F0",
];
const opacity = 0.85;
const lightnessFactor = 0.9;
function lightness(color, factor) {
  color.l = factor;
  return color;
}

// Initial data
const initialNumSamples = 1024;
const initialFormats = [
  { e: 11, m: 52, fn: false },
  { e: 8, m: 23, fn: false },
  { e: 8, m: 10, fn: false },
  { e: 8, m: 7, fn: false },
  { e: 5, m: 10, fn: false },
  { e: 5, m: 2, fn: false },
  { e: 4, m: 3, fn: true },
];
gaussianData = null;

// Chart elements
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);
const chart = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xScale = d3.scaleLinear().range([0, chartWidth]);
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

const yScale = d3.scaleLog().base(2).range([chartHeight, 0]);
const yAxis = d3.axisLeft(yScale).tickFormat((d, i) => (i == 0 ? 0 : d));
const yAxisGroup = chart.append("g").attr("class", "y axis").call(yAxis);
svg
  .append("text")
  .attr("x", 29)
  .attr("y", 15)
  .attr("text-anchor", "right")
  .text("bin count");

const plotGroup = chart.append("g");
const histGroup = plotGroup.append("g");
const histGaussianGroup = plotGroup.append("g");

svg // Add a clipping path for the bars, forcing cut-off to be chart bounds
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", chartWidth)
  .attr("height", chartHeight);
plotGroup.attr("clip-path", "url(#clip)");

// Standard deviation slider
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
const stdSliderContainerInput = stdSliderContainer
  .append("input")
  .attr("type", "range")
  .attr("min", -20)
  .attr("max", 20)
  .attr("value", 0)
  .attr("step", 1);

// Number of samples slider
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
const samplesSliderContainerInput = samplesSliderContainer
  .append("input")
  .attr("type", "range")
  .attr("min", 0)
  .attr("max", 30)
  .attr("value", Math.round(Math.log2(initialNumSamples))) // start at 2^10
  .attr("step", 1);

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
    plotGroup
      .selectAll(".gaussian-bar")
      .attr("x", (d) => newXScale(d.x))
      .attr("width", stepSize * (newXScale(1) - newXScale(0)));

    plotGroup
      .selectAll(".fp-light-bar")
      .attr("x", (d) => newXScale(d.x))
      .attr("width", stepSize * (newXScale(1) - newXScale(0)));

    plotGroup
      .selectAll(".fp-horizontal-line")
      .attr("x1", (d) => newXScale(d.x))
      .attr("x2", (d) => newXScale(d.x + stepSize));

    plotGroup
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

// --- Legend ---

const checkboxContainer = d3
  .select("body")
  .append("div")
  .attr("class", "checkbox-container");
checkboxContainer
  .append("label")
  .attr("for", "exampleCheckbox")
  .text("Click me!");

//  --- Data processing ---

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

function plot(f) {
  fmtName = `E${f.fmt.e}M${f.fmt.m}`;
  if (f.fmt.fn) {
    fmtName = `${fmtName}fn`;
  }

  function formatComparator() {
    for (i = 0; i < this.children.length; i += 1) {
      child = this.children[i];
      const regex = /^E(\d+)M(\d+)(fn)?$/;
      result = child.className.baseVal.match(regex);
      if (result) {
        const e = parseInt(result[1], 10);
        const m = parseInt(result[2], 10);
        const fn = Boolean(result[3]);
        if (
          e < f.fmt.e ||
          (e == f.fmt.e && m < f.fmt.m) ||
          (e == f.fmt.e && m == f.fmt.m && !fn)
        ) {
          return child;
        }
      }
    }
    return null;
  }

  const formatHistGroup = histGroup
    .insert("g", formatComparator)
    .attr("class", `${fmtName}`);

  formatHistGroup
    .selectAll(`.fp-light-bar`)
    .data(f.data.hData)
    .enter()
    .append("rect")
    .attr("class", `fp-light-bar`)
    .attr("x", (d) => xScale(d.x))
    .attr("y", (d) => yScale(d.y))
    .attr("width", stepSize * (xScale(1) - xScale(0)))
    .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)))
    .attr("fill", lightness(d3.hsl(f.color), lightnessFactor))
    .attr("opacity", opacity);

  formatHistGroup
    .selectAll(`.fp-horizontal-line`)
    .data(f.data.hData)
    .enter()
    .append("line")
    .attr("class", `fp-horizontal-line`)
    .attr("x1", (d) => xScale(d.x))
    .attr("x2", (d) => xScale(d.x + stepSize))
    .attr("y1", (d) => yScale(d.y))
    .attr("y2", (d) => yScale(d.y))
    .attr("stroke", d3.hsl(f.color))
    .attr("stroke-linecap", "round")
    .attr("stroke-width", lineWidth);

  formatHistGroup
    .selectAll(`.fp-vertical-line`)
    .data(f.data.vData)
    .enter()
    .append("line")
    .attr("class", `fp-vertical-line`)
    .attr("x1", (d) => xScale(d.x))
    .attr("x2", (d) => xScale(d.x))
    .attr("y1", (d) => yScale(d.y1))
    .attr("y2", (d) => yScale(d.y2))
    .attr("stroke", d3.hsl(f.color))
    .attr("stroke-linecap", "round")
    .attr("stroke-width", lineWidth);
}

function unplot(f) {
  fmtName = `E${f.fmt.e}M${f.fmt.m}`;
  if (f.fmt.fn) {
    fmtName = `${fmtName}fn`;
  }
  histGroup.selectAll(`.${fmtName}`).remove();
}

function adjustDomains(
  _formatData,
  { adjustStdSlider = true, resetZoom = false } = {},
) {
  if (resetZoom) {
    svg.call(zoom.transform, d3.zoomIdentity);
    currentTransform = d3.zoomIdentity;
  }

  formatData = _formatData.filter((fd) => fd.visible);
  xExtents = formatData.map((fd) => d3.extent(fd.data.hData, (d) => d.x));
  yExtents = formatData.map((fd) => d3.extent(fd.data.hData, (d) => d.y));

  gaussXDomain = d3.extent(
    gaussianData.filter((d) => d.y >= 0.5).map((d) => d.x),
  );
  if (gaussXDomain[0] === undefined) {
    gaussXDomain[0] = 0;
  }
  if (gaussXDomain[1] === undefined) {
    gaussXDomain[1] = 0;
  }
  xDomain = [
    Math.min(gaussXDomain[0], ...xExtents.map((e) => e[0] - 0.5)),
    Math.max(gaussXDomain[1], ...xExtents.map((e) => e[1] + 0.5)),
  ];
  xScale.domain(xDomain);
  const newXScale = currentTransform.rescaleX(xScale);
  xAxisGroup.call(xAxis.scale(newXScale));

  yScale.domain([
    1 / 2,
    Math.max(
      d3.max(gaussianData, (d) => d.y) * vPad,
      ...yExtents.map((e) => e[1] * vPad),
    ),
  ]);
  yAxisGroup.call(yAxis.scale(yScale));

  // Adjust existing plots to match domains
  plotGroup
    .selectAll(".gaussian-bar")
    .attr("x", (d) => newXScale(d.x))
    .attr("y", (d) => yScale(d.y))
    .attr("width", stepSize * (newXScale(1) - newXScale(0)))
    .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)));
  histGroup
    .selectAll(`.fp-light-bar`)
    .attr("x", (d) => newXScale(d.x))
    .attr("y", (d) => yScale(d.y))
    .attr("width", stepSize * (newXScale(1) - newXScale(0)))
    .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)));
  histGroup
    .selectAll(`.fp-horizontal-line`)
    .attr("x1", (d) => newXScale(d.x))
    .attr("x2", (d) => newXScale(d.x + stepSize))
    .attr("y1", (d) => yScale(d.y))
    .attr("y2", (d) => yScale(d.y));
  histGroup
    .selectAll(`.fp-vertical-line`)
    .attr("x1", (d) => newXScale(d.x))
    .attr("x2", (d) => newXScale(d.x))
    .attr("y1", (d) => yScale(d.y1))
    .attr("y2", (d) => yScale(d.y2));
  if (adjustStdSlider) {
    stdSliderContainerInput
      .attr("min", Math.round(xDomain[0] - 3))
      .attr("max", Math.round(xDomain[1] + 10));
  }
}

function addCheckbox(f) {
  checkboxContainer
    .append("input")
    .attr("type", "checkbox")
    .property("checked", f.visible)
    .on("change", function () {
      if (this.checked) {
        formatData.push(f);
        plot(f);
      } else {
        function removeFromList(list, conditionFn) {
          const index = list.findIndex(conditionFn);
          if (index !== -1) {
            return list.splice(index, 1)[0]; // Remove and return the matching element
          }
          return undefined; // Return undefined if no match is found
        }
        unplot(
          removeFromList(
            formatData,
            (fd) => JSON.stringify(fd.fmt) === JSON.stringify(f.fmt),
          ),
        );
      }
      adjustDomains(formatData, { resetZoom: true });
    });
}

// --- Chart generation ---

function generateChart(baseData) {
  // Gaussian data
  gaussianData = baseData.gaussianData;
  gaussianData = gaussianData.map((d) => ({
    x: d.x,
    y: (d.y * initialNumSamples) / 2, // /2 as we only show +ves
  }));

  histGaussianGroup
    .selectAll(".gaussian-bar")
    .data(gaussianData)
    .enter()
    .append("rect")
    .attr("class", "gaussian-bar")
    .attr("x", (d) => xScale(d.x))
    .attr("y", (d) => yScale(d.y))
    .attr("width", stepSize * (xScale(1) - xScale(0)))
    .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)))
    .attr("opacity", 0.5)
    .attr("fill", "steelblue");

  // FP data
  formatData = initialFormats.map((fmt, i) => ({
    fmt: fmt,
    data: genFullData(baseData.floatData[fmt.m], fmt, bins),
    color: colors[i],
    visible: fmt.e + fmt.m < 16,
  }));

  // --- Animation logic ---

  const gaussianDataOriginal = gaussianData.map((d) => ({ ...d }));

  stdSliderContainerInput.on("input", function () {
    const offset = +this.value;
    stdSliderValueDisplay.html(`2<sup>${offset}</sup>`);

    gaussianData.forEach((d, i) => {
      d.x = gaussianDataOriginal[i].x + offset;
    });
    adjustDomains(formatData, { adjustStdSlider: false });
  });

  // Number of samples
  samplesSliderContainerInput.on("input", function () {
    const exponent = +this.value;
    sliderValueDisplay.html(`2<sup>${exponent}</sup>`);

    gaussianData.forEach((d, i) => {
      d.y =
        (gaussianDataOriginal[i].y * Math.pow(2, exponent)) / initialNumSamples;
    });
    adjustDomains(formatData);
  });

  formatData.filter((fd) => fd.visible).forEach(plot);
  adjustDomains(formatData);
  formatData.forEach(addCheckbox);

  checkboxContainer
    .append("input")
    .attr("type", "checkbox")
    .attr("id", "exampleCheckbox")
    .property("checked", false)
    .on("change", function () {
      const fmt = { e: 6, m: 6, fn: true };
      if (this.checked) {
        const newFormatData = {
          fmt: fmt,
          data: genFullData(baseData.floatData[fmt.m], fmt, bins),
          color: colors[formatData.length],
          visible: true,
        };
        formatData.push(newFormatData);
        plot(newFormatData);
      } else {
        function removeFromList(list, conditionFn) {
          const index = list.findIndex(conditionFn);
          if (index !== -1) {
            return list.splice(index, 1)[0]; // Remove and return the matching element
          }
          return undefined; // Return undefined if no match is found
        }
        unplot(
          removeFromList(
            formatData,
            (fd) => JSON.stringify(fd.fmt) === JSON.stringify(fmt),
          ),
        );
      }
      adjustDomains(formatData);
    });
}

// --- Load ---

fetch("data.json")
  .then((response) => response.json())
  .then(generateChart);
