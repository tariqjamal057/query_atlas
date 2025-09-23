// Environment detection and API configuration
function getApiBase() {
  // First check if user has manually configured an override
  return new Promise(async (resolve) => {
    const result = await chrome.storage.local.get(['apiBaseOverride']);
    
    if (result.apiBaseOverride) {
      resolve(result.apiBaseOverride);
      return;
    }
    
    // Always use production API - you can override in options if needed
    resolve('https://ury-ats-rndmurlSha20077xh72nsshnz8-007.replit.app/api');
  });
}

// Authentication state
let currentUser = null;
let API_BASE = '';

// DOM elements
const statusDiv = document.getElementById('status');
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const signInBtn = document.getElementById('signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const userInfo = document.getElementById('user-info');
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
  API_BASE = await getApiBase();
  await checkAuthStatus();
  await loadStats();
  await detectCurrentPage();
});

// Check authentication status
async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get(['authToken', 'tokenExpiry']);
    
    if (result.authToken && result.tokenExpiry && Date.now() < result.tokenExpiry) {
      // Token exists and is valid, verify with server
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${result.authToken}`
          }
        });
        
        if (response.ok) {
          currentUser = await response.json();
          showAuthenticated();
          return;
        }
      } catch (error) {
        console.log('Token validation failed:', error);
      }
    }
    
    // No valid token, show sign-in
    showSignIn();
  } catch (error) {
    console.error('Auth check failed:', error);
    showSignIn();
  }
}

// Show authenticated state
function showAuthenticated() {
  authSection.style.display = 'none';
  mainSection.style.display = 'block';
  
  if (currentUser) {
    userInfo.innerHTML = `
      <div class="user-avatar">
        <img src="${currentUser.avatar_url || 'icon16.png'}" width="24" height="24" style="border-radius: 50%;" />
        <span>${currentUser.name || currentUser.email}</span>
      </div>
    `;
    userInfo.style.display = 'block';
  }
}

// Show sign-in state
function showSignIn() {
  authSection.style.display = 'block';
  mainSection.style.display = 'none';
  userInfo.style.display = 'none';
  currentUser = null;
}

// Sign in with Google
signInBtn.addEventListener('click', async () => {
  try {
    signInBtn.disabled = true;
    signInBtn.textContent = 'Signing in...';
    
    // Use extension callback approach
    const extensionCallbackUrl = chrome.runtime.getURL('oauth-callback.html');
    const authUrl = `${API_BASE}/auth/google/start?extension_redirect=${encodeURIComponent(extensionCallbackUrl)}`;
    
    // Create a popup window for OAuth
    const popup = await chrome.windows.create({
      url: authUrl,
      type: 'popup',
      width: 500,
      height: 600,
      focused: true
    });
    
    // Check for authentication completion
    const checkForAuth = async () => {
      try {
        const result = await chrome.storage.local.get(['authToken', 'tokenExpiry']);
        if (result.authToken && result.tokenExpiry && Date.now() < result.tokenExpiry) {
          // Authentication successful
          await checkAuthStatus();
          showStatus('Successfully signed in!', 'success');
          
          // Close popup if still open
          try {
            await chrome.windows.remove(popup.id);
          } catch (e) {
            // Popup already closed
          }
          
          return true;
        }
        return false;
      } catch (error) {
        console.log('Auth check error:', error);
        return false;
      }
    };
    
    // Poll for authentication every 1 second
    const interval = setInterval(async () => {
      try {
        const authenticated = await checkForAuth();
        if (authenticated) {
          clearInterval(interval);
        } else {
          // Check if popup was closed
          try {
            await chrome.windows.get(popup.id);
          } catch (error) {
            // Popup was closed without authentication
            clearInterval(interval);
            showStatus('Authentication was cancelled', 'error');
          }
        }
      } catch (error) {
        console.log('Auth polling error:', error);
        clearInterval(interval);
        showStatus('Authentication error occurred', 'error');
      }
    }, 1000);
    
    // Also check when popup is removed
    const onWindowRemoved = async (windowId) => {
      if (windowId === popup.id) {
        clearInterval(interval);
        chrome.windows.onRemoved.removeListener(onWindowRemoved);
        const authenticated = await checkForAuth();
        if (!authenticated) {
          showStatus('Authentication was cancelled', 'error');
        }
      }
    };
    chrome.windows.onRemoved.addListener(onWindowRemoved);
    
  } catch (error) {
    console.error('Sign in failed:', error);
    showStatus(`Sign in failed: ${error.message}`, 'error');
  } finally {
    signInBtn.disabled = false;
    signInBtn.textContent = 'Sign in with Google';
  }
});

// Sign out
signOutBtn.addEventListener('click', async () => {
  try {
    // Remove stored token
    await chrome.storage.local.remove(['authToken', 'tokenExpiry']);
    
    // Call logout endpoint
    if (currentUser) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await chrome.storage.local.get(['authToken'])).authToken}`
          }
        });
      } catch (error) {
        console.log('Logout endpoint call failed:', error);
      }
    }
    
    showSignIn();
    showStatus('Successfully signed out', 'info');
  } catch (error) {
    console.error('Sign out failed:', error);
    showStatus(`Sign out failed: ${error.message}`, 'error');
  }
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

