// Chrome Extension source files for "The Guardian"

export const extensionFiles = {
  'manifest.json': `{
  "manifest_version": 3,
  "name": "StackVault Guardian",
  "version": "2.0.0",
  "description": "Track your LTD tool usage automatically and sync with StackVault",
  "permissions": [
    "storage",
    "tabs",
    "alarms",
    "notifications",
    "idle"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["*://*.appsumo.com/*", "*://*.dealify.com/*", "*://*.stacksocial.com/*", "*://*.pitchground.com/*", "*://*.dealfuel.com/*"],
      "js": ["content-deal-sites.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  }
}`,

  'background.js': `// StackVault Guardian v2 - Background Service Worker
// Auto-tracks tool usage by matching tool_url domains and syncs to Supabase

const SYNC_INTERVAL_MINUTES = 1;
const MIN_ACTIVE_SECONDS = 5;
const IDLE_THRESHOLD_SECONDS = 120; // 2 min idle = stop tracking

// State
let tools = []; // Array of {id, name, tool_url, category, ...} from Supabase
let supabaseUrl = '';
let supabaseKey = '';
let accessToken = '';
let activeToolId = null;
let activeStartTime = null;
let pendingUsage = new Map(); // toolId -> accumulated seconds
let isUserActive = true;

// ---- INIT ----
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Guardian] Installed v2');
  chrome.alarms.create('syncUsage', { periodInMinutes: SYNC_INTERVAL_MINUTES });
  chrome.alarms.create('refreshTools', { periodInMinutes: 5 });
  loadConfig().then(() => fetchTools());
});

chrome.runtime.onStartup.addListener(() => {
  loadConfig().then(() => fetchTools());
});

// ---- CONFIG ----
async function loadConfig() {
  const result = await chrome.storage.sync.get(['supabaseUrl', 'supabaseKey', 'accessToken', 'refreshToken']);
  supabaseUrl = result.supabaseUrl || '';
  supabaseKey = result.supabaseKey || '';
  accessToken = result.accessToken || '';
  if (!supabaseUrl || !supabaseKey || !accessToken) {
    console.log('[Guardian] Not connected. Waiting for setup...');
  }
}

async function saveConfig(url, key, token, refreshToken) {
  supabaseUrl = url;
  supabaseKey = key;
  accessToken = token;
  await chrome.storage.sync.set({ supabaseUrl: url, supabaseKey: key, accessToken: token, refreshToken: refreshToken || '' });
}

// ---- FETCH TOOLS FROM SUPABASE ----
async function fetchTools() {
  if (!supabaseUrl || !supabaseKey || !accessToken) return;

  try {
    // First try to refresh the token
    await tryRefreshToken();

    const res = await fetch(supabaseUrl + '/rest/v1/tools?select=id,name,tool_url,category,times_used,last_used,usage_history,current_streak,longest_streak', {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json',
      }
    });

    if (res.status === 401) {
      console.log('[Guardian] Token expired, attempting refresh...');
      const refreshed = await tryRefreshToken();
      if (!refreshed) {
        console.log('[Guardian] Refresh failed. User needs to reconnect.');
        return;
      }
      return fetchTools(); // Retry
    }

    if (!res.ok) {
      console.error('[Guardian] Failed to fetch tools:', res.status);
      return;
    }

    tools = await res.json();
    // Also store for deal-site content script
    const ownedTools = tools.map(t => ({ id: t.id, name: t.name, category: t.category }));
    await chrome.storage.sync.set({ ownedTools });
    console.log('[Guardian] Loaded', tools.length, 'tools');
  } catch (err) {
    console.error('[Guardian] Fetch tools error:', err);
  }
}

async function tryRefreshToken() {
  const result = await chrome.storage.sync.get(['refreshToken']);
  if (!result.refreshToken || !supabaseUrl || !supabaseKey) return false;

  try {
    const res = await fetch(supabaseUrl + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: result.refreshToken })
    });

    if (!res.ok) return false;

    const data = await res.json();
    accessToken = data.access_token;
    await chrome.storage.sync.set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token
    });
    console.log('[Guardian] Token refreshed successfully');
    return true;
  } catch {
    return false;
  }
}

// ---- DOMAIN MATCHING ----
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function findToolByUrl(tabUrl) {
  if (!tabUrl || !tools.length) return null;
  const tabDomain = extractDomain(tabUrl);
  if (!tabDomain) return null;

  for (const tool of tools) {
    if (!tool.tool_url) continue;
    const toolDomain = extractDomain(tool.tool_url);
    if (!toolDomain) continue;

    // Match: tab domain contains tool domain or vice versa
    // e.g. "app.figma.com" matches "figma.com"
    if (tabDomain === toolDomain || 
        tabDomain.endsWith('.' + toolDomain) || 
        toolDomain.endsWith('.' + tabDomain)) {
      return tool;
    }
  }
  return null;
}

// ---- TRACKING ----
function startTracking(tool) {
  if (activeToolId === tool.id) return; // Already tracking this tool

  // Stop tracking previous tool first
  stopTracking();

  activeToolId = tool.id;
  activeStartTime = Date.now();

  chrome.action.setBadgeText({ text: '●' });
  chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  console.log('[Guardian] Tracking:', tool.name);
}

function stopTracking() {
  if (!activeToolId || !activeStartTime) return;

  const elapsed = Math.floor((Date.now() - activeStartTime) / 1000);
  if (elapsed >= MIN_ACTIVE_SECONDS) {
    const current = pendingUsage.get(activeToolId) || 0;
    pendingUsage.set(activeToolId, current + elapsed);
    console.log('[Guardian] Recorded', elapsed, 'seconds for', activeToolId);
  }

  activeToolId = null;
  activeStartTime = null;
  chrome.action.setBadgeText({ text: '' });
}

// Tab events
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab.url);
  } catch {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    handleTabChange(changeInfo.url);
  }
});

// Window focus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus - stop tracking
    stopTracking();
  } else {
    // Browser regained focus - check active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) handleTabChange(tabs[0].url);
    });
  }
});

// Idle detection
if (chrome.idle) {
  chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
  chrome.idle.onStateChanged.addListener((state) => {
    if (state === 'idle' || state === 'locked') {
      isUserActive = false;
      stopTracking();
    } else {
      isUserActive = true;
      // Re-check current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) handleTabChange(tabs[0].url);
      });
    }
  });
}

function handleTabChange(url) {
  if (!isUserActive) return;

  const tool = findToolByUrl(url);
  if (tool) {
    startTracking(tool);
  } else {
    stopTracking();
  }
}

// ---- SYNC TO SUPABASE ----
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncUsage') {
    // Record current active session time before syncing
    if (activeToolId && activeStartTime) {
      const elapsed = Math.floor((Date.now() - activeStartTime) / 1000);
      if (elapsed >= MIN_ACTIVE_SECONDS) {
        const current = pendingUsage.get(activeToolId) || 0;
        pendingUsage.set(activeToolId, current + elapsed);
      }
      activeStartTime = Date.now(); // Reset start time
    }
    syncToSupabase();
  }
  if (alarm.name === 'refreshTools') {
    fetchTools();
  }
});

async function syncToSupabase() {
  if (pendingUsage.size === 0 || !supabaseUrl || !supabaseKey || !accessToken) return;

  const usageSnapshot = new Map(pendingUsage);
  pendingUsage.clear();

  for (const [toolId, seconds] of usageSnapshot) {
    try {
      // Get current tool data
      const getRes = await fetch(
        supabaseUrl + '/rest/v1/tools?id=eq.' + toolId + '&select=times_used,last_used,usage_history,current_streak,longest_streak',
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': 'Bearer ' + accessToken,
            'Accept': 'application/vnd.pgrst.object+json',
          }
        }
      );

      if (!getRes.ok) {
        console.error('[Guardian] Failed to get tool', toolId, getRes.status);
        // Put usage back for retry
        const existing = pendingUsage.get(toolId) || 0;
        pendingUsage.set(toolId, existing + seconds);
        continue;
      }

      const currentTool = await getRes.json();
      const now = new Date().toISOString();

      const usageEntry = {
        id: crypto.randomUUID(),
        timestamp: now,
        duration: seconds,
        source: 'extension'
      };

      const existingHistory = currentTool.usage_history || [];
      const newHistory = [...existingHistory, usageEntry];

      // Update tool
      const updateRes = await fetch(
        supabaseUrl + '/rest/v1/tools?id=eq.' + toolId,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            last_used: now,
            times_used: (currentTool.times_used || 0) + 1,
            usage_history: newHistory,
            updated_at: now,
          })
        }
      );

      if (updateRes.ok) {
        console.log('[Guardian] Synced', seconds, 'seconds for tool', toolId);
        // Save sync log locally
        await saveSyncLog(toolId, seconds, now);
      } else {
        console.error('[Guardian] Sync failed for', toolId, updateRes.status);
        const existing = pendingUsage.get(toolId) || 0;
        pendingUsage.set(toolId, existing + seconds);
      }
    } catch (err) {
      console.error('[Guardian] Sync error:', err);
      const existing = pendingUsage.get(toolId) || 0;
      pendingUsage.set(toolId, existing + seconds);
    }
  }
}

async function saveSyncLog(toolId, seconds, timestamp) {
  const result = await chrome.storage.local.get(['syncLog']);
  const log = result.syncLog || [];
  log.push({ toolId, seconds, timestamp });
  // Keep last 100 entries
  const trimmed = log.slice(-100);
  await chrome.storage.local.set({ syncLog: trimmed });
}

// ---- MESSAGE HANDLING ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CONNECT': {
      const { supabaseUrl: url, supabaseKey: key, accessToken: token, refreshToken } = message;
      saveConfig(url, key, token, refreshToken).then(() => {
        fetchTools().then(() => {
          sendResponse({ success: true, toolCount: tools.length });
        });
      });
      return true;
    }

    case 'DISCONNECT':
      chrome.storage.sync.clear();
      chrome.storage.local.clear();
      tools = [];
      stopTracking();
      sendResponse({ success: true });
      break;

    case 'GET_STATUS':
      sendResponse({
        connected: !!(supabaseUrl && accessToken),
        toolCount: tools.length,
        activeToolId,
        pendingSync: pendingUsage.size,
      });
      break;

    case 'GET_TOOLS':
      sendResponse({ tools });
      break;

    case 'GET_SYNC_LOG':
      chrome.storage.local.get(['syncLog'], (result) => {
        sendResponse({ log: result.syncLog || [] });
      });
      return true;

    case 'REFRESH_TOOLS':
      fetchTools().then(() => {
        sendResponse({ success: true, toolCount: tools.length });
      });
      return true;

    case 'CHECK_DUPLICATE':
      checkForDuplicate(message.category, message.productName).then(sendResponse);
      return true;
  }
});

async function checkForDuplicate(category, productName) {
  const similar = tools.filter(tool =>
    tool.category?.toLowerCase() === category?.toLowerCase()
  );

  if (similar.length > 0) {
    const leastUsed = similar.reduce((min, tool) =>
      (tool.times_used || 0) < (min.times_used || 0) ? tool : min
    );

    return {
      hasDuplicates: true,
      count: similar.length,
      leastUsed: leastUsed,
      leastUsedTime: leastUsed.times_used || 0
    };
  }

  return { hasDuplicates: false };
}
`,

  'content-deal-sites.js': `// StackVault Guardian - Deal Site Content Script
(function() {
  'use strict';
  
  setTimeout(scanPage, 2000);
  
  function scanPage() {
    const category = extractCategory();
    const productName = extractProductName();
    
    if (category || productName) {
      checkForDuplicates(category, productName);
    }
  }
  
  function extractCategory() {
    const categoryEl = document.querySelector('[data-category]') ||
                       document.querySelector('.product-category') ||
                       document.querySelector('.breadcrumb a:last-child');
    
    if (categoryEl) {
      return categoryEl.textContent?.trim() || categoryEl.getAttribute('data-category');
    }
    
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      const keywords = metaKeywords.content.split(',');
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
    const existing = document.getElementById('stackvault-guardian-popup');
    if (existing) existing.remove();
    
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
        animation: svGuardianSlideIn 0.3s ease-out;
      ">
        <style>
          @keyframes svGuardianSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
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
            
            \${data.leastUsed ? \`<div style="
              background: rgba(249, 115, 22, 0.1);
              border: 1px solid rgba(249, 115, 22, 0.3);
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 12px;
            ">
              <p style="margin: 0; font-size: 13px; color: #fbbf24;">
                <strong>\${data.leastUsed.name}</strong> has only been used <strong style="color: #ef4444;">\${data.leastUsedTime} time\${data.leastUsedTime !== 1 ? 's' : ''}</strong>.
              </p>
            </div>\` : ''}
            
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #fff;">
              Do you really need this one?
            </p>
          </div>
          
          <button onclick="this.closest('#stackvault-guardian-popup').remove()" style="
            background: none; border: none; color: #888; cursor: pointer; padding: 4px; font-size: 20px; line-height: 1;
          ">×</button>
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button onclick="this.closest('#stackvault-guardian-popup').remove()" style="
            flex: 1; background: #22c55e; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
          ">I'll use what I have</button>
          <button onclick="this.closest('#stackvault-guardian-popup').remove()" style="
            background: transparent; color: #888; border: 1px solid #444; padding: 10px 16px; border-radius: 6px; font-size: 13px; cursor: pointer;
          ">Buy anyway</button>
        </div>
      </div>
    \`;
    
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 30000);
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 340px;
      min-height: 420px;
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
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    
    .title { font-size: 16px; font-weight: 600; }
    .subtitle { font-size: 11px; color: #888; }
    
    .status {
      margin-left: auto;
      display: flex; align-items: center; gap: 6px;
      font-size: 12px;
    }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%;
    }
    .status-dot.connected { background: #22c55e; }
    .status-dot.disconnected { background: #ef4444; }
    
    .content { padding: 16px; }
    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
      color: #888; margin-bottom: 12px;
    }
    
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 12px;
    }
    .stat-value { font-size: 24px; font-weight: 600; color: #8b5cf6; }
    .stat-label { font-size: 11px; color: #888; margin-top: 4px; }
    
    .tool-list { max-height: 160px; overflow-y: auto; }
    .tool-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; background: rgba(255,255,255,0.05);
      border-radius: 6px; margin-bottom: 6px; font-size: 13px;
    }
    .tool-item .tracking-badge {
      font-size: 10px; background: #22c55e20; color: #22c55e;
      padding: 2px 6px; border-radius: 4px;
    }
    .tool-domain { font-size: 11px; color: #888; }
    
    .empty-state { text-align: center; padding: 24px; color: #666; font-size: 13px; }
    
    /* Connect form */
    .connect-section { padding: 16px; }
    .connect-section h3 { font-size: 14px; margin-bottom: 8px; }
    .connect-section p { font-size: 12px; color: #888; margin-bottom: 12px; line-height: 1.5; }
    
    .token-input {
      width: 100%; background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px; padding: 10px 12px;
      color: #fff; font-size: 12px; font-family: monospace;
      resize: vertical; min-height: 60px;
    }
    .token-input::placeholder { color: #555; }
    
    .btn {
      width: 100%; padding: 10px; border: none; border-radius: 6px;
      font-size: 13px; font-weight: 500; cursor: pointer; margin-top: 8px;
    }
    .btn-primary { background: #8b5cf6; color: white; }
    .btn-primary:hover { background: #7c3aed; }
    .btn-danger { background: #ef444420; color: #ef4444; border: 1px solid #ef444440; }
    .btn-danger:hover { background: #ef444430; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
    
    .footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      text-align: center;
    }
    .footer a { color: #8b5cf6; text-decoration: none; font-size: 12px; }
    
    .error-msg { color: #ef4444; font-size: 12px; margin-top: 8px; }
    .success-msg { color: #22c55e; font-size: 12px; margin-top: 8px; }
    
    .active-tracking {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 8px; padding: 12px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .active-tracking .pulse {
      width: 10px; height: 10px; border-radius: 50%; background: #22c55e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    .active-tracking span { font-size: 13px; }
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
      <div class="subtitle">Auto usage tracker</div>
    </div>
    <div class="status">
      <div class="status-dot" id="statusDot"></div>
      <span id="statusText">...</span>
    </div>
  </div>
  
  <!-- Connected View -->
  <div id="connectedView" style="display:none;">
    <div class="content">
      <div id="activeTracking" class="active-tracking" style="display:none;">
        <div class="pulse"></div>
        <span>Tracking: <strong id="activeToolName"></strong></span>
      </div>
      
      <div class="section">
        <div class="section-title">Dashboard</div>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value" id="toolCount">0</div>
            <div class="stat-label">Tools Tracked</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="pendingSync">0</div>
            <div class="stat-label">Pending Sync</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Your Tools</div>
        <div class="tool-list" id="toolList">
          <div class="empty-state">Loading tools...</div>
        </div>
      </div>
      
      <button class="btn btn-secondary" id="refreshBtn">↻ Refresh Tools</button>
      <button class="btn btn-danger" id="disconnectBtn" style="margin-top:8px;">Disconnect</button>
    </div>
  </div>
  
  <!-- Disconnected View -->
  <div id="disconnectedView" style="display:none;">
    <div class="connect-section">
      <h3>Connect to StackVault</h3>
      <p>
        Go to your StackVault app → Extension page → click <strong>"Generate Connection Token"</strong>, then paste it below.
      </p>
      <textarea class="token-input" id="tokenInput" placeholder="Paste your connection token here..."></textarea>
      <button class="btn btn-primary" id="connectBtn">Connect</button>
      <div id="connectMsg"></div>
    </div>
  </div>
  
  <div class="footer">
    <a href="#" id="openDashboard">Open StackVault Dashboard →</a>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>`,

  'popup.js': `// StackVault Guardian v2 - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const status = await sendMessage({ type: 'GET_STATUS' });
  
  if (status?.connected) {
    showConnectedView(status);
  } else {
    showDisconnectedView();
  }
  
  // Connect button
  document.getElementById('connectBtn').addEventListener('click', async () => {
    const msgEl = document.getElementById('connectMsg');
    const input = document.getElementById('tokenInput').value.trim();
    
    if (!input) {
      msgEl.className = 'error-msg';
      msgEl.textContent = 'Please paste a connection token.';
      return;
    }
    
    try {
      const parsed = JSON.parse(atob(input));
      if (!parsed.supabaseUrl || !parsed.supabaseKey || !parsed.accessToken) {
        throw new Error('Invalid token format');
      }
      
      const result = await sendMessage({
        type: 'CONNECT',
        ...parsed
      });
      
      if (result?.success) {
        msgEl.className = 'success-msg';
        msgEl.textContent = 'Connected! Loaded ' + (result.toolCount || 0) + ' tools.';
        setTimeout(() => {
          const newStatus = { connected: true, toolCount: result.toolCount, pendingSync: 0 };
          showConnectedView(newStatus);
        }, 1000);
      } else {
        msgEl.className = 'error-msg';
        msgEl.textContent = 'Connection failed. Try generating a new token.';
      }
    } catch (e) {
      msgEl.className = 'error-msg';
      msgEl.textContent = 'Invalid token. Please copy the full token from StackVault.';
    }
  });
  
  // Disconnect button
  document.getElementById('disconnectBtn').addEventListener('click', async () => {
    await sendMessage({ type: 'DISCONNECT' });
    showDisconnectedView();
  });
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    btn.textContent = 'Refreshing...';
    const result = await sendMessage({ type: 'REFRESH_TOOLS' });
    btn.textContent = '↻ Refresh Tools';
    if (result?.success) {
      await loadToolList();
      document.getElementById('toolCount').textContent = result.toolCount || 0;
    }
  });
  
  // Dashboard link
  document.getElementById('openDashboard').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: window.location.origin || 'https://stackkeeper.lovable.app' });
  });
});

function showConnectedView(status) {
  document.getElementById('connectedView').style.display = 'block';
  document.getElementById('disconnectedView').style.display = 'none';
  document.getElementById('statusDot').className = 'status-dot connected';
  document.getElementById('statusText').textContent = 'Connected';
  document.getElementById('toolCount').textContent = status.toolCount || 0;
  document.getElementById('pendingSync').textContent = status.pendingSync || 0;
  
  if (status.activeToolId) {
    document.getElementById('activeTracking').style.display = 'flex';
    // Find tool name
    sendMessage({ type: 'GET_TOOLS' }).then(res => {
      const tool = res?.tools?.find(t => t.id === status.activeToolId);
      document.getElementById('activeToolName').textContent = tool?.name || 'Unknown';
    });
  }
  
  loadToolList();
}

function showDisconnectedView() {
  document.getElementById('connectedView').style.display = 'none';
  document.getElementById('disconnectedView').style.display = 'block';
  document.getElementById('statusDot').className = 'status-dot disconnected';
  document.getElementById('statusText').textContent = 'Not connected';
}

async function loadToolList() {
  const res = await sendMessage({ type: 'GET_TOOLS' });
  const tools = res?.tools || [];
  const list = document.getElementById('toolList');
  
  if (tools.length === 0) {
    list.innerHTML = '<div class="empty-state">No tools with URLs found.<br>Add tool URLs in StackVault to enable tracking.</div>';
    return;
  }
  
  // Only show tools that have a tool_url
  const trackable = tools.filter(t => t.tool_url);
  
  if (trackable.length === 0) {
    list.innerHTML = '<div class="empty-state">No tools with URLs set.<br>Add URLs to your tools in StackVault.</div>';
    return;
  }
  
  list.innerHTML = trackable.map(tool => {
    let domain = '';
    try { domain = new URL(tool.tool_url).hostname; } catch {}
    return \`
      <div class="tool-item">
        <div>
          <div>\${tool.name}</div>
          <div class="tool-domain">\${domain}</div>
        </div>
        <span class="tracking-badge">auto</span>
      </div>
    \`;
  }).join('');
}

function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      resolve(response);
    });
  });
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

  'README.md': `# StackVault Guardian v2 - Chrome Extension

## What's New in v2
- **Auto-sync to StackVault** - Usage is automatically synced to your dashboard
- **Auto-detect tools** - Tools are matched by their URL (no manual domain setup needed)
- **Idle detection** - Stops tracking when you're away from keyboard
- **Token-based auth** - Secure connection to your StackVault account

## Setup

1. **Download & extract** the ZIP file
2. Go to \\\`chrome://extensions/\\\` and enable **Developer Mode**
3. Click **"Load unpacked"** and select the extracted folder
4. In StackVault, go to the **Extension** page
5. Click **"Generate Connection Token"**
6. Click the Guardian extension icon and **paste the token**

## How It Works

1. Guardian fetches your tools (with URLs) from StackVault
2. When you visit a tool's website, it starts tracking time automatically
3. Every minute, accumulated usage is synced back to StackVault
4. Your dashboard updates with accurate, passive usage data

## Privacy
- Only tracks domains matching your tool URLs
- No browsing history collected
- Data syncs only to your StackVault account
`
};

export const generateExtensionZip = async (): Promise<Blob> => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  Object.entries(extensionFiles).forEach(([filename, content]) => {
    if (filename.includes('/')) {
      const parts = filename.split('/');
      zip.folder(parts.slice(0, -1).join('/'));
    }
    zip.file(filename, content);
  });
  
  return await zip.generateAsync({ type: 'blob' });
};
