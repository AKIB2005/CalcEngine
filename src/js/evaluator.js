/**
 * CalcEngine — Safe Expression Evaluator
 * Uses math.js for safe expression parsing (no eval)
 */
import { create, all } from 'mathjs';

// Create a math.js instance with limited scope
const math = create(all, {
  number: 'number',
  precision: 14,
});

// Angle mode: 'deg', 'rad', 'grad'
let angleMode = 'deg';

/**
 * Convert angle to radians based on current angle mode
 */
function toRadians(angle) {
  switch (angleMode) {
    case 'deg': return (angle * Math.PI) / 180;
    case 'grad': return (angle * Math.PI) / 200;
    default: return angle;
  }
}

/**
 * Convert radians back to current angle mode
 */
function fromRadians(radians) {
  switch (angleMode) {
    case 'deg': return (radians * 180) / Math.PI;
    case 'grad': return (radians * 200) / Math.PI;
    default: return radians;
  }
}

export function setAngleMode(mode) {
  angleMode = mode;
}

export function getAngleMode() {
  return angleMode;
}

/**
 * Format a number for display, removing floating-point artifacts
 */
export function formatNumber(num) {
  if (typeof num !== 'number' || !isFinite(num)) {
    if (num === Infinity) return '∞';
    if (num === -Infinity) return '-∞';
    return 'NaN';
  }

  // Handle very large or very small numbers
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(8).replace(/\.?0+e/, 'e');
  }

  // Round to remove floating-point artifacts
  const rounded = parseFloat(num.toPrecision(12));
  const str = rounded.toString();

  if (str.includes('e')) return str;

  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Format number without commas (for reuse in expressions)
 */
export function formatNumberRaw(num) {
  if (typeof num !== 'number' || !isFinite(num)) {
    if (num === Infinity) return 'Infinity';
    if (num === -Infinity) return '-Infinity';
    return 'NaN';
  }
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(8).replace(/\.?0+e/, 'e');
  }
  return parseFloat(num.toPrecision(12)).toString();
}

/**
 * Factorial (non-negative integers only)
 */
