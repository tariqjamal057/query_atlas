// Alternative OAuth implementation using chrome.identity API
// Add this to your popup.js if the current method still fails

// Alternative sign-in method using chrome.identity
async function alternativeSignIn() {
  try {
    signInBtn.disabled = true;
    signInBtn.textContent = "Signing in...";

    // Use chrome.identity.launchWebAuthFlow instead
    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = `${API_BASE}/auth/google/start?extension_redirect=${encodeURIComponent(
      redirectUrl
    )}`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Auth error:", chrome.runtime.lastError);
          showStatus(
            `Authentication failed: ${chrome.runtime.lastError.message}`,
            "error"
          );
          return;
        }

        if (responseUrl) {
          // Parse token from response URL
          const url = new URL(responseUrl);
          const token =
            url.searchParams.get("token") ||
            url.hash.match(/token=([^&]+)/)?.[1];
          const expires =
            url.searchParams.get("expires") ||
            url.hash.match(/expires=([^&]+)/)?.[1];

          if (token) {
            // Store token
            chrome.storage.local.set(
              {
                authToken: token,
                tokenExpiry: expires || Date.now() + 24 * 60 * 60 * 1000,
              },
              async () => {
                await checkAuthStatus();
                showStatus("Successfully signed in!", "success");
              }
            );
          } else {
            showStatus("No authentication token received", "error");
          }
        }
      }
    );
  } catch (error) {
    console.error("Alternative sign in failed:", error);
    showStatus(`Sign in failed: ${error.message}`, "error");
  } finally {
    signInBtn.disabled = false;
    signInBtn.textContent = "Sign in with Google";
  }
}

// You can replace the existing signInBtn event listener with this alternative method
