# LLM Archive Extension (Authenticated)

This is the **secure, authenticated version** of the LLM Archive Chrome extension that requires Google OAuth sign-in to submit search results.

## Features

- 🔐 **Secure Authentication**: Requires Google sign-in to prevent anonymous spam and DDOS attacks
- 👤 **User Attribution**: All submissions are linked to your Google account for accountability
- 🚀 **Auto-Capture**: Automatically extract search data from ChatGPT, Claude, Gemini, and DeepSeek
- ✅ **Production Ready**: Works with HTTPS domains and supports enterprise security requirements

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this `chrome-extension-auth` folder
4. The extension will appear in your Chrome toolbar

## Usage

1. **Sign In**: Click the extension icon and sign in with your Google account
2. **Submit Results**: 
   - Navigate to a ChatGPT, Claude, Gemini, or DeepSeek conversation
   - Click the extension icon
   - Use "Auto-Capture" to automatically fill the form, or fill manually
   - Submit to the archive
3. **Browse Archive**: Visit the main web application to search and discover results

## Security

- Uses secure OAuth 2.0 with PKCE S256 flow
- All submissions are attributed to your authenticated user account
- JWT tokens with 24-hour expiry
- Rate limiting and CORS protection
- Works over HTTPS in production environments

## Why Authentication?

This version requires authentication to:
- Prevent anonymous spam and abuse
- Protect against DDOS attacks
- Ensure content accountability
- Maintain high-quality submissions
- Support enterprise security requirements

If you prefer anonymous submissions, use the `chrome-extension-anonymous` version instead.

## Development

To use with a local development server:
- The extension auto-detects development environment
- Connects to `http://localhost:5000/api` automatically
- For production, update the API domain in options or let it auto-detect

## Support

For issues or questions, please check the main project documentation or create an issue in the project repository.