// Submit search result (now requires authentication)
submitBtn.addEventListener('click', async () => {
  if (!currentUser) {
    showStatus('Please sign in to submit results', 'error');
    return;
  }
  
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
    
    // Get stored auth token
    const result = await chrome.storage.local.get(['authToken']);
    if (!result.authToken) {
      showStatus('Please sign in again', 'error');
      showSignIn();
      return;
    }
    
    const response = await fetch(`${API_BASE}/search-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.authToken}`
      },
      body: JSON.stringify({
        query,
        publicLink,
        platform,
        description: description || undefined,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        showStatus('Authentication expired. Please sign in again.', 'error');
        await chrome.storage.local.remove(['authToken', 'tokenExpiry']);
        showSignIn();
        return;
      }
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
  if (!currentUser) {
    showStatus('Please sign in to use auto-capture', 'error');
    return;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Auto-capture clicked for tab:', tab.url);
    
    autoCaptureBtn.disabled = true;
    autoCaptureBtn.textContent = 'Capturing...';
    
    // Check if this is a supported platform
    const url = new URL(tab.url);
    const supportedDomains = ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'chat.deepseek.com'];
    const isSupported = supportedDomains.some(domain => url.hostname.includes(domain));
    
    if (!isSupported) {
      showStatus(`Platform ${url.hostname} is not supported. Please use ChatGPT, Claude, Gemini, or DeepSeek.`, 'error');
      return;
    }
    
    // Try to inject content script first (in case it's not loaded)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('Content script injected successfully');
      
      // Wait a moment for content script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (injectionError) {
      console.log('Content script injection failed (might already be loaded):', injectionError);
    }
    
    // Send message to content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'autoCapture' });
      console.log('Content script response:', response);
      
      if (response && response.success) {
        // Fill form with captured data
        if (response.data.query) queryInput.value = response.data.query;
        if (response.data.publicLink) publicLinkInput.value = response.data.publicLink;
        if (response.data.description) descriptionInput.value = response.data.description;
        
        showStatus('Page data captured! Review and submit.', 'success');
      } else {
        const errorMsg = response?.error || 'Unknown error occurred';
        showStatus(`Capture failed: ${errorMsg}`, 'error');
        console.error('Auto-capture failed:', response);
      }
    } catch (messageError) {
      console.error('Message sending failed:', messageError);
      showStatus('Could not communicate with page. Please refresh the page and try again.', 'error');
    }
    
  } catch (error) {
    console.error('Auto-capture error:', error);
    showStatus(`Failed to capture: ${error.message}`, 'error');
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