// OAuth callback handler - external file to comply with CSP
console.log('OAuth callback script loaded');
console.log('Current URL:', window.location.href);

try {
  // Extract token from URL fragment
  const fragment = window.location.hash.substring(1);
  const params = new URLSearchParams(fragment);
  const token = params.get("token");
  const expires = params.get("expires");

  console.log("OAuth callback received:", {
    token: token ? "present" : "missing",
    expires,
    fragmentLength: fragment.length
  });

  if (token) {
    // Calculate proper expiry timestamp
    let tokenExpiry;
    if (expires) {
      const expiresNum = parseInt(expires);
      // If expires is a timestamp (large number), use it directly
      // If it's seconds from now (small number), convert it
      if (expiresNum > 10000000000) {
        tokenExpiry = expiresNum;
      } else {
        tokenExpiry = Date.now() + (expiresNum * 1000);
      }
    } else {
      // Default to 24 hours from now
      tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    }

    console.log("Calculated token expiry:", {
      expires,
      tokenExpiry,
      hoursFromNow: (tokenExpiry - Date.now()) / (1000 * 60 * 60)
    });

    // Store token in extension storage
    chrome.storage.local.set(
      {
        authToken: token,
        tokenExpiry: tokenExpiry,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError);
          document.querySelector(".container").innerHTML =
            '<div style="color: red; font-size: 32px; margin-bottom: 16px;">❌</div><div>Failed to save authentication data</div>';
          return;
        }

        console.log("Token stored successfully");
        
        // Update UI to show success
        document.querySelector(".container").innerHTML =
          '<div class="success">✅</div><div>Authentication successful!</div><div>This window will close automatically.</div>';
        
        // Try to close the window after storing token
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.log("Could not close window automatically");
            document.querySelector(".container").innerHTML =
              '<div class="success">✅</div><div>Authentication successful!</div><div>You can close this window now.</div>';
          }
        }, 1000);
      }
    );
  } else {
    console.error("No token found in URL fragment");
    console.log("Full URL fragment:", fragment);
    
    // No token found, show error
    document.querySelector(".container").innerHTML =
      '<div style="color: red; font-size: 32px; margin-bottom: 16px;">❌</div><div>Authentication failed - no token received</div><div>Please try signing in again.</div>';
  }
} catch (error) {
  console.error("OAuth callback error:", error);
  document.querySelector(".container").innerHTML =
    '<div style="color: red; font-size: 32px; margin-bottom: 16px;">❌</div><div>Authentication error occurred</div><div>Error: ' + error.message + '</div>';
}