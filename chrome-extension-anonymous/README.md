# LLM Archive Extension (Anonymous)

This is the **simple, anonymous version** of the LLM Archive Chrome extension that allows submitting search results without requiring sign-in.

## Features

- 🚀 **No Sign-In Required**: Submit search results immediately without authentication
- 📝 **Anonymous Submissions**: All submissions are anonymous (no user attribution)
- 🎯 **Auto-Capture**: Automatically extract search data from ChatGPT, Claude, Gemini, and DeepSeek
- 🌐 **Claude Auto-Publish**: One-click publishing of Claude conversations with automatic public link capture
- ⚡ **Quick & Simple**: Minimal setup, instant usage

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this `chrome-extension-anonymous` folder
4. The extension will appear in your Chrome toolbar

## Usage

1. **No Setup Required**: Click the extension icon to start immediately
2. **Submit Results**: 
   - Navigate to a ChatGPT, Claude, Gemini, or DeepSeek conversation
   - Click the extension icon
   - Use "Auto-Capture" to automatically fill the form, or fill manually
   - **For Claude.ai**: Check "Post and Share to Anyone on Internet" to automatically publish the conversation and capture the public share link
   - Submit to the archive (no sign-in needed)
3. **Browse Archive**: Visit the main web application to search and discover results

### Claude.ai Auto-Publish Feature

When you're on a Claude.ai conversation:
1. Check the "Post and Share to Anyone on Internet" checkbox
2. The extension will automatically:
   - Click the "Share" button
   - Select the copy link option in the dialog
   - Capture the public share link
   - Fill it into the "Public Share Link" field

This makes it easy to share Claude conversations publicly without manual copying and pasting!

## Important Notes

### Anonymous Submissions
- All submissions are **anonymous** (no user attribution)
- No account required or user tracking
- Submissions cannot be edited or deleted by the submitter
- No spam protection beyond basic rate limiting

### Server Configuration
- By default, connects to `http://localhost:5000/api` for development
- Use the Options page (⚙️ Options button) to configure a different server URL
- For production use, update the API base URL in extension options

## When to Use This Version

Choose this anonymous version if you:
- Want quick, hassle-free submissions
- Don't want to create an account or sign in
- Are okay with anonymous contributions
- Are testing or developing

Choose the authenticated version (`chrome-extension-auth`) if you:
- Want your submissions attributed to your account
- Need security against spam/abuse
- Are using in production/enterprise environment
- Want accountability and submission tracking

## Development

To connect to a different server:
1. Click the extension icon
2. Click "⚙️ Options" 
3. Set your custom API base URL (e.g., `https://your-server.com/api`)
4. Save settings

## Support

For issues or questions, please check the main project documentation or create an issue in the project repository.

## Security Note

This version has minimal security protections. For production use with security requirements, consider using the authenticated version instead.