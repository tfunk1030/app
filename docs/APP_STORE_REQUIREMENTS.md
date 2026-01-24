# App Store Submission Requirements

**Generated:** 2026-01-14
**Status:** 3 P0 blockers require user action

---

## Overview

The PYYW audit identified 3 critical blockers preventing App Store submission. These require assets/decisions that only you can provide.

| # | Blocker | Current State | Required |
|---|---------|---------------|----------|
| 1 | App Icon | 192x192 PNG with alpha | 1024x1024 PNG, no alpha |
| 2 | Privacy Policy | Alert placeholder | Live URL returning HTTP 200 |
| 3 | Terms of Service | Not implemented | Live URL returning HTTP 200 |

---

## 1. App Icon (P0-1)

### Current State
```
File: assets/images/icon.png
Size: 192 x 192 pixels
Format: PNG with RGBA (has transparency)
```

### Requirements

Apple requires a **1024x1024 pixel** app icon with these specifications:

| Requirement | Value |
|-------------|-------|
| Dimensions | Exactly 1024 x 1024 pixels |
| Format | PNG |
| Color Space | sRGB |
| Transparency | **NO** (no alpha channel) |
| Layers | Flattened (no layers) |
| Rounded Corners | **NO** (Apple adds them automatically) |

### How to Create

#### Option A: Professional Designer
Best quality. Provide these specs:
- 1024x1024 px
- PNG format
- No transparency
- sRGB color space
- Golf/caddy theme matching app branding

#### Option B: Design Tools (DIY)

**Figma (Free):**
1. Create new file: 1024x1024 frame
2. Design icon (no rounded corners)
3. Export: PNG, no transparency
4. File → Export → PNG, uncheck "Include background"

**Canva (Free):**
1. Custom size: 1024x1024 px
2. Design icon
3. Download as PNG
4. Use online tool to remove alpha channel if needed

**GIMP (Free):**
1. Image → Canvas Size → 1024x1024
2. Design/import icon
3. Image → Flatten Image (removes alpha)
4. Export as PNG

#### Option C: AI Generation

Use DALL-E, Midjourney, or similar:
```
Prompt: "App icon for a golf caddy app, professional, modern, 
green and white color scheme, golf ball or flag imagery, 
flat design, no text, square format, solid background"
```
Then resize to exactly 1024x1024 and remove transparency.

### Removing Transparency (Alpha Channel)

If your icon has transparency, remove it:

**Online Tools:**
- https://onlinepngtools.com/remove-png-alpha-channel
- https://www.remove.bg (then add solid background)

**Command Line (ImageMagick):**
```bash
convert icon.png -background white -alpha remove -alpha off icon_no_alpha.png
```

**Photoshop:**
1. Layer → Flatten Image
2. Save as PNG

### Where to Place
```
assets/images/icon.png
```
Replace the existing 192x192 file with your new 1024x1024 file.

### Verification

After placing the icon, run:
```bash
file assets/images/icon.png
# Should show: PNG image data, 1024 x 1024, 8-bit/color RGB (NOT RGBA)
```

---

## 2. Privacy Policy (P0-2)

### Current State
```typescript
// src/features/redesign/screens/SetupScreen.tsx:593-594
onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon!')}
```
This is a placeholder - App Store requires a real, accessible URL.

### Requirements

Apple requires a **publicly accessible** Privacy Policy that:
- Is hosted at a URL that returns HTTP 200
- Describes what data you collect
- Explains how you use the data
- Is written in the app's primary language
- Is accessible without login

### What to Include

Your Privacy Policy should cover:

1. **Data Collection**
   - Location data (if used for weather)
   - Device information
   - Usage analytics (if any)
   - Club/yardage preferences stored locally

2. **Data Usage**
   - How location is used (weather lookup)
   - What's stored locally vs sent to servers
   - Third-party services (OpenWeatherMap, RevenueCat, Sentry)

3. **Data Sharing**
   - Third parties receiving data
   - Analytics providers
   - Payment processors

4. **User Rights**
   - How to request data deletion
   - How to opt out
   - Contact information

### Hosting Options

#### Option A: Your Domain (Recommended)
Host at: `https://aicaddypro.com/privacy`

Create a simple HTML page or use a CMS.

#### Option B: GitHub Pages (Free)
1. Create repo: `aicaddypro-legal`
2. Add `privacy.html`
3. Enable GitHub Pages
4. URL: `https://yourusername.github.io/aicaddypro-legal/privacy.html`

#### Option C: Notion (Free)
1. Create Notion page with privacy policy
2. Share → "Share to web"
3. Copy public URL

#### Option D: Google Docs (Free)
1. Create Google Doc with privacy policy
2. File → Share → Publish to web
3. Copy published URL

### Privacy Policy Template

