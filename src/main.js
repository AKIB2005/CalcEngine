/**
 * CalcEngine — Main Application
 * Premium Engineering Calculator
 */

import { initTheme, toggleTheme } from './js/theme.js';
import { initHistory, addToHistory, deleteEntry, clearHistory, getHistory } from './js/history.js';
import {
  evaluate, applyFunction, formatNumber, formatNumberRaw,
  setAngleMode, getAngleMode, getFunctionDisplay,
} from './js/evaluator.js';
import {
  convertFromBase, convertToBase,
  performBitwise,
  ohmsLaw, powerCalc, seriesResistance, parallelResistance,
  freqToWavelength, wavelengthToFreq,
  unitCategories, convertUnit,
  solveQuadratic, calculateStatistics,
  matrixAdd, matrixSubtract, matrixMultiply, matrixDeterminant, matrixTranspose,
  factorial, permutation, combination,
  gcd, lcm, isPrime, percentageCalc,
} from './js/engineering.js';

// ========== State ==========
const state = {
  expression: '',
  currentResult: null,
  lastResult: null,
  memory: 0,
  hasMemory: false,
  mode: 'basic',
  waitingForPower: false,
  waitingForNthRoot: false,
  justEvaluated: false,
};

// ========== DOM Helpers ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// DOM references (assigned in init)
let displayExpression, displayResult, displayError;
let angleDisplay, memoryIndicator;
let keypadScientific, panelEngineering;
let historyPanel, historyList, toolkitPanel, panelOverlay;

// ========== Initialization ==========
function init() {
  // Grab DOM references
  displayExpression = $('#display-expression');
  displayResult = $('#display-result');
  displayError = $('#display-error');
  angleDisplay = $('#angle-mode-display');
  memoryIndicator = $('#memory-indicator');

  keypadScientific = $('#keypad-scientific');
  panelEngineering = $('#panel-engineering');

  historyPanel = $('#history-panel');
  historyList = $('#history-list');
  toolkitPanel = $('#toolkit-panel');
  panelOverlay = $('#panel-overlay');

  initTheme();
  initHistory(renderHistory);
  setupEventListeners();
  setupModeIndicator();
  setupEngineering();
  setupToolkit();
  updateDisplay();
  renderHistory(getHistory());
}

// ========== Display ==========
function updateDisplay() {
  displayExpression.textContent = state.expression || '';

  if (state.currentResult !== null) {
    displayResult.textContent = formatNumber(state.currentResult);
  } else if (state.expression === '') {
    displayResult.textContent = '0';
  }

  displayError.style.display = 'none';
  displayError.textContent = '';
  memoryIndicator.style.display = state.hasMemory ? 'inline-block' : 'none';
}

function showError(message) {
  displayError.textContent = message;
  displayError.style.display = 'block';
}

function clearError() {
  displayError.style.display = 'none';
  displayError.textContent = '';
}

// ========== Calculator Logic ==========
function inputNumber(value) {
  clearError();
  if (state.justEvaluated) {
    state.expression = '';
    state.currentResult = null;
    state.justEvaluated = false;
  }
  state.expression += value;
  liveEvaluate();
  updateDisplay();
}

function inputOperator(op) {
  clearError();

  if (state.justEvaluated && state.lastResult !== null) {
    state.expression = formatNumberRaw(state.lastResult);
    state.currentResult = state.lastResult;
    state.justEvaluated = false;
  }

  if (state.waitingForPower) state.waitingForPower = false;

  // Replace trailing operator
  const lastChar = state.expression.trim().slice(-1);
  if (['+', '−', '×', '÷', '%'].includes(lastChar)) {
    state.expression = state.expression.trim().slice(0, -1).trimEnd();
  }

  if (state.expression === '' && state.currentResult === null) return;

  const displayOps = { '+': ' + ', '-': ' − ', '*': ' × ', '/': ' ÷ ', '%': ' mod ' };
  state.expression += displayOps[op] || ` ${op} `;
  updateDisplay();
}

function inputDecimal() {
  clearError();
  if (state.justEvaluated) {
    state.expression = '0';
    state.currentResult = null;
    state.justEvaluated = false;
  }

  // Check if last number already has a decimal
  const parts = state.expression.split(/[+\−×÷\(\)\s]+/);
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.includes('.')) return;

  if (state.expression === '' || /[+\−×÷\(\s]$/.test(state.expression)) {
    state.expression += '0.';
  } else {
    state.expression += '.';
  }
  updateDisplay();
}

