import { MathUtils } from './MathUtils.js';
import { NormalDistribution } from './NormalDistribution.js';

export class DistributionController {
  constructor() {
    this.currentMode = 'probability';
    this.fixedX = 0;
    this.distribution = new NormalDistribution('#plot');
    this.lastMean = null;
    this.lastSd = null;
    this.lastMin = null;
    this.lastMax = null;
    this.setupEventListeners();
    // Set initial Y-axis label visibility
    this.distribution.toggleYAxisLabels(false);
    this.pathPoints = null;  // Initialize pathPoints as null
  }

  setupEventListeners() {
    // Mode toggle
    document.getElementById('mode-toggle').addEventListener('change', (e) => {
      this.handleModeChange(e.target.checked);
    });

    // Add click handlers for mode labels
    document.querySelector('.probability-label').addEventListener('click', () => {
      const toggle = document.getElementById('mode-toggle');
      toggle.checked = false;
      this.handleModeChange(false);
    });

    document.querySelector('.likelihood-label').addEventListener('click', () => {
      const toggle = document.getElementById('mode-toggle');
      toggle.checked = true;
      this.handleModeChange(true);
    });

    // Probability fields
    document.getElementById('less-than-prob').addEventListener('change', (e) => {
      if (this.currentMode !== 'probability') return;
      let percentage = Number(e.target.value);
      if (isNaN(percentage)) return;

      try {
        const mean = parseFloat(document.getElementById('mean').value);
        const sd = parseFloat(document.getElementById('sd').value);
        const probability = percentage / 100;
        const xValue = MathUtils.normalInverseCDF(probability, mean, sd);

        // Update x-value and handle
        document.getElementById('x-value').value = xValue.toFixed(2);
        document.getElementById('greater-than-prob').value = (100 - percentage).toFixed(2);

        const yValue = MathUtils.normalPDF(xValue, mean, sd);
        this.distribution.updateHandle(xValue, yValue);
      } catch (error) {
        console.error('Invalid probability value');
      }
    });

    document.getElementById('greater-than-prob').addEventListener('change', (e) => {
      if (this.currentMode !== 'probability') return;
      let percentage = Number(e.target.value);
      if (isNaN(percentage)) return;

      try {
        const mean = parseFloat(document.getElementById('mean').value);
        const sd = parseFloat(document.getElementById('sd').value);
        const probability = percentage / 100;
        const xValue = MathUtils.normalInverseCDF(1 - probability, mean, sd);

        // Update x-value and handle
        document.getElementById('x-value').value = xValue.toFixed(2);
        document.getElementById('less-than-prob').value = (100 - percentage).toFixed(2);

        const yValue = MathUtils.normalPDF(xValue, mean, sd);
        this.distribution.updateHandle(xValue, yValue);
      } catch (error) {
        console.error('Invalid probability value');
      }
    });

    // Input controls
    document.getElementById('mean').addEventListener('input', (e) => {
      const value = e.target.value;
      if (value === '' || value === '-') return; // Allow typing negative numbers
      const numValue = Number(value);
      if (isNaN(numValue)) return;

      // Ensure mean stays within range bounds
      const min = parseFloat(document.getElementById('range-min').value);
      const max = parseFloat(document.getElementById('range-max').value);
      if (numValue < min) {
        e.target.value = min;
      } else if (numValue > max) {
        e.target.value = max;
      }

      this.checkRangeBounds();
      this.updateCurve();
    });

    document.getElementById('mean').addEventListener('blur', (e) => {
      const value = Number(e.target.value);
      const min = parseFloat(document.getElementById('range-min').value);
      const max = parseFloat(document.getElementById('range-max').value);
      const boundedValue = Math.min(Math.max(value, min), max);
      e.target.value = boundedValue.toFixed(2);
      if (boundedValue !== value) {
        this.updateCurve();
      }
    });

    document.getElementById('sd').addEventListener('input', (e) => {
      const value = e.target.value;
      if (value === '') return;
      const numValue = Number(value);
      if (isNaN(numValue) || numValue <= 0) return;
      this.checkRangeBounds();
      this.updateCurve();
    });

    document.getElementById('sd').addEventListener('blur', (e) => {
      const value = Math.max(0.1, Number(e.target.value));
      e.target.value = value.toFixed(2);
      this.updateCurve();
    });

    // Range controls
    document.getElementById('range-min').addEventListener('input', (e) => {
      const value = e.target.value;
      if (value === '' || value === '-') return; // Allow typing negative numbers
      const numValue = Number(value);
      if (isNaN(numValue)) return;
      this.handleRangeChange();
    });

    document.getElementById('range-max').addEventListener('input', (e) => {
      const value = e.target.value;
      if (value === '' || value === '-') return; // Allow typing negative numbers
      const numValue = Number(value);
      if (isNaN(numValue)) return;
      this.handleRangeChange();
    });

    // Handle drag
    this.distribution.setupDrag((xValue) => this.handleDrag(xValue));

    // X value input
    document.getElementById('x-value').addEventListener('change', (e) => {
      const value = e.target.value;
      if (value === '' || value === '-') return; // Allow typing negative numbers
      const numValue = Number(value);
      if (isNaN(numValue)) return;
      this.updateHandleOnly(numValue);
    });

    document.getElementById('x-value').addEventListener('blur', (e) => {
      if (e.target.value === '') {
        e.target.value = '0.00';
        return;
      }
      e.target.value = Number(e.target.value).toFixed(2);
    });

    // Probability density input
    document.getElementById('likelihood-value').addEventListener('input', (e) => {
      if (this.currentMode !== 'likelihood') return;
      const value = e.target.value;
      if (value === '') return;
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) return;

      // Find x value that corresponds to this probability density
      const mean = parseFloat(document.getElementById('mean').value);
      const sd = parseFloat(document.getElementById('sd').value);
      const min = parseFloat(document.getElementById('range-min').value);
      const max = parseFloat(document.getElementById('range-max').value);

      // Generate points for the current curve
      const points = MathUtils.generateLikelihoodPoints(this.fixedX, sd, min, max);

      // Find the point closest to the desired probability density
      const closestPoint = points.reduce((prev, curr) => {
        return Math.abs(curr.y - numValue) < Math.abs(prev.y - numValue) ? curr : prev;
      });

      // Update mean and handle position
      document.getElementById('mean').value = closestPoint.x.toFixed(2);
      this.updateHandleOnly(closestPoint.x);
    });

