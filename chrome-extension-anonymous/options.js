// DOM elements
const apiBaseInput = document.getElementById('api-base');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const statusDiv = document.getElementById('status');

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.local.get(['apiBaseOverride']);
    if (result.apiBaseOverride) {
      apiBaseInput.value = result.apiBaseOverride;
    }
  } catch (error) {
    showStatus('Failed to load settings', 'error');
  }
});

// Save settings
saveBtn.addEventListener('click', async () => {
  try {
    const apiBase = apiBaseInput.value.trim();
    
    if (apiBase) {
      // Validate URL format
      try {
        new URL(apiBase);
      } catch (error) {
        showStatus('Please enter a valid URL', 'error');
        return;
      }
      
      // Ensure it ends with /api
      if (!apiBase.endsWith('/api')) {
        showStatus('API base URL should end with /api', 'error');
        return;
      }
      
      await chrome.storage.local.set({ apiBaseOverride: apiBase });
      showStatus('Settings saved successfully! Restart the extension to apply changes.', 'success');
    } else {
      await chrome.storage.local.remove(['apiBaseOverride']);
      showStatus('Settings cleared. Extension will auto-detect the API endpoint.', 'success');
    }
  } catch (error) {
    showStatus('Failed to save settings', 'error');
  }
});

// Reset settings
resetBtn.addEventListener('click', async () => {
  try {
    await chrome.storage.local.remove(['apiBaseOverride']);
    apiBaseInput.value = '';
    showStatus('Settings reset to auto-detect mode', 'success');
  } catch (error) {
    showStatus('Failed to reset settings', 'error');
  }
});

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}