function inputParenthesis(paren) {
  clearError();
  if (state.justEvaluated) {
    if (paren === '(') {
      state.expression = '';
      state.currentResult = null;
    }
    state.justEvaluated = false;
  }
  state.expression += paren;
  if (paren === ')') liveEvaluate();
  updateDisplay();
}

function toggleSign() {
  clearError();
  if (state.currentResult !== null && state.justEvaluated) {
    state.currentResult = -state.currentResult;
    state.expression = formatNumberRaw(state.currentResult);
    state.justEvaluated = false;
    updateDisplay();
    return;
  }

  if (state.expression) {
    const match = state.expression.match(/(-?\d+\.?\d*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const negated = -num;
      state.expression = state.expression.slice(0, match.index) + formatNumberRaw(negated);
      liveEvaluate();
      updateDisplay();
    }
  }
}

function inputPercent() {
  clearError();
  if (state.currentResult !== null && state.justEvaluated) {
    state.currentResult = state.currentResult / 100;
    state.expression = formatNumberRaw(state.currentResult);
    state.justEvaluated = false;
    updateDisplay();
    return;
  }
  if (state.expression) {
    state.expression += '%';
    liveEvaluate();
    updateDisplay();
  }
}

function clearAll() {
  state.expression = '';
  state.currentResult = null;
  state.lastResult = null;
  state.justEvaluated = false;
  state.waitingForPower = false;
  state.waitingForNthRoot = false;
  clearError();
  updateDisplay();
}

function backspace() {
  clearError();
  if (state.justEvaluated) {
    clearAll();
    return;
  }

  if (state.expression.length > 0) {
    // Handle multi-char display operators
    const ops = [' + ', ' − ', ' × ', ' ÷ ', ' mod '];
    let removed = false;

    for (const op of ops) {
      if (state.expression.endsWith(op)) {
        state.expression = state.expression.slice(0, -op.length);
        removed = true;
        break;
      }
    }

    if (!removed) {
      // Check for function names ending with (
      const fnMatch = state.expression.match(/(sin⁻¹|cos⁻¹|tan⁻¹|sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|log10|log|ln|exp|abs|sqrt|cbrt)\($/);
      if (fnMatch) {
        state.expression = state.expression.slice(0, -(fnMatch[1].length + 1));
      } else {
        state.expression = state.expression.slice(0, -1);
      }
    }

    liveEvaluate();
    updateDisplay();
  }
}

function executeEquals() {
  if (!state.expression) return;

  const result = evaluate(state.expression);

  if (result.error) {
    showError(result.error);
    return;
  }

  if (result.value !== null) {
    const expr = state.expression;
    const val = result.value;
    state.lastResult = val;
    state.currentResult = val;

    addToHistory(expr, formatNumber(val));

    displayExpression.textContent = expr + ' =';
    displayResult.textContent = formatNumber(val);

    state.justEvaluated = true;
  }
}

function liveEvaluate() {
  if (!state.expression) {
    state.currentResult = null;
    return;
  }
  const result = evaluate(state.expression);
  if (result.value !== null && !result.error) {
    state.currentResult = result.value;
  }
}

// ========== Scientific Functions ==========
function applyScientificFunction(fnName) {
  clearError();

  if (fnName === 'rand') {
    const randVal = Math.random();
    state.expression = formatNumberRaw(randVal);
    state.currentResult = randVal;
    state.justEvaluated = false;
    updateDisplay();
    return;
  }

  let inputValue = state.currentResult;
  let inputExpr = state.expression;

  if (inputValue === null && state.expression) {
    const result = evaluate(state.expression);
    if (result.value !== null) {
      inputValue = result.value;
    }
  }

  if (inputValue === null) {
    // No value yet — start typing function name
    const displayNames = {
      sin: 'sin(', cos: 'cos(', tan: 'tan(',
      asin: 'asin(', acos: 'acos(', atan: 'atan(',
      sinh: 'sinh(', cosh: 'cosh(', tanh: 'tanh(',
      log: 'log(', ln: 'ln(', exp: 'exp(',
      pow10: '10^(', sqrt: 'sqrt(', cbrt: 'cbrt(',
      abs: 'abs(',
    };
    if (displayNames[fnName]) {
      state.expression += displayNames[fnName];
      state.justEvaluated = false;
      updateDisplay();
    }
    return;
  }

  const result = applyFunction(fnName, inputValue);

  if (result.error) {
    showError(result.error);
    return;
  }

  state.expression = getFunctionDisplay(fnName, inputExpr || formatNumberRaw(inputValue));
  state.currentResult = result.value;
  state.justEvaluated = false;
  updateDisplay();
}

function handlePower() {
  clearError();
  if (state.expression) {
    state.expression += '^(';
    state.waitingForPower = true;
    state.justEvaluated = false;
    updateDisplay();
  }
}

function handleNthRoot() {
  clearError();
  if (state.expression) {
    state.expression += '^(1/';
    state.waitingForNthRoot = true;
    state.justEvaluated = false;
    updateDisplay();
  }
}

function inputConstant(name) {
  clearError();
  if (state.justEvaluated) {
    state.expression = '';
    state.currentResult = null;
    state.justEvaluated = false;
  }
  const constants = {
    pi: { symbol: 'π', value: Math.PI },
    e: { symbol: 'e', value: Math.E },
    phi: { symbol: 'φ', value: (1 + Math.sqrt(5)) / 2 },
  };
  const c = constants[name];
  if (c) {
    state.expression += c.symbol;
    state.currentResult = c.value;
    updateDisplay();
  }
}

function handleScientificNotation() {
  clearError();
  if (state.expression) {
    state.expression += 'E';
    state.justEvaluated = false;
    updateDisplay();
  }
}

// ========== Memory Functions ==========
function memoryAdd() {
  if (state.currentResult !== null) {
    state.memory += state.currentResult;
    state.hasMemory = true;
    updateDisplay();
  }
}

function memorySubtract() {
  if (state.currentResult !== null) {
    state.memory -= state.currentResult;
    state.hasMemory = true;
    updateDisplay();
  }
}

function memoryRecall() {
  if (state.hasMemory) {
    if (state.justEvaluated) {
      state.expression = '';
      state.justEvaluated = false;
    }
    state.expression += formatNumberRaw(state.memory);
    state.currentResult = state.memory;
    updateDisplay();
  }
}

function memoryClear() {
  state.memory = 0;
  state.hasMemory = false;
  updateDisplay();
}

// ========== Copy / Paste ==========
function copyResult() {
  const text = state.currentResult !== null
    ? formatNumberRaw(state.currentResult)
    : displayResult.textContent;

  navigator.clipboard.writeText(text.replace(/,/g, '')).then(() => {
    const tooltip = $('.copy-tooltip');
    if (tooltip) {
      tooltip.classList.add('show');
      setTimeout(() => tooltip.classList.remove('show'), 1200);
    }
  }).catch(() => { });
}

async function pasteExpression() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      if (state.justEvaluated) {
        state.expression = '';
        state.justEvaluated = false;
      }
      state.expression += text.trim();
      liveEvaluate();
      updateDisplay();
    }
  } catch { }
}

