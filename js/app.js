// Database of products from "DUN Salsas.xlsx"
const productsData = [
  { id: "1", head: "COD. 1013001 - SALSA BOLOGNESA ARCOR", head2: "24x340g", dun: "17 793360 130011", logo: "LOGO_1" },
  { id: "2", head: "COD. 1013313 SALSA POMAROLA ARCOR", head2: "24x340g", dun: "17 790580 133136", logo: "LOGO_1" },
  { id: "3", head: "COD. 1013315 SALSA PIZZA ARCOR", head2: "24x340g", dun: "17 790580 133150", logo: "LOGO_1" },
  { id: "4", head: "COD. 1013318 SALSA FILETTO ARCOR", head2: "24x340g", dun: "17 790580 133181", logo: "LOGO_1" },
  { id: "5", head: "COD. 1013449 SALSA PORTUGUESA ARCOR", head2: "24x340g", dun: "17 790580 134492", logo: "LOGO_1" },
  { id: "6", head: "COD. 1013450 SALSA ITALIANA ARCOR", head2: "24x340g", dun: "17 790580 133754", logo: "LOGO_1" },
  { id: "7", head: "COD. 1013451 SALSA TUCO ARCOR", head2: "24x340g", dun: "17 790580 134515", logo: "LOGO_1" },
  { id: "8", head: "COD. 5040840 - SALSA PIZZA ARCOR", head2: "24x200g", dun: "17 790580 408340", logo: "LOGO_1" },
  { id: "9", head: "COD. 5042398 - SALSA POMAROLA ARCOR", head2: "24x340g", dun: "17 790580 423985", logo: "LOGO_1" },
  { id: "10", head: "COD. 1013445 SALSA POMAROLA NOEL", head2: "24x340g", dun: "17 790580 134454", logo: "LOGO_2" },
  { id: "11", head: "COD. 1013446 SALSA PIZZA NOEL", head2: "24x340g", dun: "17 790580 134461", logo: "LOGO_2" },
  { id: "12", head: "COD. 1013447 SALSA FILETTO NOEL", head2: "24x340g", dun: "17 790580 134478", logo: "LOGO_2" },
  { id: "13", head: "COD. 1013448 SALSA PORTUGUESA NOEL", head2: "24x340g", dun: "17 790580 134485", logo: "LOGO_2" },
  { id: "14", head: "COD. 1010301 – KETCHUP LA CAMPAGNOLA", head2: "24x250g", dun: "17 793360 103015", logo: "LOGO_3" },
  { id: "15", head: "COD. 1010302 – KETCHUP PICANTE LA CAMPAGNOLA", head2: "24x250g", dun: "17 793360 103022", logo: "LOGO_3" },
  { id: "16", head: "COD. 1012347 – SALSA BARBACOA LA CAMPAGNOLA", head2: "24x250g", dun: "17 793360 123471", logo: "LOGO_3" },
  { id: "17", head: "COD. 1013314 SALSA POMAROLA LA CAMPAGNOLA", head2: "24x340g", dun: "17 790580 133143", logo: "LOGO_3" },
  { id: "18", head: "COD. 1013316 SALSA PIZZA LA CAMPAGNOLA", head2: "24x340g", dun: "17 790580 133167", logo: "LOGO_3" },
  { id: "19", head: "COD. 1013317 SALSA FILETTO LA CAMPAGNOLA", head2: "24x340g", dun: "17 790580 133174", logo: "LOGO_3" },
  { id: "20", head: "COD. 1013444 SALSA ITALIANA LA CAMPAGNOLA", head2: "24x340g", dun: "17 790580 134447", logo: "LOGO_3" },
  { id: "21", head: "COD. 1015045 – KETCHUP AMERICANO", head2: "LA CAMPAGNOLA   24 x 250g", dun: "17790580150454", logo: "LOGO_3" }
];

// Global State
let currentProduct1 = null;
let currentProduct2 = null;
let currentProduct3 = null;
let activeRenderEngine = 'vector';

