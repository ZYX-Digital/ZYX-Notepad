const body = document.getElementById('body');
const toggleButton = document.getElementById('mode-toggle');
const historyToggle = document.getElementById('history-toggle'); 
const fontSelector = document.getElementById('font-selector'); 
const fontSizeUp = document.getElementById('font-size-up');      
const fontSizeDown = document.getElementById('font-size-down'); 
const showUrlButton = document.getElementById('show-url-button'); 
const splitButton = document.getElementById('split-button');
const hamburgerMenuToggle = document.getElementById('hamburger-menu-toggle');
const moreButton = document.getElementById('more-button');
const moreDropdownContent = document.getElementById('more-dropdown-content');
const moreToolsButton = document.getElementById('more-tools-button');
const toolsPanel = document.getElementById('tools-panel');
const historyCloseButton = document.getElementById('history-close-btn');
const toolsPanelCloseButton = document.getElementById('tools-panel-close-btn');
const toolsTrigger = document.getElementById('tools-trigger');
const historyTrigger = document.getElementById('history-trigger');
const showCalculatorButton = document.getElementById('show-calculator-button');
const embeddedCalculator = document.getElementById('embedded-calculator');
const calcDisplay = document.getElementById('calc-display');
const calcButtons = document.getElementById('calc-buttons');
const showRandomTextButton = document.getElementById('show-random-text-button');
const randomTextGenerator = document.getElementById('random-text-generator');
const generatedTextOutput = document.getElementById('generated-text-output');
const copyGeneratedTextButton = document.getElementById('copy-generated-text');
const charSetInput = document.getElementById('char-set');
const textLengthInput = document.getElementById('text-length');
const generateTextButton = document.getElementById('generate-text-button');
const fillAsciiButton = document.getElementById('fill-ascii-button');
const showSpecialCharsButton = document.getElementById('show-special-chars-button');
const specialCharsPanel = document.getElementById('special-chars-panel');
const specialCharsSearch = document.getElementById('special-chars-search');
const specialCharsList = document.getElementById('special-chars-list');
let specialCharsData = []; 
let specialCharsLoaded = false;
const aboutButton = document.getElementById('about-button');
const aboutModalOverlay = document.getElementById('about-modal-overlay');
const aboutModalCloseButton = document.getElementById('about-modal-close-btn');
const searchInput = document.getElementById('search-input');
const searchDropdownResults = document.getElementById('search-dropdown-results');
let searchDebounceTimeout;
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const historyClearButton = document.getElementById('history-clear-button');
const splitElements = [
    { 
        header: document.getElementById('split-header-0'),
        bar: document.getElementById('tab-bar-0'), 
        lines: document.getElementById('line-numbers-0'), 
        input: document.getElementById('text-input-0'),
        statusBar: document.getElementById('status-bar-0')
    },
    { 
        header: document.getElementById('split-header-1'),
        bar: document.getElementById('tab-bar-1'), 
        lines: document.getElementById('line-numbers-1'), 
        input: document.getElementById('text-input-1'),
        statusBar: document.getElementById('status-bar-1')
    },
    { 
        header: document.getElementById('split-header-2'),
        bar: document.getElementById('tab-bar-2'), 
        lines: document.getElementById('line-numbers-2'), 
        input: document.getElementById('text-input-2'),
        statusBar: document.getElementById('status-bar-2')
    }
];

const LOCAL_STORAGE_KEY_TABS = 'notepadTabs';
const LOCAL_STORAGE_KEY_SPLITS = 'notepadSplits';

let __tabs = {};
let __splits = []; 
let __numSplits = 1;

const HISTORY_WIDTH = 250;
const LINE_BAR_WIDTH = 30;
const PADDING_GAP = 10;
const MAX_HISTORY_ITEMS = 50;
const BUTTON_CONTAINER_PADDING = 15;
const TOP_CONTENT_Y = 100;

let urlUpdateTimeout;
const DEBOUNCE_TIME = 500; 
const defaultCharSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

let autoOpenCalculator = false;
let autoOpenRand = false;
let autoOpenSpecial = false; 

function closeMobileMenu() {
    if (body.classList.contains('mobile-layout')) {
        document.getElementById('button-container').classList.remove('mobile-menu-open');
        hamburgerMenuToggle.innerHTML = '&#9776;';
    }
}

function generateUniqueId() {
    return 'tab-' + Math.random().toString(36).substring(2, 9);
}

function getActiveState(tabId) {
    return __tabs[tabId];
}

function getSplitState(splitIndex) {
    return __splits[splitIndex];
}

function createNewTabState(id, currentTheme, tabNumber) { 
    const tabCount = tabNumber || (Object.keys(__tabs).length + 1); 
    return {
        id: id,
        content: '',
        history: [],
        theme: currentTheme || 'light',
        fontFamily: 'Arial',
        fontSizePx: 16,
        isHistoryVisible: false,
        name: `Your Tab ${tabCount}`,
        isSpellcheckOn: false
    };
}

function saveSplits() {
    localStorage.setItem(LOCAL_STORAGE_KEY_SPLITS, JSON.stringify(__splits));
}

function saveTabs() {
    localStorage.setItem(LOCAL_STORAGE_KEY_TABS, JSON.stringify(__tabs));
}

function saveSplitState() {
    __splits.forEach((split, index) => {
        if (index >= __numSplits) return; 
        const element = splitElements[index].input;
        const tabState = getActiveState(split.activeTabId);
        if (tabState) {
            tabState.content = element.value;
        }
    });
    saveTabs();
}

function updateTriggerIcons() {
    const toolsOpen = body.classList.contains('tools-panel-visible');
    if(toolsTrigger) {
        toolsTrigger.innerHTML = toolsOpen ? '<i class="fa-solid fa-chevron-left"></i>' : '<i class="fa-solid fa-chevron-right"></i>';
        toolsTrigger.style.opacity = toolsOpen ? '1' : '';
    }

    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    const historyVisible = activeTab ? activeTab.isHistoryVisible : false;
    
    if(historyTrigger) {
        historyTrigger.innerHTML = historyVisible ? '<i class="fa-solid fa-chevron-right"></i>' : '<i class="fa-solid fa-chevron-left"></i>';
        historyTrigger.style.opacity = historyVisible ? '1' : '';
    }
}

