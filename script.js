let KAOMOJI_DATA = {};

// Define category groups
const CATEGORY_GROUPS = {
    "Positivity": ["joy", "happy", "love", "excitement", "celebration", "greeting"],
    "Negativity": ["sad", "anger", "apology", "confusion"],
    "Expressions": ["surprise", "shy", "sleepy", "cool"],
    "Themes": ["animal", "food", "music"]
};

// Load kaomoji data from JSON file
async function loadKaomojiData() {
    try {
        const response = await fetch('kaomoji-data.json');
        KAOMOJI_DATA = await response.json();
    } catch (error) {
        console.error('Error loading kaomoji data:', error);
        KAOMOJI_DATA = {};
    }
}

// Utility functions
function getKaomojiByTag(tag) {
    return KAOMOJI_DATA[tag] || [];
}

function getAllTags() {
    return Object.keys(KAOMOJI_DATA);
}

function getKaomojiCountByTag(tag) {
    return getKaomojiByTag(tag).length;
}

function getCategoryGroupCount(categoryName) {
    return CATEGORY_GROUPS[categoryName].reduce((total, tag) => total + getKaomojiCountByTag(tag), 0);
}

// Copy kaomoji to clipboard with mobile support
async function copyToClipboard(text, element) {
    const originalText = element.textContent;
    
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showCopyFeedback(element, originalText);
        } else {
            fallbackCopyText(text, element, originalText);
        }
    } catch (err) {
        console.error('Clipboard API failed, using fallback:', err);
        fallbackCopyText(text, element, originalText);
    }
}

// Fallback method for clipboard copying
function fallbackCopyText(text, element, originalText) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyFeedback(element, originalText);
        } else {
            showManualCopyPrompt(text, element, originalText);
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showManualCopyPrompt(text, element, originalText);
    } finally {
        document.body.removeChild(textArea);
    }
}

// Show copy feedback
function showCopyFeedback(element, originalText) {
    element.textContent = 'Copied!';
    element.classList.add('copied');
    
    setTimeout(() => {
        element.textContent = originalText;
        element.classList.remove('copied');
    }, 1500);
}

// Show manual copy prompt for difficult cases
function showManualCopyPrompt(text, element, originalText) {
    const selectionDiv = document.createElement('div');
    selectionDiv.className = 'kaomoji-selection-modal';
    
    selectionDiv.innerHTML = `
        <div class="kaomoji-selection-content">
            <div style="margin-bottom: 15px; font-size: 1.2em;">Select and copy:</div>
            <div class="kaomoji-selection-text">${text}</div>
            <button class="kaomoji-selection-button" onclick="this.closest('.kaomoji-selection-modal').remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(selectionDiv);
    showCopyFeedback(element, originalText);
    
    setTimeout(() => {
        if (selectionDiv.parentElement) {
            selectionDiv.remove();
        }
    }, 10000);
}

// Load tags with categories
function loadTags() {
    const tagContainer = document.getElementById('tagFilters');
    tagContainer.innerHTML = '';
    
    // Calculate total count for "All" tag
    const totalCount = getAllTags().reduce((total, tag) => total + getKaomojiCountByTag(tag), 0);
    
    // Create global filter container for "All" button
    const globalFilter = document.createElement('div');
    globalFilter.className = 'global-filter';
    
    // Add "All" tag
    const allTag = document.createElement('button');
    allTag.className = 'tag active';
    allTag.innerHTML = `All <span class="tag-count">${totalCount}</span>`;
    allTag.onclick = showAllKaomoji;
    globalFilter.appendChild(allTag);
    
    tagContainer.appendChild(globalFilter);
    
    // Add category groups
    Object.keys(CATEGORY_GROUPS).forEach(categoryName => {
        const categoryCount = getCategoryGroupCount(categoryName);
        
        // Create category section
        const categorySection = document.createElement('div');
        categorySection.className = 'category-group';
        
        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <span class="category-name">${categoryName}</span>
            <span class="category-count">${categoryCount}</span>
        `;
        categorySection.appendChild(categoryHeader);
        
        // Create tags container for this category
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'category-tags';
        
        // Add tags for this category
        CATEGORY_GROUPS[categoryName].forEach(tag => {
            if (KAOMOJI_DATA[tag]) { // Only add if tag exists in data
                const count = getKaomojiCountByTag(tag);
                const tagElement = document.createElement('button');
                tagElement.className = 'tag';
                tagElement.innerHTML = `${tag.charAt(0).toUpperCase() + tag.slice(1)} <span class="tag-count">${count}</span>`;
                tagElement.onclick = () => filterByTag(tag, tagElement);
                tagsContainer.appendChild(tagElement);
            }
        });
        
        categorySection.appendChild(tagsContainer);
        tagContainer.appendChild(categorySection);
    });
}

