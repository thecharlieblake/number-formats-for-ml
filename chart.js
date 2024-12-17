// --- CHART ---

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
const bins = 4;
const stepSize = 1 / bins;

function convertCounts(counts, e, m, bins, fn) {
  // Step 1: Append modified counts array
  const countsBeforeBins = counts.slice(0, counts.length - bins);
  const countsAfterBins = Array.from(
    { length: (2 ** e - 1 - (fn ? 0 : 1)) * bins },
    (_, i) => counts[counts.length - bins + (i % bins)],
  );

  const newCounts = countsBeforeBins.concat(countsAfterBins);

  // Step 2: Modify last non-zero bin if `fn` is true
  if (fn) {
    for (let i = newCounts.length - 1; i >= 0; i--) {
      if (newCounts[i] !== 0) {
        newCounts[i] -= 2;
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

  return { newCounts, binExps };
}

function generateChart(mantissaCounts) {
  e = 5;
  m = 10;
  fn = false;
  result = convertCounts(mantissaCounts[m], e, m, bins, fn);
  floatCounts = result.newCounts;
  binExps = result.binExps;
  const zip = (arrX, arrY) => arrX.map((x, i) => ({ x: x, y: arrY[i] }));
  fpData = zip(binExps, floatCounts);
  console.log(binExps);
  console.log(floatCounts);
  fpData = fpData.map((d) => ({
    x: d.x,
    y: Math.max(d.y, 1 / 2),
  }));
  const _zip = (arr1, arr2) =>
    arr1.map((e, i) => ({ x: e.x, y1: e.y, y2: arr2[i].y }));
  const fpDataVertical = _zip(
    [...fpData, { x: fpData[fpData.length - 1].x + stepSize, y: 1 / 2 }],
    [{ x: null, y: 1 / 2 }, ...fpData],
  );

  // Gaussian data
  initialNumSamples = 1024;
  gaussianData = [
    { x: -18.0, y: 5.758874353538672e-7 },
    { x: -17.75, y: 6.848494355610082e-7 },
    { x: -17.5, y: 8.144278214705787e-7 },
    { x: -17.25, y: 9.685233599419665e-7 },
    { x: -17.0, y: 1.151774870677536e-6 },
    { x: -16.75, y: 1.3696988710712317e-6 },
    { x: -16.5, y: 1.628855642855746e-6 },
    { x: -16.25, y: 1.9370467197402865e-6 },
    { x: -16.0, y: 2.3035497411134914e-6 },
    { x: -15.75, y: 2.7393977417361705e-6 },
    { x: -15.5, y: 3.2577112850282006e-6 },
    { x: -15.25, y: 3.874093438331417e-6 },
    { x: -15.0, y: 4.607099480294338e-6 },
    { x: -14.75, y: 5.4787954802220316e-6 },
    { x: -14.5, y: 6.51542256459003e-6 },
    { x: -14.25, y: 7.748186867469565e-6 },
    { x: -14.0, y: 9.214198945127493e-6 },
    { x: -13.75, y: 1.0957590934441554e-5 },
    { x: -13.5, y: 1.3030845085449267e-5 },
    { x: -13.25, y: 1.5496373661392926e-5 },
    { x: -13.0, y: 1.84283977665655e-5 },
    { x: -12.75, y: 2.1915181660863092e-5 },
    { x: -12.5, y: 2.6061689821051944e-5 },
    { x: -12.25, y: 3.09927467344163e-5 },
    { x: -12.0, y: 3.685679454361546e-5 },
    { x: -11.75, y: 4.383036165756592e-5 },
    { x: -11.5, y: 5.2123376843331065e-5 },
    { x: -11.25, y: 6.198548876187692e-5 },
    { x: -11.0, y: 7.371358117110651e-5 },
    { x: -10.75, y: 8.766071000185113e-5 },
    { x: -10.5, y: 0.00010424673129648333 },
    { x: -10.25, y: 0.00012397093986811416 },
    { x: -10.0, y: 0.00014742709901323543 },
    { x: -9.75, y: 0.00017532131349749748 },
    { x: -9.5, y: 0.00020849328347163302 },
    { x: -9.25, y: 0.00024794157849134424 },
    { x: -9.0, y: 0.0002948536913951979 },
    { x: -8.75, y: 0.0003506417749466642 },
    { x: -8.5, y: 0.00041698513397570545 },
    { x: -8.25, y: 0.0004958807470310045 },
    { x: -8.0, y: 0.0005897033297578005 },
    { x: -7.75, y: 0.0007012767335484978 },
    { x: -7.5, y: 0.0008339588043103875 },
    { x: -7.25, y: 0.0009917422146851103 },
    { x: -7.0, y: 0.0011793742358174788 },
    { x: -6.75, y: 0.0014024989376765495 },
    { x: -6.5, y: 0.0016678259026753472 },
    { x: -6.25, y: 0.0019833302019248295 },
    { x: -6.0, y: 0.0023584891000537813 },
    { x: -5.75, y: 0.0028045616828088586 },
    { x: -5.5, y: 0.0033349182596254523 },
    { x: -5.25, y: 0.003965426826486793 },
    { x: -5.0, y: 0.004714903803466581 },
    { x: -4.75, y: 0.005605635195101995 },
    { x: -4.5, y: 0.006663971410992377 },
    { x: -4.25, y: 0.007920992780179235 },
    { x: -4.0, y: 0.009413230851614732 },
    { x: -3.75, y: 0.011183408812277904 },
    { x: -3.5, y: 0.013281126033835966 },
    { x: -3.25, y: 0.015763345904002732 },
    { x: -3.0, y: 0.018694435184109598 },
    { x: -2.75, y: 0.022145319956998463 },
    { x: -2.5, y: 0.026191027432222014 },
    { x: -2.25, y: 0.030905419132291584 },
    { x: -2.0, y: 0.03635122487377773 },
    { x: -1.75, y: 0.04256251392861174 },
    { x: -1.5, y: 0.04951555233897614 },
    { x: -1.25, y: 0.05708298004081308 },
    { x: -1.0, y: 0.06496657592502214 },
    { x: -0.75, y: 0.07260837933999825 },
    { x: -0.5, y: 0.07909415535345521 },
    { x: -0.25, y: 0.08309545897058412 },
    { x: 0.0, y: 0.08295233247311673 },
    { x: 0.25, y: 0.0770589683395122 },
    { x: 0.5, y: 0.06469018758700928 },
    { x: 0.75, y: 0.047108755566917515 },
    { x: 1.0, y: 0.028112982508810114 },
    { x: 1.25, y: 0.012709546406501016 },
    { x: 1.5, y: 0.003908365424252547 },
    { x: 1.75, y: 0.0007060270731285012 },
    { x: 2.0, y: 6.137590223842526e-5 },
    { x: 2.25, y: 1.9511641698999327e-6 },
    { x: 2.5, y: 1.5399958641637568e-8 },
    { x: 2.75, y: 1.7298051879777177e-11 },
    { x: 3.0, y: 1.2212453270876722e-15 },
  ];
  gaussianData = gaussianData.map((d) => ({
    x: d.x,
    y: d.y * initialNumSamples,
  }));

  // Scales
  xDomain = d3.extent(fpData, (d) => d.x);
  xDomain = [xDomain[0] - 0.5, xDomain[1] + 1.5];
  const xScale = d3.scaleLinear().domain(xDomain).range([0, chartWidth]);
  const yScale = d3
    .scaleLog()
    .base(2)
    .domain([
      1 / 2,
      Math.max(
        d3.max(gaussianData, (d) => d.y),
        d3.max(fpData, (d) => d.y),
      ) * 1.1,
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
    .selectAll(".fake-fp-horizontal-line")
    .data(fpData)
    .enter()
    .append("line")
    .attr("class", "fake-fp-horizontal-line")
    .attr("x1", (d) => xScale(d.x))
    .attr("x2", (d) => xScale(d.x + stepSize))
    .attr("y1", (d) => yScale(d.y))
    .attr("y2", (d) => yScale(d.y))
    .attr("stroke", "orange")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", lineWidth);

  barsGroup
    .selectAll(".fake-fp-light-bar")
    .data(fpData)
    .enter()
    .append("rect")
    .attr("class", "fake-fp-light-bar")
    .attr("x", (d) => xScale(d.x))
    .attr("y", (d) => yScale(d.y))
    .attr("width", stepSize * (xScale(1) - xScale(0)))
    .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)))
    .attr("fill", "#ffedcc");

  barsGroup
    .selectAll(".fake-fp-vertical-line")
    .data(fpDataVertical)
    .enter()
    .append("line")
    .attr("class", "fake-fp-vertical-line")
    .attr("x1", (d) => xScale(d.x))
    .attr("x2", (d) => xScale(d.x))
    .attr("y1", (d) => yScale(d.y1))
    .attr("y2", (d) => yScale(d.y2))
    .attr("stroke", "orange")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", lineWidth);

  barsGroup
    .selectAll(".gaussian-bar")
    .data(gaussianData)
    .enter()
    .append("rect")
    .attr("class", "gaussian-bar")
    .attr("x", (d) => xScale(d.x))
    .attr("y", (d) => yScale(d.y))
    .attr("width", xScale(1) - xScale(0))
    .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)))
    .attr("fill", "steelblue");

  /// --- Axes ---

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

  // --- Zoom ---

  let currentTransform = d3.zoomIdentity;

  // Define the zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([0.25, 10]) // Limit zoom levels
    .translateExtent([
      [-chartWidth, 0],
      [2 * chartWidth, chartHeight],
    ]) // Allow dragging beyond the bounds
    .on("start", ({ sourceEvent }) => {
      if (sourceEvent?.type.match(/^(mousedown|touchstart)$/)) {
        svg.style("cursor", "grabbing");
      }
    })
    .on("zoom", function (event) {
      currentTransform = event.transform;
      const newXScale = event.transform.rescaleX(xScale);
      xAxisGroup.call(xAxis.scale(newXScale));

      // Update positions and widths based on the new scale
      barsGroup
        .selectAll(".gaussian-bar")
        .attr("x", (d) => newXScale(d.x))
        .attr("width", newXScale(1) - newXScale(0));

      barsGroup
        .selectAll(".fake-fp-horizontal-line")
        .attr("x1", (d) => newXScale(d.x))
        .attr("x2", (d) => newXScale(d.x + stepSize));

      barsGroup
        .selectAll(".fake-fp-light-bar")
        .attr("x", (d) => newXScale(d.x))
        .attr("width", stepSize * (newXScale(1) - newXScale(0)));

      barsGroup
        .selectAll(".fake-fp-vertical-line")
        .attr("x1", (d) => newXScale(d.x))
        .attr("x2", (d) => newXScale(d.x));
    })
    .on("end", ({ sourceEvent }) => {
      if (sourceEvent?.type.match(/^(mouseup|touchend)$/)) {
        svg.style("cursor", "grab");
      }
    });
  svg.call(zoom).style("cursor", "grab");

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
    .attr("min", 2)
    .attr("max", 20)
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
          d3.max(fpData, (d) => d.y),
        ) * 1.1,
      ]);
      yAxisGroup.call(yAxis.scale(yScale));

      barsGroup
        .selectAll(".gaussian-bar")
        .attr("y", (d) => yScale(d.y))
        .attr("height", (d) => Math.max(0, chartHeight - yScale(d.y)));
      barsGroup
        .selectAll(".fake-fp-horizontal-line")
        .attr("y1", (d) => yScale(d.y))
        .attr("y2", (d) => yScale(d.y));
      barsGroup.selectAll(".fake-fp-light-bar").attr("y", (d) => yScale(d.y));
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
}

fetch("data.json")
  .then((response) => response.json())
  .then(generateChart);