function loadState() {
    const savedTabs = localStorage.getItem(LOCAL_STORAGE_KEY_TABS);
    const savedSplits = localStorage.getItem(LOCAL_STORAGE_KEY_SPLITS);

    if (savedTabs && Object.keys(JSON.parse(savedTabs)).length > 0) {
        __tabs = JSON.parse(savedTabs);
        Object.keys(__tabs).forEach(tabId => {
            if (typeof __tabs[tabId].isSpellcheckOn === 'undefined') {
                __tabs[tabId].isSpellcheckOn = false;
            }
        });
    } else {
        const newId = generateUniqueId();
        __tabs[newId] = createNewTabState(newId, 'dark', 1);
    }
    
    if (savedSplits && JSON.parse(savedSplits).length > 0) {
        __splits = JSON.parse(savedSplits);
        __numSplits = __splits.length;
        
        let isOldFormat = false;
        __splits.forEach(s => { if (!s.tabIds) isOldFormat = true; });

        if (isOldFormat) {
            const allTabIds = Object.keys(__tabs);
            __splits = [{ id: 'split-0', activeTabId: allTabIds[0], tabIds: allTabIds }];
            __numSplits = 1;
            saveSplits(); 
        } else {
            __splits.forEach((s, idx) => {
                if (!s.name) s.name = `Split View ${idx + 1}`;
                if (s.tabIds.length === 0) {
                    const newId = generateUniqueId();
                    __tabs[newId] = createNewTabState(newId, 'light', 1);
                    s.tabIds = [newId];
                    s.activeTabId = newId;
                }
                if (!s.tabIds.includes(s.activeTabId)) {
                    s.activeTabId = s.tabIds[0];
                }
            });
        }
    } else {
        const firstTabId = Object.keys(__tabs)[0];
        __splits = [{ id: 'split-0', activeTabId: firstTabId, tabIds: [firstTabId], name: 'Split View 1' }];
        __numSplits = 1;
    }
}

function switchTab(newTabId, splitIndex) {
    const split = getSplitState(splitIndex);
    if (!split || newTabId === split.activeTabId || !__tabs[newTabId]) return;

    saveSplitState();
    split.activeTabId = newTabId;
    applySettingsToSplit(splitIndex);
    saveSplits();
}

function deleteTabById(idToDelete, splitIndex) { 
    const split = getSplitState(splitIndex);
    if (split.tabIds.length <= 1) {
        alert('Cannot delete the last tab in this split.');
        return;
    }
    split.tabIds = split.tabIds.filter(id => id !== idToDelete);
    if (split.activeTabId === idToDelete) {
        switchTab(split.tabIds[0], splitIndex);
    }
    let isTabInUse = false;
    for (const s of __splits) {
        if (s.tabIds.includes(idToDelete)) {
            isTabInUse = true;
            break;
        }
    }
    if (!isTabInUse) {
        delete __tabs[idToDelete];
        saveTabs(); 
    }
    renderTabs();
    saveSplits();
}

function applySpellcheckSetting(splitIndex) {
    const split = getSplitState(splitIndex);
    if (!split) return;
    const activeTab = getActiveState(split.activeTabId);
    if (!activeTab) return;

    const isSpellcheckOn = activeTab.isSpellcheckOn;
    const element = splitElements[splitIndex];
    const checkbox = document.getElementById(`spellcheck-toggle-${splitIndex}`);

    if (isSpellcheckOn) {
        element.input.setAttribute('spellcheck', 'true');
        element.input.setAttribute('autocorrect', 'on');
    } else {
        element.input.setAttribute('spellcheck', 'false');
        element.input.setAttribute('autocorrect', 'off');
    }
    if (checkbox) {
        checkbox.checked = isSpellcheckOn;
    }
}

function applySettingsToSplit(splitIndex) {
    const split = getSplitState(splitIndex);
    if (!split) return;
    const activeTab = getActiveState(split.activeTabId);
    if (!activeTab) return;
    
    const element = splitElements[splitIndex];
    element.input.value = activeTab.content;
    updateWordCount(splitIndex);
    
    if (splitIndex === 0) {
        setMode(activeTab.theme === 'dark', false);
        if (activeTab.isHistoryVisible) {
            body.classList.remove('history-hidden');
        } else {
            body.classList.add('history-hidden');
        }
        renderHistoryPanel(); 
        fontSelector.value = activeTab.fontFamily;
    }
    
    applyFontSettings();
    applySpellcheckSetting(splitIndex);
    renderTabs();
    updateLayout(); 
}

function renderTabs() {
    for (let i = 0; i < __numSplits; i++) {
        const split = getSplitState(i);
        if (!split) continue;

        const tabBar = splitElements[i].bar;
        if (!tabBar) continue;
        tabBar.innerHTML = ''; 

        const newTabBtn = document.createElement('button');
        newTabBtn.className = 'new-tab-button';
        newTabBtn.textContent = '+';
        newTabBtn.title = 'Create a new tab';
        newTabBtn.dataset.splitIndex = i;
        tabBar.appendChild(newTabBtn);

        for (const id of split.tabIds) {
            const tab = __tabs[id];
            if (!tab) continue; 
            
            const btn = document.createElement('button');
            const isActive = id === split.activeTabId;

            btn.className = `tab-button ${isActive ? 'active' : ''}`;
            
            const labelSpan = document.createElement('span');
            labelSpan.textContent = tab.name;
            btn.appendChild(labelSpan);

            const isOnlyTab = split.tabIds.length === 1; 
            if (!isOnlyTab) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'tab-close-button';
                closeBtn.textContent = 'x';
                closeBtn.title = 'Close Tab';
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteTabById(id, i); 
                };
                btn.appendChild(closeBtn);
            }

            btn.dataset.tabId = id;
            btn.onclick = (event) => {
                if (isActive) {
                    const newName = prompt('Rename this tab:', tab.name);
                    if (newName && newName.trim() !== '' && newName !== tab.name) {
                        tab.name = newName.trim();
                        saveTabs();
                        renderTabs(); 
                    }
                } else {
                    switchTab(id, i);
                }
            };
            tabBar.insertBefore(btn, newTabBtn); 
        }
    }
    attachNewTabButtonListeners();
}

