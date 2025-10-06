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
        console.log('[Claude Publish] Starting automation...');
        
        // Check if we're on Claude.ai
        if (!window.location.hostname.includes('claude.ai')) {
          sendResponse({
            success: false,
            error: 'Not on Claude.ai. This feature only works on Claude conversations.'
          });
          return;
        }
        
        // Step 1: Find and click the Share/Publish button
        console.log('[Claude Publish] Step 1: Finding Share button...');
        const publishButton = await findPublishButton();
        
        if (!publishButton) {
          sendResponse({
            success: false,
            error: 'Claude.ai does not have a native share button for free users. Please manually copy the conversation URL, or use Claude Projects (Team/Enterprise only) for sharing. As an alternative, you can paste the conversation URL in the Public Share Link field.'
          });
          return;
        }
        
        console.log('[Claude Publish] Found Share button, clicking...');
        publishButton.click();
        
        // Step 2: Wait for dialog and select "Public Access"
        console.log('[Claude Publish] Step 2: Waiting for share dialog...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Find and click "Public Access" option
        console.log('[Claude Publish] Step 2a: Selecting Public Access...');
        const publicAccessButton = await findPublicAccessButton();
        
        if (!publicAccessButton) {
          console.warn('[Claude Publish] Could not find Public Access button, continuing...');
          // Don't fail here, as it might already be selected
        } else {
          console.log('[Claude Publish] Found Public Access button, clicking...');
          publicAccessButton.click();
          // Wait for the option to be selected
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Step 3: Find and click "Copy link" button
        console.log('[Claude Publish] Step 3: Finding Copy link button...');
        const copyLinkButton = await findCopyLinkButton();
        
        if (!copyLinkButton) {
          sendResponse({
            success: false,
            error: 'Share dialog opened but could not find "Copy link" button. Try sharing manually.'
          });
          return;
        }
        
        console.log('[Claude Publish] Found Copy link button, clicking...');
        
        // IMPORTANT: Focus the window first to enable clipboard access
        window.focus();
        document.body.focus();
        
        copyLinkButton.click();
        
        // Step 4: Wait longer for clipboard operation to complete
        console.log('[Claude Publish] Step 4: Waiting for clipboard...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 5: Try multiple methods to get the link
        console.log('[Claude Publish] Step 5: Attempting to get share link...');
        let publicLink = null;
        
        // Method 1: Try clipboard read (multiple attempts)
        for (let attempt = 1; attempt <= 3 && !publicLink; attempt++) {
          try {
            console.log(`[Claude Publish] Clipboard read attempt ${attempt}/3...`);
            const clipboardText = await navigator.clipboard.readText();
            console.log('[Claude Publish] Clipboard content:', clipboardText?.substring(0, 100));
            
            if (clipboardText && clipboardText.includes('claude.ai')) {
              publicLink = clipboardText.trim();
              console.log('[Claude Publish] ✓ Got link from clipboard');
              break;
            }
          } catch (clipboardError) {
            console.warn(`[Claude Publish] Clipboard read attempt ${attempt} failed:`, clipboardError.message);
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Method 2: Search for input fields with the share link
        if (!publicLink) {
          console.log('[Claude Publish] Method 2: Searching input fields...');
          const linkInputs = document.querySelectorAll('input[type="text"], input[type="url"], input[readonly], input[value*="claude.ai"]');
          for (const input of linkInputs) {
            const value = input.value || input.getAttribute('value') || '';
            if (value && value.includes('claude.ai/share')) {
              publicLink = value;
              console.log('[Claude Publish] ✓ Found share link in input:', publicLink.substring(0, 50));
              break;
            }
          }
        }
        
        // Method 3: Look for any text elements with share links
        if (!publicLink) {
          console.log('[Claude Publish] Method 3: Searching text elements...');
          const allText = document.body.innerText;
          const shareMatch = allText.match(/https:\/\/claude\.ai\/share\/[a-zA-Z0-9-]+/);
          if (shareMatch) {
            publicLink = shareMatch[0];
            console.log('[Claude Publish] ✓ Found share link in page text');
          }
        }
        
        // Method 4: Check for code/pre elements that might contain the link
        if (!publicLink) {
          console.log('[Claude Publish] Method 4: Checking code elements...');
          const codeElements = document.querySelectorAll('code, pre, span[class*="link"], div[class*="url"]');
          for (const el of codeElements) {
            const text = el.textContent || el.innerText || '';
            if (text.includes('claude.ai/share')) {
              const match = text.match(/https:\/\/claude\.ai\/share\/[a-zA-Z0-9-]+/);
              if (match) {
                publicLink = match[0];
                console.log('[Claude Publish] ✓ Found share link in code element');
                break;
              }
            }
          }
        }
        
        // Final check
        if (publicLink) {
          sendResponse({
            success: true,
            publicLink: publicLink
          });
        } else {
          sendResponse({
            success: false,
            error: 'Conversation published but could not capture the link automatically. Please copy the link manually and paste it into the Public Share Link field.'
          });
        }
        
      } catch (error) {
        console.error('[Claude Publish] Error:', error);
        sendResponse({
          success: false,
          error: `Automation failed: ${error.message}. Please try publishing manually.`
        });
      }
    })();
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'publishChatGPT') {
    (async () => {
      try {
        console.log('[ChatGPT Publish] Starting automation...');
        
        // Check if we're on ChatGPT
        if (!window.location.hostname.includes('chatgpt.com')) {
          sendResponse({
            success: false,
            error: 'Not on ChatGPT. This feature only works on ChatGPT conversations.'
          });
          return;
        }
        
        // Step 1: Find and click the Share button
        console.log('[ChatGPT Publish] Step 1: Finding Share button...');
        const shareButton = await findChatGPTShareButton();
        
        if (!shareButton) {
          sendResponse({
            success: false,
            error: 'Could not find Share button. Make sure you have a conversation started.'
          });
          return;
        }
        
        console.log('[ChatGPT Publish] Found Share button, clicking...');
        shareButton.click();
        
        // Step 2: Wait for dialog to appear and be fully loaded
        console.log('[ChatGPT Publish] Step 2: Waiting for share dialog to load...');
        
        // Wait for dialog/modal to appear (try multiple selectors)
        let dialogReady = false;
        for (let i = 0; i < 20; i++) { // Try for up to 4 seconds (20 * 200ms)
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const dialog = document.querySelector('[role="dialog"], [role="alertdialog"], .modal, [data-radix-popper-content-wrapper]');
          if (dialog && dialog.offsetParent !== null) { // Check if visible
            console.log('[ChatGPT Publish] ✓ Dialog appeared');
            dialogReady = true;
            break;
          }
        }
        
        if (!dialogReady) {
          console.log('[ChatGPT Publish] Warning: Dialog did not appear, continuing anyway...');
        }
        
        // Step 3: Wait for Create/Update link button to appear and be ready
        console.log('[ChatGPT Publish] Step 3: Waiting for Create/Update link button...');
        
        let createLinkButton = null;
        for (let i = 0; i < 15; i++) { // Try for up to 3 seconds (15 * 200ms)
          await new Promise(resolve => setTimeout(resolve, 200));
          
          createLinkButton = await findChatGPTCreateLinkButton();
          if (createLinkButton && createLinkButton.offsetParent !== null) { // Check if visible
            console.log('[ChatGPT Publish] ✓ Create/Update button found and visible');
            break;
          }
        }
        
        if (!createLinkButton) {
          sendResponse({
            success: false,
            error: 'Share dialog opened but could not find "Create link" or "Update link" button. Please try again.'
          });
          return;
        }
        
        console.log('[ChatGPT Publish] Clicking Create/Update button...');
        
        // Focus window before clicking
        window.focus();
        document.body.focus();
        
        createLinkButton.click();
        
        // Step 4: Wait for link to be created and appear in the dialog
        console.log('[ChatGPT Publish] Step 4: Waiting for link to appear...');
        let publicLink = null;
        
        // Wait and look for the link to appear (it takes a moment to generate)
        for (let i = 0; i < 20; i++) { // Try for up to 4 seconds
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Method 1: Find input field within the dialog with the share link
          const dialog = document.querySelector('[role="dialog"], [role="alertdialog"], .modal, [data-radix-popper-content-wrapper]');
          if (dialog) {
            const linkInputs = dialog.querySelectorAll('input[type="text"], input[type="url"], input[readonly], input');
            for (const input of linkInputs) {
              const value = input.value || input.getAttribute('value') || '';
              if (value && value.startsWith('https://chatgpt.com/')) {
                publicLink = value;
                console.log('[ChatGPT Publish] ✓ Found share link in dialog input:', publicLink.substring(0, 60));
                break;
              }
            }
            
            if (publicLink) break;
            
            // Also check for any text nodes with the full link in the dialog
            const dialogText = dialog.innerText || '';
            const shareMatch = dialogText.match(/https:\/\/chatgpt\.com\/share\/[a-zA-Z0-9_-]+/);
            if (shareMatch) {
              publicLink = shareMatch[0];
              console.log('[ChatGPT Publish] ✓ Found share link in dialog text:', publicLink.substring(0, 60));
              break;
            }
          }
        }
        
        // Method 2: Try to find and click a copy button, then read clipboard
        if (!publicLink) {
          console.log('[ChatGPT Publish] Method 2: Looking for copy button...');
          const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
          if (dialog) {
            const copyButtons = dialog.querySelectorAll('button');
            for (const btn of copyButtons) {
              const text = (btn.textContent || btn.innerText || '').toLowerCase();
              const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
              if (text.includes('copy') || ariaLabel.includes('copy')) {
                console.log('[ChatGPT Publish] Found copy button, clicking...');
                btn.click();
                
                // Wait and try to read clipboard
                await new Promise(resolve => setTimeout(resolve, 500));
                
                try {
                  window.focus();
                  document.body.focus();
                  const clipboardText = await navigator.clipboard.readText();
                  if (clipboardText && clipboardText.startsWith('https://chatgpt.com/')) {
                    publicLink = clipboardText.trim();
                    console.log('[ChatGPT Publish] ✓ Got link from clipboard after copy button');
                    break;
                  }
                } catch (e) {
                  console.log('[ChatGPT Publish] Clipboard read failed:', e.message);
                }
              }
            }
          }
        }
        
        // Method 3: Search all input fields on the page
        if (!publicLink) {
          console.log('[ChatGPT Publish] Method 3: Searching all input fields...');
          const allInputs = document.querySelectorAll('input');
          for (const input of allInputs) {
            const value = input.value || input.getAttribute('value') || '';
            if (value && value.startsWith('https://chatgpt.com/share/')) {
              publicLink = value;
              console.log('[ChatGPT Publish] ✓ Found share link in page input');
              break;
            }
          }
        }
        
        // Final check
        if (publicLink) {
          sendResponse({
            success: true,
            publicLink: publicLink
          });
        } else {
          sendResponse({
            success: false,
            error: 'Share link created but could not capture it automatically. Please copy the link manually.'
          });
        }
        
      } catch (error) {
        console.error('[ChatGPT Publish] Error:', error);
        sendResponse({
          success: false,
          error: `Automation failed: ${error.message}. Please try sharing manually.`
        });
      }
    })();
    
    return true; // Keep message channel open for async response
  }
});

