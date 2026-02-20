/* ============================================
   ACE Pilot Training Log
   Main Application Module
   ============================================ */

// All trackable training fields (excluding personal info)
const TRAINING_FIELDS = [
    'transferStudent', 'transferHours', 'transferLandings',
    'soloDate', 'soloAge', 'soloHours', 'soloLandings', 'soloAirplane',
    'privateDate', 'privateAge', 'privateHours', 'privateLandings',
    'privateAirplane', 'privateWrittenExam', 'privateCheckrideAttempts',
    'instrumentRating', 'instrumentDate', 'instrumentHours',
    'instrumentAirplane', 'instrumentWrittenExam',
    'commercialDate', 'commercialAge', 'commercialHours',
    'commercialAirplane', 'commercialWrittenExam', 'commercialCheckrideAttempts',
    'multiEngineRating', 'multiEngineDate', 'multiEngineHours', 'multiEngineAirplane',
    'cfiCertificate', 'cfiDate', 'cfiHours', 'cfiiCertificate', 'meiCertificate',
    'collegeAttended', 'major', 'firstAirlineJob', 'additionalRatings'
];

// Milestone groupings for progress calculation
const MILESTONES = {
    transfer: ['transferStudent', 'transferHours', 'transferLandings'],
    solo: ['soloDate', 'soloAge', 'soloHours', 'soloLandings', 'soloAirplane'],
    private: ['privateDate', 'privateAge', 'privateHours', 'privateLandings', 'privateAirplane', 'privateWrittenExam', 'privateCheckrideAttempts'],
    instrument: ['instrumentRating', 'instrumentDate', 'instrumentHours', 'instrumentAirplane', 'instrumentWrittenExam'],
    commercial: ['commercialDate', 'commercialAge', 'commercialHours', 'commercialAirplane', 'commercialWrittenExam', 'commercialCheckrideAttempts'],
    cfi: ['cfiCertificate', 'cfiDate', 'cfiHours', 'cfiiCertificate', 'meiCertificate']
};

// Achievement definitions
const ACHIEVEMENTS = [
    { id: 'solo', icon: 'fa-user-astronaut', label: 'First Solo', field: 'soloDate' },
    { id: 'private', icon: 'fa-certificate', label: 'Private Pilot', field: 'privateDate' },
    { id: 'instrument', icon: 'fa-cloud-sun', label: 'Instrument', field: 'instrumentDate' },
    { id: 'commercial', icon: 'fa-plane-departure', label: 'Commercial', field: 'commercialDate' },
    { id: 'multiengine', icon: 'fa-cogs', label: 'Multi-Engine', field: 'multiEngineDate' },
    { id: 'cfi', icon: 'fa-chalkboard-teacher', label: 'CFI', field: 'cfiDate' },
    { id: 'cfii', icon: 'fa-cloud', label: 'CFII', field: 'cfiiCertificate' },
    { id: 'college', icon: 'fa-graduation-cap', label: 'College', field: 'collegeAttended' },
    { id: 'airline', icon: 'fa-plane', label: 'Airline Job', field: 'firstAirlineJob' }
];

/**
 * Initialize the app after login
 */
function initializeApp() {
    if (!currentPilotData) return;

    updateNavPilotName();
    populateTrainingForm();
    updateDashboard();
    updateProfile();
    lockSubmittedFields();
}

/**
 * Update the nav bar with pilot name
 */
function updateNavPilotName() {
    const name = `${currentPilotData.firstName} ${currentPilotData.lastName}`;
    document.getElementById('nav-pilot-name').textContent = name;
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });

    // Refresh data when switching tabs
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'profile') {
        updateProfile();
    }
}

/**
 * Toggle form section collapse
 */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('collapsed');
}

/* ============================================
   TRAINING FORM
   ============================================ */

/**
 * Populate form fields with existing pilot data
 */
function populateTrainingForm() {
    if (!currentPilotData) return;

    TRAINING_FIELDS.forEach(field => {
        const el = document.getElementById(`field-${field}`);
        if (el && currentPilotData[field] !== undefined) {
            el.value = currentPilotData[field] || '';
        }
    });
}

/**
 * Lock fields that already have submitted data
 * Users can only fill empty fields, not edit existing data
 */
