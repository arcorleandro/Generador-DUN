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
let queueItems = []; // Array of { uid, productId, date, qty }
let itemCounter = 0;
let currentPreviewPage = 0;
let generatedLabelPages = [];
let totalDunsCount = 0;
let activeRenderEngine = 'vector';

// Helper utilities
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

function getZPLFontConfig(headText) {
  if (!headText) return { h: 38, w: 38, x: 30, fb: 752 };
  const len = headText.length;
  // Long names (Ketchup Picante and Barbacoa La Campagnola) use compressed font
  if (len > 38) {
    return { h: 32, w: 24, x: 10, fb: 792 };
  }
  // All other standard product descriptions use a larger, more legible font size (40 dots)
  return { h: 40, w: 40, x: 30, fb: 752 };
}

function validateDateString(dateStr) {
  if (!dateStr || dateStr.trim().length !== 10) return false;
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
  return regex.test(dateStr.trim());
}

// DOM References
let dynamicItemsContainer, totalDunsBadge, labelCountBadge;
let zplOutputTextarea, labelaryImg, labelaryContainer, labelaryLoading, labelaryError;
let simulatedLabel, btnGenerate, printerSelect, printerStatusBadge, printerStatusDot, printerStatusText;
let previewPageIndicator, btnPrevLabel, btnNextLabel;
let printConfirmModal, modalTotalDuns, modalTotalLabels, modalPrinterName, btnConfirmPrint, btnCancelPrint;

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

// Attach Smart Date Mask to an input element
function attachDateMask(inputElement, onUpdateCallback) {
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
    if (onUpdateCallback) onUpdateCallback(formatted);
  });
}

// Add a new product row to the dynamic queue (Default date = empty)
function addQueueItem(productId = "10", date = "", qty = 1) {
  itemCounter++;
  const uid = itemCounter;

  queueItems.push({
    uid,
    productId,
    date,
    qty
  });

  renderQueueItems();
  updateZPLAndPreview();
}

// Remove a product row from the dynamic queue
function removeQueueItem(uid) {
  if (queueItems.length <= 1) {
    showToast('Debe haber al menos un producto en la lista', 'warning');
    return;
  }
  queueItems = queueItems.filter(item => item.uid !== uid);
  renderQueueItems();
  updateZPLAndPreview();
}