function calcFactorial(n) {
  if (n < 0) throw new Error('Factorial is not defined for negative numbers');
  if (!Number.isInteger(n)) throw new Error('Factorial requires a non-negative integer');
  if (n > 170) throw new Error('Result too large');
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * Preprocess expression: convert display symbols to computable expression
 */
function preprocessExpression(expr) {
  let p = expr;

  // Replace display operators with math operators
  p = p.replace(/×/g, '*');
  p = p.replace(/÷/g, '/');
  p = p.replace(/−/g, '-');

  // Constants
  p = p.replace(/π/g, `(${Math.PI})`);
  p = p.replace(/φ/g, `(${(1 + Math.sqrt(5)) / 2})`);

  // Scientific notation display: "5E3" => "(5)*10^(3)" — must happen BEFORE 'e' constant replacement
  p = p.replace(/(\d+\.?\d*)E([+\-]?\d+)/g, '(($1)*10^($2))');

  // Percentage: "50%" => "(50/100)"
  p = p.replace(/(\d+\.?\d*)%/g, '($1/100)');

  // Replace standalone 'e' constant (not part of function name like 'exp', 'acos', etc.)
  p = p.replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9(+\-])/g, `(${Math.E})`);

  // Handle mod keyword
  p = p.replace(/\bmod\b/g, '%');

  // Replace trig functions with our angle-aware versions
  p = p.replace(/(?<![a-zA-Z])sin⁻¹\(/g, '_asin_(');
  p = p.replace(/(?<![a-zA-Z])cos⁻¹\(/g, '_acos_(');
  p = p.replace(/(?<![a-zA-Z])tan⁻¹\(/g, '_atan_(');
  p = p.replace(/(?<![a-zA-Z])sin\(/g, '_sin_(');
  p = p.replace(/(?<![a-zA-Z])cos\(/g, '_cos_(');
  p = p.replace(/(?<![a-zA-Z])tan\(/g, '_tan_(');
  p = p.replace(/(?<![a-zA-Z])asin\(/g, '_asin_(');
  p = p.replace(/(?<![a-zA-Z])acos\(/g, '_acos_(');
  p = p.replace(/(?<![a-zA-Z])atan\(/g, '_atan_(');

  // log => log10, ln => natural log
  p = p.replace(/(?<![a-zA-Z])ln\(/g, 'log(');
  p = p.replace(/(?<![a-zA-Z])log\(/g, 'log10(');

  return p;
}

/**
 * Create custom functions scope for math.js
 */
function createScope() {
  return {
    _sin_: (x) => Math.sin(toRadians(x)),
    _cos_: (x) => Math.cos(toRadians(x)),
    _tan_: (x) => {
      const rad = toRadians(x);
      const cosVal = Math.cos(rad);
      if (Math.abs(cosVal) < 1e-15) throw new Error('Tangent is undefined at this angle');
      return Math.sin(rad) / cosVal;
    },
    _asin_: (x) => {
      if (x < -1 || x > 1) throw new Error('asin: value must be between -1 and 1');
      return fromRadians(Math.asin(x));
    },
    _acos_: (x) => {
      if (x < -1 || x > 1) throw new Error('acos: value must be between -1 and 1');
      return fromRadians(Math.acos(x));
    },
    _atan_: (x) => fromRadians(Math.atan(x)),
  };
}

/**
 * Evaluate a mathematical expression safely
 */
export function evaluate(expression) {
  if (!expression || expression.trim() === '') {
    return { value: null, error: null };
  }

  try {
    const processed = preprocessExpression(expression);
    const scope = createScope();
    const result = math.evaluate(processed, scope);

    if (typeof result === 'number') {
      if (!isFinite(result)) {
        if (result === Infinity || result === -Infinity) {
          return { value: result, error: 'Result is infinity' };
        }
        return { value: null, error: 'Invalid result (NaN)' };
      }
      return { value: result, error: null };
    }

    // math.js might return BigNumber or other types
    const num = Number(result);
    if (isFinite(num)) {
      return { value: num, error: null };
    }

    return { value: null, error: 'Invalid result type' };
  } catch (err) {
    const msg = err.message || 'Invalid expression';

    if (msg.includes('Division by zero') || msg.includes('divide by zero')) {
      return { value: null, error: 'Cannot divide by zero' };
    }
    if (msg.includes('asin:') || msg.includes('acos:')) {
      return { value: null, error: msg };
    }
    if (msg.includes('Tangent is undefined')) {
      return { value: null, error: msg };
    }
    if (msg.includes('too large')) {
      return { value: null, error: 'Result too large to compute' };
    }
    if (msg.includes('Unexpected end') || msg.includes('Parenthesis')) {
      return { value: null, error: 'Incomplete expression' };
    }

    return { value: null, error: 'Invalid expression' };
  }
}

/**
 * Apply a scientific function to a numeric value
 */
export function applyFunction(fnName, value) {
  if (value === null || value === undefined || isNaN(value)) {
    return { value: null, error: 'No value to apply function to' };
  }

  try {
    let result;

    switch (fnName) {
      case 'sin': result = Math.sin(toRadians(value)); break;
      case 'cos': result = Math.cos(toRadians(value)); break;
      case 'tan': {
        const rad = toRadians(value);
        if (Math.abs(Math.cos(rad)) < 1e-15) throw new Error('Tangent is undefined at this angle');
        result = Math.tan(rad);
        break;
      }
      case 'asin':
        if (value < -1 || value > 1) throw new Error('asin requires value between -1 and 1');
        result = fromRadians(Math.asin(value)); break;
      case 'acos':
        if (value < -1 || value > 1) throw new Error('acos requires value between -1 and 1');
        result = fromRadians(Math.acos(value)); break;
      case 'atan': result = fromRadians(Math.atan(value)); break;
      case 'sinh': result = Math.sinh(value); break;
      case 'cosh': result = Math.cosh(value); break;
      case 'tanh': result = Math.tanh(value); break;
      case 'log':
        if (value <= 0) throw new Error('Logarithm requires a positive number');
        result = Math.log10(value); break;
      case 'ln':
        if (value <= 0) throw new Error('Natural log requires a positive number');
        result = Math.log(value); break;
      case 'exp':
        result = Math.exp(value);
        if (!isFinite(result)) throw new Error('Result too large');
        break;
      case 'pow10':
        result = Math.pow(10, value);
        if (!isFinite(result)) throw new Error('Result too large');
        break;
      case 'sqrt':
        if (value < 0) throw new Error('Cannot take square root of a negative number');
        result = Math.sqrt(value); break;
      case 'cbrt': result = Math.cbrt(value); break;
      case 'square': result = value * value; break;
      case 'cube': result = value * value * value; break;
      case 'abs': result = Math.abs(value); break;
      case 'reciprocal':
        if (value === 0) throw new Error('Cannot divide by zero');
        result = 1 / value; break;
      case 'factorial': result = calcFactorial(value); break;
      case 'rand': result = Math.random(); break;
      default:
        return { value: null, error: `Unknown function: ${fnName}` };
    }

    if (!isFinite(result)) {
      return { value: null, error: 'Result is too large or undefined' };
    }

    return { value: result, error: null };
  } catch (err) {
    return { value: null, error: err.message || 'Calculation error' };
  }
}

/**
 * Get display representation for a function application
 */
export function getFunctionDisplay(fnName, inputExpr) {
  switch (fnName) {
    case 'sin': return `sin(${inputExpr})`;
    case 'cos': return `cos(${inputExpr})`;
    case 'tan': return `tan(${inputExpr})`;
    case 'asin': return `sin⁻¹(${inputExpr})`;
    case 'acos': return `cos⁻¹(${inputExpr})`;
    case 'atan': return `tan⁻¹(${inputExpr})`;
    case 'sinh': return `sinh(${inputExpr})`;
    case 'cosh': return `cosh(${inputExpr})`;
    case 'tanh': return `tanh(${inputExpr})`;
    case 'log': return `log(${inputExpr})`;
    case 'ln': return `ln(${inputExpr})`;
    case 'exp': return `e^(${inputExpr})`;
    case 'pow10': return `10^(${inputExpr})`;
    case 'sqrt': return `√(${inputExpr})`;
    case 'cbrt': return `∛(${inputExpr})`;
    case 'square': return `(${inputExpr})²`;
    case 'cube': return `(${inputExpr})³`;
    case 'abs': return `|${inputExpr}|`;
    case 'reciprocal': return `1/(${inputExpr})`;
    case 'factorial': return `(${inputExpr})!`;
    case 'rand': return 'rand()';
    default: return `${fnName}(${inputExpr})`;
  }
}
