#!/usr/bin/env node

/**
 * Standalone SharePoint Document Tree Inspector
 * Recursively inspects a SharePoint site or folder URL and outputs the complete document tree.
 *
 * Usage:
 *   node scripts/fetch-sharepoint-tree.js
 *   node scripts/fetch-sharepoint-tree.js --json
 *   node scripts/fetch-sharepoint-tree.js --out=tree.json
 *   node scripts/fetch-sharepoint-tree.js --url="https://..."
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Manually parse scripts/.env if present, without exposing or printing secrets
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const localEnv = loadEnvFile(path.join(__dirname, '.env'));

// Command-line arguments
const args = process.argv.slice(2);
const isJsonMode = args.includes('--json');
const outFileArg = args.find((a) => a.startsWith('--out='));
const outFilePath = outFileArg ? outFileArg.split('=')[1] : null;
const customUrlArg = args.find((a) => a.startsWith('--url='));
const customUrl = customUrlArg ? customUrlArg.split('=')[1] : null;
const parentFolderIdArg = args.find((a) => a.startsWith('--parent-id='));

// Credentials from environment or scripts/.env
const tenantId = process.env.TENANT_ID || localEnv.TENANT_ID;
const clientId = process.env.CLIENT_ID || localEnv.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET || localEnv.CLIENT_SECRET;
const sharepointUrl = customUrl || process.env.SHAREPOINT_URL || localEnv.SHAREPOINT_URL;
const sharepointParentFolderId =
  (parentFolderIdArg ? parentFolderIdArg.split('=')[1] : null) ||
  process.env.SHAREPOINT_PARENT_FOLDER_ID ||
  localEnv.SHAREPOINT_PARENT_FOLDER_ID;

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validation
if (!tenantId || !clientId || !clientSecret || tenantId.includes('your-azure-tenant-id')) {
  console.error('\n❌ Missing or incomplete Microsoft Graph credentials.');
  console.error('👉 Please edit "scripts/.env" and fill in your real TENANT_ID, CLIENT_ID, and CLIENT_SECRET.\n');
  process.exit(1);
}

if (!sharepointUrl || sharepointUrl.includes('YourSite/Shared')) {
  console.error('\n❌ Missing or placeholder SHAREPOINT_URL.');
  console.error('👉 Please specify a valid SharePoint URL in "scripts/.env" or pass --url="https://..."\n');
  process.exit(1);
}

/**
 * Fetch OAuth2 token from Microsoft Entra ID
 */
async function getAccessToken(tId, cId, cSec) {
  const tokenUrl = `https://login.microsoftonline.com/${tId}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', cId);
  params.append('client_secret', cSec);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Authentication failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Helper to fetch from Microsoft Graph with retry on 429
 */
async function graphFetch(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return graphFetch(url, token);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Graph API error (${res.status} ${res.statusText}): ${errText}`);
  }

  return res.json();
}

/**
 * Resolve SharePoint site and drive targets
 */
async function resolveSharePointTarget(targetUrl, token) {
  const parsed = new URL(targetUrl);
  const idParam = parsed.searchParams.get('id');
  const fullPath = decodeURIComponent(idParam || parsed.pathname);

  const siteMatch = fullPath.match(/^(\/sites\/[^/]+)/);
  const sitePath = siteMatch ? siteMatch[1] : fullPath;

  if (!sitePath) {
    throw new Error(`Could not parse SharePoint site path from URL: ${targetUrl}`);
  }

  // 1. Get Site details
  const siteApiUrl = `https://graph.microsoft.com/v1.0/sites/${parsed.hostname}:${sitePath}`;
  const siteData = await graphFetch(siteApiUrl, token);
  const siteId = siteData.id;

  // 2. Fetch all document libraries (drives) in site
  const drivesData = await graphFetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, token);
  const drives = drivesData.value || [];

  const pathAfterSite = fullPath.substring(sitePath.length).replace(/^\//, '');
  const segments = pathAfterSite.split('/').filter(Boolean);
  const firstSegment = segments[0];

  let matchedDrive = drives.find(
    (d) =>
      (firstSegment && d.name.toLowerCase() === firstSegment.toLowerCase()) ||
      (firstSegment && d.webUrl && d.webUrl.toLowerCase().endsWith('/' + firstSegment.toLowerCase()))
  );

  let folderPathInDrive = '';
  if (matchedDrive) {
    folderPathInDrive = segments.slice(1).join('/');
  } else {
    matchedDrive = drives.find((d) => d.name === 'Documents' || d.name === 'Shared Documents') || drives[0];
    folderPathInDrive = pathAfterSite;
  }

  if (!matchedDrive) {
    throw new Error(`Could not locate document library for site ${sitePath}`);
  }

  return {
    siteId,
    siteName: siteData.displayName || siteData.name,
    driveId: matchedDrive.id,
    driveName: matchedDrive.name,
    folderPathInDrive,
  };
}

