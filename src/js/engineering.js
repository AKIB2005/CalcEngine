/**
 * CalcEngine — Engineering Utilities
 * Number systems, bitwise ops, electrical calculations, unit conversions, and toolkit
 */

// ========== Number System Conversions ==========

export function decimalToBinary(dec) {
  const n = parseInt(dec, 10);
  if (isNaN(n)) return '';
  return (n >>> 0).toString(2);
}

export function decimalToOctal(dec) {
  const n = parseInt(dec, 10);
  if (isNaN(n)) return '';
  return (n >>> 0).toString(8);
}

export function decimalToHex(dec) {
  const n = parseInt(dec, 10);
  if (isNaN(n)) return '';
  return (n >>> 0).toString(16).toUpperCase();
}

export function binaryToDecimal(bin) {
  if (!/^[01]+$/.test(bin)) return NaN;
  return parseInt(bin, 2);
}

export function octalToDecimal(oct) {
  if (!/^[0-7]+$/.test(oct)) return NaN;
  return parseInt(oct, 8);
}

export function hexToDecimal(hex) {
  if (!/^[0-9a-fA-F]+$/.test(hex)) return NaN;
  return parseInt(hex, 16);
}

export function convertFromBase(value, fromBase) {
  const str = value.toString().trim();
  if (!str) return NaN;

  switch (fromBase) {
    case 2: return binaryToDecimal(str);
    case 8: return octalToDecimal(str);
    case 10: return parseInt(str, 10);
    case 16: return hexToDecimal(str);
    default: return NaN;
  }
}

export function convertToBase(decimal, toBase) {
  if (isNaN(decimal)) return '';
  const n = parseInt(decimal, 10);
  switch (toBase) {
    case 2: return decimalToBinary(n);
    case 8: return decimalToOctal(n);
    case 10: return n.toString();
    case 16: return decimalToHex(n);
    default: return '';
  }
}

// ========== Bitwise Operations ==========

export function bitwiseAnd(a, b) { return (a & b) >>> 0; }
export function bitwiseOr(a, b) { return (a | b) >>> 0; }
export function bitwiseXor(a, b) { return (a ^ b) >>> 0; }
export function bitwiseNot(a) { return (~a) >>> 0; }
export function leftShift(a, b) { return (a << b) >>> 0; }
export function rightShift(a, b) { return a >>> b; }

export function performBitwise(op, a, b) {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);

  if (isNaN(numA)) return { result: null, error: 'Invalid value A' };

  let result;
  let description;

  switch (op) {
    case 'and':
      if (isNaN(numB)) return { result: null, error: 'Invalid value B' };
      result = bitwiseAnd(numA, numB);
      description = `${numA} AND ${numB}`;
      break;
    case 'or':
      if (isNaN(numB)) return { result: null, error: 'Invalid value B' };
      result = bitwiseOr(numA, numB);
      description = `${numA} OR ${numB}`;
      break;
    case 'xor':
      if (isNaN(numB)) return { result: null, error: 'Invalid value B' };
      result = bitwiseXor(numA, numB);
      description = `${numA} XOR ${numB}`;
      break;
    case 'not':
      result = bitwiseNot(numA);
      description = `NOT ${numA}`;
      break;
    case 'lshift':
      if (isNaN(numB)) return { result: null, error: 'Invalid value B' };
      result = leftShift(numA, numB);
      description = `${numA} << ${numB}`;
      break;
    case 'rshift':
      if (isNaN(numB)) return { result: null, error: 'Invalid value B' };
      result = rightShift(numA, numB);
      description = `${numA} >> ${numB}`;
      break;
    default:
      return { result: null, error: 'Unknown operation' };
  }

  return {
    result,
    description,
    decimal: result.toString(),
    binary: result.toString(2),
    hex: result.toString(16).toUpperCase(),
    octal: result.toString(8),
    error: null,
  };
}

// ========== Electrical Calculations ==========

/**
 * Ohm's Law: V = I × R
 * Given any two, calculate the third
 */
