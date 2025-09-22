// Background service worker for LLM Archive extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('LLM Archive extension installed');
    
    // Initialize storage
    await chrome.storage.local.set({
      capturedCount: 0,
      sessionCount: 0,
      settings: {
        autoCapture: false,
        apiEndpoint: 'http://localhost:5000/api'
      }
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: 'http://localhost:5000'
    });
  }
});

// Listen for tab updates to detect LLM platforms
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const supportedDomains = [
      'chatgpt.com',
      'claude.ai', 
      'gemini.google.com',
      'chat.deepseek.com'
    ];
    
    const isLLMPlatform = supportedDomains.some(domain => 
      url.hostname.includes(domain)
    );
    
    if (isLLMPlatform) {
      // Update extension badge to show it's active on this page
      chrome.action.setBadgeText({
        tabId: tabId,
        text: '●'
      });
      
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#2563eb'
      });
      
      // Inject content script if not already injected
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).catch(() => {
        // Script might already be injected, ignore error
      });
    } else {
      // Clear badge for non-LLM pages
      chrome.action.setBadgeText({
        tabId: tabId,
        text: ''
      });
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'submitToArchive') {
    handleSubmitToArchive(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['settings'])
      .then(result => sendResponse({ settings: result.settings || {} }))
      .catch(error => sendResponse({ error: error.message }));
    
    return true;
  }
  
  if (request.action === 'updateSettings') {
    chrome.storage.local.set({ settings: request.settings })
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    
    return true;
  }
});

// Submit data to LLM Archive API
async function handleSubmitToArchive(data) {
  try {
    // Get API endpoint from settings
    const result = await chrome.storage.local.get(['settings']);
    const apiEndpoint = result.settings?.apiEndpoint || 'http://localhost:5000/api';
    
    const response = await fetch(`${apiEndpoint}/search-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit to archive');
    }
    
    const result_data = await response.json();
    
    // Update statistics
    const stats = await chrome.storage.local.get(['capturedCount', 'sessionCount']);
    await chrome.storage.local.set({
      capturedCount: (stats.capturedCount || 0) + 1,
      sessionCount: (stats.sessionCount || 0) + 1
    });
    
    return result_data;
    
  } catch (error) {
    console.error('Failed to submit to archive:', error);
    throw error;
  }
}

// Context menu for quick capture
chrome.contextMenus.create({
  id: 'capture-llm-result',
  title: 'Save to LLM Archive',
  contexts: ['page'],
  documentUrlPatterns: [
    'https://chatgpt.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://chat.deepseek.com/*'
  ]
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'capture-llm-result') {
    // Send message to content script to capture page data
    chrome.tabs.sendMessage(tab.id, { action: 'autoCapture' }, (response) => {
      if (response && response.success) {
        // Auto-submit the captured data
        handleSubmitToArchive(response.data)
          .then(() => {
            // Show success notification
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon48.png',
              title: 'LLM Archive',
              message: 'Successfully saved to archive!'
            });
          })
          .catch(error => {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon48.png',
              title: 'LLM Archive',
              message: `Failed to save: ${error.message}`
            });
          });
      }
    });
  }
});

// Reset session count daily
chrome.alarms.create('resetSessionCount', { 
  delayInMinutes: 1440, // 24 hours
  periodInMinutes: 1440 
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetSessionCount') {
    chrome.storage.local.set({ sessionCount: 0 });
  }
});
