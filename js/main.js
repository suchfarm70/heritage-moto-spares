/**
 * Heritage Moto Spares — Main Client Controller
 * Handles: FAQ accordions, Form Validation & Submission, GA4 Event Dispatching,
 * and Catalog Live Filter.
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. FAQ Accordions
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });

  // 2. Rare Part Request Form Controller
  const form = document.getElementById('rare-part-form');
  if (form) {
    const successBanner = document.getElementById('form-success-banner');
    const errorBanner = document.getElementById('form-error-banner');
    const submitBtn = document.getElementById('btn-submit-request');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Anti-spam check
      const honeypot = document.getElementById('form-website-check');
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Bot submission blocked via honeypot.');
        return;
      }

      // Validate Required Fields
      let isValid = true;
      const requiredFields = [
        { id: 'sender-name', errId: 'err-name' },
        { id: 'sender-email', errId: 'err-email', isEmail: true },
        { id: 'moto-make', errId: 'err-make' },
        { id: 'moto-model', errId: 'err-model' },
        { id: 'moto-year', errId: 'err-year', isYear: true },
        { id: 'part-name', errId: 'err-part' },
        { id: 'part-description', errId: 'err-desc' },
        { id: 'consent-check', errId: 'err-consent', isCheck: true }
      ];

      requiredFields.forEach(f => {
        const el = document.getElementById(f.id);
        const errEl = document.getElementById(f.errId);
        let fieldValid = true;

        if (!el) return;

        if (f.isCheck) {
          fieldValid = el.checked;
        } else if (f.isEmail) {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          fieldValid = emailPattern.test(el.value.trim());
        } else if (f.isYear) {
          const y = parseInt(el.value.trim(), 10);
          fieldValid = !isNaN(y) && y >= 1920 && y <= 2008;
        } else {
          fieldValid = el.value.trim().length > 1;
        }

        if (!fieldValid) {
          isValid = false;
          el.classList.add('error');
          if (errEl) errEl.style.display = 'block';
        } else {
          el.classList.remove('error');
          if (errEl) errEl.style.display = 'none';
        }
      });

      if (!isValid) {
        if (errorBanner) {
          errorBanner.style.display = 'block';
          errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (successBanner) successBanner.style.display = 'none';
        return;
      }

      // UI submission state
      if (errorBanner) errorBanner.style.display = 'none';
      const origBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Verifying Archives & Sourcing Network...</span>';
      submitBtn.disabled = true;

      const payload = {
        name: document.getElementById('sender-name').value.trim(),
        email: document.getElementById('sender-email').value.trim(),
        make: document.getElementById('moto-make').value,
        model: document.getElementById('moto-model').value.trim(),
        year: document.getElementById('moto-year').value.trim(),
        part_name: document.getElementById('part-name').value.trim(),
        part_number: document.getElementById('part-number') ? document.getElementById('part-number').value.trim() : '',
        condition: document.getElementById('part-condition') ? document.getElementById('part-condition').value : 'Any',
        description: document.getElementById('part-description').value.trim(),
        timestamp: new Date().toISOString()
      };

      // Dispatch GA4 Event
      if (typeof gtag === 'function') {
        gtag('event', 'rare_part_request_submitted', {
          event_category: 'Lead Generation',
          motorcycle_make: payload.make,
          motorcycle_year: payload.year,
          part_name: payload.part_name,
          preferred_condition: payload.condition
        });
        console.log('GA4 event successfully tracked: rare_part_request_submitted');
      }

      setTimeout(() => {
        submitBtn.innerHTML = origBtnText;
        submitBtn.disabled = false;

        const userNameEl = document.getElementById('success-user-name');
        const partNameEl = document.getElementById('success-part-name');
        if (userNameEl) userNameEl.textContent = payload.name;
        if (partNameEl) partNameEl.textContent = `${payload.make} ${payload.model} (${payload.part_name})`;

        if (successBanner) {
          successBanner.style.display = 'block';
          successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        form.reset();
      }, 1000);
    });
  }

  // 3. Catalog Live Filter
  const catalogSearch = document.getElementById('catalog-search');
  if (catalogSearch) {
    catalogSearch.addEventListener('input', function () {
      const q = this.value.toLowerCase().trim();
      const items = document.querySelectorAll('.catalog-item');
      items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes(q)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // 4. Amazon / Flipkart Style Spare Parts Marketplace Controller
  const marketplaceGrid = document.getElementById('marketplace-products-grid');
  if (marketplaceGrid) {
    const searchInput = document.getElementById('marketplace-search-input');
    const sortSelect = document.getElementById('marketplace-sort-select');
    const resultCountEl = document.getElementById('marketplace-result-count');
    const clearBtn = document.getElementById('btn-clear-filters');
    const marqueCheckboxes = document.querySelectorAll('.filter-marque');
    const hubCheckboxes = document.querySelectorAll('.filter-hub');
    const systemCheckboxes = document.querySelectorAll('.filter-system');
    const priceRadios = document.querySelectorAll('.filter-price');

    function applyFilters() {
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const selectedMarques = Array.from(marqueCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
      const selectedHubs = Array.from(hubCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
      const selectedSystems = Array.from(systemCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
      
      let selectedPrice = 'all';
      const checkedPrice = Array.from(priceRadios).find(r => r.checked);
      if (checkedPrice) selectedPrice = checkedPrice.value;

      const cards = Array.from(marketplaceGrid.querySelectorAll('.ecommerce-card'));
      let visibleCount = 0;

      cards.forEach(card => {
        const brand = (card.dataset.brand || '').toLowerCase();
        const hub = (card.dataset.hub || '').toLowerCase();
        const system = (card.dataset.system || '').toLowerCase();
        const price = parseInt(card.dataset.price || '0', 10);
        const cardText = card.innerText.toLowerCase();

        // 1. Text Search Match
        const matchesQuery = !q || cardText.includes(q);

        // 2. Marque Filter
        const matchesMarque = selectedMarques.length === 0 || selectedMarques.includes(brand);

        // 3. Hub Filter (Delhi / Mumbai)
        const matchesHub = selectedHubs.length === 0 || selectedHubs.includes(hub);

        // 4. System Filter
        const matchesSystem = selectedSystems.length === 0 || selectedSystems.includes(system);

        // 5. Price Filter
        let matchesPrice = true;
        if (selectedPrice === 'under-3000') matchesPrice = price < 3000;
        else if (selectedPrice === '3000-7500') matchesPrice = price >= 3000 && price <= 7500;
        else if (selectedPrice === '7500-15000') matchesPrice = price > 7500 && price <= 15000;
        else if (selectedPrice === 'above-15000') matchesPrice = price > 15000;

        if (matchesQuery && matchesMarque && matchesHub && matchesSystem && matchesPrice) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (resultCountEl) {
        resultCountEl.textContent = `Showing ${visibleCount} available classic parts`;
      }
    }

    // Sort Handler
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        const sortVal = this.value;
        const cards = Array.from(marketplaceGrid.querySelectorAll('.ecommerce-card'));
        cards.sort((a, b) => {
          const priceA = parseInt(a.dataset.price || '0', 10);
          const priceB = parseInt(b.dataset.price || '0', 10);
          if (sortVal === 'price-low') return priceA - priceB;
          if (sortVal === 'price-high') return priceB - priceA;
          return 0; // default featured
        });
        cards.forEach(card => marketplaceGrid.appendChild(card));
      });
    }

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    marqueCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    hubCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    systemCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    priceRadios.forEach(rb => rb.addEventListener('change', applyFilters));

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        marqueCheckboxes.forEach(cb => cb.checked = false);
        hubCheckboxes.forEach(cb => cb.checked = false);
        systemCheckboxes.forEach(cb => cb.checked = false);
        priceRadios.forEach(rb => rb.checked = (rb.value === 'all'));
        applyFilters();
      });
    }

    // Bike Models Data Dictionary
    const bikeModelsByMake = {
      'royal-enfield': ['Bullet 350 (Cast Iron)', 'Bullet 500 (Cast Iron)', 'Redditch 350/500', 'Lightning 535', 'Crusader 250'],
      'yamaha': ['Yamaha RX100 (Made in Japan)', 'Yamaha RD350 HT (30.5 bhp)', 'Yamaha RD350 LT', 'Yamaha RX135 (4-Speed)'],
      'yezdi': ['Yezdi Roadking (250cc)', 'Jawa 250 Type 353', 'Yezdi Classic', 'Yezdi Monarch', 'Yezdi 175 Deluxe'],
      'jawa-yezdi': ['Yezdi Roadking (250cc)', 'Jawa 250 Type 353', 'Yezdi Classic', 'Yezdi Monarch', 'Yezdi 175 Deluxe'],
      'rajdoot': ['Rajdoot 175 Standard', 'Rajdoot GTS 175 Bobby', 'Rajdoot 175 Deluxe', 'Rajdoot 350 HT'],
      'bajaj': ['Bajaj Chetak 150', 'Bajaj Super 150', 'Bajaj Priya 150', 'Bajaj 150 Vespa Sprint'],
      'lml-vespa': ['LML Vespa 150 NV', 'LML Select 150', 'LML Star 150', 'LML Vespa T5'],
      'lambretta': ['SIL Vijay Super 150', 'API Lamby 150', 'Lambretta Li150 Series II', 'Lambretta GP150'],
      'kinetic-honda': ['Kinetic Honda DX (98cc)', 'Kinetic Honda ZX', 'Kinetic Marvel 150', 'Honda Lead NH90'],
      'herohonda': ['Hero Honda CD100 (1985)', 'Hero Honda CD100 SS', 'Hero Honda Sleek', 'Splendor (Gen 1)'],
      'triumph': ['Bonneville T120 (650cc)', 'Tiger 650 (TR6)', 'Trident T150 (750cc)', 'Trophy 500 (T100)'],
      'norton': ['Commando 750 Fastback', 'Commando 850 Interstate', 'Dominator 88 (500cc)', 'Dominator 99 (600cc)'],
      'bsa': ['Gold Star DBD34 (500cc)', 'A65 Lightning (650cc)', 'Bantam D7 (175cc)', 'M20 / M21 (SV 500/600)'],
      'honda': ['CB750 Four SOHC (1969-78)', 'CB350 Super Sport Twin', 'CB400 Four', 'CB550 Four'],
      'bmw': ['BMW R75 /5 Boxer (1969-73)', 'BMW R69S Earles', 'BMW R60/6', 'BMW R90S'],
      'motoguzzi': ['Moto Guzzi V7 Sport (750cc)', 'Le Mans 850 Mark I', '850 Eldorado / California', 'V50 Monza'],
      'ducati': ['Ducati 750 Super Sport (Roundcase)', 'Ducati 900 SS Bevel', '450 Desmo Silver Shotgun', '350 Scrambler'],
      'matchless': ['Matchless G80 500cc Single', 'Matchless G12 650cc Twin', 'AJS Model 18 500 Single', 'AJS Model 31 650cc'],
      'harley': ['Harley-Davidson WLA 45 (Flathead)', 'Harley Servi-Car 45ci', 'Early Sportster Ironhead']
    };

    // Global Model Dropdown Controller
    window.updateModelDropdown = function () {
      const makeSelect = document.getElementById('select-bike-make');
      const modelSelect = document.getElementById('select-bike-model');
      if (!makeSelect || !modelSelect) return;
      const make = makeSelect.value;
      modelSelect.innerHTML = '<option value="">2. Select Model</option>';
      if (bikeModelsByMake[make]) {
        bikeModelsByMake[make].forEach(mod => {
          const opt = document.createElement('option');
          opt.value = mod;
          opt.textContent = mod;
          modelSelect.appendChild(opt);
        });
      }
    };

    // Global Clear Filters Controller
    window.clearAllFilters = function () {
      if (searchInput) searchInput.value = '';
      marqueCheckboxes.forEach(cb => cb.checked = false);
      hubCheckboxes.forEach(cb => cb.checked = false);
      systemCheckboxes.forEach(cb => cb.checked = false);
      priceRadios.forEach(rb => rb.checked = (rb.value === 'all'));
      const pills = document.querySelectorAll('.cat-pill-btn');
      pills.forEach(p => p.classList.toggle('active', p.dataset.system === 'all'));
      applyFilters();
    };

    // Quick filter by hub from top announcement bar
    window.filterByHubQuick = function (hubName) {
      const h = (hubName || '').toLowerCase();
      hubCheckboxes.forEach(cb => {
        cb.checked = (cb.value.toLowerCase() === h);
      });
      applyFilters();
      const target = document.getElementById('spare-parts-inventory');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    };

    // URL Search Parameters Handler (Auto-filter from URL query)
    const urlParams = new URLSearchParams(window.location.search);
    const paramMake = urlParams.get('make') || urlParams.get('marque') || urlParams.get('brand');
    const paramHub = urlParams.get('hub');
    const paramSystem = urlParams.get('system');
    const paramQ = urlParams.get('q');

    let hasUrlFilter = false;
    if (paramMake) {
      const targetVal = paramMake.toLowerCase();
      marqueCheckboxes.forEach(cb => {
        if (cb.value.toLowerCase() === targetVal || (targetVal === 'jawa-yezdi' && cb.value.toLowerCase() === 'yezdi')) {
          cb.checked = true;
          hasUrlFilter = true;
        }
      });
      const makeSelect = document.getElementById('select-bike-make');
      if (makeSelect) {
        makeSelect.value = targetVal === 'jawa-yezdi' ? 'yezdi' : targetVal;
        window.updateModelDropdown();
      }
    }

    if (paramHub) {
      const hubVal = paramHub.toLowerCase();
      hubCheckboxes.forEach(cb => {
        if (cb.value.toLowerCase() === hubVal) {
          cb.checked = true;
          hasUrlFilter = true;
        }
      });
    }

    if (paramSystem) {
      const sysVal = paramSystem.toLowerCase();
      systemCheckboxes.forEach(cb => {
        if (cb.value.toLowerCase() === sysVal) {
          cb.checked = true;
          hasUrlFilter = true;
        }
      });
    }

    if (paramQ && searchInput) {
      searchInput.value = paramQ;
      hasUrlFilter = true;
    }

    if (hasUrlFilter) {
      applyFilters();
      const target = document.getElementById('spare-parts-inventory');
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 200);
      }
    }

    // Category Navigation Pills Controller
    const categoryTabs = document.querySelectorAll('.cat-pill-btn');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        categoryTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const sys = this.dataset.system;
        systemCheckboxes.forEach(cb => {
          cb.checked = (sys !== 'all' && cb.value === sys);
        });
        applyFilters();
        const grid = document.getElementById('spare-parts-inventory');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Modal buy/inquire triggers
    window.openOrderModal = function (title, sku, price, hub) {
      const modal = document.getElementById('order-modal');
      if (!modal) return;

      // Reset modal body to form view if previously submitted
      const modalBox = modal.querySelector('.order-modal-box');
      if (modalBox.dataset.originalHtml) {
        modalBox.innerHTML = modalBox.dataset.originalHtml;
        setupModalFormListener();
      } else {
        modalBox.dataset.originalHtml = modalBox.innerHTML;
      }

      document.getElementById('modal-part-title').textContent = title;
      document.getElementById('modal-part-sku').textContent = 'SKU: ' + sku;
      document.getElementById('modal-part-price').textContent = '₹' + price.toLocaleString('en-IN');
      document.getElementById('modal-part-hub').textContent = 'Dispatch Warehouse: ' + hub;
      const inputName = document.getElementById('modal-input-part-name');
      const inputSku = document.getElementById('modal-input-part-sku');
      if (inputName) inputName.value = title;
      if (inputSku) inputSku.value = sku;
      modal.classList.add('active');
    };

    window.closeOrderModal = function () {
      const modal = document.getElementById('order-modal');
      if (modal) modal.classList.remove('active');
    };

    window.openWhatsAppInquiry = function (title, sku, price, hub) {
      const msg = encodeURIComponent(`Hello Heritage Moto Spares! I am inquiring about: ${title} (SKU: ${sku}, Price: ₹${price.toLocaleString('en-IN')}). Dispatched from ${hub}. I need delivery in Delhi / Mumbai. Is this available?`);
      window.open(`https://wa.me/919876543210?text=${msg}`, '_blank');
    };

    // Setup interactive in-modal dispatch receipt
    function setupModalFormListener() {
      const modalForm = document.getElementById('modal-order-form');
      if (!modalForm) return;

      modalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const partTitle = document.getElementById('modal-part-title').textContent;
        const partSku = document.getElementById('modal-part-sku').textContent;
        const partPrice = document.getElementById('modal-part-price').textContent;
        const hubText = document.getElementById('modal-part-hub').textContent;
        const custName = modalForm.querySelector('input[type="text"]').value || 'Restorer';
        const custPhone = modalForm.querySelector('input[type="tel"]').value || '+91 98765 43210';
        const isDelhi = hubText.toLowerCase().includes('delhi');
        const trackingId = 'HMS-' + (isDelhi ? 'DEL' : 'BOM') + '-' + Math.floor(1000 + Math.random() * 9000);
        const courierName = isDelhi ? 'Delhi NCR Express (Karol Bagh Vault)' : 'Mumbai MMR Same-Day Courier (Grant Road Hub)';
        const deliveryEstimate = isDelhi ? 'Guaranteed 24h NCR Delivery' : 'Same-Day 4-Hour Express MMR';

        // Save order to localStorage
        const orderData = { id: trackingId, part: partTitle, sku: partSku, price: partPrice, hub: courierName, customer: custName, phone: custPhone, date: new Date().toISOString() };
        try {
          const prev = JSON.parse(localStorage.getItem('hms_vault_orders') || '[]');
          prev.unshift(orderData);
          localStorage.setItem('hms_vault_orders', JSON.stringify(prev.slice(0, 10)));
        } catch(err) {}

        const modalBox = document.querySelector('#order-modal .order-modal-box');
        if (modalBox) {
          modalBox.innerHTML = `
            <button class="modal-close-btn" onclick="closeOrderModal()" aria-label="Close modal">&times;</button>
            <div style="text-align:center; padding:10px 0 16px;">
              <div style="width:56px; height:56px; background:#DCFCE7; color:#16A34A; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:12px; box-shadow:0 0 16px rgba(22, 163, 74, 0.2);">✓</div>
              <h3 style="color:#0F172A; font-size:21px; margin-bottom:4px; font-family:'Playfair Display', serif;">Dispatch Confirmed &amp; Logged</h3>
              <p style="color:#64748B; font-size:13.5px; margin-bottom:16px;">Your authentic spare parts order has been allocated to our vault team.</p>
            </div>

            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:8px; margin-bottom:8px;">
                <span style="font-size:12px; color:#64748B; font-weight:600;">Tracking Reference:</span>
                <span style="font-size:13.5px; font-weight:800; color:#0284C7; letter-spacing:0.5px;">${trackingId}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:8px; margin-bottom:8px;">
                <span style="font-size:12px; color:#64748B; font-weight:600;">Component:</span>
                <span style="font-size:13px; font-weight:700; color:#0F172A; text-align:right; max-width:260px;">${partTitle}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:8px; margin-bottom:8px;">
                <span style="font-size:12px; color:#64748B; font-weight:600;">Dispatch Hub:</span>
                <span style="font-size:12.5px; font-weight:700; color:#10B981;">📍 ${courierName}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; color:#64748B; font-weight:600;">Delivery Service:</span>
                <span style="font-size:12.5px; font-weight:700; color:#F59E0B;">⚡ ${deliveryEstimate}</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <button class="btn btn-primary" onclick="window.openWhatsAppInquiry('${partTitle.replace(/'/g, "\'")}', '${partSku.replace(/'/g, "\'")}', 0, '${courierName.replace(/'/g, "\'")}')" style="font-size:12.5px; padding:10px 12px; background:#25D366; border-color:#25D366;">
                📲 WhatsApp Desk
              </button>
              <button class="btn btn-secondary" onclick="closeOrderModal()" style="font-size:12.5px; padding:10px 12px; border-color:#0F172A; color:#0F172A;">
                ← Back to Vault
              </button>
            </div>
          `;
        }
      });
    }

    setupModalFormListener();


    // 5. Predictive Search Dropdown Autocomplete
    const predictiveDropdown = document.getElementById('predictive-search-dropdown');
    if (searchInput && predictiveDropdown) {
      searchInput.addEventListener('input', function () {
        const val = this.value.toLowerCase().trim();
        if (val.length < 2) {
          predictiveDropdown.classList.remove('active');
          predictiveDropdown.innerHTML = '';
          return;
        }

        const cards = Array.from(marketplaceGrid.querySelectorAll('.ecommerce-card'));
        const matches = cards.filter(c => {
          return c.innerText.toLowerCase().includes(val) || (c.dataset.sku || '').toLowerCase().includes(val);
        }).slice(0, 5);

        if (matches.length > 0) {
          predictiveDropdown.innerHTML = matches.map(c => {
            const title = c.querySelector('.ecommerce-title').innerText;
            const sku = c.querySelector('.ecommerce-sku').innerText;
            const price = c.querySelector('.price-current').innerText;
            const img = c.querySelector('img').src;
            const hub = c.dataset.hub === 'delhi' ? 'Delhi Vault' : 'Mumbai Hub';
            return `
              <div class="predictive-item" onclick="selectPredictiveItem('${title.replace(/'/g, "\\'")}')">
                <img src="${img}" class="predictive-thumb" alt="${title}">
                <div class="predictive-info">
                  <div class="predictive-title">${title}</div>
                  <div class="predictive-meta"><span>${sku}</span> &bull; <span>📍 ${hub}</span></div>
                </div>
                <div class="predictive-price">${price}</div>
              </div>
            `;
          }).join('');
          predictiveDropdown.classList.add('active');
        } else {
          predictiveDropdown.innerHTML = '<div style="padding:12px; font-size:13px; color:#64748B; text-align:center;">No direct match in stock. <a href="rare-part-request/index.html" style="color:var(--accent-brass); font-weight:700;">Submit Rare Part Request &rarr;</a></div>';
          predictiveDropdown.classList.add('active');
        }
      });

      document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !predictiveDropdown.contains(e.target)) {
          predictiveDropdown.classList.remove('active');
        }
      });
    }

    window.selectPredictiveItem = function (title) {
      if (searchInput) searchInput.value = title;
      if (predictiveDropdown) predictiveDropdown.classList.remove('active');
      applyFilters();
    };

    // 6. Universal "Select Your Motorcycle" Bar (CMSNL / Hitchcocks Style)

    const makeSelect = document.getElementById('select-bike-make');
    const modelSelect = document.getElementById('select-bike-model');
    const systemSelect = document.getElementById('select-bike-system');

    if (makeSelect && modelSelect) {
      makeSelect.addEventListener('change', function () {
        const make = this.value;
        modelSelect.innerHTML = '<option value="">All Models</option>';
        if (bikeModelsByMake[make]) {
          bikeModelsByMake[make].forEach(mod => {
            const opt = document.createElement('option');
            opt.value = mod;
            opt.textContent = mod;
            modelSelect.appendChild(opt);
          });
        }
      });
    }

    window.executeBikeFinder = function () {
      const make = makeSelect ? makeSelect.value : '';
      const model = modelSelect ? modelSelect.value : '';
      const system = systemSelect ? systemSelect.value : '';

      // Set marque checkbox
      if (make) {
        marqueCheckboxes.forEach(cb => {
          cb.checked = (cb.value.toLowerCase() === make.toLowerCase());
        });
      }

      // Set system checkbox
      if (system) {
        systemCheckboxes.forEach(cb => {
          cb.checked = (cb.value.toLowerCase() === system.toLowerCase());
        });
      }

      if (model && searchInput) {
        searchInput.value = model.split(' ')[0]; // Search base model name
      }

      applyFilters();

      const target = document.getElementById('spare-parts-inventory');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    };

    // 7. Interactive Microfiche Exploded Schematic Pins
    window.highlightMicrofichePart = function (partId, pinEl) {
      document.querySelectorAll('.microfiche-callout-pin').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.microfiche-part-item').forEach(i => i.classList.remove('highlighted'));

      if (pinEl) pinEl.classList.add('active');
      const itemEl = document.getElementById('fiche-item-' + partId);
      if (itemEl) {
        itemEl.classList.add('highlighted');
        itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    // 8. Delhi & Mumbai Pincode Delivery Calculator
    window.checkDeliveryPincode = function () {
      const pinInput = document.getElementById('pincode-calc-input');
      const resultEl = document.getElementById('pincode-calc-result');
      if (!pinInput || !resultEl) return;

      const pin = pinInput.value.trim();
      if (!/^\d{6}$/.test(pin)) {
        resultEl.innerHTML = '<span style="color:#EF4444;">Please enter a valid 6-digit Indian PIN code.</span>';
        return;
      }

      if (pin.startsWith('110') || pin.startsWith('122') || pin.startsWith('201')) {
        resultEl.innerHTML = '<span style="color:#10B981; font-weight:700;">🟢 Delhi NCR Karol Bagh Vault:</span> Guaranteed Next-Day 2 PM Delivery via Express Parts Van. Free Local Courier!';
      } else if (pin.startsWith('400') || pin.startsWith('410') || pin.startsWith('411')) {
        resultEl.innerHTML = '<span style="color:#0284C7; font-weight:700;">🟢 Mumbai MMR Grant Road Hub:</span> Same-Day Courier (4 Hours) across Mumbai, Bandra, and Thane. Overnight to Pune!';
      } else {
        resultEl.innerHTML = '<span style="color:#C5A059; font-weight:700;">✈️ Domestic Express Air (BlueDart / Tracked SpeedPost):</span> Dispatched within 24 hours. Delivery in 2–3 business days.';
      }
    };
  }
});