function attachNewTabButtonListeners() {
    document.querySelectorAll('.new-tab-button').forEach(button => {
        button.onclick = null; 
        button.onclick = (e) => {
            e.stopPropagation();
            const splitIndex = parseInt(e.target.dataset.splitIndex);
            const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            
            const split = __splits[splitIndex];
            let maxTabNum = 0;
            if (split && split.tabIds) { 
                split.tabIds.forEach(tabId => {
                    const tab = __tabs[tabId];
                    if (tab && tab.name.startsWith('Your Tab ')) {
                        const num = parseInt(tab.name.replace('Your Tab ', ''));
                        if (!isNaN(num) && num > maxTabNum) { maxTabNum = num; }
                    }
                });
            }
            const newTabNumber = maxTabNum + 1;
            const newId = generateUniqueId();
            __tabs[newId] = createNewTabState(newId, currentTheme, newTabNumber); 
            __splits[splitIndex].tabIds.push(newId); 
            __splits[splitIndex].activeTabId = newId; 
            
            applySettingsToSplit(splitIndex);
            renderTabs(); 
            saveTabs();
            saveSplits(); 
        };
    });
}

function handleInput(e, index) {
    const split = getSplitState(index); 
    if (!split) return;
    const tab = getActiveState(split.activeTabId); 
    if (!tab) return;

    tab.content = e.target.value;
    updateLineNumbers(index);
    updateWordCount(index);
    saveSplitState();
    debounceUrlUpdate();
}

function handleCopy(e, index) {
    const split = getSplitState(index);
    if (!split) return;
    const tab = getActiveState(split.activeTabId);
    if (!tab) return;
    
    const selectedText = splitElements[index].input.value.substring(
        splitElements[index].input.selectionStart, 
        splitElements[index].input.selectionEnd
    );
    addHistoryEntry('Copied', selectedText, index + 1, tab.name);
}

function handleCut(e, index) {
    const split = getSplitState(index);
    if (!split) return;
    const tab = getActiveState(split.activeTabId);
    if (!tab) return;

    const input = splitElements[index].input;
    const selectedText = input.value.substring(input.selectionStart, input.selectionEnd);
    setTimeout(() => {
        addHistoryEntry('Cut', selectedText, index + 1, tab.name);
    }, 10); 
}

function handleKeydown(e, index) {
    const split = getSplitState(index);
    if (!split) return;
    const tab = getActiveState(split.activeTabId);
    if (!tab) return;

    const input = splitElements[index].input;
    const isDeleteKey = e.keyCode === 46; 
    const isBackspaceKey = e.keyCode === 8; 
    const hasSelection = input.selectionStart !== input.selectionEnd;

    if ((isDeleteKey || isBackspaceKey) && hasSelection) {
        const selectedText = input.value.substring(input.selectionStart, input.selectionEnd);
        setTimeout(() => {
            addHistoryEntry('Deleted', selectedText, index + 1, tab.name);
        }, 10);
    }
}

function handlePaste(e, index) {
    const split = getSplitState(index);
    if (!split) return;
    const tab = getActiveState(split.activeTabId);
    if (!tab) return;

    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    setTimeout(() => {
        addHistoryEntry('Pasted', pastedText, index + 1, tab.name);
    }, 10);
}

function handleSpellcheckToggle(e) {
    const splitIndex = parseInt(e.target.dataset.splitIndex);
    const split = getSplitState(splitIndex);
    if (!split) return;
    const activeTab = getActiveState(split.activeTabId);
    if (!activeTab) return;

    activeTab.isSpellcheckOn = e.target.checked;
    applySpellcheckSetting(splitIndex);
    saveTabs();
}

function countWords(text) {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
}

function updateWordCount(splitIndex) {
    const elements = splitElements[splitIndex];
    if (!elements || elements.statusBar.classList.contains('hidden')) return;
    const text = elements.input.value;
    const count = countWords(text);
    const label = elements.statusBar.querySelector('.word-count-label');
    if (label) label.textContent = `Word Count: ${count}`;
}

function updateLineNumbers(splitIndex) {
    const input = splitElements[splitIndex].input;
    const lineNumbers = splitElements[splitIndex].lines;
    
    if (lineNumbers.classList.contains('hidden')) return; 
    
    const lines = input.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lines; i++) {
        numbers += i + '\n';
    }
    
    if (lineNumbers.innerText !== numbers) {
        lineNumbers.innerText = numbers;
    }
    
    lineNumbers.scrollTop = input.scrollTop;
}

function performSearch() {
    saveSplitState();
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm === '') return [];
    
    const results = [];
    const addedTabIds = new Set(); 

    __splits.forEach((split, splitIndex) => {
        if (splitIndex >= __numSplits) return; 
        split.tabIds.forEach(tabId => {
            if (addedTabIds.has(tabId)) return; 
            const tab = __tabs[tabId];
            if (!tab) return;
            const content = tab.content.toLowerCase();
            const index = content.indexOf(searchTerm);
            
            if (index > -1) {
                const start = Math.max(0, index - 20);
                const end = Math.min(content.length, index + searchTerm.length + 30);
                const snippet = tab.content.substring(start, end).replace(/</g, "&lt;").replace(/>/g, "&gt;");
                results.push({
                    tabName: tab.name,
                    tabId: tab.id,
                    splitIndex: splitIndex,
                    snippet: `...${snippet}...`
                });
                addedTabIds.add(tabId);
            }
        });
    });
    return results;
}

function renderSearchDropdown(results) {
    searchDropdownResults.innerHTML = ''; 
    if (results.length === 0) {
        searchDropdownResults.classList.remove('show');
        return;
    }
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-dropdown-item';
        item.dataset.tabId = result.tabId;
        item.dataset.splitIndex = result.splitIndex;
        item.innerHTML = `<strong>${result.tabName}</strong><span>Split ${result.splitIndex + 1}</span>`;
        item.addEventListener('click', handleSearchDropdownClick);
        searchDropdownResults.appendChild(item);
    });
    searchDropdownResults.classList.add('show');
}

function handleSearchDropdownClick(e) {
    const item = e.currentTarget;
    const tabId = item.dataset.tabId;
    const splitIndex = parseInt(item.dataset.splitIndex);
    const originalSearchTerm = searchInput.value;
    
    switchTab(tabId, splitIndex);
    searchInput.value = '';
    searchDropdownResults.classList.remove('show');
    
    setTimeout(() => {
        const inputElement = splitElements[splitIndex].input;
        inputElement.focus();
        if(originalSearchTerm) {
            const index = inputElement.value.toLowerCase().indexOf(originalSearchTerm.toLowerCase());
            if(index > -1) {
                inputElement.setSelectionRange(index, index + originalSearchTerm.length);
            }
        }
    }, 50); 
}

