// Anonymous version - no authentication required

// Simple API configuration
function getApiBase() {
  return new Promise(async (resolve) => {
    // Check if user has manually configured an override
    const result = await chrome.storage.local.get(['apiBaseOverride']);
    
    if (result.apiBaseOverride) {
      resolve(result.apiBaseOverride);
      return;
    }
    
    // Default to production API, can be overridden in options
    resolve('https://ury-ats-rndmurlSha20077xh72nsshnz8-007.replit.app/api');
  });
}

let API_BASE = '';

// DOM elements
const statusDiv = document.getElementById('status');
const mainSection = document.getElementById('main-section');
const queryInput = document.getElementById('query');
const autoShareCheckbox = document.getElementById('autoShare');
const publicLinkInput = document.getElementById('publicLink');
const platformSelect = document.getElementById('platform');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submit-btn');
const autoCaptureBtn = document.getElementById('auto-capture-btn');
const capturedCountSpan = document.getElementById('captured-count');
const sessionCountSpan = document.getElementById('session-count');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  API_BASE = await getApiBase();
  
  // Always show main section (no authentication required)
  mainSection.style.display = 'block';
  
  // Hide auth-related elements if they exist
  const authSection = document.getElementById('auth-section');
  const userInfo = document.getElementById('user-info');
  if (authSection) authSection.style.display = 'none';
  if (userInfo) userInfo.style.display = 'none';
  
  await loadStats();
  await detectCurrentPage();
});

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Load stats from server
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    if (response.ok) {
      const stats = await response.json();
      updateStats(stats);
    }
  } catch (error) {
    console.log('Failed to load stats:', error);
  }
}

// Update stats display
function updateStats(stats = null) {
  if (stats) {
    if (capturedCountSpan) {
      capturedCountSpan.textContent = stats.totalResults || 0;
    }
  }
  
  // Update session count from storage
  chrome.storage.local.get(['sessionSubmissions'], (result) => {
    if (sessionCountSpan) {
      sessionCountSpan.textContent = result.sessionSubmissions || 0;
    }
  });
}

// Detect current page and auto-fill form
async function detectCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    const url = tab.url;
    let platform = 'ChatGPT'; // default
    
    if (url.includes('chatgpt.com')) {
      platform = 'ChatGPT';
    } else if (url.includes('claude.ai')) {
      platform = 'Claude';
    } else if (url.includes('gemini.google.com')) {
      platform = 'Gemini';
    } else if (url.includes('chat.deepseek.com')) {
      platform = 'DeepSeek';
    }
    
    platformSelect.value = platform;
    
    // Try to auto-fill the link if it's a supported platform
    if (platform && url.includes('http')) {
      publicLinkInput.value = url;
    }
  } catch (error) {
    console.log('Failed to detect current page:', error);
  }
}

// Auto-capture functionality
autoCaptureBtn?.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showStatus('Please navigate to a supported LLM platform', 'error');
      return;
    }
    
    // Check if it's a supported platform
    const url = tab.url;
    const supportedPlatforms = ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'chat.deepseek.com'];
    const isSupported = supportedPlatforms.some(platform => url.includes(platform));
    
    if (!isSupported) {
      showStatus('Auto-capture only works on ChatGPT, Claude, Gemini, and DeepSeek', 'error');
      return;
    }
    
    autoCaptureBtn.disabled = true;
    autoCaptureBtn.textContent = 'Capturing...';
    
    try {
      // Inject content script to extract data
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractSearchData
      });
      
      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        
        // Fill form with extracted data
        if (data.query) queryInput.value = data.query;
        if (data.platform) platformSelect.value = data.platform;
        publicLinkInput.value = url;
        
        showStatus('Successfully captured search data!', 'success');
      } else {
        showStatus('Could not extract search data from this page', 'error');
      }
    } catch (error) {
      console.error('Auto-capture failed:', error);
      showStatus('Auto-capture failed. Please fill the form manually.', 'error');
    }
  } catch (error) {
    console.error('Auto-capture error:', error);
    showStatus('Auto-capture failed. Please try again.', 'error');
  } finally {
    autoCaptureBtn.disabled = false;
    autoCaptureBtn.textContent = '🚀 Auto-Capture';
  }
});