function lockSubmittedFields() {
    if (!currentPilotData) return;

    TRAINING_FIELDS.forEach(field => {
        const el = document.getElementById(`field-${field}`);
        if (!el) return;

        const value = currentPilotData[field];
        if (value !== undefined && value !== null && value !== '') {
            // Field has data - lock it
            const wrapper = el.closest('.form-field');
            if (wrapper) {
                wrapper.classList.add('field-locked');
            }
            el.disabled = true;
        } else {
            // Field is empty - keep editable
            const wrapper = el.closest('.form-field');
            if (wrapper) {
                wrapper.classList.remove('field-locked');
            }
            el.disabled = false;
        }
    });
}

/**
 * Save training data to Firestore
 * Only saves fields that were previously empty
 */
async function saveTrainingData() {
    if (!currentPilotData || !currentUser) return;

    const saveBtn = document.getElementById('save-training-btn');
    const saveStatus = document.getElementById('save-status');
    saveBtn.disabled = true;

    try {
        const updates = {};
        let hasChanges = false;

        TRAINING_FIELDS.forEach(field => {
            const el = document.getElementById(`field-${field}`);
            if (!el) return;

            const currentValue = currentPilotData[field];
            const newValue = el.value.trim();

            // Only allow updating fields that were previously empty
            if ((!currentValue || currentValue === '') && newValue !== '') {
                updates[field] = newValue;
                hasChanges = true;
            }
        });

        if (!hasChanges) {
            showSaveStatus('No new data to save.', 'error');
            saveBtn.disabled = false;
            return;
        }

        updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        // Update Firestore
        await db.collection('pilots').doc(currentPilotData.certId).update(updates);

        // Update local data
        Object.keys(updates).forEach(key => {
            if (key !== 'updatedAt') {
                currentPilotData[key] = updates[key];
            }
        });

        // Re-lock fields and refresh dashboard
        lockSubmittedFields();
        updateDashboard();
        updateProfile();

        showSaveStatus('Training data saved successfully!', 'success');
        showToast('Data saved!');
    } catch (error) {
        console.error('Save error:', error);
        showSaveStatus('Failed to save data. Please try again.', 'error');
    } finally {
        saveBtn.disabled = false;
    }
}

/**
 * Show save status message
 */
function showSaveStatus(message, type) {
    const el = document.getElementById('save-status');
    el.textContent = message;
    el.className = `save-status ${type}`;
    el.classList.remove('hidden');

    setTimeout(() => {
        el.classList.add('hidden');
    }, 4000);
}

/* ============================================
   DASHBOARD & ANALYTICS
   ============================================ */

/**
 * Update the entire dashboard with current data
 */
function updateDashboard() {
    if (!currentPilotData) return;

    updateOverallProgress();
    updateMilestoneCards();
    updateHoursSummary();
}

/**
 * Calculate and update overall progress percentage
 */
function updateOverallProgress() {
    let filledCount = 0;
    let totalCount = TRAINING_FIELDS.length;

    TRAINING_FIELDS.forEach(field => {
        const value = currentPilotData[field];
        if (value !== undefined && value !== null && value !== '') {
            filledCount++;
        }
    });

    const percent = Math.round((filledCount / totalCount) * 100);
    const fill = document.getElementById('overall-progress-fill');
    const text = document.getElementById('overall-progress-text');

    if (fill) fill.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
}

/**
 * Update individual milestone progress cards
 */
function updateMilestoneCards() {
    Object.keys(MILESTONES).forEach(milestone => {
        const fields = MILESTONES[milestone];
        let filled = 0;

        fields.forEach(field => {
            const value = currentPilotData[field];
            if (value !== undefined && value !== null && value !== '') {
                filled++;
            }
        });

        const percent = Math.round((filled / fields.length) * 100);

        // Update progress bar
        const progressFill = document.querySelector(`[data-milestone="${milestone}"]`);
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }

        // Update progress text
        const progressText = document.querySelector(`[data-milestone-text="${milestone}"]`);
        if (progressText) {
            progressText.textContent = `${percent}%`;
        }

        // Mark completed milestones
        const card = document.getElementById(`milestone-${milestone}`);
        if (card) {
            card.classList.toggle('completed', percent === 100);
        }
    });

    // Update milestone stat values
    updateStatValue('transferHours', currentPilotData.transferHours);
    updateStatValue('transferLandings', currentPilotData.transferLandings);
    updateStatValue('soloDate', formatDate(currentPilotData.soloDate));
    updateStatValue('soloHours', currentPilotData.soloHours);
    updateStatValue('privateDate', formatDate(currentPilotData.privateDate));
    updateStatValue('privateHours', currentPilotData.privateHours);
    updateStatValue('instrumentDate', formatDate(currentPilotData.instrumentDate));
    updateStatValue('instrumentHours', currentPilotData.instrumentHours);
    updateStatValue('commercialDate', formatDate(currentPilotData.commercialDate));
    updateStatValue('commercialHours', currentPilotData.commercialHours);
    updateStatValue('cfiDate', formatDate(currentPilotData.cfiDate));
    updateStatValue('cfiHours', currentPilotData.cfiHours);
}