function toggleToolsPanel() {
    body.classList.toggle('tools-panel-visible');
    const activeTab = getActiveState(__splits[0].activeTabId); 
    
    if (body.classList.contains('mobile-layout') && body.classList.contains('tools-panel-visible')) {
        if (activeTab && activeTab.isHistoryVisible) {
            activeTab.isHistoryVisible = false;
            body.classList.add('history-hidden');
        }
    } 
    
    if (!body.classList.contains('tools-panel-visible')) {
         embeddedCalculator.classList.add('hidden'); 
         randomTextGenerator.classList.add('hidden');
         specialCharsPanel.classList.add('hidden');
    } else {
        if (autoOpenCalculator) { embeddedCalculator.classList.remove('hidden'); autoOpenCalculator = false; }
        if (autoOpenRand) { randomTextGenerator.classList.remove('hidden'); autoOpenRand = false; }
        if (autoOpenSpecial) { specialCharsPanel.classList.remove('hidden'); autoOpenSpecial = false; }
    }
    
    updateTriggerIcons(); 
    setTimeout(() => { updateLayout(); }, 310);
    closeMobileMenu();
    moreDropdownContent.classList.remove('show');
    updateUrlHash(); 
}

function toggleHistory() {
    const activeTab = getActiveState(__splits[0].activeTabId); 
    if (!activeTab) return;
    
    activeTab.isHistoryVisible = !activeTab.isHistoryVisible;

    if (body.classList.contains('mobile-layout') && activeTab.isHistoryVisible) {
        body.classList.remove('tools-panel-visible');
        embeddedCalculator.classList.add('hidden');
        randomTextGenerator.classList.add('hidden');
        specialCharsPanel.classList.add('hidden');
        updateTriggerIcons(); 
    }

    if (activeTab.isHistoryVisible) {
        body.classList.remove('history-hidden');
    } else {
        body.classList.add('history-hidden');
    }
    
    updateTriggerIcons(); 
    setTimeout(() => { updateLayout(); }, 310); 
    renderHistoryPanel();
    saveTabs();
    updateUrlHash(); 
    closeMobileMenu();
    moreDropdownContent.classList.remove('show');
}

function toggleSplits() {
    saveSplitState();
    function createAndRegisterNewTab() { 
        const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newId = generateUniqueId();
        __tabs[newId] = createNewTabState(newId, currentTheme, 1); 
        saveTabs();
        return newId;
    }
    if (__numSplits === 1) {
        __numSplits = 2;
        const newTabId = createAndRegisterNewTab();
        __splits[1] = { id: 'split-1', activeTabId: newTabId, tabIds: [newTabId], name: 'Split View 2' };
    } else if (__numSplits === 2) {
        __numSplits = 3;
        const newTabId = createAndRegisterNewTab();
        __splits[2] = { id: 'split-2', activeTabId: newTabId, tabIds: [newTabId], name: 'Split View 3' };
    } else {
        __numSplits = 1;
    }
    updateLayout();
    renderTabs();
    saveSplits();
    closeMobileMenu();
}

function closeSplit(index) {
    if (__numSplits <= 1) {
        alert("You must have at least one split open.");
        return;
    }
    saveSplitState();
    const tabsToMove = __splits[index].tabIds;
    let targetIndex;
    if (index > 0) { targetIndex = index - 1; } else { targetIndex = 1; }
    __splits[targetIndex].tabIds = __splits[targetIndex].tabIds.concat(tabsToMove);
    __splits.splice(index, 1);
    __numSplits--;
    saveSplits();
    renderTabs();
    for(let i=0; i<__numSplits; i++) { applySettingsToSplit(i); }
    updateLayout();
}