// Helper utilities for ZPL string escaping and barcode normalization
function escapeZPL(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\^/g, '\\^')
    .replace(/~/g, '\\~');
}

function getCleanDun(dunStr) {
  if (!dunStr) return '';
  return String(dunStr).replace(/\s+/g, '');
}

// DOM Elements References
let productSelect1, productSelect2, productSelect3;
let inputFecha1, inputFecha2, inputFecha3;
let zplOutputTextarea, labelaryImg, labelaryContainer, labelaryLoading, labelaryError;
let simulatedLabel, btnGenerate, printerSelect, printerStatusBadge, printerStatusDot, printerStatusText;

// Toast Notification Utility
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-brand-600 text-white'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-triangle-exclamation',
    info: 'fa-info-circle'
  };

  toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg font-medium text-xs transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type]} text-sm"></i><span>${message}</span>`;
  
  toastContainer.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Smart Date Mask Formatter
function setupDateMask(inputElement) {
  if (!inputElement) return;

  inputElement.addEventListener('keydown', function(e) {
    if (e.key === '/') {
      e.preventDefault();
    }
  });

  inputElement.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    
    let formatted = '';
    if (value.length > 0) {
      formatted += value.substring(0, 2);
      if (value.length >= 2) {
        formatted += '/';
        formatted += value.substring(2, 4);
        if (value.length >= 4) {
          formatted += '/';
          formatted += value.substring(4, 8);
        }
      }
    }
    
    e.target.value = formatted;
    updateZPLAndPreview();
  });
}

// Populate Dropdown Menus
function populateProductSelects() {
  const selects = [productSelect1, productSelect2, productSelect3];
  selects.forEach((select) => {
    if (!select) return;
    select.innerHTML = '';
    productsData.forEach((prod) => {
      const option = document.createElement('option');
      option.value = prod.id;
      option.textContent = `${prod.head} (${prod.head2})`;
      select.appendChild(option);
    });
  });

  // Set default initial selections
  if (productSelect1 && productsData[9]) productSelect1.value = productsData[9].id; // NOEL Pomarola
  if (productSelect2 && productsData[20]) productSelect2.value = productsData[20].id; // Ketchup Americano
  if (productSelect3 && productsData[20]) productSelect3.value = productsData[20].id; // Ketchup Americano

  currentProduct1 = productsData.find(p => p.id === productSelect1.value) || productsData[0];
  currentProduct2 = productsData.find(p => p.id === productSelect2.value) || productsData[0];
  currentProduct3 = productsData.find(p => p.id === productSelect3.value) || productsData[0];
}

// Generate ZPL String using exact specified structure and Y coordinates
function generateZPLCode() {
  const p1 = currentProduct1 || productsData[0];
  const p2 = currentProduct2 || productsData[0];
  const p3 = currentProduct3 || productsData[0];

  const f1 = inputFecha1.value.trim() || '--/--/----';
  const f2 = inputFecha2.value.trim() || '--/--/----';
  const f3 = inputFecha3.value.trim() || '--/--/----';

  const dun1Clean = getCleanDun(p1.dun);
  const dun2Clean = getCleanDun(p2.dun);
  const dun3Clean = getCleanDun(p3.dun);

  return `^XA
^PW812
^LL1218
^COMMENT ${p1.logo}^FS
^FO30,110^CI28^A0N,36,36^FB752,2,0,C,0^FD${escapeZPL(p1.head)}^FS
^FO30,150^A0N,32,32^FB752,1,0,C,0^FD${escapeZPL(p1.head2)}^FS
^BY6,3,130
^FO60,200^BB8,130,Y,N,N^FD${dun1Clean}^FS
^FO30,350^A0N,30,30^FB752,1,0,C,0^FD${p1.dun}^FS
^FO30,380^A0N,36,36^FB692,1,0,R,0^FDL ${f1}^FS
^FO30,430^GB752,4,4^FS
^COMMENT ${p2.logo}^FS
^FO30,460^A0N,36,36^FB752,2,0,C,0^FD${escapeZPL(p2.head)}^FS
^FO30,500^A0N,32,32^FB752,1,0,C,0^FD${escapeZPL(p2.head2)}^FS
^BY6,3,130
^FO60,550^BB8,130,Y,N,N^FD${dun2Clean}^FS
^FO30,700^A0N,30,30^FB752,1,0,C,0^FD${p2.dun}^FS
^FO30,730^A0N,36,36^FB692,1,0,R,0^FDL ${f2}^FS
^FO30,780^GB752,4,4^FS
^COMMENT ${p3.logo}^FS
^FO30,810^A0N,36,36^FB752,2,0,C,0^FD${escapeZPL(p3.head)}^FS
^FO30,850^A0N,32,32^FB752,1,0,C,0^FD${escapeZPL(p3.head2)}^FS
^BY6,3,130
^FO60,900^BB8,130,Y,N,N^FD${dun3Clean}^FS
^FO30,1050^A0N,30,30^FB752,1,0,C,0^FD${p3.dun}^FS
^FO30,1080^A0N,36,36^FB692,1,0,R,0^FDL ${f3}^FS
^XZ`;
}

