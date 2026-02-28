function extractItemIds(text) {
    // Returns a Set of item IDs found in the text
    const itemIds = new Set();
    const isHTML = /<[a-z][\s\S]*>/i.test(text);

    // If content contains HTML (e.g. pasted directly from a webpage), parse it and
    // extract item IDs from href attributes like /item=12345 or /item/12345.
    // This replicates the "Grouper" workflow: select items on Wowhead / The Undermine
    // Journal / WoWuction, copy, paste here.
    if (isHTML) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            doc.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const itemMatch = href.match(/item[/=](\d+)/i);
                    if (itemMatch) {
                        itemIds.add(itemMatch[1]);
                    }
                }
            });
        } catch (e) {
            console.warn('HTML parsing failed:', e);
        }
    }

    // Pattern 1: Wowhead URLs with item IDs
    // https://www.wowhead.com/item=12345 or https://www.wowhead.com/item=12345/item-name
    const wowheadUrlPattern = /wowhead\.com\/[a-z]*\/?item[=/](\d+)/gi;
    let match;
    while ((match = wowheadUrlPattern.exec(text)) !== null) {
        itemIds.add(match[1]);
    }

    // Pattern 2: Direct item IDs (numbers separated by commas, spaces, or newlines)
    // Skip for HTML input to avoid extracting unrelated numbers from markup.
    if (!isHTML) {
        const numberPattern = /\b(\d+)\b/g;
        while ((match = numberPattern.exec(text)) !== null) {
            itemIds.add(match[1]);
        }
    }

    // Pattern 3: item:xxxxx format
    const itemFormatPattern = /item:(\d+)/gi;
    while ((match = itemFormatPattern.exec(text)) !== null) {
        itemIds.add(match[1]);
    }

    // Pattern 4: i:xxxxx format (already TSM format)
    const tsmFormatPattern = /i:(\d+)/gi;
    while ((match = tsmFormatPattern.exec(text)) !== null) {
        itemIds.add(match[1]);
    }

    return itemIds;
}

async function searchWowheadForItemName(itemName) {
    // Note: Due to CORS restrictions and ad blockers, automated searching may not work
    // This function attempts to search but provides helpful feedback if it fails
    
    // Try to use allorigins which is more reliable
    const proxy = 'https://api.allorigins.win/raw?url=';
    const searchUrl = `https://www.wowhead.com/items?filter=na=${encodeURIComponent(itemName)}`;
    
    try {
        const proxyUrl = proxy + encodeURIComponent(searchUrl);
        const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(8000) // 8 second timeout
        });
        
        if (!response.ok) {
            throw new Error('Response not OK');
        }
        
        const html = await response.text();
        
        // Extract the first item ID from the search results
        // Wowhead embeds item data in JavaScript within the page
        const listviewMatch = html.match(/new Listview\(\{[^}]*template:\s*'item'[^}]*data:\s*(\[[\s\S]*?\])\}/);
        
        if (listviewMatch && listviewMatch[1]) {
            try {
                const data = JSON.parse(listviewMatch[1]);
                if (data && data.length > 0 && data[0].id) {
                    // Extract the actual item name from Wowhead if available
                    const foundName = data[0].name_enus || data[0].name || itemName;
                    return { success: true, id: data[0].id.toString(), searchedName: itemName, foundName: foundName };
                }
            } catch (e) {
                console.error('Failed to parse Wowhead data:', e);
            }
        }
        
        // Fallback: try to find item IDs in the HTML directly
        const itemIdMatch = html.match(/\/item[=/](\d+)/);
        if (itemIdMatch) {
            return { success: true, id: itemIdMatch[1], searchedName: itemName, foundName: itemName };
        }
        
        return { success: false, name: itemName, error: 'No item found', searchUrl };
        
    } catch (error) {
        console.warn(`Search failed for "${itemName}":`, error.message);
        return { success: false, name: itemName, error: error.message, searchUrl };
    }
}

function extractItemNames(text) {
    const itemNames = [];
    // Extract item names from square brackets like [Thunderfury, Blessed Blade of the Windseeker]
    const itemNamePattern = /\[([^\]]+)\]/g;
    let match;
    while ((match = itemNamePattern.exec(text)) !== null) {
        itemNames.push(match[1]);
    }
    return itemNames;
}

function formatSearchLinks(failedSearches) {
    // Helper function to format failed searches as HTML links
    return failedSearches.map(item => 
        `<a href="${item.searchUrl}" target="_blank" style="color: #58a6ff;">${escapeHtml(item.name)}</a>`
    ).join(', ');
}