function updateLayout() {
    const buttonContainerDiv = document.getElementById('button-container');
    const containerDiv = document.getElementById('container');
    if(!buttonContainerDiv || !containerDiv) return; 

    const currentWidth = window.innerWidth;
    const isHardVertical = (currentWidth <= 800);
    const isVerticalLayout = isHardVertical;

    body.classList.remove('mobile-layout', 'desktop-layout');
    void buttonContainerDiv.offsetHeight; 
    body.classList.add('desktop-layout');
    
    const searchInputRect = searchInput.getBoundingClientRect();
    const containerRect = containerDiv.getBoundingClientRect();
    const searchInputLeft = searchInputRect.left - containerRect.left;
    const titleCollisionPoint = 350;
    const isColliding = (searchInputLeft < titleCollisionPoint); 
    const isMobileMenu = isHardVertical || (isColliding && !isHardVertical); 
    
    body.classList.toggle('mobile-layout', isMobileMenu);
    body.classList.toggle('desktop-layout', !isMobileMenu);

    const activeTab = getActiveState(__splits[0].activeTabId);
    let historyVisible = activeTab ? activeTab.isHistoryVisible : false; 
    
    if (historyVisible) body.classList.remove('history-hidden');
    else body.classList.add('history-hidden');

    if (historyVisible && !isVerticalLayout) {
        const newRight = HISTORY_WIDTH + PADDING_GAP + BUTTON_CONTAINER_PADDING;
        buttonContainerDiv.style.right = `${newRight}px`;
    } else {
        buttonContainerDiv.style.right = `${BUTTON_CONTAINER_PADDING}px`;
    }
    
    const headerHeight = 30;
    const tabBarHeight = 40;
    const statusBarHeight = 30;
    
    if (isVerticalLayout) {
        if (historyVisible) {
            splitElements.forEach(elements => {
                if(elements.header) elements.header.classList.add('hidden');
                elements.bar.classList.add('hidden');
                elements.lines.classList.add('hidden');
                elements.input.classList.add('hidden');
                elements.statusBar.classList.add('hidden');
            });
        } else {
            const totalContentHeight = containerDiv.clientHeight - TOP_CONTENT_Y - 40;
            const splitHeight = totalContentHeight / __numSplits;
            const lineBarStart = PADDING_GAP;
            const contentStart = lineBarStart + LINE_BAR_WIDTH + PADDING_GAP;
            const containerWidth = containerDiv.clientWidth;
            const contentWidth = Math.max(20, containerWidth - LINE_BAR_WIDTH - PADDING_GAP * 3);

            splitElements.forEach((elements, index) => {
                const shouldShow = index < __numSplits;
                if(elements.header) elements.header.classList.toggle('hidden', !shouldShow);
                elements.bar.classList.toggle('hidden', !shouldShow);
                elements.lines.classList.toggle('hidden', !shouldShow);
                elements.input.classList.toggle('hidden', !shouldShow);
                elements.statusBar.classList.toggle('hidden', !shouldShow);
                
                if (shouldShow) {
                    const splitY = TOP_CONTENT_Y + index * splitHeight;
                    const textHeight = Math.max(20, splitHeight - headerHeight - tabBarHeight - statusBarHeight);

                    if(elements.header) {
                        const labelSpan = elements.header.querySelector('.split-label');
                        if (labelSpan) {
                            const splitName = __splits[index].name || `Split View ${index + 1}`;
                            labelSpan.textContent = splitName;
                            const newLabel = labelSpan.cloneNode(true);
                            labelSpan.parentNode.replaceChild(newLabel, labelSpan);
                            newLabel.onclick = () => {
                                const newName = prompt("Rename this Split View:", splitName);
                                if (newName) { __splits[index].name = newName; saveSplits(); updateLayout(); }
                            };
                        }
                        elements.header.style.left = `${contentStart}px`;
                        elements.header.style.width = `${contentWidth}px`;
                        elements.header.style.top = `${splitY}px`;
                    }
                    elements.bar.style.left = `${contentStart}px`;
                    elements.bar.style.width = `${contentWidth}px`;
                    elements.bar.style.top = `${splitY + headerHeight}px`; 

                    elements.lines.style.left = `${lineBarStart}px`;
                    elements.lines.style.width = `${LINE_BAR_WIDTH}px`;
                    elements.lines.style.top = `${splitY + headerHeight + tabBarHeight}px`; 
                    elements.lines.style.height = `${textHeight}px`;

                    elements.input.style.left = `${contentStart}px`;
                    elements.input.style.width = `${contentWidth}px`;
                    elements.input.style.top = `${splitY + headerHeight + tabBarHeight}px`; 
                    elements.input.style.height = `${textHeight}px`;

                    elements.statusBar.style.left = `${contentStart}px`;
                    elements.statusBar.style.width = `${contentWidth}px`;
                    elements.statusBar.style.top = `${splitY + splitHeight - statusBarHeight}px`;
                    elements.statusBar.style.bottom = 'auto'; 

                    updateWordCount(index);
                    updateLineNumbers(index);
                }
            });
        }
    } else {
        let splitAreaStart = PADDING_GAP;
        let containerWidth = containerDiv.clientWidth;
        let splitAreaEnd = containerWidth - PADDING_GAP;
        
        if (historyVisible) {
            splitAreaEnd = containerWidth - HISTORY_WIDTH - PADDING_GAP;
        }

        const totalContentWidth = splitAreaEnd - splitAreaStart;
        const splitWidth = totalContentWidth / __numSplits;
        
        splitElements.forEach((elements, index) => {
            const shouldShow = index < __numSplits;
            if(elements.header) elements.header.classList.toggle('hidden', !shouldShow);
            elements.bar.classList.toggle('hidden', !shouldShow);
            elements.lines.classList.toggle('hidden', !shouldShow);
            elements.input.classList.toggle('hidden', !shouldShow);
            elements.statusBar.classList.toggle('hidden', !shouldShow);
            
            if (shouldShow) {
                const splitX = splitAreaStart + index * splitWidth;
                const lineBarStart = splitX;
                const contentStart = lineBarStart + LINE_BAR_WIDTH + PADDING_GAP;
                const contentWidth = Math.max(20, splitWidth - LINE_BAR_WIDTH - PADDING_GAP - (index === __numSplits - 1 ? 0 : PADDING_GAP));
                
                const topY = TOP_CONTENT_Y;
                const contentHeight = containerDiv.clientHeight - TOP_CONTENT_Y - 40 - headerHeight - tabBarHeight - statusBarHeight;

                elements.lines.style.left = `${lineBarStart}px`;
                elements.lines.style.width = `${LINE_BAR_WIDTH}px`;
                elements.lines.style.top = `${topY + headerHeight + tabBarHeight}px`;
                elements.lines.style.height = `${contentHeight}px`;

                if(elements.header) {
                     const labelSpan = elements.header.querySelector('.split-label');
                     if (labelSpan) {
                         const splitName = __splits[index].name || `Split View ${index + 1}`;
                         labelSpan.textContent = splitName;
                         const newLabel = labelSpan.cloneNode(true);
                         labelSpan.parentNode.replaceChild(newLabel, labelSpan);
                         newLabel.onclick = () => {
                             const newName = prompt("Rename this Split View:", splitName);
                             if (newName) { __splits[index].name = newName; saveSplits(); updateLayout(); }
                         };
                     }
                    elements.header.style.left = `${contentStart}px`; 
                    elements.header.style.width = `${contentWidth}px`;
                    elements.header.style.top = `${topY}px`;
                }

                elements.bar.style.left = `${contentStart}px`; 
                elements.bar.style.width = `${contentWidth}px`;
                elements.bar.style.top = `${topY + headerHeight}px`;

                elements.input.style.left = `${contentStart}px`;
                elements.input.style.width = `${contentWidth}px`;
                elements.input.style.top = `${topY + headerHeight + tabBarHeight}px`;
                elements.input.style.height = `${contentHeight}px`;

                elements.statusBar.style.left = `${contentStart}px`;
                elements.statusBar.style.width = `${contentWidth}px`;
                elements.statusBar.style.top = ''; 
                elements.statusBar.style.bottom = '40px'; 

                updateWordCount(index);
                updateLineNumbers(index);
            }
        });
    }
    
    if (!isMobileMenu) {
         buttonContainerDiv.classList.remove('mobile-menu-open');
         hamburgerMenuToggle.innerHTML = '&#9776;';
    }
    buttonContainerDiv.style.left = 'auto';
}

function renderHistoryPanel() {
    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    if (!activeTab) return;
    historyList.innerHTML = ''; 
    if (activeTab.history.length === 0) {
        historyList.innerHTML = '<li>History is currently empty. Copy or delete text to log it!</li>';
    } else {
        activeTab.history.forEach(item => {
            const li = document.createElement('li');
            const title = document.createElement('strong');
            title.textContent = `${item.timestamp} - ${item.type} (Split ${item.split} | ${item.tabName}):`;
            const textSnippet = document.createElement('span');
            textSnippet.textContent = `"${item.text}"`;
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = () => { copyTextToClipboard(item.fullText); };
            li.appendChild(title); li.appendChild(textSnippet); li.appendChild(copyBtn);
            historyList.appendChild(li);
        });
    }
}