// ========== Mode Switching ==========
function setMode(mode) {
  state.mode = mode;

  $$('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
    btn.setAttribute('aria-selected', btn.dataset.mode === mode);
  });

  keypadScientific.style.display = (mode === 'scientific') ? 'flex' : 'none';
  panelEngineering.style.display = (mode === 'engineering') ? 'flex' : 'none';

  updateModeIndicator();
}

function setupModeIndicator() {
  updateModeIndicator();
  // Re-calc on resize
  window.addEventListener('resize', updateModeIndicator);
}

function updateModeIndicator() {
  const indicator = $('.mode-indicator');
  const activeBtn = $(`.mode-btn[data-mode="${state.mode}"]`);

  if (indicator && activeBtn) {
    const switcher = activeBtn.parentElement;
    const switcherRect = switcher.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    indicator.style.width = `${btnRect.width}px`;
    indicator.style.transform = `translateX(${btnRect.left - switcherRect.left - 4}px)`;
  }
}

// ========== History Panel ==========
function toggleHistory() {
  const isOpen = historyPanel.classList.contains('open');

  if (window.innerWidth <= 1024) {
    if (isOpen) {
      historyPanel.classList.remove('open');
      panelOverlay.classList.remove('visible');
    } else {
      toolkitPanel.classList.remove('open');
      historyPanel.classList.add('open');
      panelOverlay.classList.add('visible');
    }
  } else {
    historyPanel.style.display = historyPanel.style.display === 'none' ? 'flex' : 'none';
  }
}

