function extractItemIds(text) {
    const itemIds = new Set();
    
    // Pattern 1: Wowhead URLs with item IDs
    // https://www.wowhead.com/item=12345 or https://www.wowhead.com/item=12345/item-name
    const wowheadUrlPattern = /wowhead\.com\/[a-z]*\/?item[=/](\d+)/gi;
    let match;
    while ((match = wowheadUrlPattern.exec(text)) !== null) {
        itemIds.add(match[1]);
    }
    
    // Pattern 2: Direct item IDs (numbers separated by commas, spaces, or newlines)
    const numberPattern = /\b(\d+)\b/g;
    while ((match = numberPattern.exec(text)) !== null) {
        itemIds.add(match[1]);
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
    
    return Array.from(itemIds).sort((a, b) => Number(a) - Number(b));
}

function convertToTSM() {
    const input = document.getElementById('input').value;
    const output = document.getElementById('output');
    const itemCountEl = document.getElementById('itemCount');
    const uniqueCountEl = document.getElementById('uniqueCount');
    
    if (!input.trim()) {
        showMessage('Please enter some Wowhead URLs or item IDs', 'error');
        return;
    }
    
    const itemIds = extractItemIds(input);
    const uniqueCount = itemIds.length;
    
    if (uniqueCount === 0) {
        showMessage('No valid item IDs found in the input', 'error');
        output.value = '';
        itemCountEl.textContent = '0';
        uniqueCountEl.textContent = '0';
        return;
    }
    
    // Convert to TSM format: i:12345,i:67890,i:13579
    const tsmFormat = itemIds.map(id => `i:${id}`).join(',');
    output.value = tsmFormat;
    
    // Update stats (both show unique count since duplicates are removed)
    itemCountEl.textContent = uniqueCount;
    uniqueCountEl.textContent = uniqueCount;
    
    showMessage(`Successfully converted ${uniqueCount} item(s) to TSM format!`, 'success');
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

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type} show`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideMessage();
    }, 3000);
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