function setMode(isDark, updatePersistence = true) {
    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    if (!activeTab) return;
    const newTheme = isDark ? 'dark' : 'light';
    if (isDark) {
        body.classList.add('dark-mode');
        toggleButton.textContent = 'Switch to Light Mode';
    } else {
        body.classList.remove('dark-mode');
        toggleButton.textContent = 'Switch to Dark Mode';
    }
    if (updatePersistence) {
        Object.keys(__tabs).forEach(tabId => { __tabs[tabId].theme = newTheme; });
        saveTabs(); updateUrlHash(); 
    }
}

function addHistoryEntry(type, text, splitNum, tabName) {
    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    if (text.trim() === '' || !activeTab) return;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const truncatedText = text.substring(0, 50) + (text.length > 50 ? '...' : ''); 
    activeTab.history.unshift({ type: type, text: truncatedText, fullText: text, timestamp: timestamp, split: splitNum, tabName: tabName });
    if (activeTab.history.length > MAX_HISTORY_ITEMS) { activeTab.history.pop(); }
    renderHistoryPanel(); saveTabs();
}

function updateUrlHash() {
    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    if (!activeTab) return;
    const toolsVisible = body.classList.contains('tools-panel-visible');
    const calcVisible = !embeddedCalculator.classList.contains('hidden');
    const randVisible = !randomTextGenerator.classList.contains('hidden');
    const specialVisible = !specialCharsPanel.classList.contains('hidden');
    
    const stateParams = `font=${encodeURIComponent(activeTab.fontFamily)}&size=${activeTab.fontSizePx}&hist=${activeTab.isHistoryVisible ? 1 : 0}&tools=${toolsVisible ? 1 : 0}&calc=${calcVisible ? 1 : 0}&rand=${randVisible ? 1 : 0}&spec=${specialVisible ? 1 : 0}&theme=${activeTab.theme}&splits=${__numSplits}`;
    const newHash = `#${stateParams}`;
    window.history.replaceState(null, null, newHash);
}

function debounceUrlUpdate() {
    window.clearTimeout(urlUpdateTimeout);
    window.setTimeout(() => { updateUrlHash(); }, DEBOUNCE_TIME);
}

function getFontFallback(fontFamily) {
    switch(fontFamily) {
        case 'Arial': case 'Verdana': case 'Helvetica': return 'sans-serif';
        case 'Georgia': case 'Times New Roman': return 'serif';
        case 'Courier New': return 'monospace';
        default: return 'sans-serif';
    }
}

function applyFontSettings() {
    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    if (!activeTab) return;
    const currentFontFamily = activeTab.fontFamily;
    const currentFontSizePx = activeTab.fontSizePx;
    const lineHeight = Math.floor(currentFontSizePx * 1.5); 
    const lineHeightCSS = `${lineHeight}px`;
    
    splitElements.forEach((elements, index) => {
        elements.input.style.fontFamily = `'${currentFontFamily}', ${getFontFallback(currentFontFamily)}`;
        elements.input.style.fontSize = `${currentFontSizePx}px`;
        elements.input.style.lineHeight = lineHeightCSS; 
        
        elements.lines.style.fontFamily = `'Courier New', monospace`;
        elements.lines.style.fontSize = `${currentFontSizePx}px`;
        elements.lines.style.lineHeight = lineHeightCSS; 
        elements.input.style.paddingTop = '10px';
        elements.lines.style.paddingTop = '10px';

        updateLineNumbers(index);
    });
    fontSelector.value = currentFontFamily;
    saveSplitState(); updateUrlHash(); 
}

function handleFontChange(event) {
    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    if (!activeTab) return;
    const newFont = event.target.value;
    Object.keys(__tabs).forEach(tabId => { __tabs[tabId].fontFamily = newFont; });
    applyFontSettings(); saveTabs(); closeMobileMenu();
}

function handleFontSizeChange(increase) {
    const activeTab = __splits.length > 0 ? getActiveState(__splits[0].activeTabId) : null;
    if (!activeTab) return;
    const minSize = 10; const maxSize = 30; const step = 2;
    let newSize = activeTab.fontSizePx;
    if (increase && activeTab.fontSizePx < maxSize) { newSize += step; } 
    else if (!increase && activeTab.fontSizePx > minSize) { newSize -= step; }
    Object.keys(__tabs).forEach(tabId => { __tabs[tabId].fontSizePx = newSize; });
    applyFontSettings(); saveTabs(); closeMobileMenu();
}

function showCopyNotification(message) { alert(message); }

function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { showCopyNotification('Copied!'); }).catch(err => { showCopyNotification('Error!'); });
    } else {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; textArea.style.opacity = 0;
            document.body.appendChild(textArea); textArea.focus(); textArea.select();
            document.execCommand('copy'); document.body.removeChild(textArea);
            showCopyNotification('Copied!');
        } catch (err) { showCopyNotification('Error!'); }
    }
}

function handleSaveAsTxt(e) {
    const splitIndex = parseInt(e.target.dataset.splitIndex);
    const split = getSplitState(splitIndex);
    if (!split) return;
    const activeTab = getActiveState(split.activeTabId);
    if (!activeTab) return;
    const textContent = activeTab.content;
    const fileName = `${activeTab.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
}

function handleCalcKeyDown(e) {
    if (!body.classList.contains('tools-panel-visible')) return;
    if (embeddedCalculator.classList.contains('hidden')) return;
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.id === 'search-input' || activeEl.id === 'text-length' || activeEl.id === 'char-set' || activeEl.id === 'special-chars-search')) return; 

    let key = e.key; let buttonValue;
    if (key >= '0' && key <= '9') buttonValue = key;
    else if (key === '+' || key === '-' || key === '*' || key === '/') buttonValue = key;
    else if (key === '.') buttonValue = key;
    else if (key === 'Enter' || key === '=') buttonValue = '=';
    else if (key === 'Delete' || key === 'Backspace') buttonValue = 'C';
    else return; 
    e.preventDefault(); 
    const button = document.querySelector(`#calc-buttons button[data-value="${buttonValue}"]`);
    if (button) {
        button.style.backgroundColor = '#ccc';
        setTimeout(() => { button.style.backgroundColor = ''; }, 100);
        button.click();
    }
}

