// Content script for LLM platforms
console.log('LLM Archive content script loaded on:', window.location.hostname);

// Platform-specific selectors and extractors
const platformConfig = {
  'chatgpt.com': {
    querySelector: 'textarea[placeholder*="Message"], [data-testid="user-input"] textarea, textarea[data-id="root"]',
    shareButtonSelector: 'button[data-testid="share-button"], button:has(svg[data-icon="share"])',
    conversationSelector: '[data-testid="conversation-turn"], .group, [role="presentation"]',
    titleSelector: 'h1, [data-testid="conversation-title"], .text-lg',
    getShareUrl: () => {
      // For ChatGPT, return current URL if it's a conversation
      const url = window.location.href;
      if (url.includes('/c/') || url.includes('chatgpt.com/g/') || url.includes('chatgpt.com/?') || url.includes('chat')) {
        return url;
      }
      // If not a specific conversation, still return URL (user can create share link later)
      return url;
    }
  },
  'claude.ai': {
    querySelector: 'div[contenteditable="true"], textarea, [role="textbox"]',
    shareButtonSelector: 'button[aria-label*="Share"]',
    conversationSelector: '.message, [data-testid="user-message"], [data-testid="assistant-message"]',
    titleSelector: '.conversation-title, h1, h2',
    getShareUrl: () => {
      // Claude.ai - return current conversation URL
      return window.location.href;
    }
  },
  'gemini.google.com': {
    querySelector: 'div[contenteditable="true"], textarea, [role="textbox"]',
    shareButtonSelector: 'button[aria-label*="Share"]',
    conversationSelector: '.conversation-container, [data-test-id="message"]',
    titleSelector: '.conversation-title, h1',
    getShareUrl: () => {
      // Gemini - return current URL
      return window.location.href;
    }
  },
  'chat.deepseek.com': {
    querySelector: 'textarea, div[contenteditable="true"], [role="textbox"]',
    shareButtonSelector: 'button[title*="Share"]',
    conversationSelector: '.message, [data-testid="message"]',
    titleSelector: '.chat-title, h1, h2',
    getShareUrl: () => {
      // DeepSeek - return current URL
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
  
  // Try to get the last user input from various sources
  let query = '';
  
  // First try: Current input field
  const queryElements = document.querySelectorAll(config.querySelector);
  if (queryElements.length > 0) {
    const lastInput = queryElements[queryElements.length - 1];
    query = lastInput.value || lastInput.textContent || lastInput.innerText;
    if (query && query.trim()) {
      return query.trim();
    }
  }
  
  // Second try: Look for user messages in conversation
  const conversationElements = document.querySelectorAll(config.conversationSelector);
  if (conversationElements.length > 0) {
    // Find the last user message (usually odd-numbered or has specific class)
    for (let i = conversationElements.length - 1; i >= 0; i--) {
      const element = conversationElements[i];
      const text = element.textContent || element.innerText;
      
      // Skip very short messages and look for substantive queries
      if (text && text.trim().length > 10) {
        return text.trim().substring(0, 200); // Limit to reasonable length
      }
    }
  }
  
  // Third try: Any textarea or contenteditable element
  const fallbackElements = document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]');
  for (const element of fallbackElements) {
    const text = element.value || element.textContent || element.innerText;
    if (text && text.trim().length > 5) {
      return text.trim();
    }
  }
  
  return null;
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
  console.log('Content script received message:', request.action);
  
  if (request.action === 'getPageData') {
    try {
      const query = extractQuery() || extractTitle();
      const shareUrl = getShareUrl();
      const description = extractConversationSummary();
      const platformName = getPlatformName();
      
      console.log('getPageData extracted:', { query, shareUrl, description, platformName });
      
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
      console.error('getPageData error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'autoCapture') {
    try {
      console.log('Starting autoCapture...');
      const platformConfig = getCurrentPlatformConfig();
      console.log('Platform config:', platformConfig);
      
      const query = extractQuery() || extractTitle();
      const shareUrl = getShareUrl();
      const description = extractConversationSummary();
      const platformName = getPlatformName();
      
      console.log('Extracted data:', { query, shareUrl, description, platformName });
      
      if (!query) {
        console.log('No query found, available elements:', document.querySelectorAll('textarea, [contenteditable="true"]').length);
        sendResponse({
          success: false,
          error: 'No query found on page. Make sure you have entered a question or have a conversation started.'
        });
        return;
      }
      
      if (!shareUrl) {
        console.log('No share URL found, current URL:', window.location.href);
        sendResponse({
          success: false,
          error: 'No public share link available. For ChatGPT, please create a share link first. For other platforms, the current page URL will be used.'
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
      console.error('autoCapture error:', error);
      sendResponse({
        success: false,
        error: `Failed to capture: ${error.message}`
      });
    }
    
    return true;
  }
  
  if (request.action === 'publishClaude') {
    (async () => {
      try {
        console.log('Starting Claude publish automation...');
        
        // Check if we're on Claude.ai
        if (!window.location.hostname.includes('claude.ai')) {
          sendResponse({
            success: false,
            error: 'Not on Claude.ai'
          });
          return;
        }
        
        // Find the Publish button - try multiple selectors
        const publishButtonSelectors = [
          'button[aria-label*="Publish"]',
          'button:has-text("Publish")',
          'button[title*="Publish"]',
          '[data-testid*="publish"]',
          'button:contains("Publish")'
        ];
        
        let publishButton = null;
        for (const selector of publishButtonSelectors) {
          try {
            publishButton = document.querySelector(selector);
            if (publishButton) break;
          } catch (e) {
            // Selector might not be valid, continue
          }
        }
        
        // Fallback: search all buttons for one containing "Publish"
        if (!publishButton) {
          const allButtons = document.querySelectorAll('button');
          for (const btn of allButtons) {
            const text = btn.textContent || btn.innerText || '';
            if (text.toLowerCase().includes('publish')) {
              publishButton = btn;
              break;
            }
          }
        }
        
        if (!publishButton) {
          sendResponse({
            success: false,
            error: 'Could not find Publish button. Make sure you have a conversation open.'
          });
          return;
        }
        
        console.log('Found publish button, clicking...');
        publishButton.click();
        
        // Wait for the publish dialog to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find "Publish and Copy link" button in the dialog
        let publishAndCopyButton = null;
        
        // Try to find the button with various selectors
        const copyLinkSelectors = [
          'button:has-text("Publish and Copy link")',
          'button[aria-label*="Copy"]',
          'button:contains("Copy link")',
          '[data-testid*="copy-link"]'
        ];
        
        for (const selector of copyLinkSelectors) {
          try {
            publishAndCopyButton = document.querySelector(selector);
            if (publishAndCopyButton) break;
          } catch (e) {
            // Continue
          }
        }
        
        // Fallback: search all buttons for one containing "Copy" or "link"
        if (!publishAndCopyButton) {
          const allButtons = document.querySelectorAll('button');
          for (const btn of allButtons) {
            const text = (btn.textContent || btn.innerText || '').toLowerCase();
            if (text.includes('copy') && text.includes('link')) {
              publishAndCopyButton = btn;
              break;
            }
          }
        }
        
        if (!publishAndCopyButton) {
          sendResponse({
            success: false,
            error: 'Publish dialog opened but could not find "Publish and Copy link" button. Please publish manually.'
          });
          return;
        }
        
        console.log('Found "Publish and Copy link" button, clicking...');
        publishAndCopyButton.click();
        
        // Wait for link to be copied
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to get the link from clipboard
        try {
          const clipboardText = await navigator.clipboard.readText();
          console.log('Got clipboard text:', clipboardText);
          
          if (clipboardText && clipboardText.includes('claude.ai')) {
            sendResponse({
              success: true,
              publicLink: clipboardText
            });
          } else {
            // Fallback: try to extract from the current page
            const linkInputs = document.querySelectorAll('input[type="text"], input[type="url"]');
            for (const input of linkInputs) {
              if (input.value && input.value.includes('claude.ai/share')) {
                sendResponse({
                  success: true,
                  publicLink: input.value
                });
                return;
              }
            }
            
            sendResponse({
              success: false,
              error: 'Link was copied but could not be read from clipboard. Please paste the link manually.'
            });
          }
        } catch (clipboardError) {
          console.error('Clipboard read error:', clipboardError);
          sendResponse({
            success: false,
            error: 'Link was copied but browser blocked clipboard access. Please paste the link manually (Ctrl+V or Cmd+V).'
          });
        }
        
      } catch (error) {
        console.error('Claude publish error:', error);
        sendResponse({
          success: false,
          error: `Failed to publish: ${error.message}`
        });
      }
    })();
    
    return true; // Keep message channel open for async response
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
