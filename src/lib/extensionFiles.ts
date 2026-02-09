// Chrome Extension source files for "The Guardian"

export const extensionFiles = {
  'manifest.json': `{
  "manifest_version": 3,
  "name": "StackVault Guardian",
  "version": "1.0.0",
  "description": "Track your LTD tool usage automatically and get warnings before impulse buying duplicates",
  "permissions": [
    "storage",
    "tabs",
    "alarms",
    "notifications"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["*://*.appsumo.com/*", "*://*.dealify.com/*", "*://*.stacksocial.com/*"],
      "js": ["content-deal-sites.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  }
}`,

  'background.js': `// StackVault Guardian - Background Service Worker

// Configuration
const TRACKING_INTERVAL = 15000; // 15 seconds
const MIN_ACTIVE_TIME = 5000; // 5 seconds minimum to count as active

// State
let trackedDomains = new Map(); // domain -> toolId
let activeTabDomain = null;
let lastActiveTime = Date.now();
let sessionUsage = new Map(); // toolId -> seconds

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('StackVault Guardian installed');
  loadTrackedDomains();
  
  // Set up periodic usage sync
  chrome.alarms.create('syncUsage', { periodInMinutes: 1 });
});

// Load tracked domains from storage
async function loadTrackedDomains() {
  const result = await chrome.storage.sync.get(['trackedDomains']);
  if (result.trackedDomains) {
    trackedDomains = new Map(Object.entries(result.trackedDomains));
  }
}

// Save tracked domains
async function saveTrackedDomains() {
  await chrome.storage.sync.set({
    trackedDomains: Object.fromEntries(trackedDomains)
  });
}

// Add a tool to track
async function addTrackedTool(domain, toolId, toolName) {
  trackedDomains.set(domain, { toolId, toolName });
  await saveTrackedDomains();
  console.log(\`Now tracking: \${domain} -> \${toolName}\`);
}

// Remove a tracked tool
async function removeTrackedTool(domain) {
  trackedDomains.delete(domain);
  await saveTrackedDomains();
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Check if URL matches any tracked domain
function findMatchingTool(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  for (const [trackedDomain, toolInfo] of trackedDomains) {
    if (domain.includes(trackedDomain) || trackedDomain.includes(domain)) {
      return toolInfo;
    }
  }
  return null;
}

// Track active tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  handleTabChange(tab.url);
});

// Track URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    handleTabChange(changeInfo.url);
  }
});

// Handle tab/URL changes
function handleTabChange(url) {
  const tool = findMatchingTool(url);
  
  if (tool) {
    // Start tracking this tool
    activeTabDomain = tool.toolId;
    lastActiveTime = Date.now();
    
    // Update badge to show tracking
    chrome.action.setBadgeText({ text: '●' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  } else {
    // Stop tracking
    if (activeTabDomain) {
      recordUsageTime();
    }
    activeTabDomain = null;
    chrome.action.setBadgeText({ text: '' });
  }
}

// Record usage time for current tool
function recordUsageTime() {
  if (!activeTabDomain) return;
  
  const elapsed = Math.floor((Date.now() - lastActiveTime) / 1000);
  if (elapsed >= MIN_ACTIVE_TIME / 1000) {
    const current = sessionUsage.get(activeTabDomain) || 0;
    sessionUsage.set(activeTabDomain, current + elapsed);
  }
  lastActiveTime = Date.now();
}

// Periodic usage sync
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncUsage') {
    recordUsageTime();
    syncUsageToApp();
  }
});

// Sync usage data to StackVault app
async function syncUsageToApp() {
  if (sessionUsage.size === 0) return;
  
  const usageData = Object.fromEntries(sessionUsage);
  
  // Store locally for now (can be synced to server later)
  const result = await chrome.storage.local.get(['usageHistory']);
  const history = result.usageHistory || [];
  
  history.push({
    timestamp: new Date().toISOString(),
    usage: usageData
  });
  
  // Keep last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = history.filter(h => new Date(h.timestamp).getTime() > weekAgo);
  
  await chrome.storage.local.set({ usageHistory: filtered });
  
  // Clear session
  sessionUsage.clear();
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'ADD_TRACKED_TOOL':
      addTrackedTool(message.domain, message.toolId, message.toolName);
      sendResponse({ success: true });
      break;
      
    case 'REMOVE_TRACKED_TOOL':
      removeTrackedTool(message.domain);
      sendResponse({ success: true });
      break;
      
    case 'GET_TRACKED_TOOLS':
      sendResponse({ tools: Object.fromEntries(trackedDomains) });
      break;
      
    case 'GET_USAGE_STATS':
      chrome.storage.local.get(['usageHistory'], (result) => {
        sendResponse({ history: result.usageHistory || [] });
      });
      return true; // Keep channel open for async response
      
    case 'CHECK_DUPLICATE':
      checkForDuplicate(message.category, message.productName).then(sendResponse);
      return true;
  }
});

// Check if user owns similar tools
async function checkForDuplicate(category, productName) {
  const result = await chrome.storage.sync.get(['ownedTools']);
  const ownedTools = result.ownedTools || [];
  
  const similar = ownedTools.filter(tool => 
    tool.category?.toLowerCase() === category?.toLowerCase()
  );
  
  if (similar.length > 0) {
    // Find the least used one
    const usageResult = await chrome.storage.local.get(['usageHistory']);
    const history = usageResult.usageHistory || [];
    
    const toolUsage = {};
    similar.forEach(tool => { toolUsage[tool.id] = 0; });
    
    history.forEach(entry => {
      Object.entries(entry.usage).forEach(([toolId, seconds]) => {
        if (toolUsage[toolId] !== undefined) {
          toolUsage[toolId] += seconds;
        }
      });
    });
    
    const leastUsed = similar.reduce((min, tool) => 
      (toolUsage[tool.id] || 0) < (toolUsage[min.id] || 0) ? tool : min
    );
    
    return {
      hasDuplicates: true,
      count: similar.length,
      leastUsed: leastUsed,
      leastUsedTime: toolUsage[leastUsed.id] || 0
    };
  }
  
  return { hasDuplicates: false };
}
`,

  'content-deal-sites.js': `// StackVault Guardian - Deal Site Content Script
// Runs on AppSumo, Dealify, StackSocial, etc.

(function() {
  'use strict';
  
  // Wait for page to load
  setTimeout(scanPage, 2000);
  
  function scanPage() {
    // Try to extract product category from page
    const category = extractCategory();
    const productName = extractProductName();
    
    if (category || productName) {
      checkForDuplicates(category, productName);
    }
  }
  
  function extractCategory() {
    // AppSumo specific selectors
    const categoryEl = document.querySelector('[data-category]') ||
                       document.querySelector('.product-category') ||
                       document.querySelector('.breadcrumb a:last-child');
    
    if (categoryEl) {
      return categoryEl.textContent?.trim() || categoryEl.getAttribute('data-category');
    }
    
    // Try meta tags
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      const keywords = metaKeywords.content.split(',');
      // Common LTD categories
      const categories = ['AI', 'Writing', 'SEO', 'Marketing', 'Design', 'Video', 'Audio', 'Productivity', 'CRM', 'Email'];
      for (const keyword of keywords) {
        for (const cat of categories) {
          if (keyword.toLowerCase().includes(cat.toLowerCase())) {
            return cat;
          }
        }
      }
    }
    
    return null;
  }
  
  function extractProductName() {
    // Try common selectors
    const titleEl = document.querySelector('h1') ||
                    document.querySelector('[data-product-name]') ||
                    document.querySelector('.product-title');
    
    return titleEl?.textContent?.trim() || document.title.split('|')[0]?.trim();
  }
  
  async function checkForDuplicates(category, productName) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        category,
        productName
      });
      
      if (response?.hasDuplicates) {
        showWarningPopup(response);
      }
    } catch (error) {
      console.log('StackVault Guardian: Could not check duplicates', error);
    }
  }
  
  function showWarningPopup(data) {
    // Remove existing popup if any
    const existing = document.getElementById('stackvault-guardian-popup');
    if (existing) existing.remove();
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'stackvault-guardian-popup';
    popup.innerHTML = \`
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #f97316;
        border-radius: 12px;
        padding: 20px;
        max-width: 350px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        animation: slideIn 0.3s ease-out;
      ">
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
        
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="
            background: #f97316;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            animation: pulse 2s infinite;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </div>
          
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #f97316;">
              🛑 Hold on!
            </h3>
            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #e5e5e5;">
              You already own <strong style="color: #fff;">\${data.count} similar tool\${data.count > 1 ? 's' : ''}</strong> in this category.
            </p>
            
            <div style="
              background: rgba(249, 115, 22, 0.1);
              border: 1px solid rgba(249, 115, 22, 0.3);
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 12px;
            ">
              <p style="margin: 0; font-size: 13px; color: #fbbf24;">
                <strong>\${data.leastUsed?.name || 'One of them'}</strong> has 
                <strong style="color: #ef4444;">\${formatTime(data.leastUsedTime)}</strong> usage this month.
              </p>
            </div>
            
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #fff;">
              Do you really need this one?
            </p>
          </div>
          
          <button onclick="this.closest('#stackvault-guardian-popup').remove()" style="
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 4px;
            font-size: 20px;
            line-height: 1;
          ">×</button>
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button onclick="this.closest('#stackvault-guardian-popup').remove()" style="
            flex: 1;
            background: #22c55e;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
          ">
            I'll use what I have
          </button>
          <button onclick="this.closest('#stackvault-guardian-popup').remove()" style="
            background: transparent;
            color: #888;
            border: 1px solid #444;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
          ">
            Buy anyway
          </button>
        </div>
      </div>
    \`;
    
    document.body.appendChild(popup);
    
    // Auto-dismiss after 30 seconds
    setTimeout(() => popup.remove(), 30000);
  }
  
  function formatTime(seconds) {
    if (!seconds || seconds === 0) return '0 minutes';
    if (seconds < 60) return \`\${seconds} seconds\`;
    if (seconds < 3600) return \`\${Math.floor(seconds / 60)} minutes\`;
    return \`\${Math.floor(seconds / 3600)} hours\`;
  }
})();
`,

  'popup.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StackVault Guardian</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 320px;
      min-height: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
      color: #fff;
    }
    
    .header {
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .subtitle {
      font-size: 11px;
      color: #888;
    }
    
    .status {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .content {
      padding: 16px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
      margin-bottom: 12px;
    }
    
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #8b5cf6;
    }
    
    .stat-label {
      font-size: 11px;
      color: #888;
      margin-top: 4px;
    }
    
    .tool-list {
      max-height: 150px;
      overflow-y: auto;
    }
    
    .tool-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 13px;
    }
    
    .tool-item:hover {
      background: rgba(255,255,255,0.08);
    }
    
    .tool-time {
      font-size: 11px;
      color: #22c55e;
    }
    
    .empty-state {
      text-align: center;
      padding: 24px;
      color: #666;
      font-size: 13px;
    }
    
    .add-tool-form {
      display: flex;
      gap: 8px;
    }
    
    .add-tool-form input {
      flex: 1;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 8px 12px;
      color: #fff;
      font-size: 13px;
    }
    
    .add-tool-form input::placeholder {
      color: #666;
    }
    
    .add-tool-form button {
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
    }
    
    .add-tool-form button:hover {
      background: #7c3aed;
    }
    
    .footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      text-align: center;
    }
    
    .footer a {
      color: #8b5cf6;
      text-decoration: none;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <div>
      <div class="title">StackVault Guardian</div>
      <div class="subtitle">Protecting your wallet</div>
    </div>
    <div class="status">
      <div class="status-dot"></div>
      Active
    </div>
  </div>
  
  <div class="content">
    <div class="section">
      <div class="section-title">Today's Tracking</div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value" id="toolsTracked">0</div>
          <div class="stat-label">Tools Used</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="timeTracked">0h</div>
          <div class="stat-label">Time Tracked</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Active Tools</div>
      <div class="tool-list" id="toolList">
        <div class="empty-state">No tools tracked yet</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Quick Add Domain</div>
      <form class="add-tool-form" id="addToolForm">
        <input type="text" placeholder="e.g., relayter.com" id="domainInput" />
        <button type="submit">Add</button>
      </form>
    </div>
  </div>
  
  <div class="footer">
    <a href="#" id="openDashboard">Open StackVault Dashboard →</a>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>`,

  'popup.js': `// StackVault Guardian - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadTrackedTools();
  
  // Handle form submission
  document.getElementById('addToolForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('domainInput');
    const domain = input.value.trim().replace(/^https?:\/\//, '').replace(/^\/+|\/+$/g, '');
    
    if (domain) {
      await chrome.runtime.sendMessage({
        type: 'ADD_TRACKED_TOOL',
        domain,
        toolId: 'tool_' + Date.now(),
        toolName: domain.split('.')[0]
      });
      
      input.value = '';
      await loadTrackedTools();
    }
  });
  
  // Open dashboard
  document.getElementById('openDashboard').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://your-stackvault-app.com' });
  });
});