async function loadSpecialCharacters() {
    if (specialCharsLoaded) return;
    specialCharsList.innerHTML = '<div style="padding:10px; color:#666;">Loading special characters...</div>';
    try {
        const res = await fetch('/json/special_chars.json');
        if (!res.ok) throw new Error('Could not fetch special_chars.json');
        const json = await res.json();
        if (!Array.isArray(json) || json.length === 0) {
            specialCharsList.innerHTML = '<div style="padding:10px; color:red;">special_chars.json is empty or invalid</div>';
            return;
        }
        specialCharsData = json;
        specialCharsLoaded = true;
        populateSpecialCharsList();
    } catch (e) {
        console.error("Error loading special characters:", e);
        specialCharsList.innerHTML = '<div style="padding:10px; color:red;">Error loading special characters. Ensure /json/special_chars.json is accessible.</div>';
    }
}


function populateSpecialCharsList(filter = '') {
    specialCharsList.innerHTML = '';
    const searchTerm = filter.toLowerCase();
    const filtered = specialCharsData.filter(item => {
        return (item.name && item.name.toLowerCase().includes(searchTerm)) || 
               (item.char && item.char.includes(searchTerm)) ||
               (item.codepoint && item.codepoint.toLowerCase().includes(searchTerm));
    });
    
    if (filtered.length === 0) {
        specialCharsList.innerHTML = '<div style="padding:10px; text-align:center;">No matches found</div>';
        return;
    }
    const limit = 100;
    const renderList = filtered.slice(0, limit);
    
    renderList.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'currency-button'; 
        btn.dataset.char = item.char;
        btn.innerHTML = `<span>${item.name} <small style="color:#888;">${item.codepoint}</small></span><span style="font-size:1.5em;">${item.char}</span>`;
        specialCharsList.appendChild(btn);
    });
    
    if (filtered.length > limit) {
        const more = document.createElement('div');
        more.style.padding = '10px'; more.style.textAlign = 'center'; more.style.color = '#888';
        more.textContent = `...and ${filtered.length - limit} more (refine search)`;
        specialCharsList.appendChild(more);
    }
}