// Helper function to find ChatGPT Share button
async function findChatGPTShareButton() {
  // Try valid CSS selectors first
  const selectors = [
    'button[data-testid="share-button"]',
    'button[aria-label*="Share"]',
    'button[title*="Share"]'
  ];
  
  for (const selector of selectors) {
    try {
      const btn = document.querySelector(selector);
      if (btn) {
        console.log('[ChatGPT Publish] Found Share button with selector:', selector);
        return btn;
      }
    } catch (e) {
      console.log('[ChatGPT Publish] Invalid selector:', selector);
    }
  }
  
  // Text-based search
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = (btn.textContent || btn.innerText || '').toLowerCase().trim();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    if (text.includes('share') || ariaLabel.includes('share')) {
      console.log('[ChatGPT Publish] Found Share button by text/aria-label');
      return btn;
    }
  }
  
  return null;
}

// Helper function to find ChatGPT Create/Update link button
async function findChatGPTCreateLinkButton() {
  // Try valid CSS selectors first (aria-label attributes)
  const selectors = [
    'button[aria-label*="Create link"]',
    'button[aria-label*="Update link"]',
    'button[aria-label*="Copy link"]'
  ];
  
  for (const selector of selectors) {
    try {
      const btn = document.querySelector(selector);
      if (btn) {
        console.log('[ChatGPT Publish] Found Create/Update button with selector:', selector);
        return btn;
      }
    } catch (e) {
      console.log('[ChatGPT Publish] Invalid selector:', selector);
    }
  }
  
  // Text-based search in all buttons (case-insensitive partial match)
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = (btn.textContent || btn.innerText || '').trim();
    const lowerText = text.toLowerCase();
    
    // Match "Create link", "Create Link", "Update link", "Update Link", "Copy link", etc.
    if (lowerText.includes('create link') || 
        lowerText.includes('update link') || 
        lowerText.includes('copy link')) {
      console.log('[ChatGPT Publish] Found Create/Update button by text:', text);
      return btn;
    }
  }
  
  return null;
}

