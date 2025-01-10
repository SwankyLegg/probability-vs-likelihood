export class NormalDistribution {
  constructor(containerId, options = {}) {
    this.margin = { top: 10, right: 10, bottom: 30, left: 50 };
    this.width = (options.width || 760) - this.margin.left - this.margin.right;
    this.height = (options.height || 400) - this.margin.top - this.margin.bottom;
    this.showYAxisLabels = false;  // Initialize to false for probability mode
    this.isLikelihoodMode = false; // Track the current mode

    this.svg = d3.select(containerId)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .style("cursor", "default")
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    // Add drag overlay (invisible by default)
    this.dragOverlay = this.svg.append("rect")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("fill", "none")
      .attr("pointer-events", "none")
      .style("cursor", "grabbing");

    this.setupScales();
    this.setupAxes();
    this.setupLine();

    // Create a group for the curve that will always be behind the handle
    this.curveGroup = this.svg.append("g").attr("class", "curve-group");

    // Create handle last so it's on top
    this.setupHandle();
  }

  setupScales() {
    this.x = d3.scaleLinear()
      .range([0, this.width]);
    this.updateXDomain();

    this.y = d3.scaleLinear()
      .domain([0, 0.5])
      .range([this.height, 0]);
  }

  updateXDomain() {
    const min = parseFloat(document.getElementById('range-min').value);
    const max = parseFloat(document.getElementById('range-max').value);

    // Update X axis
    this.x.domain([min, max]);
    const formatXNumber = d => Math.round(d).toString();
    this.svg.select(".x-axis").call(d3.axisBottom(this.x).tickFormat(formatXNumber));
  }

  updateYDomain(points) {
    if (!points || points.length === 0) return;

    // Find the maximum Y value in the data
    const maxY = d3.max(points, d => d.y);
    // Add 10% padding to the top
    const yMax = maxY * 1.1;

    // Update Y axis scale
    this.y.domain([0, yMax]);

    // Update Y axis with labels hidden if not in likelihood mode
    const formatYNumber = d => {
      const num = Number(d);
      return num === 0 ? "0" : num.toString().replace(/^0+/, '');
    };
    this.svg.select(".y-axis")
      .call(d3.axisLeft(this.y).tickFormat(formatYNumber))
      .selectAll("text")
      .style("opacity", this.showYAxisLabels ? 1 : 0);
  }

  setupAxes() {
    const formatXNumber = d => Math.round(d).toString();
    const formatYNumber = d => {
      const num = Number(d);
      return num === 0 ? "0" : num.toString().replace(/^0+/, '');
    };

    this.svg.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(this.x).tickFormat(formatXNumber));

    this.svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(this.y).tickFormat(formatYNumber));

    // Add Y axis label
    this.yAxisLabel = this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - (this.height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("opacity", 0)  // Initially hidden
      .text("Probability density");
  }

  toggleYAxisLabels(show) {
    this.showYAxisLabels = show;
    this.svg.select(".y-axis")
      .selectAll("text")
      .style("opacity", show ? 1 : 0);

    // Also toggle the Y axis label visibility
    this.yAxisLabel.style("opacity", show ? 1 : 0);
  }

  setupLine() {
    this.line = d3.line()
      .x(d => this.x(d.x))
      .y(d => this.y(d.y));

    // Add area generators for shading
    this.areaLeft = d3.area()
      .x(d => this.x(d.x))
      .y0(this.height)
      .y1(d => this.y(d.y));

    this.areaRight = d3.area()
      .x(d => this.x(d.x))
      .y0(this.height)
      .y1(d => this.y(d.y));
  }

  setupHandle() {
    // Create a group for the handle
    const handleGroup = this.svg.append("g");

    // Add the handle path using the SVG from graph_handle.svg
    this.handle = handleGroup.append("path")
      .attr("d", "M8.70711 18.6066C8.31658 18.9971 7.68342 18.9971 7.29289 18.6066L2.34315 13.6569C-0.781048 10.5327 -0.781049 5.46734 2.34315 2.34315C5.46734 -0.781048 10.5327 -0.781049 13.6569 2.34315C16.781 5.46734 16.781 10.5327 13.6569 13.6569L8.70711 18.6066Z")
      .attr("fill", "#ff4444")
      .attr("cursor", "grab")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Add vertical line in the curve group (solid purple for probability mode)
    this.verticalLine = this.curveGroup.append("line")
      .attr("stroke", "#8B44FF")
      .attr("stroke-width", 2);

    // Add horizontal dotted line in the curve group
    this.horizontalLine = this.curveGroup.append("line")
      .attr("stroke", "#ff4444")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0);  // Hidden by default
  }

  setLikelihoodMode(isLikelihood) {
    this.isLikelihoodMode = isLikelihood;
    this.horizontalLine.attr("opacity", isLikelihood ? 1 : 0);

    // Update vertical line style based on mode
    if (!isLikelihood) {
      this.verticalLine
        .attr("stroke", "#8B44FF")  // Purple color
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", null);  // Remove dash array for solid line
    } else {
      this.verticalLine
        .attr("stroke", "#ff4444")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");
    }

    // Toggle visibility of shaded areas
    this.curveGroup.selectAll(".area-left, .area-right")
      .style("display", isLikelihood ? "none" : "block");

    // If switching to probability mode, ensure areas are updated
    if (!isLikelihood) {
      const points = this.curveGroup.select(".distribution-line").datum();
      const xValue = parseFloat(document.getElementById('x-value').value);
      this.updateShading(points, xValue);
    }
  }

  updateShading(points, xValue) {
    if (!this.isLikelihoodMode && points) {
      // Add a tiny buffer to ensure areas overlap
      const buffer = 0.04;
      const leftPoints = points.filter(p => p.x <= xValue + buffer);
      const rightPoints = points.filter(p => p.x >= xValue - buffer);

      // Update or create left (blue) shaded area
      let areaLeft = this.curveGroup.select(".area-left");
      if (areaLeft.empty()) {
        areaLeft = this.curveGroup.append("path")
          .attr("class", "area-left")
          .attr("fill", "#2196F3")
          .attr("fill-opacity", 0.2);
      }
      areaLeft.datum(leftPoints).attr("d", this.areaLeft);

      // Update or create right (red) shaded area
      let areaRight = this.curveGroup.select(".area-right");
      if (areaRight.empty()) {
        areaRight = this.curveGroup.append("path")
          .attr("class", "area-right")
          .attr("fill", "#ff4444")
          .attr("fill-opacity", 0.2);
      }
      areaRight.datum(rightPoints).attr("d", this.areaRight);
    }
  }

  updateHandle(xValue, yValue) {
    const xPos = this.x(xValue);
    const yPos = this.y(yValue);
    const handleWidth = 16;
    const handleHeight = 19;

    // Position the handle with its tip on the line
    this.handle
      .attr("transform", `translate(${xPos - handleWidth / 2},${yPos - handleHeight}) scale(1)`);

    // Update vertical line to extend below the graph
    this.verticalLine
      .attr("x1", xPos)
      .attr("y1", yPos)
      .attr("x2", xPos)
      .attr("y2", this.height);

    // Update horizontal line to extend to Y axis
    this.horizontalLine
      .attr("x1", 0)
      .attr("y1", yPos)
      .attr("x2", xPos)
      .attr("y2", yPos);

    // Update shaded areas
    const points = this.curveGroup.select(".distribution-line").datum();
    this.updateShading(points, xValue);
  }

  setupDrag(onDrag) {
    // Store the callback for use in click handler
    this.onDragCallback = onDrag;

    const drag = d3.drag()
      .on("drag", event => {
        const xValue = this.x.invert(Math.min(Math.max(0, event.x), this.width));
        onDrag(xValue);
      })
      .on("start", () => {
        this.handle.attr("cursor", "grabbing");
        // Enable overlay during drag
        this.dragOverlay.attr("pointer-events", "all");
        this.svg.style("cursor", "grabbing");
      })
      .on("end", () => {
        this.handle.attr("cursor", "grab");
        // Disable overlay after drag
        this.dragOverlay.attr("pointer-events", "none");
        this.svg.style("cursor", "default");
      });

    this.handle.call(drag);
  }

  handleLineClick(event, points) {
    const mouseX = d3.pointer(event)[0];
    const xValue = this.x.invert(mouseX);

    // Find the closest point on the curve
    const closestPoint = points.reduce((prev, curr) => {
      return Math.abs(curr.x - xValue) < Math.abs(prev.x - xValue) ? curr : prev;
    });

    // Update handle position through the drag callback
    if (this.onDragCallback) {
      this.onDragCallback(closestPoint.x);
    }
  }

  updateCurve(points) {
    // Update both X and Y domains
    this.updateXDomain();
    this.updateYDomain(points);

    // Clear and redraw the curve
    this.curveGroup.selectAll(".distribution-line, .distribution-line-hitarea, .area-left, .area-right").remove();

    // Add wider invisible path for hit detection
    this.curveGroup.append("path")
      .datum(points)
      .attr("class", "distribution-line-hitarea")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", "16")
      .attr("cursor", "pointer")
      .attr("d", this.line)
      .on("click", (event) => this.handleLineClick(event, points));

    // Add visible path on top
    this.curveGroup.append("path")
      .datum(points)
      .attr("class", "distribution-line")
      .attr("fill", "none")
      .attr("stroke", "#2196F3")  // Always blue
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .attr("d", this.line)
      .on("click", (event) => this.handleLineClick(event, points));

    // Update shaded areas
    const xValue = parseFloat(document.getElementById('x-value').value);
    this.updateShading(points, xValue);
  }
} 