export function ohmsLaw(v, i, r) {
  const vals = [v, i, r].map(x => x !== '' && x !== null && x !== undefined ? parseFloat(x) : null);
  const [voltage, current, resistance] = vals;
  const filled = vals.filter(x => x !== null && !isNaN(x)).length;

  if (filled < 2) return { error: 'Enter any two values' };

  if (voltage === null || isNaN(voltage)) {
    return { result: `Voltage = ${(current * resistance).toPrecision(6)} V`, error: null };
  }
  if (current === null || isNaN(current)) {
    if (resistance === 0) return { error: 'Resistance cannot be zero' };
    return { result: `Current = ${(voltage / resistance).toPrecision(6)} A`, error: null };
  }
  if (resistance === null || isNaN(resistance)) {
    if (current === 0) return { error: 'Current cannot be zero' };
    return { result: `Resistance = ${(voltage / current).toPrecision(6)} Ω`, error: null };
  }

  return { error: 'Leave one field empty to calculate it' };
}

/**
 * Power Calculator: P = V × I
 */
export function powerCalc(p, v, i) {
  const vals = [p, v, i].map(x => x !== '' && x !== null && x !== undefined ? parseFloat(x) : null);
  const [power, voltage, current] = vals;
  const filled = vals.filter(x => x !== null && !isNaN(x)).length;

  if (filled < 2) return { error: 'Enter any two values' };

  if (power === null || isNaN(power)) {
    return { result: `Power = ${(voltage * current).toPrecision(6)} W`, error: null };
  }
  if (voltage === null || isNaN(voltage)) {
    if (current === 0) return { error: 'Current cannot be zero' };
    return { result: `Voltage = ${(power / current).toPrecision(6)} V`, error: null };
  }
  if (current === null || isNaN(current)) {
    if (voltage === 0) return { error: 'Voltage cannot be zero' };
    return { result: `Current = ${(power / voltage).toPrecision(6)} A`, error: null };
  }

  return { error: 'Leave one field empty to calculate it' };
}

/**
 * Series resistance
 */
export function seriesResistance(resistances) {
  if (!resistances || resistances.length === 0) return { error: 'Enter resistance values' };
  const total = resistances.reduce((sum, r) => sum + r, 0);
  return { result: total, error: null };
}

/**
 * Parallel resistance
 */
export function parallelResistance(resistances) {
  if (!resistances || resistances.length === 0) return { error: 'Enter resistance values' };
  if (resistances.some(r => r === 0)) return { error: 'Resistance values must be non-zero' };
  const reciprocalSum = resistances.reduce((sum, r) => sum + (1 / r), 0);
  return { result: 1 / reciprocalSum, error: null };
}

/**
 * Frequency ↔ Wavelength: λ = c / f
 */
const SPEED_OF_LIGHT = 299792458; // m/s

export function freqToWavelength(freq) {
  if (freq <= 0) return { error: 'Frequency must be positive' };
  return { result: SPEED_OF_LIGHT / freq, error: null };
}

export function wavelengthToFreq(wavelength) {
  if (wavelength <= 0) return { error: 'Wavelength must be positive' };
  return { result: SPEED_OF_LIGHT / wavelength, error: null };
}

// ========== Unit Conversions ==========