// Helper function to find Publish/Share button with multiple strategies
async function findPublishButton() {
  // Strategy 1: Modern Claude selectors (2025)
  const selectors = [
    'button[data-testid="share-menu-trigger"]',
    'header button[aria-label*="Share"]',
    'button[aria-label*="Share"]',
    'button[title*="Share"]',
    'button[aria-label*="Publish"]', // Backward compatibility
    'button[title*="Publish"]',
    'button[aria-label*="Post"]',
    '[data-testid*="publish-button"]',
    '[data-testid*="share-button"]'
  ];
  
  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      console.log('[Claude Publish] Found Share button with selector:', selector);
      return btn;
    }
  }
  
  // Strategy 2: Text-based search in header buttons first
  const headerButtons = document.querySelectorAll('header button');
  for (const btn of headerButtons) {
    const text = (btn.textContent || btn.innerText || '').toLowerCase().trim();
    if (text === 'share' || text.includes('share')) {
      console.log('[Claude Publish] Found Share button by header text');
      return btn;
    }
  }
  
  // Strategy 3: All buttons text search
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = (btn.textContent || btn.innerText || '').toLowerCase();
    if (text.includes('share') || text.includes('publish') || text.includes('post to')) {
      console.log('[Claude Publish] Found Share button by general text search');
      return btn;
    }
  }
  
  return null;
}