async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_USAGE_STATS' });
    const history = response?.history || [];
    
    // Calculate today's stats
    const today = new Date().toDateString();
    const todayUsage = history.filter(h => 
      new Date(h.timestamp).toDateString() === today
    );
    
    let totalSeconds = 0;
    const toolsUsed = new Set();
    
    todayUsage.forEach(entry => {
      Object.entries(entry.usage).forEach(([toolId, seconds]) => {
        totalSeconds += seconds;
        toolsUsed.add(toolId);
      });
    });
    
    document.getElementById('toolsTracked').textContent = toolsUsed.size;
    document.getElementById('timeTracked').textContent = formatHours(totalSeconds);
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function loadTrackedTools() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TRACKED_TOOLS' });
    const tools = response?.tools || {};
    const list = document.getElementById('toolList');
    
    if (Object.keys(tools).length === 0) {
      list.innerHTML = '<div class="empty-state">No tools tracked yet. Add a domain below!</div>';
      return;
    }
    
    list.innerHTML = Object.entries(tools).map(([domain, info]) => \`
      <div class="tool-item">
        <span>\${info.toolName || domain}</span>
        <span class="tool-time">\${domain}</span>
      </div>
    \`).join('');
  } catch (error) {
    console.error('Failed to load tools:', error);
  }
}

function formatHours(seconds) {
  if (seconds < 60) return '0h';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
  return Math.floor(seconds / 3600) + 'h';
}
`,

  'icons/icon16.svg': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="4" fill="#8b5cf6"/>
  <path d="M12 4L4 8l8 4 8-4-8-4z" fill="white"/>
  <path d="M4 16l8 4 8-4" stroke="white" stroke-width="2" fill="none"/>
  <path d="M4 12l8 4 8-4" stroke="white" stroke-width="2" fill="none"/>
</svg>`,

  'icons/icon48.svg': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="4" fill="#8b5cf6"/>
  <path d="M12 4L4 8l8 4 8-4-8-4z" fill="white"/>
  <path d="M4 16l8 4 8-4" stroke="white" stroke-width="2" fill="none"/>
  <path d="M4 12l8 4 8-4" stroke="white" stroke-width="2" fill="none"/>
</svg>`,

  'icons/icon128.svg': `<svg width="128" height="128" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="4" fill="#8b5cf6"/>
  <path d="M12 4L4 8l8 4 8-4-8-4z" fill="white"/>
  <path d="M4 16l8 4 8-4" stroke="white" stroke-width="2" fill="none"/>
  <path d="M4 12l8 4 8-4" stroke="white" stroke-width="2" fill="none"/>
</svg>`,

  'README.md': `# StackVault Guardian - Chrome Extension

## Installation (Developer Mode)

Since this extension isn't on the Chrome Web Store yet, you'll need to install it manually:

1. **Unzip the downloaded file** to a folder on your computer

2. **Open Chrome** and go to \`chrome://extensions/\`

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"** and select the unzipped folder

5. **Pin the extension** to your toolbar for easy access

## Features

### 🔍 Passive Usage Tracking
- Automatically tracks time spent on your LTD tools
- Works silently in the background
- Syncs with your StackVault dashboard

### 🛑 Stop Buying Alerts
- Warns you when browsing deal sites (AppSumo, Dealify, etc.)
- Checks if you already own similar tools
- Shows usage stats of your existing tools

## Adding Tools to Track

1. Click the Guardian extension icon
2. Enter the domain of your tool (e.g., \`relayter.com\`)
3. Click "Add"

The extension will now track time whenever you visit that domain.

## Privacy

- Only tracks domains you explicitly add
- All data stored locally on your device
- No personal browsing data is collected
- Open source - inspect the code yourself!

## Support

Visit your StackVault dashboard for help and feedback.
`
};

export const generateExtensionZip = async (): Promise<Blob> => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Add all files to the zip
  Object.entries(extensionFiles).forEach(([filename, content]) => {
    // Create folder structure for icons
    if (filename.includes('/')) {
      const parts = filename.split('/');
      const folder = parts.slice(0, -1).join('/');
      zip.folder(folder);
    }
    zip.file(filename, content);
  });
  
  // Generate the zip file
  return await zip.generateAsync({ type: 'blob' });
};