function renderHistory(entries) {
  if (!historyList) return;

  if (!entries || entries.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <p>No calculations yet</p>
      </div>`;
    return;
  }

  historyList.innerHTML = entries.map(entry => `
    <div class="history-item" data-id="${entry.id}" data-result="${escapeAttr(entry.result)}" title="Click to use this result">
      <div class="history-expression">${escapeHtml(entry.expression)}</div>
      <div class="history-result">= ${escapeHtml(entry.result)}</div>
      <button class="history-delete" data-delete-id="${entry.id}" title="Delete" aria-label="Delete entry">×</button>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ========== Toolkit Panel ==========
function toggleToolkit() {
  if (window.innerWidth <= 1024) {
    if (toolkitPanel.classList.contains('open')) {
      toolkitPanel.classList.remove('open');
      panelOverlay.classList.remove('visible');
    } else {
      historyPanel.classList.remove('open');
      toolkitPanel.style.display = 'flex';
      requestAnimationFrame(() => {
        toolkitPanel.classList.add('open');
        panelOverlay.classList.add('visible');
      });
    }
  } else {
    const isVisible = toolkitPanel.style.display !== 'none';
    toolkitPanel.style.display = isVisible ? 'none' : 'flex';
  }
}

// ========== Engineering Setup ==========
function setupEngineering() {
  // Number system conversions
  $$('.num-sys-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const base = parseInt(e.target.dataset.base);
      const value = e.target.value.trim();
      if (!value) {
        $$('.num-sys-input').forEach(inp => {
          if (inp !== e.target) inp.value = '';
        });
        return;
      }

      const decimal = convertFromBase(value, base);
      if (isNaN(decimal)) return;

      $$('.num-sys-input').forEach(inp => {
        if (inp === e.target) return;
        const targetBase = parseInt(inp.dataset.base);
        inp.value = convertToBase(decimal, targetBase);
      });
    });
  });

  // Bitwise operations
  $$('[data-bitwise]').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.dataset.bitwise;
      const a = $('#bitwise-a').value;
      const b = $('#bitwise-b').value;
      const result = performBitwise(op, a, b);

      if (result.error) {
        $('#bitwise-result').textContent = result.error;
        $('#bitwise-details').innerHTML = '';
        return;
      }

      $('#bitwise-result').textContent = result.decimal;
      $('#bitwise-details').innerHTML =
        `${result.description}<br>DEC: ${result.decimal}<br>BIN: ${result.binary}<br>HEX: ${result.hex}<br>OCT: ${result.octal}`;
    });
  });

  // Ohm's Law
  $('#btn-ohm-calc').addEventListener('click', () => {
    const result = ohmsLaw($('#ohm-v').value, $('#ohm-i').value, $('#ohm-r').value);
    $('#ohm-result').textContent = result.error || result.result;
  });

  // Power Calculator
  $('#btn-pwr-calc').addEventListener('click', () => {
    const result = powerCalc($('#pwr-p').value, $('#pwr-v').value, $('#pwr-i').value);
    $('#pwr-result').textContent = result.error || result.result;
  });

  // Resistance
  const parseResistances = () => {
    const input = $('#res-values').value;
    const values = input.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (values.length === 0) {
      $('#res-result').textContent = 'Enter resistance values';
      return null;
    }
    return values;
  };

  $('#btn-res-series').addEventListener('click', () => {
    const values = parseResistances();
    if (!values) return;
    const result = seriesResistance(values);
    $('#res-result').textContent = result.error || `Series: ${result.result.toPrecision(6)} Ω`;
  });

  $('#btn-res-parallel').addEventListener('click', () => {
    const values = parseResistances();
    if (!values) return;
    const result = parallelResistance(values);
    $('#res-result').textContent = result.error || `Parallel: ${result.result.toPrecision(6)} Ω`;
  });

  // Frequency/Wavelength
  $('#btn-fw-calc').addEventListener('click', () => {
    const freq = parseFloat($('#fw-freq').value);
    const wave = parseFloat($('#fw-wave').value);

    if (!isNaN(freq) && freq > 0) {
      const result = freqToWavelength(freq);
      $('#fw-result').textContent = result.error || `Wavelength: ${result.result.toExponential(4)} m`;
      if (!result.error) $('#fw-wave').value = result.result;
    } else if (!isNaN(wave) && wave > 0) {
      const result = wavelengthToFreq(wave);
      $('#fw-result').textContent = result.error || `Frequency: ${result.result.toExponential(4)} Hz`;
      if (!result.error) $('#fw-freq').value = result.result;
    } else {
      $('#fw-result').textContent = 'Enter frequency or wavelength';
    }
  });

  // Engineering tabs
  $$('.eng-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.engTab;
      $$('.eng-tab').forEach(t => t.classList.toggle('active', t === tab));
      $$('.eng-tab-content').forEach(content => {
        content.style.display = content.id === `eng-${tabName}` ? 'block' : 'none';
      });
    });
  });

  // Unit converter
  setupUnitConverter();
}