const initialLoad = () => {
    loadState();
    charSetInput.value = defaultCharSet;
    
    const urlHash = location.hash.substring(1); 
    let stateParams = null; 
    if (urlHash) { try { stateParams = new URLSearchParams(urlHash); } catch(e) { console.error(e); } }
    
    let activeTab = getActiveState(__splits[0].activeTabId);
    if (stateParams) {
        function createAndRegisterNewTab() {
            const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            const newId = generateUniqueId();
            __tabs[newId] = createNewTabState(newId, currentTheme, 1); 
            saveTabs(); return newId;
        }
        const urlSplits = parseInt(stateParams.get('splits'), 10);
        if (urlSplits && urlSplits > __numSplits) {
            if (urlSplits >= 2 && !__splits[1]) {
                const newTabId = createAndRegisterNewTab();
                __splits.push({ id: 'split-1', activeTabId: newTabId, tabIds: [newTabId], name: 'Split View 2' });
            }
            if (urlSplits === 3 && !__splits[2]) {
                const newTabId = createAndRegisterNewTab();
                __splits.push({ id: 'split-2', activeTabId: newTabId, tabIds: [newTabId], name: 'Split View 3' });
            }
            __numSplits = urlSplits; saveSplits();
        } else if (urlSplits && urlSplits < __numSplits) { __numSplits = urlSplits; saveSplits(); }

        activeTab = getActiveState(__splits[0].activeTabId);
        if (activeTab) {
            const urlTheme = stateParams.get('theme') || activeTab.theme;
            const urlFont = decodeURIComponent(stateParams.get('font') || activeTab.fontFamily);
            const urlSize = parseInt(stateParams.get('size'), 10) || activeTab.fontSizePx;
            const urlHist = stateParams.get('hist') === '1';
            const urlTools = stateParams.get('tools') === '1';
            const urlCalc = stateParams.get('calc') === '1';
            const urlRand = stateParams.get('rand') === '1';
            const urlSpec = stateParams.get('spec') === '1';
            
            if (urlTools) {
                body.classList.add('tools-panel-visible');
                if (urlCalc) embeddedCalculator.classList.remove('hidden');
                if (urlRand) randomTextGenerator.classList.remove('hidden');
                if (urlSpec) { specialCharsPanel.classList.remove('hidden'); loadSpecialCharacters(); }
            } else {
                if (urlCalc) autoOpenCalculator = true;
                if (urlRand) autoOpenRand = true;
                if (urlSpec) autoOpenSpecial = true;
            }
            Object.keys(__tabs).forEach(tabId => {
                __tabs[tabId].theme = urlTheme;
                __tabs[tabId].fontFamily = urlFont;
                __tabs[tabId].fontSizePx = urlSize;
            });
            activeTab.isHistoryVisible = urlHist;
        }
    }
    
    for (let i = 0; i < __numSplits; i++) {
        applySettingsToSplit(i); 
        const split = __splits[i];
        const tab = getActiveState(split.activeTabId);
        if (tab) {
            splitElements[i].input.value = tab.content;
            updateLineNumbers(i);
            updateWordCount(i);
        }
    }

    splitElements.forEach((el, index) => {
        if(el.input) {
            el.input.oninput = (e) => handleInput(e, index);
            el.input.onscroll = () => updateLineNumbers(index);
            el.input.oncopy = (e) => handleCopy(e, index);
            el.input.oncut = (e) => handleCut(e, index);
            el.input.onkeydown = (e) => handleKeydown(e, index);
            el.input.onpaste = (e) => handlePaste(e, index);
        }
        const saveButton = el.statusBar ? el.statusBar.querySelector('.save-tab-button') : null;
        if (saveButton) saveButton.onclick = (e) => handleSaveAsTxt(e);
    });

    document.querySelectorAll('.spellcheck-toggle').forEach(toggle => {
        toggle.addEventListener('change', handleSpellcheckToggle);
    });

    historyCloseButton.addEventListener('click', toggleHistory);

    hamburgerMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (body.classList.contains('tools-panel-visible')) { toggleToolsPanel(); return; }
        const isOpen = document.getElementById('button-container').classList.toggle('mobile-menu-open');
        hamburgerMenuToggle.innerHTML = isOpen ? '&times;' : '&#9776;';
    });

    historyClearButton.addEventListener('click', () => {
        const activeTab = getActiveState(__splits[0].activeTabId);
        if (activeTab && confirm('Are you sure you want to clear all history for this tab?')) {
            activeTab.history = []; saveTabs(); renderHistoryPanel();
        }
    });

    if(moreToolsButton) moreToolsButton.addEventListener('click', (e) => { e.stopPropagation(); toggleToolsPanel(); });
    if(toolsTrigger) toolsTrigger.addEventListener('click', (e) => { e.stopPropagation(); toggleToolsPanel(); });
    if(historyTrigger) historyTrigger.addEventListener('click', (e) => { e.stopPropagation(); toggleHistory(); });

    document.querySelectorAll('.split-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.splitIndex);
            closeSplit(index);
        });
    });

    toolsPanelCloseButton.addEventListener('click', toggleToolsPanel);
    
    showCalculatorButton.addEventListener('click', (e) => {
        e.stopPropagation(); embeddedCalculator.classList.toggle('hidden'); updateUrlHash();
    });

    calcButtons.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return; 
        e.stopPropagation(); 
        const value = e.target.dataset.value;
        if (value === 'C') calcDisplay.value = '';
        else if (value === '=') {
            try { calcDisplay.value = eval(calcDisplay.value.replace(/[^-()\d/*+.]/g, '')); } 
            catch (error) { calcDisplay.value = 'Error'; }
        } else if (value) calcDisplay.value += value;
    });
    
    showRandomTextButton.addEventListener('click', (e) => {
        e.stopPropagation(); randomTextGenerator.classList.toggle('hidden'); updateUrlHash();
    });
    
    generateTextButton.addEventListener('click', (e) => { e.stopPropagation(); 
        const chars = charSetInput.value; const length = parseInt(textLengthInput.value, 10);
        if (!chars || length <= 0) { generatedTextOutput.value = "Error"; return; }
        let result = ''; for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        generatedTextOutput.value = result;
    });
    
    copyGeneratedTextButton.addEventListener('click', (e) => {
        e.stopPropagation(); if(generatedTextOutput.value) copyTextToClipboard(generatedTextOutput.value);
    });
    
    fillAsciiButton.addEventListener('click', (e) => { e.stopPropagation(); charSetInput.value = defaultCharSet; });

    showSpecialCharsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        specialCharsPanel.classList.toggle('hidden');
        if (!specialCharsPanel.classList.contains('hidden')) { loadSpecialCharacters(); }
        updateUrlHash();
    });
    
    specialCharsList.addEventListener('click', (e) => {
         e.stopPropagation();
         const button = e.target.closest('.currency-button');
         if (button) { const char = button.dataset.char; copyTextToClipboard(char); }
    });
    
    specialCharsSearch.addEventListener('input', (e) => { populateSpecialCharsList(e.target.value); });
    
    splitButton.addEventListener('click', toggleSplits);
    fontSelector.addEventListener('change', handleFontChange);
    fontSizeUp.addEventListener('click', () => handleFontSizeChange(true));
    fontSizeDown.addEventListener('click', () => handleFontSizeChange(false));
    
    if(historyToggle) historyToggle.addEventListener('click', toggleHistory);
    
    toggleButton.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        setMode(!isDarkMode); closeMobileMenu(); moreDropdownContent.classList.remove('show');
    });
    
    showUrlButton.addEventListener('click', () => {
        updateUrlHash(); 
        const shareUrl = window.location.href; const originalText = "Get Share URL";
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showUrlButton.textContent = "URL Copied"; showUrlButton.classList.add('copied'); 
                setTimeout(() => { showUrlButton.textContent = originalText; showUrlButton.classList.remove('copied'); }, 1000); 
            }).catch(err => { showUrlButton.textContent = "Error copying!"; setTimeout(() => { showUrlButton.textContent = originalText; }, 2000); });
        } else {
             try {
                const textArea = document.createElement("textarea"); textArea.value = shareUrl;
                textArea.style.position = "fixed";  textArea.style.opacity = 0;
                document.body.appendChild(textArea); textArea.focus(); textArea.select();
                document.execCommand('copy'); document.body.removeChild(textArea);
                showUrlButton.textContent = "URL Copied"; showUrlButton.classList.add('copied'); 
                setTimeout(() => { showUrlButton.textContent = originalText; showUrlButton.classList.remove('copied'); }, 1000); 
            } catch (err) { showUrlButton.textContent = "Error copying!"; setTimeout(() => { showUrlButton.textContent = originalText; }, 2000); }
        }
    });
    
    aboutButton.addEventListener('click', () => {
        aboutModalOverlay.classList.add('show'); closeMobileMenu(); moreDropdownContent.classList.remove('show');
    });

    aboutModalCloseButton.addEventListener('click', () => { aboutModalOverlay.classList.remove('show'); });
    aboutModalOverlay.addEventListener('click', (e) => { if (e.target === aboutModalOverlay) aboutModalOverlay.classList.remove('show'); });

    moreButton.addEventListener('click', (e) => { e.stopPropagation(); moreDropdownContent.classList.toggle('show'); });
    moreDropdownContent.addEventListener('click', (e) => { 

    });

    window.addEventListener('click', (e) => {
        if (!moreButton.contains(e.target) && !moreDropdownContent.contains(e.target)) {
            if (moreDropdownContent.classList.contains('show')) moreDropdownContent.classList.remove('show');
        }
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            if (searchDropdownResults.classList.contains('show')) searchDropdownResults.classList.remove('show');
        }
        const buttonContainer = document.getElementById('button-container');
        const isMobile = body.classList.contains('mobile-layout');
        if (isMobile && buttonContainer.classList.contains('mobile-menu-open') && !hamburgerMenuToggle.contains(e.target) && !buttonContainer.contains(e.target)) {
            buttonContainer.classList.remove('mobile-menu-open'); hamburgerMenuToggle.innerHTML = '&#9776;';
        }
    });
    
    window.addEventListener('keydown', handleCalcKeyDown);
    
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
            const results = performSearch(); renderSearchDropdown(results);
        }, 300); 
    });
    
    updateTriggerIcons();
};

window.addEventListener('resize', () => { updateLayout(); }); 

window.onload = () => {
    initialLoad();
};