// Update Simulated Vector SVG & HTML UI
function updateSimulatedLabel() {
  const p1 = currentProduct1;
  const p2 = currentProduct2;
  const p3 = currentProduct3;

  const f1 = inputFecha1.value.trim() || '--/--/----';
  const f2 = inputFecha2.value.trim() || '--/--/----';
  const f3 = inputFecha3.value.trim() || '--/--/----';

  // Section 1
  document.getElementById('lbl-head').textContent = p1.head;
  document.getElementById('lbl-head2').textContent = p1.head2;
  document.getElementById('lbl-dun').textContent = p1.dun;
  document.getElementById('lbl-lote').textContent = `L ${f1}`;
  try {
    JsBarcode("#barcode-svg", getCleanDun(p1.dun), {
      format: "ITF14",
      width: 1.8,
      height: 38,
      displayValue: false,
      margin: 0
    });
  } catch (e) {
    JsBarcode("#barcode-svg", getCleanDun(p1.dun), { format: "CODE128", width: 1.5, height: 38, displayValue: false, margin: 0 });
  }

  // Section 2
  document.getElementById('lbl-head-2').textContent = p2.head;
  document.getElementById('lbl-head2-2').textContent = p2.head2;
  document.getElementById('lbl-dun-2').textContent = p2.dun;
  document.getElementById('lbl-lote-2').textContent = `L ${f2}`;
  try {
    JsBarcode("#barcode-svg-2", getCleanDun(p2.dun), {
      format: "ITF14",
      width: 1.8,
      height: 38,
      displayValue: false,
      margin: 0
    });
  } catch (e) {
    JsBarcode("#barcode-svg-2", getCleanDun(p2.dun), { format: "CODE128", width: 1.5, height: 38, displayValue: false, margin: 0 });
  }

  // Section 3
  document.getElementById('lbl-head-3').textContent = p3.head;
  document.getElementById('lbl-head2-3').textContent = p3.head2;
  document.getElementById('lbl-dun-3').textContent = p3.dun;
  document.getElementById('lbl-lote-3').textContent = `L ${f3}`;
  try {
    JsBarcode("#barcode-svg-3", getCleanDun(p3.dun), {
      format: "ITF14",
      width: 1.8,
      height: 38,
      displayValue: false,
      margin: 0
    });
  } catch (e) {
    JsBarcode("#barcode-svg-3", getCleanDun(p3.dun), { format: "CODE128", width: 1.5, height: 38, displayValue: false, margin: 0 });
  }
}