function escapeHtml(text) {
    // Helper function to escape HTML special characters to prevent XSS
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function convertToTSM() {
    const input = document.getElementById('input').value;
    const output = document.getElementById('output');
    const itemCountEl = document.getElementById('itemCount');
    const uniqueCountEl = document.getElementById('uniqueCount');
    
    if (!input.trim()) {
        showMessage('Please enter some Wowhead URLs or item IDs', 'error');
        return;
    }
    
    // Extract item IDs from various formats
    const itemIds = extractItemIds(input);
    
    // Extract item names and search for them
    const itemNames = extractItemNames(input);
    
    const failedSearches = [];
    const foundItems = [];
    
    if (itemNames.length > 0) {
        showMessage(`Searching Wowhead for ${itemNames.length} item name(s)... This may take a moment.`, 'info');
        
        for (const itemName of itemNames) {
            const result = await searchWowheadForItemName(itemName);
            if (result.success) {
                itemIds.add(result.id);
                foundItems.push({ searchedName: result.searchedName, foundName: result.foundName, id: result.id });
                console.log(`✓ Found ID ${result.id} for item: ${itemName}`);
            } else {
                console.warn(`✗ Could not find ID for item: ${itemName}`);
                failedSearches.push({ name: itemName, searchUrl: result.searchUrl });
            }
        }
    }
    
    // Sort the IDs
    const sortedIds = Array.from(itemIds).sort((a, b) => Number(a) - Number(b));
    const uniqueCount = sortedIds.length;
    
    if (uniqueCount === 0 && failedSearches.length > 0) {
        const searchLinks = formatSearchLinks(failedSearches);
        showMessage(`Could not automatically find items. Try searching manually: ${searchLinks}. Note: Automatic search may be blocked by ad blockers or browser extensions.`, 'error', true);
        output.value = '';
        itemCountEl.textContent = '0';
        uniqueCountEl.textContent = '0';
        return;
    }
    
    if (uniqueCount === 0) {
        showMessage('No valid item IDs found in the input', 'error');
        output.value = '';
        itemCountEl.textContent = '0';
        uniqueCountEl.textContent = '0';
        return;
    }
    
    // Convert to TSM format: i:12345,i:67890,i:13579
    const tsmFormat = sortedIds.map(id => `i:${id}`).join(',');
    output.value = tsmFormat;
    
    // Update stats (both show unique count since duplicates are removed)
    itemCountEl.textContent = uniqueCount;
    uniqueCountEl.textContent = uniqueCount;
    
    let message = `Successfully converted ${uniqueCount} item(s) to TSM format!`;
    
    // Show found items as confirmation
    if (foundItems.length > 0) {
        const foundItemsList = foundItems.map(item => 
            `<br>✓ Found: <strong>${escapeHtml(item.foundName)}</strong> (ID: ${escapeHtml(item.id)})`
        ).join('');
        message += foundItemsList;
    }
    
    if (failedSearches.length > 0) {
        const searchLinks = formatSearchLinks(failedSearches);
        message += `<br>❌ Could not find: ${searchLinks}. (May be blocked by ad blocker)`;
        showMessage(message, 'info', true);
    } else if (foundItems.length > 0) {
        showMessage(message, 'success', true);
    } else {
        showMessage(message, 'success');
    }
}

function copyToClipboard() {
    const output = document.getElementById('output');
    
    if (!output.value) {
        showMessage('Nothing to copy! Please convert some items first.', 'error');
        return;
    }
    
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output.value).then(() => {
            showMessage('Copied to clipboard! Ready to import in TSM.', 'success');
        }).catch(() => {
            // Fallback to deprecated method for older browsers
            fallbackCopy(output);
        });
    } else {
        // Fallback for browsers without Clipboard API
        fallbackCopy(output);
    }
}

function fallbackCopy(output) {
    output.select();
    output.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        showMessage('Copied to clipboard! Ready to import in TSM.', 'success');
    } catch (err) {
        showMessage('Failed to copy. Please copy manually.', 'error');
    }
}

function clearAll() {
    document.getElementById('input').value = '';
    document.getElementById('output').value = '';
    document.getElementById('itemCount').textContent = '0';
    document.getElementById('uniqueCount').textContent = '0';
    hideMessage();
}

function showMessage(text, type, isHTML = false) {
    const messageEl = document.getElementById('message');
    if (isHTML) {
        messageEl.innerHTML = text;
    } else {
        messageEl.textContent = text;
    }
    messageEl.className = `message ${type} show`;
    
    // Auto-hide after 5 seconds (longer for HTML messages with links)
    setTimeout(() => {
        hideMessage();
    }, isHTML ? 8000 : 3000);
}

function hideMessage() {
    const messageEl = document.getElementById('message');
    messageEl.classList.remove('show');
}

// Allow pressing Ctrl/Cmd+Enter to convert
document.getElementById('input').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        convertToTSM();
    }
});

// When pasting, prefer the HTML version of clipboard data so that item links
// copied from Wowhead, Grouper, The Undermine Journal, etc. are preserved.
// The extractItemIds() function already knows how to parse HTML and pull out
// /item=XXXXX hrefs, so we only need to make sure the raw HTML reaches it.
document.getElementById('input').addEventListener('paste', (e) => {
    const html = e.clipboardData && e.clipboardData.getData('text/html');
    if (html && html.trim()) {
        e.preventDefault();
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = textarea.value;
        textarea.value = current.slice(0, start) + html + current.slice(end);
        // Move cursor to end of inserted text
        textarea.selectionStart = textarea.selectionEnd = start + html.length;
        // Notify assistive technologies and any input listeners of the change
        textarea.dispatchEvent(new Event('input'));
    }
    // If no HTML in clipboard, let the default plain-text paste proceed normally.
});