function setupUnitConverter() {
  const categorySelect = $('#unit-category');
  const fromSelect = $('#unit-from');
  const toSelect = $('#unit-to');
  const valueInput = $('#unit-value');
  const resultDisplay = $('#unit-result');

  function populateUnits() {
    const category = categorySelect.value;
    const cat = unitCategories[category];
    if (!cat) return;

    fromSelect.innerHTML = cat.units.map(u => `<option value="${u}">${u}</option>`).join('');
    toSelect.innerHTML = cat.units.map((u, i) =>
      `<option value="${u}" ${i === 1 ? 'selected' : ''}>${u}</option>`
    ).join('');
    convert();
  }

  function convert() {
    const value = valueInput.value;
    if (!value) {
      resultDisplay.innerHTML = '<span class="unit-result-value">—</span>';
      return;
    }

    const result = convertUnit(categorySelect.value, fromSelect.value, toSelect.value, value);
    if (result.error) {
      resultDisplay.innerHTML = `<span class="unit-result-value">${result.error}</span>`;
    } else {
      const formatted = parseFloat(result.result.toPrecision(10));
      resultDisplay.innerHTML = `<span class="unit-result-value">${formatted} ${toSelect.value}</span>`;
    }
  }

  categorySelect.addEventListener('change', populateUnits);
  fromSelect.addEventListener('change', convert);
  toSelect.addEventListener('change', convert);
  valueInput.addEventListener('input', convert);

  populateUnits();
}

