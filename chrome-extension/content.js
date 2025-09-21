// Content script for LLM platforms
console.log('LLM Archive content script loaded');

// Platform-specific selectors and extractors
const platformConfig = {
  'chatgpt.com': {
    querySelector: 'textarea[placeholder*="Message"], [data-testid="user-input"] textarea',
    shareButtonSelector: 'button[data-testid="share-button"], button:has(svg[data-icon="share"])',
    conversationSelector: '[data-testid="conversation-turn"]',
    titleSelector: 'h1, [data-testid="conversation-title"]',
    getShareUrl: () => {
      // ChatGPT specific logic to get or create share URL
      return window.location.href.includes('/c/') ? window.location.href : null;
    }
  },
  'claude.ai': {
    querySelector: 'div[contenteditable="true"]',
    shareButtonSelector: 'button[aria-label*="Share"]',
    conversationSelector: '.message',
    titleSelector: '.conversation-title',
    getShareUrl: () => {
      return window.location.href.includes('/chat/') ? window.location.href : null;
    }
  },
  'gemini.google.com': {
    querySelector: 'div[contenteditable="true"]',
    shareButtonSelector: 'button[aria-label*="Share"]',
    conversationSelector: '.conversation-container',
    titleSelector: '.conversation-title',
    getShareUrl: () => {
      return window.location.href;
    }
  },
  'chat.deepseek.com': {
    querySelector: 'textarea, div[contenteditable="true"]',
    shareButtonSelector: 'button[title*="Share"]',
    conversationSelector: '.message',
    titleSelector: '.chat-title',
    getShareUrl: () => {
      return window.location.href;
    }
  }
};

// Get current platform configuration
function getCurrentPlatformConfig() {
  const hostname = window.location.hostname;
  for (const [domain, config] of Object.entries(platformConfig)) {
    if (hostname.includes(domain)) {
      return config;
    }
  }
  return null;
}

// Get platform name in API-compatible format
function getPlatformName() {
  const hostname = window.location.hostname;
  if (hostname.includes('chatgpt.com')) return 'ChatGPT';
  if (hostname.includes('claude.ai')) return 'Claude';
  if (hostname.includes('gemini.google.com')) return 'Gemini';
  if (hostname.includes('chat.deepseek.com')) return 'DeepSeek';
  return 'Other';
}

// Extract query from the page
function extractQuery() {
  const config = getCurrentPlatformConfig();
  if (!config) return null;
  
  // Try to get the last user input
  const queryElements = document.querySelectorAll(config.querySelector);
  if (queryElements.length === 0) return null;
  
  // Get the last input element
  const lastInput = queryElements[queryElements.length - 1];
  const query = lastInput.value || lastInput.textContent || lastInput.innerText;
  
  return query.trim();
}

// Extract conversation title or generate from first message
function extractTitle() {
  const config = getCurrentPlatformConfig();
  if (!config) return null;
  
  // Try to get title from title selector
  const titleElement = document.querySelector(config.titleSelector);
  if (titleElement) {
    const title = titleElement.textContent || titleElement.innerText;
    if (title && title.trim() !== '') return title.trim();
  }
  
  // Fallback: get first user message from conversation
  const conversationElements = document.querySelectorAll(config.conversationSelector);
  if (conversationElements.length > 0) {
    const firstMessage = conversationElements[0];
    const text = firstMessage.textContent || firstMessage.innerText;
    if (text) {
      // Return first 100 characters as title
      return text.trim().substring(0, 100) + (text.length > 100 ? '...' : '');
    }
  }
  
  return null;
}

// Get share URL for the current conversation
function getShareUrl() {
  const config = getCurrentPlatformConfig();
  if (!config) return null;
  
  return config.getShareUrl();
}

// Extract conversation summary
function extractConversationSummary() {
  const config = getCurrentPlatformConfig();
  if (!config) return null;
  
  const conversationElements = document.querySelectorAll(config.conversationSelector);
  if (conversationElements.length === 0) return null;
  
  // Get first few messages to create a summary
  const messages = Array.from(conversationElements)
    .slice(0, 3) // First 3 messages
    .map(el => (el.textContent || el.innerText).trim())
    .filter(text => text.length > 0)
    .join(' ');
  
  if (messages.length > 200) {
    return messages.substring(0, 197) + '...';
  }
  
  return messages;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageData') {
    const query = extractQuery() || extractTitle();
    const shareUrl = getShareUrl();
    const description = extractConversationSummary();
    const platformName = getPlatformName();
    
    sendResponse({
      success: true,
      data: {
        query,
        publicLink: shareUrl, // Map shareUrl to publicLink for API compatibility
        description,
        platform: platformName
      }
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'autoCapture') {
    try {
      const query = extractQuery() || extractTitle();
      const shareUrl = getShareUrl();
      const description = extractConversationSummary();
      const platformName = getPlatformName();
      
      if (!query) {
        sendResponse({
          success: false,
          error: 'No query found on page'
        });
        return;
      }
      
      if (!shareUrl) {
        sendResponse({
          success: false,
          error: 'No public share link available. Please create a share link first.'
        });
        return;
      }
      
      sendResponse({
        success: true,
        data: {
          query,
          publicLink: shareUrl, // Map shareUrl to publicLink for API compatibility
          description,
          platform: platformName
        }
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
    
    return true;
  }
});

// Auto-detect new conversations and offer to capture
function detectNewConversation() {
  const config = getCurrentPlatformConfig();
  if (!config) return;
  
  // Watch for URL changes (new conversations)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      
      // Wait a bit for page to load, then check if this is a conversation
      setTimeout(() => {
        const hasConversation = document.querySelector(config.conversationSelector);
        const hasQuery = extractQuery() || extractTitle();
        
        if (hasConversation && hasQuery) {
          // Show subtle notification that conversation can be captured
          showCaptureNotification();
        }
      }, 2000);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

// Show a subtle notification about capture capability
function showCaptureNotification() {
  // Only show if not already shown for this conversation
  const conversationId = window.location.pathname;
  const storageKey = `notification_shown_${conversationId}`;
  
  if (localStorage.getItem(storageKey)) return;
  
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2563eb;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Save to LLM Archive</span>
    </div>
  `;
  
  notification.addEventListener('click', () => {
    // Open extension popup would require different approach
    // For now, just remove the notification
    notification.remove();
  });
  
  document.body.appendChild(notification);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
  
  // Mark as shown
  localStorage.setItem(storageKey, 'true');
}

// Initialize content script
if (getCurrentPlatformConfig()) {
  detectNewConversation();
}
