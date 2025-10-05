# LLM Archive Chrome Extensions

This project provides **two versions** of the Chrome extension to suit different needs and security requirements.

## 🔐 Authenticated Version (`chrome-extension-auth/`)

**Secure extension requiring Google OAuth sign-in**

✅ **Best for:**
- Production environments
- Enterprise/business use
- When you need user accountability
- Security-conscious deployments

✅ **Features:**
- Google OAuth authentication
- User attribution for all submissions
- Spam/DDOS protection
- Works with HTTPS production domains
- Enterprise-ready security
- **Claude.ai Auto-Publish**: Automatically publish conversations and capture public share links

📁 **Location:** `chrome-extension-auth/`
📖 **Documentation:** [chrome-extension-auth/README.md](chrome-extension-auth/README.md)

## 🚀 Anonymous Version (`chrome-extension-anonymous/`)

**Simple extension with no sign-in required**

✅ **Best for:**
- Development and testing
- Quick anonymous contributions
- When you don't want to create accounts
- Simple usage scenarios

✅ **Features:**
- No authentication required
- Anonymous submissions
- Instant usage
- Simplified interface
- **Claude.ai Auto-Publish**: Automatically publish conversations and capture public share links

📁 **Location:** `chrome-extension-anonymous/`
📖 **Documentation:** [chrome-extension-anonymous/README.md](chrome-extension-anonymous/README.md)

## 🎯 Which Version Should I Use?

| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| **Setup Time** | Instant | Requires Google sign-in |
| **Security** | Basic rate limiting | Full OAuth + attribution |
| **User Tracking** | None | Google account linked |
| **Spam Protection** | Minimal | Strong |
| **Production Ready** | Limited | Yes |
| **Enterprise Use** | No | Yes |

### Choose **Anonymous** if:
- You want to test quickly
- You don't mind anonymous contributions
- You don't want to sign in
- You're developing/experimenting

### Choose **Authenticated** if:
- You're deploying in production
- You need security against abuse
- You want submission accountability
- You're using for business/enterprise

## 🛠️ Installation

Both versions install the same way:

1. Download/clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select either `chrome-extension-auth/` or `chrome-extension-anonymous/`

## 🌐 Backend Compatibility

Both extensions work with the same backend API:

- **Authenticated version** → `/api/search-results` (requires JWT token)
- **Anonymous version** → `/api/search-results/anonymous` (no auth needed)

The backend supports both endpoints simultaneously, so you can use both versions if needed.

## 📚 Full Documentation

- [Main Project](replit.md)
- [Authenticated Extension](chrome-extension-auth/README.md)
- [Anonymous Extension](chrome-extension-anonymous/README.md)

## 🔧 Development

Both extensions auto-detect development environments and connect to `http://localhost:5000/api` when in development mode. For production, they can be configured through the options page or auto-detect the production domain.