// Content script function to extract search data
function extractSearchData() {
  const url = window.location.href;
  let platform = 'ChatGPT';
  let query = '';
  
  if (url.includes('chatgpt.com')) {
    platform = 'ChatGPT';
    // Try to find the conversation title or latest message
    const titleEl = document.querySelector('h1') || document.querySelector('[data-testid="conversation-header"]');
    if (titleEl) {
      query = titleEl.textContent.trim();
    }
  } else if (url.includes('claude.ai')) {
    platform = 'Claude';
    // Try to find conversation title
    const titleEl = document.querySelector('.conversation-title, .chat-title, h1');
    if (titleEl) {
      query = titleEl.textContent.trim();
    }
  } else if (url.includes('gemini.google.com')) {
    platform = 'Gemini';
    // Try to find the query in Gemini
    const queryEl = document.querySelector('.query-text, .user-message, .prompt-text');
    if (queryEl) {
      query = queryEl.textContent.trim();
    }
  } else if (url.includes('chat.deepseek.com')) {
    platform = 'DeepSeek';
    // Try to find conversation title
    const titleEl = document.querySelector('.conversation-title, .chat-title');
    if (titleEl) {
      query = titleEl.textContent.trim();
    }
  }
  
  return {
    platform,
    query: query.substring(0, 200) // Limit query length
  };
}

// Submit form handler
submitBtn?.addEventListener('click', async () => {
  const query = queryInput.value.trim();
  const publicLink = publicLinkInput.value.trim();
  const platform = platformSelect.value;
  const description = descriptionInput.value.trim();
  
  if (!query || !publicLink) {
    showStatus('Please fill in both Query and Public Link fields', 'error');
    return;
  }
  
  // Basic URL validation
  try {
    new URL(publicLink);
  } catch {
    showStatus('Please enter a valid URL for the public link', 'error');
    return;
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Use anonymous endpoint (no authentication required)
    const response = await fetch(`${API_BASE}/search-results/anonymous`, {
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
    
    // Update session count
    const result = await chrome.storage.local.get(['sessionSubmissions']);
    const newCount = (result.sessionSubmissions || 0) + 1;
    await chrome.storage.local.set({ sessionSubmissions: newCount });
    
    // Update stats
    await loadStats();
    
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

// Auto-share checkbox handler
autoShareCheckbox?.addEventListener('change', async () => {
  if (!autoShareCheckbox.checked) return;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    
    // Check if this is Claude
    if (!url.hostname.includes('claude.ai')) {
      showStatus('Auto-share is only available for Claude.ai', 'error');
      autoShareCheckbox.checked = false;
      return;
    }
    
    showStatus('Triggering Claude publish...', 'info');
    
    // Try to inject content script first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.log('Content script already loaded');
    }
    
    // Send message to content script to publish
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'publishClaude' });
    
    if (response && response.success) {
      publicLinkInput.value = response.publicLink;
      showStatus('Public share link captured!', 'success');
    } else {
      showStatus(response?.error || 'Failed to publish conversation', 'error');
      autoShareCheckbox.checked = false;
    }
    
  } catch (error) {
    console.error('Auto-share error:', error);
    showStatus(`Failed to auto-share: ${error.message}`, 'error');
    autoShareCheckbox.checked = false;
  }
});

// Handle options page
document.getElementById('options-btn')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Platform detection and URL validation
publicLinkInput?.addEventListener('blur', () => {
  const url = publicLinkInput.value.trim();
  if (url) {
    try {
      const urlObj = new URL(url);
      
      // Auto-detect platform from URL
      if (urlObj.hostname.includes('chatgpt.com')) {
        platformSelect.value = 'ChatGPT';
      } else if (urlObj.hostname.includes('claude.ai')) {
        platformSelect.value = 'Claude';
      } else if (urlObj.hostname.includes('gemini.google.com')) {
        platformSelect.value = 'Gemini';
      } else if (urlObj.hostname.includes('chat.deepseek.com')) {
        platformSelect.value = 'DeepSeek';
      }
    } catch (error) {
      // Invalid URL, user will get validation error on submit
    }
  }
});