// ========== Toolkit Setup ==========
function setupToolkit() {
  // Toolkit tabs
  $$('.toolkit-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.toolkit;
      $$('.toolkit-tab').forEach(t => t.classList.toggle('active', t === tab));
      $$('.toolkit-section').forEach(section => {
        section.style.display = section.id === `toolkit-${tabName}` ? 'block' : 'none';
      });
    });
  });

  // Quadratic solver
  $('#btn-quad-solve').addEventListener('click', () => {
    const a = parseFloat($('#quad-a').value);
    const b = parseFloat($('#quad-b').value);
    const c = parseFloat($('#quad-c').value);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      $('#quad-result').textContent = 'Enter values for a, b, and c';
      return;
    }

    const result = solveQuadratic(a, b, c);
    if (result.error) {
      $('#quad-result').textContent = result.error;
      return;
    }

    let text = `Discriminant: ${result.discriminant !== null ? result.discriminant : 'N/A'}\n`;

    if (result.type === 'linear') {
      text += `x = ${result.roots[0]}`;
    } else if (result.type === 'real') {
      text += `x₁ = ${parseFloat(result.roots[0].toPrecision(10))}\nx₂ = ${parseFloat(result.roots[1].toPrecision(10))}`;
    } else if (result.type === 'repeated') {
      text += `x = ${parseFloat(result.roots[0].toPrecision(10))} (repeated)`;
    } else if (result.type === 'complex') {
      const r = result.roots[0];
      text += `x₁ = ${parseFloat(r.real.toPrecision(8))} + ${parseFloat(r.imag.toPrecision(8))}i\n`;
      text += `x₂ = ${parseFloat(r.real.toPrecision(8))} − ${parseFloat(Math.abs(r.imag).toPrecision(8))}i`;
    }

    $('#quad-result').textContent = text;
  });

  // Statistics
  $('#btn-stats-calc').addEventListener('click', () => {
    const input = $('#stats-data').value;
    const data = input.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

    if (data.length === 0) {
      $('#stats-result').textContent = 'Enter comma-separated numbers';
      return;
    }

    const stats = calculateStatistics(data);
    if (stats.error) {
      $('#stats-result').textContent = stats.error;
      return;
    }

    $('#stats-result').innerHTML = `
      <strong>Count:</strong> ${stats.count}<br>
      <strong>Sum:</strong> ${stats.sum}<br>
      <strong>Mean:</strong> ${stats.mean}<br>
      <strong>Median:</strong> ${stats.median}<br>
      <strong>Mode:</strong> ${Array.isArray(stats.mode) ? stats.mode.join(', ') : stats.mode}<br>
      <strong>Min:</strong> ${stats.min}<br>
      <strong>Max:</strong> ${stats.max}<br>
      <strong>Range:</strong> ${stats.range}<br>
      <strong>Std Dev (pop):</strong> ${stats.stdDev}<br>
      <strong>Std Dev (sample):</strong> ${stats.sampleStdDev}<br>
      <strong>Variance:</strong> ${stats.variance}
    `;
  });

  // Matrix
  setupMatrix();

  // Combinatorics
  $('#btn-perm').addEventListener('click', () => {
    try {
      const n = parseInt($('#comb-n').value);
      const r = parseInt($('#comb-r').value);
      const result = permutation(n, r);
      $('#comb-result').textContent = `P(${n}, ${r}) = ${result}`;
    } catch (e) {
      $('#comb-result').textContent = e.message;
    }
  });

  $('#btn-comb').addEventListener('click', () => {
    try {
      const n = parseInt($('#comb-n').value);
      const r = parseInt($('#comb-r').value);
      const result = combination(n, r);
      $('#comb-result').textContent = `C(${n}, ${r}) = ${result}`;
    } catch (e) {
      $('#comb-result').textContent = e.message;
    }
  });

  $('#btn-fact-n').addEventListener('click', () => {
    try {
      const n = parseInt($('#comb-n').value);
      const result = factorial(n);
      $('#comb-result').textContent = `${n}! = ${result}`;
    } catch (e) {
      $('#comb-result').textContent = e.message;
    }
  });

  // Percentage
  $('#btn-pct-calc').addEventListener('click', () => {
    const value = parseFloat($('#pct-value').value);
    const percent = parseFloat($('#pct-percent').value);

    if (isNaN(value) || isNaN(percent)) {
      $('#pct-result').textContent = 'Enter both values';
      return;
    }

    const result = percentageCalc(value, percent);
    $('#pct-result').innerHTML = `
      ${percent}% of ${value} = <strong>${parseFloat(result.percentOf.toPrecision(10))}</strong><br>
      ${value} + ${percent}% = <strong>${parseFloat(result.increase.toPrecision(10))}</strong><br>
      ${value} − ${percent}% = <strong>${parseFloat(result.decrease.toPrecision(10))}</strong>
    `;
  });

  // GCD / LCM
  $('#btn-gcd').addEventListener('click', () => {
    const a = parseInt($('#gcd-a').value);
    const b = parseInt($('#gcd-b').value);
    if (isNaN(a) || isNaN(b)) {
      $('#gcd-result').textContent = 'Enter two numbers';
      return;
    }
    $('#gcd-result').textContent = `GCD(${a}, ${b}) = ${gcd(a, b)}`;
  });

  $('#btn-lcm').addEventListener('click', () => {
    const a = parseInt($('#gcd-a').value);
    const b = parseInt($('#gcd-b').value);
    if (isNaN(a) || isNaN(b)) {
      $('#gcd-result').textContent = 'Enter two numbers';
      return;
    }
    $('#gcd-result').textContent = `LCM(${a}, ${b}) = ${lcm(a, b)}`;
  });

  // Prime checker
  $('#btn-prime-check').addEventListener('click', () => {
    const n = parseInt($('#prime-input').value);
    if (isNaN(n) || n < 2) {
      $('#prime-result').textContent = 'Enter a number ≥ 2';
      return;
    }
    const result = isPrime(n);
    $('#prime-result').textContent = result
      ? `${n} is PRIME ✓`
      : `${n} is NOT prime (divisible by ${findSmallestFactor(n)})`;
  });
}