    document.getElementById('likelihood-value').addEventListener('blur', (e) => {
      const value = Math.max(0, Number(e.target.value));
      e.target.value = value.toFixed(4);
    });
  }

  checkRangeBounds() {
    const min = parseFloat(document.getElementById('range-min').value);
    const max = parseFloat(document.getElementById('range-max').value);
    const xValue = parseFloat(document.getElementById('x-value').value);

    let needsUpdate = false;

    // Ensure min is not above X value
    if (min > xValue) {
      document.getElementById('range-min').value = Math.floor(xValue);
      needsUpdate = true;
    }

    // Ensure max is not below X value
    if (max < xValue) {
      document.getElementById('range-max').value = Math.ceil(xValue);
      needsUpdate = true;
    }

    // Ensure min is not greater than or equal to max - 1
    if (min >= max - 1) {
      document.getElementById('range-max').value = Math.ceil(min + 1);
      needsUpdate = true;
    }

    // If either bound was updated, force a curve update
    if (needsUpdate) {
      this.lastMin = null;
      this.lastMax = null;
    }
  }

  handleRangeChange() {
    const min = parseFloat(document.getElementById('range-min').value);
    const max = parseFloat(document.getElementById('range-max').value);
    const xValue = parseFloat(document.getElementById('x-value').value);

    // Ensure min is not above X value
    if (min > xValue) {
      document.getElementById('range-min').value = Math.floor(xValue);
      return;
    }

    // Ensure max is not below X value
    if (max < xValue) {
      document.getElementById('range-max').value = Math.ceil(xValue);
      return;
    }

    // Ensure min is not greater than or equal to max - 1
    if (min >= max - 1) {
      document.getElementById('range-max').value = Math.ceil(min + 1);
      return;
    }

    // Force a curve update by clearing the last values
    this.lastMin = null;
    this.lastMax = null;

    // Update the curve which will also update the axes
    this.updateCurve();
  }

  handleModeChange(isLikelihood) {
    const currentX = parseFloat(document.getElementById('x-value').value);

    this.currentMode = isLikelihood ? 'likelihood' : 'probability';

    // Update labels
    document.querySelector('.probability-label').classList.toggle('active-mode', !isLikelihood);
    document.querySelector('.likelihood-label').classList.toggle('active-mode', isLikelihood);

    // Toggle Y-axis label visibility and horizontal line
    this.distribution.toggleYAxisLabels(isLikelihood);
    this.distribution.setLikelihoodMode(isLikelihood);

    // Toggle field visibility based on mode
    document.querySelector('.likelihood-field').style.display = isLikelihood ? 'block' : 'none';
    document.querySelectorAll('.probability-fields').forEach(field => {
      field.style.display = isLikelihood ? 'none' : 'block';
    });

    if (isLikelihood) {
      this.fixedX = currentX;
      // Calculate initial likelihood value
      const mean = parseFloat(document.getElementById('mean').value);
      const sd = parseFloat(document.getElementById('sd').value);
      const likelihood = MathUtils.normalPDF(currentX, mean, sd);
      document.getElementById('likelihood-value').value = likelihood.toFixed(4);
    } else {
      // Just update the probability fields without moving the handle
      this.updateProbabilities();
    }
  }

  handleDrag(xValue) {
    if (this.currentMode === 'likelihood') {
      document.getElementById('mean').value = Number(xValue).toFixed(2);
    }
    this.updateHandleOnly(xValue);
  }

  updateCurve() {
    const mean = parseFloat(document.getElementById('mean').value);
    const sd = parseFloat(document.getElementById('sd').value);
    const min = parseFloat(document.getElementById('range-min').value);
    const max = parseFloat(document.getElementById('range-max').value);
    const xValue = parseFloat(document.getElementById('x-value').value);

    // Generate points and update curve only if parameters changed
    if (this.shouldUpdateCurve()) {
      const points = this.currentMode === 'likelihood'
        ? MathUtils.generateLikelihoodPoints(xValue, sd, min, max)
        : MathUtils.generateDistributionPoints(mean, sd, min, max);

      this.distribution.updateCurve(points);
      this.pathPoints = points;  // Store the new path points

      // Store current values
      this.lastMean = mean;
      this.lastSd = sd;
      this.lastMin = min;
      this.lastMax = max;

      // Update likelihood value in likelihood mode
      if (this.currentMode === 'likelihood') {
        const likelihood = MathUtils.normalPDF(xValue, mean, sd);
        document.getElementById('likelihood-value').value = likelihood.toFixed(4);
      }
    }

    // Update handle position
    const currentX = parseFloat(document.getElementById('x-value').value) || mean;
    this.updateHandleOnly(currentX);
  }

  shouldUpdateCurve() {
    const mean = parseFloat(document.getElementById('mean').value);
    const sd = parseFloat(document.getElementById('sd').value);
    const min = parseFloat(document.getElementById('range-min').value);
    const max = parseFloat(document.getElementById('range-max').value);

    return !this.lastMean ||
      !this.lastSd ||
      mean !== this.lastMean ||
      sd !== this.lastSd ||
      min !== this.lastMin ||
      max !== this.lastMax;
  }

  updateHandleOnly(xValue) {
    if (!this.pathPoints) {
      // If no path points exist yet, generate them
      const mean = parseFloat(document.getElementById('mean').value);
      const sd = parseFloat(document.getElementById('sd').value);
      const min = parseFloat(document.getElementById('range-min').value);
      const max = parseFloat(document.getElementById('range-max').value);
      this.pathPoints = MathUtils.generateDistributionPoints(mean, sd, min, max);
      this.distribution.updateCurve(this.pathPoints);
    }

    // Find the two closest points and interpolate
    const sortedPoints = [...this.pathPoints].sort((a, b) => Math.abs(a.x - xValue) - Math.abs(b.x - xValue));
    const p1 = sortedPoints[0];
    const p2 = sortedPoints[1];

    let yValue;
    if (Math.abs(p1.x - xValue) < 0.0001) {
      // If we're very close to a point, just use that point's y-value
      yValue = p1.y;
    } else {
      // Linear interpolation between the two closest points
      const t = (xValue - p1.x) / (p2.x - p1.x);
      yValue = p1.y + t * (p2.y - p1.y);
    }

    // Update the handle position
    this.distribution.updateHandle(xValue, yValue);

    // Update X value input
    document.getElementById('x-value').value = xValue.toFixed(2);

    // Update probability fields in probability mode
    if (this.currentMode === 'probability') {
      this.updateProbabilities();
    }

    // Update likelihood value if in likelihood mode
    if (this.currentMode === 'likelihood') {
      const fixedX = this.fixedX;
      const mean = xValue;  // In likelihood mode, xValue is the mean
      const sd = parseFloat(document.getElementById('sd').value);
      const likelihood = MathUtils.normalPDF(fixedX, mean, sd);
      document.getElementById('likelihood-value').value = likelihood.toFixed(4);
    }
  }

  updateHandle(xValue) {
    const mean = parseFloat(document.getElementById('mean').value);
    const sd = parseFloat(document.getElementById('sd').value);
    const yValue = MathUtils.normalPDF(xValue, mean, sd);

    // Update handle position
    this.distribution.updateHandle(xValue, yValue);

    // Update probability fields in probability mode
    if (this.currentMode === 'probability') {
      const leftProb = MathUtils.normalCDF(xValue, mean, sd);
      const rightProb = 1 - leftProb;

      // Update probability fields without appending %
      document.getElementById('less-than-prob').value = (leftProb * 100).toFixed(2);
      document.getElementById('greater-than-prob').value = (rightProb * 100).toFixed(2);
    }
  }

  initialize() {
    this.updateCurve();
    this.updateProbabilities();
  }

  updateProbabilities() {
    const xValue = parseFloat(document.getElementById('x-value').value);
    const mean = parseFloat(document.getElementById('mean').value);
    const sd = parseFloat(document.getElementById('sd').value);

    const lessThanProb = MathUtils.normalCDF(xValue, mean, sd) * 100;
    const greaterThanProb = (1 - MathUtils.normalCDF(xValue, mean, sd)) * 100;

    document.getElementById('less-than-prob').value = lessThanProb.toFixed(2);
    document.getElementById('greater-than-prob').value = greaterThanProb.toFixed(2);
  }
} 