// Call Labelary API for real Zebra raster preview
function updateLabelaryPreview(zplCode) {
  if (activeRenderEngine !== 'labelary') return;

  labelaryLoading.classList.remove('hidden');
  labelaryImg.classList.add('hidden');
  labelaryError.classList.add('hidden');

  const url = `https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/`;
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'image/png',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: zplCode
  })
  .then(response => {
    if (!response.ok) throw new Error('Respuesta de API Labelary no válida');
    return response.blob();
  })
  .then(blob => {
    const objectURL = URL.createObjectURL(blob);
    labelaryImg.src = objectURL;
    labelaryImg.classList.remove('hidden');
    labelaryLoading.classList.add('hidden');
  })
  .catch(err => {
    console.warn('Error en Labelary API:', err);
    labelaryLoading.classList.add('hidden');
    labelaryError.classList.remove('hidden');
  });
}

// Refresh all UI elements
function updateZPLAndPreview() {
  const zplCode = generateZPLCode();
  if (zplOutputTextarea) zplOutputTextarea.value = zplCode;
  
  const charCountElem = document.getElementById('zpl-char-count');
  if (charCountElem) charCountElem.textContent = `${zplCode.length} caracteres`;

  updateSimulatedLabel();
  updateLabelaryPreview(zplCode);
}

// Check real printer connection status with network fetch timeout
async function checkPrinterConnection() {
  const ip = printerSelect.value;
  printerStatusText.textContent = 'Verificando...';
  printerStatusBadge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  printerStatusDot.className = 'w-2 h-2 mr-1.5 bg-amber-500 rounded-full animate-pulse';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    await fetch(`http://${ip}/`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    printerStatusText.textContent = 'Disponible';
    printerStatusBadge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    printerStatusDot.className = 'w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse';
  } catch (err) {
    clearTimeout(timeoutId);
    printerStatusText.textContent = 'Desconectada';
    printerStatusBadge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
    printerStatusDot.className = 'w-2 h-2 mr-1.5 bg-rose-500 rounded-full';
  }
}