// Render all dynamic product rows in the left panel
function renderQueueItems() {
  dynamicItemsContainer.innerHTML = '';

  queueItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.dataset.uid = item.uid;
    card.className = 'queue-item-card p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-2.5 transition-all';

    const optionsHtml = productsData.map(prod => {
      const selected = prod.id === item.productId ? 'selected' : '';
      return `<option value="${prod.id}" ${selected}>${prod.head} (${prod.head2})</option>`;
    }).join('');

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Producto ${index + 1}
        </span>
        ${queueItems.length > 1 ? `
          <button type="button" class="btn-remove-item text-xs text-slate-400 hover:text-rose-500 transition px-1" title="Eliminar producto">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        ` : ''}
      </div>

      <div>
        <select class="item-product-select w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium text-slate-800 dark:text-slate-100 cursor-pointer">
          ${optionsHtml}
        </select>
      </div>

      <div class="grid grid-cols-12 gap-2.5">
        <div class="col-span-7">
          <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            <i class="fa-regular fa-calendar-check text-brand-500"></i> Fecha Vencimiento <span class="text-rose-500">*</span>
          </label>
          <input type="text" maxlength="10" placeholder="DD/MM/YYYY" value="${item.date}"
            class="item-date-input w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none tracking-wider">
        </div>
        <div class="col-span-5">
          <label class="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            <i class="fa-solid fa-hashtag text-emerald-500"></i> Cant. DUNs
          </label>
          <input type="number" min="1" max="999" value="${item.qty}"
            class="item-qty-input w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-emerald-600 dark:text-emerald-400">
        </div>
      </div>
    `;

    const selectEl = card.querySelector('.item-product-select');
    const dateEl = card.querySelector('.item-date-input');
    const qtyEl = card.querySelector('.item-qty-input');
    const removeBtn = card.querySelector('.btn-remove-item');

    selectEl.addEventListener('change', (e) => {
      item.productId = e.target.value;
      updateZPLAndPreview();
    });

    attachDateMask(dateEl, (newVal) => {
      item.date = newVal;
      updateZPLAndPreview();
    });

    qtyEl.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      item.qty = (!isNaN(val) && val >= 1) ? val : 1;
      updateZPLAndPreview();
    });

    qtyEl.addEventListener('blur', (e) => {
      const val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) {
        e.target.value = 1;
        item.qty = 1;
        updateZPLAndPreview();
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => removeQueueItem(item.uid));
    }

    dynamicItemsContainer.appendChild(card);
  });
}

// Always build the queue strictly following Producto 1 -> Producto 2 -> Producto N
// If total DUNs > 9, each product starts on a clean label sheet so different products never mix.
// If total DUNs <= 9, they are packed continuously in groups of 3 to save label sheets.
function buildLabelPages() {
  const cards = dynamicItemsContainer.querySelectorAll('.queue-item-card');
  const parsedItems = [];
  let totalDuns = 0;

  // First pass: sync DOM values and calculate total DUNs
  cards.forEach(card => {
    const uid = parseInt(card.dataset.uid, 10);
    const item = queueItems.find(q => q.uid === uid);
    if (!item) return;

    const selectEl = card.querySelector('.item-product-select');
    const dateEl = card.querySelector('.item-date-input');
    const qtyEl = card.querySelector('.item-qty-input');

    item.productId = selectEl.value;
    item.date = dateEl.value;
    const rawQty = parseInt(qtyEl.value, 10);
    item.qty = (!isNaN(rawQty) && rawQty >= 1) ? rawQty : 1;

    const product = productsData.find(p => p.id === item.productId) || productsData[0];
    const date = item.date.trim() || '--/--/----';

    parsedItems.push({ product, date, qty: item.qty });
    totalDuns += item.qty;
  });

  const pages = [];

  if (totalDuns > 9) {
    // Separate label sheets per product when printing more than 9 DUNs
    parsedItems.forEach(({ product, date, qty }) => {
      const productSlots = [];
      for (let i = 0; i < qty; i++) {
        productSlots.push({ product, date });
      }
      for (let i = 0; i < productSlots.length; i += 3) {
        pages.push(productSlots.slice(i, i + 3));
      }
    });
  } else {
    // Pack continuously in groups of 3 when total DUNs <= 9
    const flatDuns = [];
    parsedItems.forEach(({ product, date, qty }) => {
      for (let i = 0; i < qty; i++) {
        flatDuns.push({ product, date });
      }
    });
    for (let i = 0; i < flatDuns.length; i += 3) {
      pages.push(flatDuns.slice(i, i + 3));
    }
  }

  return { totalDuns, pages };
}

function generateSingleLabelZPL(slots) {
  const s1 = slots[0];
  const s2 = slots[1];
  const s3 = slots[2];

  const dun1Clean = getCleanDun(s1.product.dun);
  const cfg1 = getZPLFontConfig(s1.product.head);

  let zpl = `^XA
^PW812
^LL1218
^COMMENT ${s1.product.logo}^FS
^FO${cfg1.x},105^CI28^A0N,${cfg1.h},${cfg1.w}^FB${cfg1.fb},2,0,C,0^FD${escapeZPL(s1.product.head)}^FS
^FO30,150^A0N,32,32^FB752,1,0,C,0^FD${escapeZPL(s1.product.head2)}^FS
^BY6,3,130
^FO60,200^BB8,130,Y,N,N^FD${dun1Clean}^FS
^FO30,350^A0N,30,30^FB752,1,0,C,0^FD${s1.product.dun}^FS
^FO30,380^A0N,36,36^FB692,1,0,R,0^FDL ${s1.date}^FS`;

  if (s2) {
    const dun2Clean = getCleanDun(s2.product.dun);
    const cfg2 = getZPLFontConfig(s2.product.head);
    zpl += `
^FO30,430^GB752,4,4^FS
^COMMENT ${s2.product.logo}^FS
^FO${cfg2.x},455^A0N,${cfg2.h},${cfg2.w}^FB${cfg2.fb},2,0,C,0^FD${escapeZPL(s2.product.head)}^FS
^FO30,500^A0N,32,32^FB752,1,0,C,0^FD${escapeZPL(s2.product.head2)}^FS
^BY6,3,130
^FO60,550^BB8,130,Y,N,N^FD${dun2Clean}^FS
^FO30,700^A0N,30,30^FB752,1,0,C,0^FD${s2.product.dun}^FS
^FO30,730^A0N,36,36^FB692,1,0,R,0^FDL ${s2.date}^FS`;
  }

  if (s3) {
    const dun3Clean = getCleanDun(s3.product.dun);
    const cfg3 = getZPLFontConfig(s3.product.head);
    zpl += `
^FO30,780^GB752,4,4^FS
^COMMENT ${s3.product.logo}^FS
^FO${cfg3.x},805^A0N,${cfg3.h},${cfg3.w}^FB${cfg3.fb},2,0,C,0^FD${escapeZPL(s3.product.head)}^FS
^FO30,850^A0N,32,32^FB752,1,0,C,0^FD${escapeZPL(s3.product.head2)}^FS
^BY6,3,130
^FO60,900^BB8,130,Y,N,N^FD${dun3Clean}^FS
^FO30,1050^A0N,30,30^FB752,1,0,C,0^FD${s3.product.dun}^FS
^FO30,1080^A0N,36,36^FB692,1,0,R,0^FDL ${s3.date}^FS`;
  }

  zpl += `\n^XZ`;
  return zpl;
}

function generateFullZPLCode() {
  return generatedLabelPages.map(pageSlots => generateSingleLabelZPL(pageSlots)).join('\n');
}

function updateSimulatedLabel() {
  if (generatedLabelPages.length === 0) return;

  if (currentPreviewPage >= generatedLabelPages.length) {
    currentPreviewPage = generatedLabelPages.length - 1;
  }
  if (currentPreviewPage < 0) currentPreviewPage = 0;

  const pageSlots = generatedLabelPages[currentPreviewPage];

  previewPageIndicator.textContent = `${currentPreviewPage + 1} / ${generatedLabelPages.length}`;
  btnPrevLabel.disabled = currentPreviewPage === 0;
  btnNextLabel.disabled = currentPreviewPage >= generatedLabelPages.length - 1;

  const adjustTextSize = (elemId, text) => {
    const elem = document.getElementById(elemId);
    if (!elem) return;
    elem.textContent = text;
    if (text.length > 38) {
      elem.className = "font-bold text-[9.5px] tracking-tight leading-tight text-black uppercase whitespace-nowrap overflow-hidden";
    } else {
      elem.className = "font-bold text-[11.5px] leading-tight text-black uppercase break-words max-h-8 overflow-hidden";
    }
  };

  // Section 1
  const s1 = pageSlots[0];
  adjustTextSize('lbl-head', s1.product.head);
  document.getElementById('lbl-head2').textContent = s1.product.head2;
  document.getElementById('lbl-dun').textContent = s1.product.dun;
  document.getElementById('lbl-lote').textContent = `L ${s1.date}`;
  try {
    JsBarcode("#barcode-svg", getCleanDun(s1.product.dun), { format: "ITF14", width: 1.8, height: 35, displayValue: false, margin: 0 });
  } catch (e) {
    JsBarcode("#barcode-svg", getCleanDun(s1.product.dun), { format: "CODE128", width: 1.5, height: 35, displayValue: false, margin: 0 });
  }

  // Section 2
  const sec2 = document.getElementById('sim-section-2');
  const div1 = document.getElementById('sim-divider-1');
  if (pageSlots[1]) {
    sec2.classList.remove('invisible');
    div1.classList.remove('invisible');
    const s2 = pageSlots[1];
    adjustTextSize('lbl-head-2', s2.product.head);
    document.getElementById('lbl-head2-2').textContent = s2.product.head2;
    document.getElementById('lbl-dun-2').textContent = s2.product.dun;
    document.getElementById('lbl-lote-2').textContent = `L ${s2.date}`;
    try {
      JsBarcode("#barcode-svg-2", getCleanDun(s2.product.dun), { format: "ITF14", width: 1.8, height: 35, displayValue: false, margin: 0 });
    } catch (e) {
      JsBarcode("#barcode-svg-2", getCleanDun(s2.product.dun), { format: "CODE128", width: 1.5, height: 35, displayValue: false, margin: 0 });
    }
  } else {
    sec2.classList.add('invisible');
    div1.classList.add('invisible');
  }

  // Section 3
  const sec3 = document.getElementById('sim-section-3');
  const div2 = document.getElementById('sim-divider-2');
  if (pageSlots[2]) {
    sec3.classList.remove('invisible');
    div2.classList.remove('invisible');
    const s3 = pageSlots[2];
    adjustTextSize('lbl-head-3', s3.product.head);
    document.getElementById('lbl-head2-3').textContent = s3.product.head2;
    document.getElementById('lbl-dun-3').textContent = s3.product.dun;
    document.getElementById('lbl-lote-3').textContent = `L ${s3.date}`;
    try {
      JsBarcode("#barcode-svg-3", getCleanDun(s3.product.dun), { format: "ITF14", width: 1.8, height: 35, displayValue: false, margin: 0 });
    } catch (e) {
      JsBarcode("#barcode-svg-3", getCleanDun(s3.product.dun), { format: "CODE128", width: 1.5, height: 35, displayValue: false, margin: 0 });
    }
  } else {
    sec3.classList.add('invisible');
    div2.classList.add('invisible');
  }
}

function updateLabelaryPreview() {
  if (activeRenderEngine !== 'labelary' || generatedLabelPages.length === 0) return;

  labelaryLoading.classList.remove('hidden');
  labelaryImg.classList.add('hidden');
  labelaryError.classList.add('hidden');

  const pageZPL = generateSingleLabelZPL(generatedLabelPages[currentPreviewPage]);
  const url = `https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/`;
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'image/png',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: pageZPL
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

function updateZPLAndPreview() {
  const { totalDuns, pages } = buildLabelPages();
  generatedLabelPages = pages;
  totalDunsCount = totalDuns;

  totalDunsBadge.textContent = `${totalDuns} DUN${totalDuns !== 1 ? 's' : ''}`;
  labelCountBadge.textContent = `${pages.length} etiqueta${pages.length !== 1 ? 's' : ''}`;

  const fullZpl = generateFullZPLCode();
  if (zplOutputTextarea) zplOutputTextarea.value = fullZpl;
  
  const charCountElem = document.getElementById('zpl-char-count');
  if (charCountElem) charCountElem.textContent = `${fullZpl.length} caracteres`;

  updateSimulatedLabel();
  updateLabelaryPreview();
}

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

// Check all items have valid dates before printing
function checkDatesValidity() {
  for (let i = 0; i < queueItems.length; i++) {
    const item = queueItems[i];
    if (!validateDateString(item.date)) {
      showToast(`Por favor ingrese una fecha válida (DD/MM/YYYY) para el Producto ${i + 1}`, 'error');
      return false;
    }
  }
  return true;
}

// Open confirmation modal before sending print command
function openPrintConfirmationModal() {
  updateZPLAndPreview();
  if (!checkDatesValidity()) return;

  const totalLabels = generatedLabelPages.length;
  const printerName = printerSelect.options[printerSelect.selectedIndex].text;

  modalTotalDuns.textContent = `${totalDunsCount} DUN${totalDunsCount !== 1 ? 's' : ''}`;
  modalTotalLabels.textContent = `${totalLabels} etiqueta${totalLabels !== 1 ? 's' : ''}`;
  modalPrinterName.textContent = printerName;

  printConfirmModal.classList.remove('hidden');
  printConfirmModal.classList.add('flex');
}

function closePrintConfirmationModal() {
  printConfirmModal.classList.add('hidden');
  printConfirmModal.classList.remove('flex');
}

// Helper delay to avoid overflowing Zebra printer buffer on large print jobs
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeDirectPrintToZebra() {
  closePrintConfirmationModal();

  const targetIP = printerSelect.value;
  const printerName = printerSelect.options[printerSelect.selectedIndex].text;
  const totalLabels = generatedLabelPages.length;

  btnGenerate.disabled = true;
  btnGenerate.classList.add('opacity-60', 'cursor-not-allowed');

  showToast(`Iniciando impresión secuencial de ${totalLabels} etiqueta(s) en ${printerName}...`, 'info');

  try {
    for (let i = 0; i < totalLabels; i++) {
      const singleLabelZpl = generateSingleLabelZPL(generatedLabelPages[i]);
      btnGenerate.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-lg"></i> IMPRIMIENDO ${i + 1} DE ${totalLabels}...`;

      await fetch(`http://${targetIP}/pstprnt`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: singleLabelZpl
      });

      // Pause 180ms between labels so the Zebra print server processes the queue in strict order
      if (i < totalLabels - 1) {
        await sleep(180);
      }
    }

    showToast(`¡Impresión de ${totalLabels} etiqueta(s) completada en orden en ${printerName}!`, 'success');
  } catch (err) {
    console.warn('Error en envío secuencial:', err);
    showToast(`Se interrumpió el envío a ${printerName} (${targetIP}). Verifique la conexión.`, 'error');
  } finally {
    btnGenerate.disabled = false;
    btnGenerate.classList.remove('opacity-60', 'cursor-not-allowed');
    btnGenerate.innerHTML = `<i class="fa-solid fa-print text-lg"></i> IMPRIMIR ETIQUETAS DIRECTO`;
  }
}

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  dynamicItemsContainer = document.getElementById('dynamic-items-container');
  totalDunsBadge = document.getElementById('total-duns-badge');
  labelCountBadge = document.getElementById('label-count-badge');

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

  previewPageIndicator = document.getElementById('preview-page-indicator');
  btnPrevLabel = document.getElementById('btn-prev-label');
  btnNextLabel = document.getElementById('btn-next-label');

  // Modal references
  printConfirmModal = document.getElementById('print-confirm-modal');
  modalTotalDuns = document.getElementById('modal-total-duns');
  modalTotalLabels = document.getElementById('modal-total-labels');
  modalPrinterName = document.getElementById('modal-printer-name');
  btnConfirmPrint = document.getElementById('btn-confirm-print');
  btnCancelPrint = document.getElementById('btn-cancel-print');

  // Add Item Button (Default date empty)
  document.getElementById('btn-add-item').addEventListener('click', () => {
    addQueueItem("10", "", 1);
    dynamicItemsContainer.scrollTop = dynamicItemsContainer.scrollHeight;
  });

  // Preview Pagination Controls
  btnPrevLabel.addEventListener('click', () => {
    if (currentPreviewPage > 0) {
      currentPreviewPage--;
      updateSimulatedLabel();
      updateLabelaryPreview();
    }
  });

  btnNextLabel.addEventListener('click', () => {
    if (currentPreviewPage < generatedLabelPages.length - 1) {
      currentPreviewPage++;
      updateSimulatedLabel();
      updateLabelaryPreview();
    }
  });

  // Printer Selection Change
  printerSelect.addEventListener('change', checkPrinterConnection);

  // Print Direct Button Event -> Opens Confirmation Modal
  btnGenerate.addEventListener('click', openPrintConfirmationModal);

  // Modal Buttons
  btnConfirmPrint.addEventListener('click', executeDirectPrintToZebra);
  btnCancelPrint.addEventListener('click', closePrintConfirmationModal);
  printConfirmModal.addEventListener('click', (e) => {
    if (e.target === printConfirmModal) closePrintConfirmationModal();
  });

  // Copy ZPL Code Button
  document.getElementById('btn-copy-zpl').addEventListener('click', () => {
    if (!checkDatesValidity()) return;

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

  // Refresh Labelary Button
  document.getElementById('btn-refresh-labelary').addEventListener('click', () => {
    updateLabelaryPreview();
    showToast('Vista previa actualizada', 'info');
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
    updateLabelaryPreview();
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

  // Initialize with empty expiration date
  addQueueItem("15", "", 1);
  checkPrinterConnection();
});