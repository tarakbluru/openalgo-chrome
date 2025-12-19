// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "injectButtons") {
    injectTradingButtons();
    sendResponse({success: true});
  } else if (request.action === "updateSettings") {
    // Update settings from popup if needed
    sendResponse({success: true});
  }
  return true;
});

// Automatically inject trading buttons when page loads
document.addEventListener('DOMContentLoaded', function() {
  injectTradingButtons();
});

// In case the document is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  injectTradingButtons();
}

// Function to inject trading buttons into the page
function injectTradingButtons() {
  // Check if buttons already exist
  if (document.getElementById('openalgo-controls')) {
    return;
  }
  
  // Check if we're on the OpenAlgo dashboard page and position differently
  const isOpenAlgoDashboard = window.location.href.includes('127.0.0.1:5000/dashboard');
  
  // Create container for buttons
  const container = document.createElement('div');
  container.id = 'openalgo-controls';
  container.className = 'openalgo-controls-container';
  
  // Add draggable functionality
  makeDraggable(container);
  
  // Create buttons for both symbols
  const buttonRows = [
    [
      { id: 'le1-button', text: 'LE1', color: 'success', action: 'longEntry', symbolNum: 1, tooltip: 'Long Entry - Symbol 1' },
      { id: 'lx1-button', text: 'LX1', color: 'warning', action: 'longExit', symbolNum: 1, tooltip: 'Long Exit - Symbol 1' },
      { id: 'se1-button', text: 'SE1', color: 'error', action: 'shortEntry', symbolNum: 1, tooltip: 'Short Entry - Symbol 1' },
      { id: 'sx1-button', text: 'SX1', color: 'info', action: 'shortExit', symbolNum: 1, tooltip: 'Short Exit - Symbol 1' }
    ],
    [
      { id: 'le2-button', text: 'LE2', color: 'success', action: 'longEntry', symbolNum: 2, tooltip: 'Long Entry - Symbol 2' },
      { id: 'lx2-button', text: 'LX2', color: 'warning', action: 'longExit', symbolNum: 2, tooltip: 'Long Exit - Symbol 2' },
      { id: 'se2-button', text: 'SE2', color: 'error', action: 'shortEntry', symbolNum: 2, tooltip: 'Short Entry - Symbol 2' },
      { id: 'sx2-button', text: 'SX2', color: 'info', action: 'shortExit', symbolNum: 2, tooltip: 'Short Exit - Symbol 2' }
    ]
  ];

  // Create buttons container with two rows
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'openalgo-buttons-container';

  buttonRows.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'openalgo-buttons-row';

    row.forEach(button => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.textContent = button.text;
      btn.className = `openalgo-button btn-${button.color}`;
      btn.setAttribute('title', button.tooltip);
      btn.addEventListener('click', () => handleButtonClick(button.action, button.symbolNum));
      rowDiv.appendChild(btn);
    });

    // Add settings icon after SX1 (first row only)
    if (rowIndex === 0) {
      const settingsIcon = document.createElement('button');
      settingsIcon.className = 'openalgo-settings-icon';
      settingsIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="8" cy="4" r="1.5"/>
          <circle cx="8" cy="8" r="1.5"/>
          <circle cx="8" cy="12" r="1.5"/>
        </svg>
      `;
      settingsIcon.addEventListener('click', toggleSettings);
      settingsIcon.setAttribute('title', 'OpenAlgo Settings');
      rowDiv.appendChild(settingsIcon);
    }

    buttonsContainer.appendChild(rowDiv);
  });
  
  // Add the buttons container to the main container
  container.appendChild(buttonsContainer);
  
  // Create settings panel
  const settingsPanel = document.createElement('div');
  settingsPanel.id = 'openalgo-settings-panel';
  settingsPanel.className = 'openalgo-settings-panel hidden';
  
  // Make sure settings panel receives all mouse events
  settingsPanel.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  
  // Load settings from storage (including migration from old format)
  chrome.storage.sync.get(['hostUrl', 'apiKey', 'symbol', 'quantity', 'symbol1', 'symbol2', 'quantity1', 'quantity2', 'exchange', 'product', 'enabled2'], function(settings) {
    // Migration: if old format exists, migrate to new format
    if (settings.symbol && !settings.symbol1) {
      settings.symbol1 = settings.symbol;
      settings.quantity1 = settings.quantity;
      chrome.storage.sync.set({ symbol1: settings.symbol, quantity1: settings.quantity });
    }

    // Default enabled state for Symbol 2
    if (settings.enabled2 === undefined) settings.enabled2 = false;

    settingsPanel.innerHTML = `
      <div class="card-body p-3">
        <h3 class="card-title text-xs">Settings</h3>
        <div class="settings-form">
          <div class="form-group">
            <label for="hostUrl">Host URL</label>
            <input type="text" id="hostUrl" value="${settings.hostUrl || 'http://127.0.0.1:5000'}" class="input input-bordered input-xs" placeholder="Host URL">
          </div>
          <div class="form-group">
            <label for="apiKey">API Key</label>
            <input type="text" id="apiKey" value="${settings.apiKey || ''}" class="input input-bordered input-xs" placeholder="API Key">
          </div>
          <div class="form-group">
            <label for="exchange">Exchange</label>
            <select id="exchange" class="select select-bordered select-xs">
              <option value="NSE" ${settings.exchange === 'NSE' ? 'selected' : ''}>NSE</option>
              <option value="BSE" ${settings.exchange === 'BSE' ? 'selected' : ''}>BSE</option>
              <option value="BFO" ${settings.exchange === 'BFO' ? 'selected' : ''}>BFO</option>
              <option value="NFO" ${settings.exchange === 'NFO' ? 'selected' : ''}>NFO</option>
              <option value="MCX" ${settings.exchange === 'MCX' ? 'selected' : ''}>MCX</option>
              <option value="CDS" ${settings.exchange === 'CDS' ? 'selected' : ''}>CDS</option>
            </select>
          </div>
          <div class="form-group">
            <label for="product">Product</label>
            <select id="product" class="select select-bordered select-xs">
              <option value="MIS" ${settings.product === 'MIS' ? 'selected' : ''}>MIS</option>
              <option value="NRML" ${settings.product === 'NRML' ? 'selected' : ''}>NRML</option>
              <option value="CNC" ${settings.product === 'CNC' ? 'selected' : ''}>CNC</option>
            </select>
          </div>
          <hr class="settings-divider">
          <h4 class="settings-section-title">Symbol 1:</h4>
          <div class="form-group">
            <label for="symbol1">Symbol</label>
            <input type="text" id="symbol1" value="${settings.symbol1 || ''}" class="input input-bordered input-xs" placeholder="Symbol">
          </div>
          <div class="form-group">
            <label for="quantity1">Quantity</label>
            <input type="number" id="quantity1" value="${settings.quantity1 || ''}" class="input input-bordered input-xs" placeholder="Quantity">
          </div>
          <hr class="settings-divider">
          <div class="symbol-header">
            <h4 class="settings-section-title">Symbol 2:</h4>
            <label class="checkbox-label">
              <input type="checkbox" id="enabled2" ${settings.enabled2 ? 'checked' : ''} class="checkbox-input">
              <span class="checkbox-text">Enable</span>
            </label>
          </div>
          <div class="form-group">
            <label for="symbol2">Symbol</label>
            <input type="text" id="symbol2" value="${settings.symbol2 || ''}" class="input input-bordered input-xs" placeholder="Symbol">
          </div>
          <div class="form-group">
            <label for="quantity2">Quantity</label>
            <input type="number" id="quantity2" value="${settings.quantity2 || ''}" class="input input-bordered input-xs" placeholder="Quantity">
          </div>
          <button id="saveSettings" class="btn btn-primary btn-xs w-full mt-2">Save</button>
        </div>
      </div>
    `;
    
    // Attach event listeners to all inputs to stop propagation
    const inputs = settingsPanel.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      input.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // Add uppercase conversion for symbol inputs
    const symbol1Input = settingsPanel.querySelector('#symbol1');
    const symbol2Input = settingsPanel.querySelector('#symbol2');

    if (symbol1Input) {
      symbol1Input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    }

    if (symbol2Input) {
      symbol2Input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    }
    
    // Save settings button handler
    settingsPanel.querySelector('#saveSettings').addEventListener('click', function(e) {
      e.stopPropagation();

      const newSettings = {
        hostUrl: settingsPanel.querySelector('#hostUrl').value,
        apiKey: settingsPanel.querySelector('#apiKey').value,
        exchange: settingsPanel.querySelector('#exchange').value,
        product: settingsPanel.querySelector('#product').value,
        symbol1: settingsPanel.querySelector('#symbol1').value,
        quantity1: settingsPanel.querySelector('#quantity1').value,
        symbol2: settingsPanel.querySelector('#symbol2').value,
        quantity2: settingsPanel.querySelector('#quantity2').value,
        enabled2: settingsPanel.querySelector('#enabled2').checked
      };

      chrome.storage.sync.set(newSettings, function() {
        showNotification('Settings saved successfully!', 'success');
        // Update button visibility
        updateButtonVisibility();
        toggleSettings();
      });
    });
  });
  
  container.appendChild(settingsPanel);

  // Update button visibility based on enabled state on initial load
  updateButtonVisibility();

  // Position the container differently on the OpenAlgo dashboard
  if (isOpenAlgoDashboard) {
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.left = 'auto';
    
    // Wait for the dashboard to fully load before adding
    setTimeout(() => {
      document.body.appendChild(container);
    }, 1000);
  } else {
    // Default position for other sites
    container.style.top = '100px';
    container.style.left = '20px';
    document.body.appendChild(container);
  }
}

// Toggle settings panel
function toggleSettings() {
  const settingsPanel = document.getElementById('openalgo-settings-panel');
  settingsPanel.classList.toggle('hidden');
}

// Update button visibility based on enabled state
function updateButtonVisibility() {
  chrome.storage.sync.get(['enabled2'], function(settings) {
    const enabled2 = settings.enabled2 !== undefined ? settings.enabled2 : false;

    // Get all button rows
    const buttonRows = document.querySelectorAll('.openalgo-buttons-row');

    // Row 1 (Symbol 1) is always visible
    if (buttonRows.length >= 1) {
      buttonRows[0].style.display = 'flex';
    }

    // Row 2 (Symbol 2) visibility controlled by enabled2
    if (buttonRows.length >= 2) {
      buttonRows[1].style.display = enabled2 ? 'flex' : 'none';
    }
  });
}

// Make an element draggable
function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;
  
  element.style.position = 'fixed';
  element.style.zIndex = '10000';
  
  // Add handle for dragging
  const handle = document.createElement('div');
  handle.className = 'openalgo-drag-handle';
  element.appendChild(handle);
  
  element.addEventListener('mousedown', startDrag);
  
  function startDrag(e) {
    // Don't start dragging if clicked on a form element or the settings panel
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'SELECT' || 
        e.target.tagName === 'BUTTON' || 
        e.target.closest('#openalgo-settings-panel')) {
      return;
    }
    
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Prevent text selection during drag
    e.preventDefault();
  }
  
  function drag(e) {
    if (isDragging) {
      element.style.left = (e.clientX - offsetX) + 'px';
      element.style.top = (e.clientY - offsetY) + 'px';
    }
  }
  
  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  }
}

// Handle button clicks and API calls
function handleButtonClick(action, symbolNum) {
  chrome.storage.sync.get(['hostUrl', 'apiKey', 'exchange', 'product', 'symbol1', 'quantity1', 'symbol2', 'quantity2', 'enabled2'], function(settings) {
    // Check if symbol 2 is enabled (symbol 1 is always enabled)
    if (symbolNum === 2) {
      const enabled2 = settings.enabled2;
      if (!enabled2) {
        showNotification('Error: Symbol 2 is disabled!', 'error');
        return;
      }
    }

    // Get symbol-specific settings
    const symbol = settings[`symbol${symbolNum}`];
    const quantity = settings[`quantity${symbolNum}`];

    // Validate common settings
    if (!settings.hostUrl || !settings.apiKey || !settings.exchange || !settings.product) {
      showNotification('Error: Please complete common settings first!', 'error');
      toggleSettings();
      return;
    }

    // Validate symbol-specific settings
    if (!symbol || !quantity) {
      showNotification(`Error: Please configure Symbol ${symbolNum} settings!`, 'error');
      toggleSettings();
      return;
    }

    // Create settings object with symbol-specific values
    const tradeSettings = {
      hostUrl: settings.hostUrl,
      apiKey: settings.apiKey,
      exchange: settings.exchange,
      product: settings.product,
      symbol: symbol,
      quantity: quantity
    };

    switch (action) {
      case 'longEntry':
        placeOrder('BUY', tradeSettings);
        break;
      case 'longExit':
        placeSmartOrder('BUY', tradeSettings);
        break;
      case 'shortEntry':
        placeOrder('SELL', tradeSettings);
        break;
      case 'shortExit':
        placeSmartOrder('SELL', tradeSettings);
        break;
    }
  });
}

// Place a regular order (LE or SE)
function placeOrder(action, settings) {
  const url = `${settings.hostUrl}/api/v1/placeorder`;
  
  const data = {
    apikey: settings.apiKey,
    strategy: "Chrome",
    symbol: settings.symbol,
    action: action,
    exchange: settings.exchange,
    pricetype: "MARKET",
    product: settings.product,
    quantity: settings.quantity
  };
  
  makeApiCall(url, data, action === 'BUY' ? 'Long Entry' : 'Short Entry');
}

// Place a smart order (LX or SX)
function placeSmartOrder(action, settings) {
  const url = `${settings.hostUrl}/api/v1/placesmartorder`;
  
  const data = {
    apikey: settings.apiKey,
    strategy: "chrome",
    exchange: settings.exchange,
    symbol: settings.symbol,
    action: action,
    product: settings.product,
    pricetype: "MARKET",
    quantity: "0",
    position_size: "0"
  };
  
  makeApiCall(url, data, action === 'BUY' ? 'Long Exit' : 'Short Exit');
}

// Make API call to OpenAlgo
// Make API call to OpenAlgo via background script (bypasses CORS)
function makeApiCall(url, data, actionText) {
  // Show loading indicator
  const loadingNotification = showNotification(`Processing ${actionText}...`, 'info', true);

  // Send message to background script to make the API call
  chrome.runtime.sendMessage({
    action: 'placeOrder',
    url: url,
    orderData: data
  }, (response) => {
    // Remove loading notification
    if (loadingNotification) {
      loadingNotification.remove();
    }
    
    // Check if there was an error in the message passing
    if (chrome.runtime.lastError) {
      showNotification(`Connection Error: ${chrome.runtime.lastError.message}`, 'error');
      return;
    }
    
    // Handle the response from background script
    if (response && response.success) {
      const responseData = response.data;
      if (responseData.status === 'success') {
        showNotification(`${actionText} successful!`, 'success');
      } else {
        showNotification(`Error: ${responseData.message || 'Unknown error'}`, 'error');
      }
    } else {
      const errorMsg = response && response.error ? response.error : 'Unknown error occurred';
      showNotification(`API Error: ${errorMsg}`, 'error');
    }
  });
}


// Show notification on the page
function showNotification(message, type, isPersistent = false) {
  const notification = document.createElement('div');
  notification.className = `openalgo-notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  if (!isPersistent) {
    setTimeout(() => {
      notification.classList.add('fadeOut');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
  
  return notification;
}

// Inject CSS for buttons
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Scope all styles to avoid affecting OpenAlgo dashboard */
    .openalgo-controls-container {
      display: flex;
      flex-direction: column;
      padding: 3px;
      background-color: rgba(255, 255, 255, 0.95);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      max-width: 200px;
      position: fixed;
      z-index: 10000;
      transition: box-shadow 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      font-size: 14px;
      line-height: 1.4;
      box-sizing: border-box;
      color: #333333 !important;
    }
    
    .openalgo-controls-container *, .openalgo-controls-container *::before, .openalgo-controls-container *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    }
    
    .openalgo-controls-container:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    .openalgo-buttons-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 2px;
    }

    .openalgo-buttons-row {
      display: flex;
      gap: 2px;
      align-items: center;
      justify-content: flex-start;
    }
    
    .openalgo-drag-handle {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: #d1d5db;
      border-radius: 3px 3px 0 0;
      cursor: move;
    }
    
    .openalgo-drag-handle:hover {
      background-color: #9ca3af;
    }
    
    .openalgo-button {
      font-weight: bold !important;
      min-width: 28px;
      cursor: pointer;
      border: none;
      padding: 3px 6px;
      border-radius: 3px;
      color: white !important;
      text-transform: uppercase;
      font-size: 0.7rem !important;
      transition: all 0.15s ease;
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    .openalgo-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }
    
    .openalgo-button.btn-success {
      background-color: #36D399 !important;
      color: white !important;
    }
    
    .openalgo-button.btn-warning {
      background-color: #FBBD23 !important;
      color: #1f2937 !important;
    }
    
    .openalgo-button.btn-error {
      background-color: #F87272 !important;
      color: white !important;
    }
    
    .openalgo-button.btn-info {
      background-color: #3ABFF8 !important;
      color: white !important;
    }
    
    .openalgo-settings-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background: #f2f2f2 !important;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      cursor: pointer;
      color: #1f2937 !important;
      transition: all 0.2s ease;
      margin-left: 2px;
    }
    
    .openalgo-settings-icon:hover {
      background-color: #e5e7eb !important;
    }
    
    .openalgo-settings-panel {
      position: absolute;
      top: 100%;
      right: 0;
      width: 250px;
      background-color: white !important;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      margin-top: 4px;
      z-index: 10001;
      animation: slideDown 0.2s ease;
      pointer-events: auto;
      color: #333333 !important;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .openalgo-settings-panel.hidden {
      display: none;
    }
    
    .openalgo-controls-container .settings-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .openalgo-controls-container .form-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .openalgo-controls-container .form-group label {
      font-size: 0.7rem !important;
      color: #374151 !important;
      font-weight: 600 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    .openalgo-controls-container .form-group input,
    .openalgo-controls-container .form-group select {
      padding: 3px 6px;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      font-size: 0.75rem !important;
      transition: all 0.2s ease;
      background-color: white !important;
      z-index: 10002;
      position: relative;
      width: 100%;
      height: auto;
      color: #333333 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .openalgo-controls-container #symbol1,
    .openalgo-controls-container #symbol2 {
      text-transform: uppercase;
    }
    
    .openalgo-controls-container .form-group input:focus, 
    .openalgo-controls-container .form-group select:focus {
      outline: none;
      border-color: #570df8;
      box-shadow: 0 0 0 1px rgba(87, 13, 248, 0.2);
    }
    
    .openalgo-controls-container .btn {
      display: inline-flex;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-radius: 3px;
      font-weight: 600 !important;
      text-transform: uppercase;
      border: none;
    }
    
    .openalgo-controls-container .btn-primary {
      background-color: #570df8 !important;
      color: white !important;
    }
    
    .openalgo-controls-container .btn-primary:hover {
      background-color: #4506cb !important;
    }
    
    .openalgo-controls-container .btn-xs {
      height: 1.5rem;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      font-size: 0.7rem !important;
    }
    
    .openalgo-controls-container .w-full {
      width: 100%;
    }
    
    .openalgo-controls-container .mt-2 {
      margin-top: 0.5rem;
    }
    
    .openalgo-controls-container .card-body {
      padding: 0.5rem;
    }
    
    .openalgo-controls-container .p-3 {
      padding: 0.75rem;
    }
    
    .openalgo-controls-container .text-xs {
      font-size: 0.7rem !important;
    }
    
    .openalgo-controls-container .input-xs, 
    .openalgo-controls-container .select-xs {
      height: 1.5rem;
      font-size: 0.7rem !important;
      padding: 0 0.5rem;
    }
    
    .openalgo-controls-container .input-bordered, 
    .openalgo-controls-container .select-bordered {
      border: 1px solid #d1d5db;
    }
    
    .openalgo-controls-container .card-title {
      margin-bottom: 0.5rem;
      font-weight: 700 !important;
      color: #374151 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .openalgo-controls-container .settings-divider {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 12px 0;
    }

    .openalgo-controls-container .settings-section-title {
      font-size: 0.7rem !important;
      font-weight: 600 !important;
      color: #570df8 !important;
      margin: 0 0 6px 0;
      opacity: 1 !important;
      visibility: visible !important;
      text-decoration: underline;
    }

    .openalgo-controls-container .symbol-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .openalgo-controls-container .symbol-header .settings-section-title {
      margin-bottom: 0;
    }

    .openalgo-controls-container .checkbox-label {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      font-size: 0.65rem !important;
    }

    .openalgo-controls-container .checkbox-input {
      width: 14px;
      height: 14px;
      cursor: pointer;
      accent-color: #570df8;
    }

    .openalgo-controls-container .checkbox-text {
      color: #374151 !important;
      font-weight: 500 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    .openalgo-controls-container .hidden {
      display: none;
    }
    
    .openalgo-notification {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      padding: 0.5rem 0.75rem;
      border-radius: 3px;
      color: white !important;
      font-weight: bold !important;
      z-index: 10001;
      opacity: 1 !important;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-width: 250px;
      font-size: 0.8rem !important;
      animation: slideIn 0.2s ease;
      visibility: visible !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .openalgo-notification.success {
      background-color: #36D399 !important;
      border-left: 3px solid #2bb37f;
    }
    
    .openalgo-notification.error {
      background-color: #F87272 !important;
      border-left: 3px solid #e75757;
    }
    
    .openalgo-notification.info {
      background-color: #3ABFF8 !important;
      border-left: 3px solid #0d99ff;
    }
    
    .openalgo-notification.fadeOut {
      opacity: 0;
      transform: translateX(10px);
    }
  `;
  
  document.head.appendChild(style);
}

// Inject styles on content script load
injectStyles();