// Direct HTTP Raw Print to Zebra Printer
function printDirectToZebra() {
  const zplData = generateZPLCode();
  const targetIP = printerSelect.value;
  const printerName = printerSelect.options[printerSelect.selectedIndex].text;

  showToast(`Enviando trabajo de impresión ZPL a ${printerName}...`, 'info');

  fetch(`http://${targetIP}/pstprnt`, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: zplData
  })
  .then(() => {
    showToast(`¡Comando de impresión enviado con éxito a ${printerName}!`, 'success');
  })
  .catch((err) => {
    console.warn('Envió no-cors realizado o error de puerto:', err);
    showToast(`Impresión enviada a ${printerName} (${targetIP}). Compruebe la salida de la impresora.`, 'success');
  });
}

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  productSelect1 = document.getElementById('product-select');
  productSelect2 = document.getElementById('product-select-2');
  productSelect3 = document.getElementById('product-select-3');

  inputFecha1 = document.getElementById('input-fecha');
  inputFecha2 = document.getElementById('input-fecha-2');
  inputFecha3 = document.getElementById('input-fecha-3');

  zplOutputTextarea = document.getElementById('zpl-output');
  simulatedLabel = document.getElementById('simulated-label');
  labelaryImg = document.getElementById('labelary-img');
  labelaryContainer = document.getElementById('labelary-container');
  labelaryLoading = document.getElementById('labelary-loading');
  labelaryError = document.getElementById('labelary-error');
  btnGenerate = document.getElementById('btn-generate');
  printerSelect = document.getElementById('printerSelect');
  printerStatusBadge = document.getElementById('printer-status-badge');
  printerStatusDot = document.getElementById('printer-status-dot');
  printerStatusText = document.getElementById('printer-status-text');

  // Populate Select Options
  populateProductSelects();

  // Mask Date Inputs
  setupDateMask(inputFecha1);
  setupDateMask(inputFecha2);
  setupDateMask(inputFecha3);

  // Default Expiration Date (Default: 2 years from today)
  const now = new Date();
  now.setFullYear(now.getFullYear() + 2);
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const defaultDate = `${day}/${month}/${now.getFullYear()}`;

  inputFecha1.value = defaultDate;
  inputFecha2.value = defaultDate;
  inputFecha3.value = defaultDate;

  // Event Listeners for Product Selection
  productSelect1.addEventListener('change', (e) => {
    currentProduct1 = productsData.find(p => p.id === e.target.value);
    updateZPLAndPreview();
  });

  productSelect2.addEventListener('change', (e) => {
    currentProduct2 = productsData.find(p => p.id === e.target.value);
    updateZPLAndPreview();
  });

  productSelect3.addEventListener('change', (e) => {
    currentProduct3 = productsData.find(p => p.id === e.target.value);
    updateZPLAndPreview();
  });

  // Copy Product 1 Shortcuts
  document.getElementById('btn-copy-prod1-to-2').addEventListener('click', () => {
    productSelect2.value = productSelect1.value;
    currentProduct2 = currentProduct1;
    inputFecha2.value = inputFecha1.value;
    updateZPLAndPreview();
    showToast('Producto 1 copiado a Sección 2', 'info');
  });

  document.getElementById('btn-copy-prod1-to-3').addEventListener('click', () => {
    productSelect3.value = productSelect1.value;
    currentProduct3 = currentProduct1;
    inputFecha3.value = inputFecha1.value;
    updateZPLAndPreview();
    showToast('Producto 1 copiado a Sección 3', 'info');
  });

  // Printer Selection Change
  printerSelect.addEventListener('change', checkPrinterConnection);

  // Print Direct Button Event
  btnGenerate.addEventListener('click', printDirectToZebra);

  // Copy ZPL Code Button
  document.getElementById('btn-copy-zpl').addEventListener('click', () => {
    const text = zplOutputTextarea.value;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Código ZPL copiado al portapapeles', 'success');
    } catch (err) {
      showToast('Error al copiar el código ZPL', 'error');
    }
    document.body.removeChild(textArea);
  });

  // Render Engine Switcher
  document.getElementById('render-mode-vector').addEventListener('click', (e) => {
    activeRenderEngine = 'vector';
    e.target.className = 'px-2.5 py-1 rounded bg-brand-600 text-white font-medium';
    document.getElementById('render-mode-labelary').className = 'px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-300';
    simulatedLabel.classList.remove('hidden');
    labelaryContainer.classList.add('hidden');
  });

  document.getElementById('render-mode-labelary').addEventListener('click', (e) => {
    activeRenderEngine = 'labelary';
    e.target.className = 'px-2.5 py-1 rounded bg-brand-600 text-white font-medium';
    document.getElementById('render-mode-vector').className = 'px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-300';
    simulatedLabel.classList.add('hidden');
    labelaryContainer.classList.remove('hidden');
    updateLabelaryPreview(generateZPLCode());
  });

  // Tab Switchers
  const tabVisual = document.getElementById('tab-visual');
  const tabCode = document.getElementById('tab-code');
  const viewVisual = document.getElementById('view-visual');
  const viewCode = document.getElementById('view-code');

  tabVisual.addEventListener('click', () => {
    tabVisual.className = 'tab-btn px-4 py-2 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center gap-2 transition';
    tabCode.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition';
    viewVisual.classList.remove('hidden');
    viewCode.classList.add('hidden');
  });

  tabCode.addEventListener('click', () => {
    tabCode.className = 'tab-btn px-4 py-2 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center gap-2 transition';
    tabVisual.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition';
    viewCode.classList.remove('hidden');
    viewVisual.classList.add('hidden');
  });

  // Dark Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle');
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
    lightIcon.classList.remove('hidden');
  } else {
    darkIcon.classList.remove('hidden');
  }

  themeToggleBtn.addEventListener('click', () => {
    darkIcon.classList.toggle('hidden');
    lightIcon.classList.toggle('hidden');
    document.documentElement.classList.toggle('dark');
  });

  // Initial Call to Build Label
  updateZPLAndPreview();
  checkPrinterConnection();
});