export const unitCategories = {
  length: {
    units: ['meter', 'kilometer', 'centimeter', 'millimeter', 'mile', 'yard', 'foot', 'inch', 'nautical mile'],
    // All relative to meter
    factors: {
      meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
      mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254, 'nautical mile': 1852,
    },
  },
  mass: {
    units: ['kilogram', 'gram', 'milligram', 'metric ton', 'pound', 'ounce', 'stone'],
    factors: {
      kilogram: 1, gram: 0.001, milligram: 0.000001, 'metric ton': 1000,
      pound: 0.453592, ounce: 0.0283495, stone: 6.35029,
    },
  },
  temperature: {
    units: ['celsius', 'fahrenheit', 'kelvin'],
    custom: true,
  },
  time: {
    units: ['second', 'millisecond', 'microsecond', 'minute', 'hour', 'day', 'week', 'year'],
    factors: {
      second: 1, millisecond: 0.001, microsecond: 0.000001,
      minute: 60, hour: 3600, day: 86400, week: 604800, year: 31557600,
    },
  },
  area: {
    units: ['sq meter', 'sq kilometer', 'sq centimeter', 'sq mile', 'sq yard', 'sq foot', 'acre', 'hectare'],
    factors: {
      'sq meter': 1, 'sq kilometer': 1e6, 'sq centimeter': 1e-4,
      'sq mile': 2589988.11, 'sq yard': 0.836127, 'sq foot': 0.092903,
      acre: 4046.86, hectare: 10000,
    },
  },
  volume: {
    units: ['liter', 'milliliter', 'cubic meter', 'gallon (US)', 'quart', 'pint', 'cup', 'fluid ounce'],
    factors: {
      liter: 1, milliliter: 0.001, 'cubic meter': 1000,
      'gallon (US)': 3.78541, quart: 0.946353, pint: 0.473176,
      cup: 0.236588, 'fluid ounce': 0.0295735,
    },
  },
  speed: {
    units: ['m/s', 'km/h', 'mph', 'knot', 'ft/s'],
    factors: {
      'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, knot: 0.514444, 'ft/s': 0.3048,
    },
  },
  pressure: {
    units: ['pascal', 'kilopascal', 'bar', 'atmosphere', 'psi', 'mmHg', 'torr'],
    factors: {
      pascal: 1, kilopascal: 1000, bar: 100000, atmosphere: 101325,
      psi: 6894.76, mmHg: 133.322, torr: 133.322,
    },
  },
  energy: {
    units: ['joule', 'kilojoule', 'calorie', 'kilocalorie', 'watt-hour', 'kWh', 'electronvolt', 'BTU'],
    factors: {
      joule: 1, kilojoule: 1000, calorie: 4.184, kilocalorie: 4184,
      'watt-hour': 3600, kWh: 3600000, electronvolt: 1.602e-19, BTU: 1055.06,
    },
  },
  power: {
    units: ['watt', 'kilowatt', 'megawatt', 'horsepower', 'BTU/h'],
    factors: {
      watt: 1, kilowatt: 1000, megawatt: 1e6, horsepower: 745.7, 'BTU/h': 0.293071,
    },
  },
  frequency: {
    units: ['hertz', 'kilohertz', 'megahertz', 'gigahertz'],
    factors: {
      hertz: 1, kilohertz: 1000, megahertz: 1e6, gigahertz: 1e9,
    },
  },
};

/**
 * Convert between units
 */
export function convertUnit(category, fromUnit, toUnit, value) {
  const cat = unitCategories[category];
  if (!cat) return { result: null, error: 'Unknown category' };

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return { result: null, error: 'Invalid value' };

  // Special handling for temperature
  if (category === 'temperature') {
    return convertTemperature(fromUnit, toUnit, numValue);
  }

  const fromFactor = cat.factors[fromUnit];
  const toFactor = cat.factors[toUnit];
  if (fromFactor === undefined || toFactor === undefined) {
    return { result: null, error: 'Unknown unit' };
  }

  // Convert: value * fromFactor gives base unit, then divide by toFactor
  const result = (numValue * fromFactor) / toFactor;
  return { result, error: null };
}

function convertTemperature(from, to, value) {
  let celsius;

  // Convert to Celsius first
  switch (from) {
    case 'celsius': celsius = value; break;
    case 'fahrenheit': celsius = (value - 32) * 5 / 9; break;
    case 'kelvin': celsius = value - 273.15; break;
    default: return { result: null, error: 'Unknown temperature unit' };
  }

  // Convert from Celsius to target
  let result;
  switch (to) {
    case 'celsius': result = celsius; break;
    case 'fahrenheit': result = celsius * 9 / 5 + 32; break;
    case 'kelvin': result = celsius + 273.15; break;
    default: return { result: null, error: 'Unknown temperature unit' };
  }

  return { result, error: null };
}

// ========== Toolkit Functions ==========

