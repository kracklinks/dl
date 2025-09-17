// Function to get URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[key] = decodeURIComponent(value);
        }
    }
    
    return params;
}

// Function to remove token from URL without reloading
function cleanUrl() {
    const url = new URL(window.location);
    url.searchParams.delete('token');
    url.searchParams.delete('source');
    url.searchParams.delete('timestamp');
    window.history.replaceState({}, document.title, url.toString());
}

// Validate access and handle token securely
function validateAccess() {
    const params = getUrlParams();
    const token = params.token;
    const source = params.source;
    const timestamp = params.timestamp ? parseInt(params.timestamp, 10) : null;
    
    const messageEl = document.getElementById('verification-message');
    const errorMessageEl = document.getElementById('error-message');
    const downloadSection = document.getElementById('download-section');
    const downloadBtn = document.getElementById('downloadBtn');
    const returnLink = document.getElementById('returnLink');
    const verificationDetails = document.getElementById('verification-details');
    
    // Check if we have the required parameters
    if (!token || !source) {
        messageEl.classList.add('hidden');
        errorMessageEl.classList.remove('hidden');
        errorMessageEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;"><p style="margin: 0; flex: 1;">Missing verification parameters. Please complete the verification process.</p><button id="copyUrlBtn" style="margin-left: 10px; padding: 8px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">Copy URL</button></div>';
        returnLink.classList.remove('hidden');
        returnLink.href = document.referrer || 'javascript:history.back()';
        setupCopyButton();
        return;
    }
    
    // Check if coming from the verification page with correct source
    if (source !== 'verification') {
        messageEl.classList.add('hidden');
        errorMessageEl.classList.remove('hidden');
        errorMessageEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;"><p style="margin: 0; flex: 1;">Invalid access source. Please complete the verification process.</p><button id="copyUrlBtn" style="margin-left: 10px; padding: 8px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">Copy URL</button></div>';
        returnLink.classList.remove('hidden');
        returnLink.href = document.referrer || 'javascript:history.back()';
        setupCopyButton();
        return;
    }
    
    try {
        // Check if token is still valid (within 5 minutes)
        const currentTime = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (timestamp && (currentTime - timestamp > fiveMinutes)) {
            messageEl.classList.add('hidden');
            errorMessageEl.classList.remove('hidden');
            errorMessageEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;"><p style="margin: 0; flex: 1;">Token has expired. Please restart the verification process.</p><button id="copyUrlBtn" style="margin-left: 10px; padding: 8px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">Copy URL</button></div>';
            returnLink.classList.remove('hidden');
            returnLink.href = document.referrer || 'javascript:history.back()';
            setupCopyButton();
            return;
        }
        
        // Validate token format (starts with v2_ and has timestamp)
        if (token && token.startsWith('v2_') && token.includes('_')) {
            // Store token in sessionStorage for one-time use
            sessionStorage.setItem('verificationToken', token);
            sessionStorage.setItem('tokenTimestamp', timestamp);
            
            // Remove token from URL immediately
            cleanUrl();
            
            // Success - enable download
            setTimeout(() => {
                messageEl.innerHTML = '<p>Verification successful! You can now download your content.</p>';
                messageEl.className = 'message success';
                downloadSection.classList.remove('hidden');
                verificationDetails.classList.remove('hidden');
                
                // Set up download button
                downloadBtn.addEventListener('click', handleDownload);
            }, 1500);
            
        } else {
            // Failed verification
            messageEl.classList.add('hidden');
            errorMessageEl.classList.remove('hidden');
            errorMessageEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;"><p style="margin: 0; flex: 1;">Access denied. Invalid verification token.</p><button id="copyUrlBtn" style="margin-left: 10px; padding: 8px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">Copy URL</button></div>';
            returnLink.classList.remove('hidden');
            returnLink.href = document.referrer || 'javascript:history.back()';
            setupCopyButton();
        }
    } catch (e) {
        console.error('Verification error:', e);
        messageEl.classList.add('hidden');
        errorMessageEl.classList.remove('hidden');
        errorMessageEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;"><p style="margin: 0; flex: 1;">An error occurred during verification. Please try again.</p><button id="copyUrlBtn" style="margin-left: 10px; padding: 8px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">Copy URL</button></div>';
        returnLink.classList.remove('hidden');
        returnLink.href = document.referrer || 'javascript:history.back()';
        setupCopyButton();
    }
}



// Handle download with token invalidation
function handleDownload() {
    const token = sessionStorage.getItem('verificationToken');
    
    if (!token) {
        alert('Your session has expired. Please complete the verification process again.');
        return;
    }
    
    // Invalidate token immediately after download
    sessionStorage.removeItem('verificationToken');
    sessionStorage.removeItem('tokenTimestamp');
    
    // Call the separated download function
    createDownload();
    
    // Update UI
    document.getElementById('downloadBtn').textContent = 'Downloaded';
    document.getElementById('downloadBtn').disabled = true;
    
    // Show message
    const messageEl = document.getElementById('verification-message');
    messageEl.innerHTML = '<p>Download completed! Your token has been invalidated for security.</p>';
    messageEl.className = 'message success';
}

// Setup copy button functionality
function setupCopyButton() {
    const copyBtn = document.getElementById('copyUrlBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const currentUrl = window.location.href;
            
            navigator.clipboard.writeText(currentUrl).then(() => {
                // Show success feedback
                const btn = document.getElementById('copyUrlBtn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy URL. Please try again.');
            });
        });
    }
}

// Check if we're returning with a token in the URL
function checkForToken() {
    const params = getUrlParams();
    if (params.token && params.source === 'verification') {
        validateAccess();
    } else {
        // Check if we already have a valid token in sessionStorage
        const storedToken = sessionStorage.getItem('verificationToken');
        const storedTimestamp = sessionStorage.getItem('tokenTimestamp');
        
        if (storedToken && storedTimestamp) {
            const currentTime = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (currentTime - parseInt(storedTimestamp, 10) > fiveMinutes) {
                // Token expired
                sessionStorage.removeItem('verificationToken');
                sessionStorage.removeItem('tokenTimestamp');
                document.getElementById('verification-message').classList.add('hidden');
                document.getElementById('error-message').classList.remove('hidden');
                document.getElementById('error-message').innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;"><p style="margin: 0; flex: 1;">Your session has expired. Please complete the verification process again.</p><button id="copyUrlBtn" style="margin-left: 10px; padding: 8px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">Copy URL</button></div>';
                document.getElementById('returnLink').classList.remove('hidden');
                setupCopyButton();
            } else {
                // Token is still valid
                document.getElementById('verification-message').innerHTML = 
                    '<p>Verification successful! You can now download your content.</p>';
                document.getElementById('verification-message').className = 'message success';
                document.getElementById('download-section').classList.remove('hidden');
                document.getElementById('verification-details').classList.remove('hidden');
                document.getElementById('downloadBtn').addEventListener('click', handleDownload);
            }
        } else {
            // No valid token found
            document.getElementById('verification-message').classList.add('hidden');
            document.getElementById('error-message').classList.remove('hidden');
            document.getElementById('returnLink').classList.remove('hidden');
            document.getElementById('returnLink').href = 'javascript:history.back()';
            setupCopyButton();
        }
    }
}

// Run validation when page loads
document.addEventListener('DOMContentLoaded', checkForToken);