/**
 * Update a stat value in the milestone cards
 */
function updateStatValue(statName, value) {
    const el = document.querySelector(`[data-stat="${statName}"]`);
    if (el) {
        el.textContent = value || '--';
    }
}

/**
 * Update flight hours summary section
 */
function updateHoursSummary() {
    // Calculate total hours (highest hour value represents total)
    const hourFields = [
        parseFloat(currentPilotData.transferHours) || 0,
        parseFloat(currentPilotData.soloHours) || 0,
        parseFloat(currentPilotData.privateHours) || 0,
        parseFloat(currentPilotData.instrumentHours) || 0,
        parseFloat(currentPilotData.commercialHours) || 0,
        parseFloat(currentPilotData.multiEngineHours) || 0,
        parseFloat(currentPilotData.cfiHours) || 0
    ];
    const totalHours = Math.max(...hourFields, 0);

    // Calculate total landings
    const totalLandings =
        (parseInt(currentPilotData.transferLandings) || 0) +
        (parseInt(currentPilotData.soloLandings) || 0) +
        (parseInt(currentPilotData.privateLandings) || 0);

    // Count certificates earned
    let certificates = 0;
    if (currentPilotData.privateDate) certificates++;
    if (currentPilotData.commercialDate) certificates++;
    if (currentPilotData.cfiCertificate === 'Yes') certificates++;

    // Count ratings earned
    let ratings = 0;
    if (currentPilotData.instrumentRating === 'Yes') ratings++;
    if (currentPilotData.multiEngineRating === 'Yes') ratings++;
    if (currentPilotData.cfiiCertificate === 'Yes') ratings++;
    if (currentPilotData.meiCertificate === 'Yes') ratings++;
    if (currentPilotData.additionalRatings) ratings++;

    // Animate counters
    animateCounter('stat-total-hours', totalHours, true);
    animateCounter('stat-total-landings', totalLandings);
    animateCounter('stat-certificates', certificates);
    animateCounter('stat-ratings', ratings);
}

/**
 * Animate a numeric counter
 */
function animateCounter(elementId, targetValue, isDecimal = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const duration = 1000;
    const start = parseFloat(el.textContent) || 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = start + (targetValue - start) * eased;

        el.textContent = isDecimal ? current.toFixed(1) : Math.round(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/* ============================================
   PROFILE
   ============================================ */

/**
 * Update the profile tab with pilot data
 */
function updateProfile() {
    if (!currentPilotData) return;

    document.getElementById('profile-name').textContent =
        `${currentPilotData.firstName} ${currentPilotData.lastName}`;
    document.getElementById('profile-cert-id').textContent =
        currentPilotData.certId;
    document.getElementById('profile-gender').textContent =
        currentPilotData.gender || '--';

    // Format join date
    if (currentPilotData.createdAt) {
        const date = currentPilotData.createdAt.toDate
            ? currentPilotData.createdAt.toDate()
            : new Date(currentPilotData.createdAt);
        document.getElementById('profile-joined').textContent =
            date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
        document.getElementById('profile-joined').textContent = '--';
    }

    // Update achievements
    updateAchievements();
}

/**
 * Update achievement badges
 */
function updateAchievements() {
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';

    ACHIEVEMENTS.forEach(achievement => {
        const value = currentPilotData[achievement.field];
        const earned = value && value !== '' && value !== 'No' && value !== 'In Progress';

        const badge = document.createElement('div');
        badge.className = `achievement-badge${earned ? ' earned' : ''}`;
        badge.innerHTML = `
            <i class="fas ${achievement.icon}"></i>
            <span>${achievement.label}</span>
        `;
        container.appendChild(badge);
    });
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Format a date string for display
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

/* ============================================
   KEYBOARD SHORTCUTS & EVENTS
   ============================================ */

// Handle Enter key on login/register forms
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const loginSection = document.getElementById('login-form-section');
        const registerSection = document.getElementById('register-form-section');

        if (!loginSection.classList.contains('hidden')) {
            handleLogin();
        } else if (!registerSection.classList.contains('hidden')) {
            handleRegister();
        }
    }
});

// Initialize loading state
showLoading(true);
