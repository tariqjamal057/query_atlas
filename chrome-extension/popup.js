// API endpoint - in production, this would be configurable
const API_BASE = 'http://localhost:5000/api';

// DOM elements
const statusDiv = document.getElementById('status');
const queryInput = document.getElementById('query');
const publicLinkInput = document.getElementById('publicLink');
const platformSelect = document.getElementById('platform');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submit-btn');
const autoCaptureBtn = document.getElementById('auto-capture-btn');
const capturedCountSpan = document.getElementById('captured-count');
const sessionCountSpan = document.getElementById('session-count');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await detectCurrentPage();
});

// Load statistics
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['capturedCount', 'sessionCount']);
    capturedCountSpan.textContent = result.capturedCount || 0;
    sessionCountSpan.textContent = result.sessionCount || 0;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Detect current page and auto-fill if it's an LLM platform
async function detectCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    
    // Detect platform from URL
    let platform = '';
    if (url.hostname.includes('chatgpt.com')) {
      platform = 'ChatGPT';
    } else if (url.hostname.includes('claude.ai')) {
      platform = 'Claude';
    } else if (url.hostname.includes('gemini.google.com')) {
      platform = 'Gemini';
    } else if (url.hostname.includes('chat.deepseek.com')) {
      platform = 'DeepSeek';
    }
    
    if (platform) {
      platformSelect.value = platform;
      showStatus(`Detected ${platform} page`, 'info');
      
      // Try to get page data from content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageData' });
        if (response && response.success) {
          if (response.data.query) queryInput.value = response.data.query;
          if (response.data.publicLink) publicLinkInput.value = response.data.publicLink;
        }
      } catch (error) {
        console.log('Could not get page data from content script');
      }
    }
  } catch (error) {
    console.error('Failed to detect current page:', error);
  }
}

// Submit search result
submitBtn.addEventListener('click', async () => {
  const query = queryInput.value.trim();
  const publicLink = publicLinkInput.value.trim();
  const platform = platformSelect.value || 'Other';
  const description = descriptionInput.value.trim();
  
  if (!query) {
    showStatus('Query is required', 'error');
    return;
  }
  
  if (!publicLink) {
    showStatus('Public link is required', 'error');
    return;
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    const response = await fetch(`${API_BASE}/search-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        publicLink,
        platform,
        description: description || undefined,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit');
    }
    
    showStatus('Successfully submitted to archive!', 'success');
    
    // Update stats
    await updateStats();
    
    // Clear form
    queryInput.value = '';
    publicLinkInput.value = '';
    descriptionInput.value = '';
    
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit to Archive';
  }
});

// Auto-capture current page
autoCaptureBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    autoCaptureBtn.disabled = true;
    autoCaptureBtn.textContent = 'Capturing...';
    
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'autoCapture' });
    
    if (response && response.success) {
      // Fill form with captured data
      if (response.data.query) queryInput.value = response.data.query;
      if (response.data.publicLink) publicLinkInput.value = response.data.publicLink;
      if (response.data.description) descriptionInput.value = response.data.description;
      
      showStatus('Page data captured! Review and submit.', 'success');
    } else {
      showStatus('Could not capture page data. This page may not be supported.', 'error');
    }
    
  } catch (error) {
    showStatus('Failed to capture page data', 'error');
  } finally {
    autoCaptureBtn.disabled = false;
    autoCaptureBtn.textContent = 'Auto-Capture Current Page';
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

// Update statistics
async function updateStats() {
  try {
    const result = await chrome.storage.local.get(['capturedCount', 'sessionCount']);
    const capturedCount = (result.capturedCount || 0) + 1;
    const sessionCount = (result.sessionCount || 0) + 1;
    
    await chrome.storage.local.set({ capturedCount, sessionCount });
    
    capturedCountSpan.textContent = capturedCount;
    sessionCountSpan.textContent = sessionCount;
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}