// Update showAllKaomoji to also scroll
function showAllKaomoji() {
    displayAllKaomojiByCategory();
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    // Scroll to kaomoji container on mobile when "All" is clicked
    scrollToKaomoji();
}

// Filter by tag
function filterByTag(tag, element) {
    const kaomoji = getKaomojiByTag(tag);
    displayFilteredKaomoji(kaomoji, tag);
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    
    // Scroll to kaomoji container on mobile
    scrollToKaomoji();
}

// Function to scroll to kaomoji container
function scrollToKaomoji() {
    const kaomojiContainer = document.getElementById('kaomojiContainer');
    
    // Check if mobile device (more comprehensive check)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile && kaomojiContainer) {
        // Small delay to ensure the DOM has updated with new content
        setTimeout(() => {
            const containerPosition = kaomojiContainer.getBoundingClientRect().top + window.pageYOffset;
            const offset = 10; // Small offset
            
            window.scrollTo({
                top: containerPosition - offset,
                behavior: 'smooth'
            });
        }, 100);
    }
}

// Display filtered kaomoji by tag
function displayFilteredKaomoji(kaomojiList, tag) {
    const container = document.getElementById('kaomojiContainer');
    container.innerHTML = '';
    
    if (kaomojiList.length === 0) {
        container.innerHTML = '<div class="no-results">No kaomoji found for "' + tag + '"</div>';
        return;
    }
    
    const section = document.createElement('div');
    section.className = 'category-section';
    
    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = tag.charAt(0).toUpperCase() + tag.slice(1) + ` (${kaomojiList.length})`;
    section.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'kaomoji-grid';
    
    kaomojiList.forEach((kaomoji, index) => {
        const kaomojiElement = document.createElement('div');
        kaomojiElement.className = 'kaomoji-item';
        kaomojiElement.textContent = kaomoji;
        kaomojiElement.onclick = (e) => copyToClipboard(kaomoji, e.target);
        kaomojiElement.style.animationDelay = `${index * 0.05}s`;
        grid.appendChild(kaomojiElement);
    });
    
    section.appendChild(grid);
    container.appendChild(section);
}

// Display all kaomoji grouped by category
function displayAllKaomojiByCategory() {
    const container = document.getElementById('kaomojiContainer');
    container.innerHTML = '';
    
    let animationDelay = 0;
    
    for (const tag of getAllTags()) {
        const kaomojis = getKaomojiByTag(tag);
        
        if (kaomojis.length > 0) {
            const section = document.createElement('div');
            section.className = 'category-section';
            section.style.animationDelay = `${animationDelay}s`;
            animationDelay += 0.1;
            
            const title = document.createElement('h2');
            title.className = 'category-title';
            title.textContent = tag.charAt(0).toUpperCase() + tag.slice(1) + ` (${kaomojis.length})`;
            section.appendChild(title);
            
            const grid = document.createElement('div');
            grid.className = 'kaomoji-grid';
            
            kaomojis.forEach((kaomoji, index) => {
                const kaomojiElement = document.createElement('div');
                kaomojiElement.className = 'kaomoji-item';
                kaomojiElement.textContent = kaomoji;
                kaomojiElement.onclick = (e) => copyToClipboard(kaomoji, e.target);
                kaomojiElement.style.animationDelay = `${index * 0.05}s`;
                grid.appendChild(kaomojiElement);
            });
            
            section.appendChild(grid);
            container.appendChild(section);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load kaomoji data first
    await loadKaomojiData();
    
    // Then load the UI
    loadTags();
    displayAllKaomojiByCategory();
});