function findSmallestFactor(n) {
  if (n % 2 === 0) return 2;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return i;
  }
  return n;
}

// ========== Matrix Setup ==========
function setupMatrix() {
  const sizeSelect = $('#matrix-size');

  function buildGrids() {
    const size = parseInt(sizeSelect.value);
    buildMatrixGrid('matrix-a-grid', size);
    buildMatrixGrid('matrix-b-grid', size);
    clearMatrixResult();
  }

  function buildMatrixGrid(id, size) {
    const grid = $(`#${id}`);
    grid.className = `matrix-grid size-${size}`;
    grid.innerHTML = '';
    for (let i = 0; i < size * size; i++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'glass-input';
      input.placeholder = '0';
      input.step = 'any';
      grid.appendChild(input);
    }
  }

  function readMatrix(id) {
    const grid = $(`#${id}`);
    const inputs = grid.querySelectorAll('input');
    const size = parseInt(sizeSelect.value);
    const matrix = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(parseFloat(inputs[i * size + j].value) || 0);
      }
      matrix.push(row);
    }
    return matrix;
  }

  function displayMatrixResult(matrix) {
    const size = matrix.length;
    const grid = $('#matrix-result-grid');
    grid.className = `matrix-grid size-${size}`;
    grid.innerHTML = '';
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'glass-input';
        input.value = parseFloat(matrix[i][j].toPrecision(8));
        input.readOnly = true;
        grid.appendChild(input);
      }
    }
    $('#matrix-scalar-result').textContent = '';
  }

  function clearMatrixResult() {
    const grid = $('#matrix-result-grid');
    grid.className = 'matrix-grid';
    grid.innerHTML = '';
    $('#matrix-scalar-result').textContent = '';
  }

  sizeSelect.addEventListener('change', buildGrids);

  $$('[data-matrix-op]').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.dataset.matrixOp;
      const a = readMatrix('matrix-a-grid');
      const b = readMatrix('matrix-b-grid');

      try {
        switch (op) {
          case 'add': displayMatrixResult(matrixAdd(a, b)); break;
          case 'subtract': displayMatrixResult(matrixSubtract(a, b)); break;
          case 'multiply': displayMatrixResult(matrixMultiply(a, b)); break;
          case 'det-a': {
            const det = matrixDeterminant(a);
            clearMatrixResult();
            $('#matrix-scalar-result').textContent = `det(A) = ${parseFloat(det.toPrecision(10))}`;
            break;
          }
          case 'det-b': {
            const det = matrixDeterminant(b);
            clearMatrixResult();
            $('#matrix-scalar-result').textContent = `det(B) = ${parseFloat(det.toPrecision(10))}`;
            break;
          }
          case 'transpose-a':
            displayMatrixResult(matrixTranspose(a));
            break;
        }
      } catch (e) {
        clearMatrixResult();
        $('#matrix-scalar-result').textContent = e.message;
      }
    });
  });

  buildGrids();
}

// ========== Keyboard Support ==========
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Ignore if focus is in an input/select/textarea
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    let handled = true;

    // Handle Ctrl shortcuts first
    if (e.ctrlKey) {
      if (e.key === 'v') { pasteExpression(); return; }
      if (e.key === 'c') { copyResult(); return; }
      return; // Don't handle other Ctrl combos
    }

    switch (e.key) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        inputNumber(e.key);
        highlightKey(`[data-value="${e.key}"]`);
        break;
      case '+':
        inputOperator('+');
        highlightKey('[data-value="+"]');
        break;
      case '-':
        inputOperator('-');
        highlightKey('[data-value="-"]');
        break;
      case '*':
        inputOperator('*');
        highlightKey('[data-value="*"]');
        break;
      case '/':
        e.preventDefault();
        inputOperator('/');
        highlightKey('[data-value="/"]');
        break;
      case '.':
        inputDecimal();
        highlightKey('[data-action="decimal"]');
        break;
      case 'Enter':
      case '=':
        e.preventDefault();
        executeEquals();
        highlightKey('[data-action="equals"]');
        break;
      case 'Backspace':
        backspace();
        highlightKey('[data-action="backspace"]');
        break;
      case 'Escape':
        clearAll();
        highlightKey('[data-action="clear"]');
        break;
      case '(':
        inputParenthesis('(');
        break;
      case ')':
        inputParenthesis(')');
        break;
      case '%':
        inputPercent();
        break;
      default:
        handled = false;
    }
  });
}

