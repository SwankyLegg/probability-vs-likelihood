export class MathUtils {
  static normalPDF(x, mean, sd) {
    const coefficient = 1 / (sd * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * sd * sd);
    return coefficient * Math.exp(exponent);
  }

  static normalCDF(x, mean, sd) {
    return 0.5 * (1 + this.erf((x - mean) / (sd * Math.sqrt(2))));
  }

  // Error function approximation
  static erf(x) {
    const sign = Math.sign(x);
    x = Math.abs(x);

    // Constants for approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    // Approximation formula
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Inverse error function approximation
  static erfinv(x) {
    const sign = Math.sign(x);
    x = Math.abs(x);

    // Approximation for |x| ≤ 0.7
    if (x <= 0.7) {
      const x2 = x * x;
      return sign * x * (((1.0 * x2 + 0.278393) * x2 + 0.230389) * x2 + 0.000972 + 1.0) /
        (((1.0 * x2 + 0.352246) * x2 + 0.260223) * x2 + 1.0);
    }

    // Approximation for |x| > 0.7
    const y = Math.sqrt(-Math.log((1 - x) / 2));
    return sign * (((((2.32121 * y + 4.85037) * y - 2.29796) * y - 2.78718) * y + 2.37847) * y + 1.91915) /
      (((((1.49012 * y + 0.147037) * y - 2.07119) * y + 4.94554) * y - 2.54469) * y + 1.0);
  }

  // Inverse normal CDF (probit function)
  static normalInverseCDF(p, mean = 0, sd = 1) {
    if (p <= 0 || p >= 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    return mean + sd * Math.sqrt(2) * this.erfinv(2 * p - 1);
  }

  static generateDistributionPoints(mean, sd, start, end, step = 0.1) {
    const points = [];
    for (let x = start; x <= end; x += step) {
      points.push({
        x: x,
        y: this.normalPDF(x, mean, sd)
      });
    }
    return points;
  }

  static generateLikelihoodPoints(fixedX, sd, start, end, step = 0.1) {
    const points = [];
    for (let mean = start; mean <= end; mean += step) {
      points.push({
        x: mean,
        y: this.normalPDF(fixedX, mean, sd)
      });
    }
    return points;
  }

  static adjustStep(start, end) {
    // Adjust step size based on range to maintain smooth curve
    const range = Math.abs(end - start);
    return Math.max(0.1, range / 200); // Ensures we have at most 200 points
  }
} 