/**
 * Quadratic equation solver: ax² + bx + c = 0
 */
export function solveQuadratic(a, b, c) {
  if (a === 0) {
    if (b === 0) return { error: 'Not a valid equation (a and b are both 0)' };
    return { roots: [-c / b], type: 'linear', discriminant: null };
  }

  const discriminant = b * b - 4 * a * c;

  if (discriminant > 0) {
    const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    return { roots: [x1, x2], type: 'real', discriminant };
  } else if (discriminant === 0) {
    const x = -b / (2 * a);
    return { roots: [x], type: 'repeated', discriminant };
  } else {
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-discriminant) / (2 * a);
    return {
      roots: [
        { real: realPart, imag: imagPart },
        { real: realPart, imag: -imagPart },
      ],
      type: 'complex',
      discriminant,
    };
  }
}

/**
 * Statistics calculator
 */
export function calculateStatistics(data) {
  if (!data || data.length === 0) return { error: 'No data provided' };

  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);

  // Mean
  const sum = data.reduce((s, v) => s + v, 0);
  const mean = sum / n;

  // Median
  let median;
  if (n % 2 === 0) {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  } else {
    median = sorted[Math.floor(n / 2)];
  }

  // Mode
  const frequency = {};
  let maxFreq = 0;
  data.forEach(v => {
    frequency[v] = (frequency[v] || 0) + 1;
    if (frequency[v] > maxFreq) maxFreq = frequency[v];
  });
  const mode = maxFreq > 1
    ? Object.keys(frequency).filter(k => frequency[k] === maxFreq).map(Number)
    : [];

  // Standard deviation (population)
  const variance = data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Sample standard deviation
  const sampleVariance = n > 1 ? data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
  const sampleStdDev = Math.sqrt(sampleVariance);

  return {
    count: n,
    sum: parseFloat(sum.toPrecision(12)),
    mean: parseFloat(mean.toPrecision(12)),
    median: parseFloat(median.toPrecision(12)),
    mode: mode.length > 0 ? mode : 'No mode',
    min: sorted[0],
    max: sorted[n - 1],
    range: parseFloat((sorted[n - 1] - sorted[0]).toPrecision(12)),
    stdDev: parseFloat(stdDev.toPrecision(12)),
    sampleStdDev: parseFloat(sampleStdDev.toPrecision(12)),
    variance: parseFloat(variance.toPrecision(12)),
  };
}

/**
 * Matrix operations
 */
export function matrixAdd(a, b) {
  const rows = a.length;
  const cols = a[0].length;
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

export function matrixSubtract(a, b) {
  return a.map((row, i) => row.map((val, j) => val - b[i][j]));
}

export function matrixMultiply(a, b) {
  const rowsA = a.length;
  const colsA = a[0].length;
  const colsB = b[0].length;
  const result = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

export function matrixDeterminant(m) {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];

  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
    det += (j % 2 === 0 ? 1 : -1) * m[0][j] * matrixDeterminant(minor);
  }
  return det;
}

export function matrixTranspose(m) {
  return m[0].map((_, j) => m.map(row => row[j]));
}

/**
 * Combinatorics
 */
export function factorial(n) {
  if (n < 0) throw new Error('Factorial requires non-negative integer');
  if (!Number.isInteger(n)) throw new Error('Factorial requires an integer');
  if (n > 170) throw new Error('Result too large');
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function permutation(n, r) {
  if (n < 0 || r < 0) throw new Error('Values must be non-negative');
  if (r > n) throw new Error('r cannot be greater than n');
  return factorial(n) / factorial(n - r);
}

export function combination(n, r) {
  if (n < 0 || r < 0) throw new Error('Values must be non-negative');
  if (r > n) throw new Error('r cannot be greater than n');
  return factorial(n) / (factorial(r) * factorial(n - r));
}

/**
 * Number theory
 */
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

export function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

/**
 * Percentage calculator
 */
export function percentageCalc(value, percent) {
  const result = (value * percent) / 100;
  return {
    percentOf: result,
    increase: value + result,
    decrease: value - result,
  };
}