function highlightKey(selector) {
  const btn = $(selector);
  if (btn) {
    btn.classList.add('key-active');
    setTimeout(() => btn.classList.remove('key-active'), 150);
  }
}

// ========== Ripple Effect ==========
function addRipple(e, btn) {
  const rect = btn.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  btn.style.setProperty('--x', `${(x / rect.width) * 100}%`);
  btn.style.setProperty('--y', `${(y / rect.height) * 100}%`);

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}

// ========== Event Listeners ==========
function setupEventListeners() {
  // Theme toggle
  $('#btn-theme-toggle').addEventListener('click', toggleTheme);

  // History toggle
  $('#btn-history-toggle').addEventListener('click', toggleHistory);

  // Toolkit toggle
  $('#btn-toolkit-toggle').addEventListener('click', toggleToolkit);
  $('#btn-toolkit-close').addEventListener('click', () => {
    if (window.innerWidth <= 1024) {
      toolkitPanel.classList.remove('open');
      panelOverlay.classList.remove('visible');
    } else {
      toolkitPanel.style.display = 'none';
    }
  });

  // Panel overlay
  panelOverlay.addEventListener('click', () => {
    historyPanel.classList.remove('open');
    toolkitPanel.classList.remove('open');
    panelOverlay.classList.remove('visible');
  });

  // Mode switching
  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  // Calculator buttons — event delegation
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.calc-btn');
    if (!btn) return;

    // Don't intercept engineering-specific buttons (they have their own handlers)
    if (btn.closest('.engineering-panel') || btn.closest('.toolkit-panel')) {
      if (!btn.dataset.action) return;
    }

    addRipple(e, btn);

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    switch (action) {
      case 'number': inputNumber(value); break;
      case 'operator': inputOperator(value); break;
      case 'decimal': inputDecimal(); break;
      case 'equals': executeEquals(); break;
      case 'clear': clearAll(); break;
      case 'backspace': backspace(); break;
      case 'toggle-sign': toggleSign(); break;
      case 'percent': inputPercent(); break;
      case 'parenthesis': inputParenthesis(value); break;
      case 'function':
        if (value === 'nthroot') {
          handleNthRoot();
        } else {
          applyScientificFunction(value);
        }
        break;
      case 'constant': inputConstant(value); break;
      case 'power': handlePower(); break;
      case 'scientific-notation': handleScientificNotation(); break;
      case 'mc': memoryClear(); break;
      case 'mr': memoryRecall(); break;
      case 'm-plus': memoryAdd(); break;
      case 'm-minus': memorySubtract(); break;
    }
  });

  // Angle mode
  $$('.angle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.angle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.angle;
      setAngleMode(mode);
      angleDisplay.textContent = mode.toUpperCase();
    });
  });

  // Copy result
  $('#btn-copy-result').addEventListener('click', copyResult);

  // Clear history
  $('#btn-clear-history').addEventListener('click', clearHistory);

  // History list delegation
  historyList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.history-delete');
    if (deleteBtn) {
      e.stopPropagation();
      deleteEntry(deleteBtn.dataset.deleteId);
      return;
    }

    const item = e.target.closest('.history-item');
    if (item) {
      const result = item.dataset.result;
      if (result) {
        state.expression = result.replace(/,/g, '');
        state.currentResult = parseFloat(result.replace(/,/g, ''));
        state.justEvaluated = false;
        updateDisplay();

        if (window.innerWidth <= 1024) {
          historyPanel.classList.remove('open');
          panelOverlay.classList.remove('visible');
        }
      }
    }
  });

  // Keyboard support
  setupKeyboard();
}

// ========== Start ==========
document.addEventListener('DOMContentLoaded', init);