```markdown
# Privacy Policy for AICaddyPro

Last updated: [DATE]

## Overview
AICaddyPro ("we", "our", "us") is a golf shot calculator app that helps 
golfers adjust their shots based on environmental conditions.

## Data We Collect

### Location Data
- We request location access to fetch local weather conditions
- Location is sent to OpenWeatherMap API for weather data
- We do not store your location history

### Local Storage
- Club distances and preferences are stored locally on your device
- Settings and preferences are stored locally
- No account or login required

### Analytics
- We use [Sentry/etc.] for crash reporting
- Anonymous usage statistics help us improve the app

## Third-Party Services
- **OpenWeatherMap**: Weather data (receives your location)
- **RevenueCat**: Subscription management
- **Sentry**: Crash reporting

## Data Retention
- Local data remains on your device until you delete the app
- We do not maintain servers storing your personal data

## Your Rights
- Delete app to remove all local data
- Contact us at [EMAIL] for questions

## Contact
[YOUR EMAIL]
[YOUR ADDRESS - optional]

## Changes
We may update this policy. Check this page for the latest version.
```

### Provide Your URL

Once hosted, provide the URL:
```
Privacy Policy URL: https://___________________
```

---

## 3. Terms of Service (P0-3)

### Current State
Not implemented in the app.

### Requirements

Apple requires Terms of Service for apps with:
- In-app purchases (you have RevenueCat subscriptions)
- User-generated content
- Account creation

### What to Include

1. **Acceptance of Terms**
2. **Description of Service**
3. **User Responsibilities**
4. **Payment Terms** (for subscriptions)
5. **Intellectual Property**
6. **Disclaimers** (golf advice is not guaranteed)
7. **Limitation of Liability**
8. **Termination**
9. **Governing Law**
10. **Contact Information**

### Terms of Service Template

```markdown
# Terms of Service for AICaddyPro

Last updated: [DATE]

## 1. Acceptance
By using AICaddyPro, you agree to these terms.

## 2. Description of Service
AICaddyPro provides golf shot calculations based on environmental 
conditions. Results are estimates and not guaranteed.

## 3. Subscriptions
- Premium features require a paid subscription
- Subscriptions are managed through Apple App Store
- Refunds are handled by Apple per their policies
- You can cancel anytime in your App Store settings

## 4. Disclaimer
**IMPORTANT**: Shot recommendations are estimates based on weather 
data and general physics. Actual results vary based on:
- Individual swing characteristics
- Course conditions
- Equipment differences
- Weather accuracy

We are not responsible for golf performance outcomes.

## 5. Limitation of Liability
To the maximum extent permitted by law, AICaddyPro shall not be 
liable for any indirect, incidental, or consequential damages.

## 6. Intellectual Property
The app, design, and content are owned by [YOUR NAME/COMPANY].

## 7. Termination
We may terminate access for violation of these terms.

## 8. Changes
We may update these terms. Continued use constitutes acceptance.

## 9. Contact
[YOUR EMAIL]

## 10. Governing Law
These terms are governed by the laws of [YOUR STATE/COUNTRY].
```

### Hosting Options

Same as Privacy Policy - can be hosted on same platform:
- `https://aicaddypro.com/terms`
- `https://yourusername.github.io/aicaddypro-legal/terms.html`
- Notion public page
- Google Docs published page

### Provide Your URL

Once hosted, provide the URL:
```
Terms of Service URL: https://___________________
```

---

## Summary: What I Need From You

Please provide:

### 1. App Icon
- [ ] 1024x1024 PNG file
- [ ] No transparency
- [ ] sRGB color space

**Action:** Place file at `assets/images/icon.png` or provide file to me

### 2. Privacy Policy URL
```
URL: _________________________________
```

### 3. Terms of Service URL
```
URL: _________________________________
```

---

## After You Provide These

Once you provide the icon and URLs, I will:

1. Update `assets/images/icon.png` (if you provide file)
2. Update `SetupScreen.tsx` to link to real URLs
3. Run PYYW validation:
   - `file` command on icon
   - `curl` on both URLs
4. Run typecheck
5. Mark App Store blockers as resolved

---

## Quick Reference: File Locations

| Item | Location |
|------|----------|
| App Icon | `assets/images/icon.png` |
| Setup Screen | `src/features/redesign/screens/SetupScreen.tsx` |
| App Config | `app.json` |

---

## Verification Commands

After implementation, these commands will verify success:

```bash
# Icon check
file assets/images/icon.png
# Expected: PNG image data, 1024 x 1024, 8-bit/color RGB

# Privacy URL check
curl -sI https://[YOUR_PRIVACY_URL] | head -3
# Expected: HTTP/2 200

# Terms URL check
curl -sI https://[YOUR_TERMS_URL] | head -3
# Expected: HTTP/2 200
```

---

*Document generated by Droid Factory*
*PYYW Protocol: All changes will be validated before marking complete*