/**
 * Recursively fetch folder children using Graph DriveItem ID (maxDepth limits traversal)
 * Level 1 = root folder (Merchant Uploads)
 * Level 2 = merchant folders
 * Beyond level 2: only record folder name, do not scan deeper children
 */
async function fetchFolderNodeById(driveId, itemId, token, displayName = null, currentDepth = 1, maxDepth = 2) {
  const initialUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/children?$top=200`;
  const children = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    const data = await graphFetch(nextUrl, token);
    const items = data.value || [];

    for (const item of items) {
      if (item.folder) {
        if (currentDepth < maxDepth) {
          // Go deeper
          const subNode = await fetchFolderNodeById(driveId, item.id, token, item.name, currentDepth + 1, maxDepth);
          subNode.id = item.id;
          subNode.webUrl = item.webUrl;
          subNode.lastModified = item.lastModifiedDateTime;
          children.push(subNode);
        } else {
          // At max depth: just list the folder name, do not fetch sub-children
          children.push({
            id: item.id,
            name: item.name,
            type: 'folder',
            size: item.size || 0,
            webUrl: item.webUrl,
            lastModified: item.lastModifiedDateTime,
            truncated: true,
            children: [],
          });
        }
      } else if (item.file) {
        children.push({
          id: item.id,
          name: item.name,
          type: 'file',
          size: item.size || 0,
          webUrl: item.webUrl,
          lastModified: item.lastModifiedDateTime,
          mimeType: item.file?.mimeType || 'application/octet-stream',
          downloadUrl: item['@microsoft.graph.downloadUrl'] || null,
        });
      }
    }

    nextUrl = data['@odata.nextLink'] || null;
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const folderSize = children.reduce((acc, c) => acc + (c.size || 0), 0);

  return {
    id: itemId,
    name: displayName || itemId,
    type: 'folder',
    size: folderSize,
    children,
  };
}

/**
 * Recursively fetch folder children by path (maxDepth limits traversal)
 */
async function fetchFolderNode(driveId, folderPath, token, displayName = null, currentDepth = 1, maxDepth = 2) {
  let initialUrl;
  if (folderPath) {
    const encoded = encodeURIComponent(folderPath).replace(/%2F/g, '/');
    initialUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encoded}:/children?$top=200`;
  } else {
    initialUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children?$top=200`;
  }

  const children = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    const data = await graphFetch(nextUrl, token);
    const items = data.value || [];

    for (const item of items) {
      if (item.folder) {
        if (currentDepth < maxDepth) {
          const subPath = folderPath ? `${folderPath}/${item.name}` : item.name;
          const subNode = await fetchFolderNode(driveId, subPath, token, item.name, currentDepth + 1, maxDepth);
          subNode.id = item.id;
          subNode.webUrl = item.webUrl;
          subNode.lastModified = item.lastModifiedDateTime;
          children.push(subNode);
        } else {
          // At max depth: just list the folder name
          children.push({
            id: item.id,
            name: item.name,
            type: 'folder',
            size: item.size || 0,
            webUrl: item.webUrl,
            lastModified: item.lastModifiedDateTime,
            truncated: true,
            children: [],
          });
        }
      } else if (item.file) {
        children.push({
          id: item.id,
          name: item.name,
          type: 'file',
          size: item.size || 0,
          webUrl: item.webUrl,
          lastModified: item.lastModifiedDateTime,
          mimeType: item.file?.mimeType || 'application/octet-stream',
          downloadUrl: item['@microsoft.graph.downloadUrl'] || null,
        });
      }
    }

    nextUrl = data['@odata.nextLink'] || null;
  }

  // Sort: folders first, then alphabetical
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const folderSize = children.reduce((acc, c) => acc + (c.size || 0), 0);

  return {
    id: null,
    name: displayName || folderPath || '(root)',
    type: 'folder',
    path: folderPath || '/',
    size: folderSize,
    children,
  };
}

/**
 * Print visual ASCII tree to console
 */
function printAsciiTree(node, prefix = '', isLast = true, isRoot = true) {
  if (isRoot) {
    console.log(`📁 ${node.name} [${formatBytes(node.size)}]`);
  } else {
    const marker = isLast ? '└── ' : '├── ';
    if (node.type === 'folder') {
      const suffix = node.truncated ? ' [Folder - contents collapsed]' : ` (${node.children?.length || 0} items)`;
      console.log(`${prefix}${marker}📁 ${node.name}/${suffix} [${formatBytes(node.size)}]`);
    } else {
      console.log(`${prefix}${marker}📄 ${node.name} [${formatBytes(node.size)}]`);
    }
  }

  if (node.children && node.children.length > 0) {
    const newPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
    node.children.forEach((child, idx) => {
      const childIsLast = idx === node.children.length - 1;
      printAsciiTree(child, newPrefix, childIsLast, false);
    });
  }
}

/**
 * Calculate totals summary
 */
function calculateSummary(node) {
  let files = 0;
  let folders = 0;
  let totalBytes = 0;

  function traverse(n) {
    if (n.type === 'file') {
      files++;
      totalBytes += n.size || 0;
    } else if (n.type === 'folder') {
      folders++;
      if (n.children) {
        n.children.forEach(traverse);
      }
    }
  }

  traverse(node);
  return { files, folders: Math.max(0, folders - 1), totalBytes };
}

async function main() {
  console.log('🔄 Authenticating with Microsoft Graph...');
  const token = await getAccessToken(tenantId, clientId, clientSecret);
  console.log('✅ Authenticated.');

  console.log(`🔍 Resolving SharePoint target from URL: ${sharepointUrl}...`);
  const target = await resolveSharePointTarget(sharepointUrl, token);
  console.log(`   🌐 Site: ${target.siteName}`);
  console.log(`   📚 Library (Drive): ${target.driveName}`);
  console.log(`   📂 Starting Path: /${target.folderPathInDrive || '(root)'}`);

  // Fetch Parent Folder Information
  const segments = (target.folderPathInDrive || '').split('/').filter(Boolean);
  if (segments.length > 0) {
    const parentSegments = segments.slice(0, -1);
    const parentPath = parentSegments.join('/');
    const parentDisplayName = parentSegments[parentSegments.length - 1] || target.driveName;

    console.log(`\n⬆️  Parent Folder Information:`);
    console.log(`   📁 Parent Path: /${parentPath || '(library root)'}`);
    console.log(`   🏷️  Parent Name: ${parentDisplayName}`);

    try {
      let parentApiUrl;
      if (parentPath) {
        const encodedParent = encodeURIComponent(parentPath).replace(/%2F/g, '/');
        parentApiUrl = `https://graph.microsoft.com/v1.0/drives/${target.driveId}/root:/${encodedParent}`;
      } else {
        parentApiUrl = `https://graph.microsoft.com/v1.0/drives/${target.driveId}/root`;
      }
      const parentData = await graphFetch(parentApiUrl, token);
      if (parentData.id) console.log(`   🔑 Parent Item ID: ${parentData.id}`);
      if (parentData.webUrl) console.log(`   🔗 Parent Web URL: ${parentData.webUrl}`);
      if (parentData.lastModifiedDateTime) {
        console.log(`   🕒 Parent Last Modified: ${parentData.lastModifiedDateTime}`);
      }

      // List peer items / sibling count in parent
      const parentChildrenUrl = `${parentApiUrl}/children?$select=id,name,folder,file&$top=100`;
      const siblingsData = await graphFetch(parentChildrenUrl, token);
      const siblingItems = siblingsData.value || [];
      const siblingFolders = siblingItems.filter((i) => i.folder).map((i) => i.name);
      console.log(`   👥 Folders in Parent (${siblingFolders.length}): ${siblingFolders.slice(0, 8).join(', ')}${siblingFolders.length > 8 ? '...' : ''}`);
    } catch (parentErr) {
      console.warn(`   ⚠️ Could not fetch extra parent metadata: ${parentErr.message}`);
    }
  } else {
    console.log(`\nℹ️  The current URL points directly to the document library root; there is no parent folder above this.`);
  }

  // If SHAREPOINT_PARENT_FOLDER_ID is provided, fetch and display its full tree
  if (sharepointParentFolderId) {
    console.log(`\n======================================================`);
    console.log(`📂 FETCHING PARENT FOLDER TREE (ID: ${sharepointParentFolderId})`);
    console.log(`======================================================\n`);

    try {
      const parentItemMeta = await graphFetch(
        `https://graph.microsoft.com/v1.0/drives/${target.driveId}/items/${sharepointParentFolderId}`,
        token
      );
      console.log(`   🏷️  Parent Folder Name: ${parentItemMeta.name || sharepointParentFolderId}`);
      if (parentItemMeta.webUrl) console.log(`   🔗 Web URL: ${parentItemMeta.webUrl}`);

      const parentTree = await fetchFolderNodeById(
        target.driveId,
        sharepointParentFolderId,
        token,
        parentItemMeta.name || sharepointParentFolderId,
        1,
        2
      );
      const parentSummary = calculateSummary(parentTree);

      // Merchant folder count = direct folder children of Merchant Uploads
      const merchantFolders = (parentTree.children || []).filter((c) => c.type === 'folder');

      console.log('\n--- PARENT FOLDER TREE (2 Levels Deep) ---');
      printAsciiTree(parentTree);
      console.log('------------------------------------------------------');
      console.log(
        `📊 Parent Summary: ${parentSummary.folders} folder(s), ${parentSummary.files} file(s) | Total Size: ${formatBytes(parentSummary.totalBytes)}`
      );
      console.log(`🏢 Merchant Count (under "${parentItemMeta.name || 'Merchant Uploads'}"): ${merchantFolders.length} merchants`);
      console.log('======================================================\n');
    } catch (parentTreeErr) {
      console.error(`❌ Failed to fetch parent folder tree by ID "${sharepointParentFolderId}":`, parentTreeErr.message);
    }
  }

  console.log('\n⏳ Fetching complete document tree for target path (2 levels deep)...');
  const tree = await fetchFolderNode(target.driveId, target.folderPathInDrive, token, target.folderPathInDrive || target.driveName, 1, 2);
  const summary = calculateSummary(tree);
  const rootMerchantFolders = (tree.children || []).filter((c) => c.type === 'folder');

  if (isJsonMode) {
    console.log(JSON.stringify(tree, null, 2));
  } else {
    console.log('\n======================================================');
    console.log('📂 SHAREPOINT DOCUMENT TREE (2 Levels Deep)');
    console.log('======================================================\n');
    printAsciiTree(tree);
    console.log('\n------------------------------------------------------');
    console.log(`📊 Summary: ${summary.folders} folder(s), ${summary.files} file(s) | Total Size: ${formatBytes(summary.totalBytes)}`);
    if (rootMerchantFolders.length > 0) {
      console.log(`🏢 Merchant Count (Direct Subfolders): ${rootMerchantFolders.length} merchants`);
    }
    console.log('======================================================\n');
  }

  if (outFilePath) {
    fs.writeFileSync(outFilePath, JSON.stringify(tree, null, 2), 'utf8');
    console.log(`💾 Saved tree structure to: ${outFilePath}`);
  }
}

main().catch((err) => {
  console.error('\n❌ Execution failed:', err.message);
  process.exit(1);
});