// Helper function to find Public Access button
async function findPublicAccessButton() {
  // Strategy 1: Modern Claude selectors for menu items (2025)
  const selectors = [
    'label:has(input[value="public"])',
    'div[role="menuitem"]',
    'div[role="option"]',
    'button[aria-label*="Public"]',
    'button[title*="Public"]',
    'button[aria-label*="Public Access"]',
    '[data-testid*="public-access"]'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = (el.textContent || el.innerText || '').toLowerCase().trim();
      if (text.includes('anyone with the link') || text.includes('public') || text.includes('anyone on internet')) {
        console.log('[Claude Publish] Found Public Access with selector:', selector, 'text:', text);
        return el;
      }
    }
  }
  
  // Strategy 2: Look for radio/checkbox inputs with public value
  const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
  for (const input of inputs) {
    if (input.value === 'public' || input.id?.includes('public')) {
      console.log('[Claude Publish] Found Public Access input');
      return input.parentElement;
    }
  }
  
  return null;
}

// Helper function to find Copy Link button
async function findCopyLinkButton() {
  // Strategy 1: Modern Claude selectors (2025)
  const selectors = [
    'button[data-testid="copy-share-link"]',
    'button[aria-label*="Copy link"]',
    'button[aria-label*="Copy"]',
    'button[title*="Copy link"]',
    '[data-testid*="copy-link"]',
    'button:has(svg[aria-label*="Copy"])'
  ];
  
  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      console.log('[Claude Publish] Found Copy button with selector:', selector);
      return btn;
    }
  }
  
  // Strategy 2: Text-based search in visible buttons (check nested spans too)
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = (btn.textContent || btn.innerText || '').toLowerCase().trim();
    if (text === 'copy link' || text === 'copy' || (text.includes('copy') && text.includes('link')) || text.includes('publish and copy')) {
      console.log('[Claude Publish] Found Copy button by text:', text);
      return btn;
    }
  }
  
  return null;
}

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
