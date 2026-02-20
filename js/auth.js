/* ============================================
   ACE Pilot Training Log
   Authentication Module
   ============================================ */

// Current user state
let currentUser = null;
let currentPilotData = null;

/**
 * Show the login form, hide registration
 */
function showLogin() {
    document.getElementById('login-form-section').classList.remove('hidden');
    document.getElementById('register-form-section').classList.add('hidden');
    clearErrors();
}

/**
 * Show the registration form, hide login
 */
function showRegister() {
    document.getElementById('login-form-section').classList.add('hidden');
    document.getElementById('register-form-section').classList.remove('hidden');
    clearErrors();
}

/**
 * Clear error messages
 */
function clearErrors() {
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('register-error').classList.add('hidden');
}

/**
 * Show error on login form
 */
function showLoginError(message) {
    const el = document.getElementById('login-error');
    el.textContent = message;
    el.classList.remove('hidden');
}

/**
 * Show error on registration form
 */
function showRegisterError(message) {
    const el = document.getElementById('register-error');
    el.textContent = message;
    el.classList.remove('hidden');
}

/**
 * Validate certificate ID (must be exactly 5 digits)
 */
function validateCertId(certId) {
    return /^\d{5}$/.test(certId);
}

/**
 * Handle user login
 */
async function handleLogin() {
    clearErrors();

    const certId = document.getElementById('login-cert-id').value.trim();
    const password = document.getElementById('login-password').value;

    if (!validateCertId(certId)) {
        showLoginError('Certificate ID must be exactly 5 digits.');
        return;
    }

    if (!password || password.length < 6) {
        showLoginError('Password must be at least 6 characters.');
        return;
    }

    showLoading(true);

    try {
        // Use cert ID as email prefix for Firebase Auth
        const email = `pilot${certId}@acepilotlog.app`;
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;

        // Load pilot data
        await loadPilotData(certId);
        showAppScreen();
        showToast('Welcome back, pilot!');
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
            showLoginError('No account found with this Certificate ID. Please register first.');
        } else if (error.code === 'auth/wrong-password') {
            showLoginError('Incorrect password. Please try again.');
        } else if (error.code === 'auth/invalid-credential') {
            showLoginError('Invalid credentials. Please check your Certificate ID and password.');
        } else {
            showLoginError('Login failed. Please try again.');
        }
    } finally {
        showLoading(false);
    }
}

/**
 * Handle new user registration
 */
async function handleRegister() {
    clearErrors();

    const firstName = document.getElementById('reg-first-name').value.trim();
    const lastName = document.getElementById('reg-last-name').value.trim();
    const certId = document.getElementById('reg-cert-id').value.trim();
    const gender = document.getElementById('reg-gender').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;

    // Validation
    if (!firstName) {
        showRegisterError('First name is required.');
        return;
    }

    if (!lastName) {
        showRegisterError('Last name is required.');
        return;
    }

    if (!validateCertId(certId)) {
        showRegisterError('Certificate ID must be exactly 5 digits.');
        return;
    }

    if (!gender) {
        showRegisterError('Please select your gender.');
        return;
    }

    if (!password || password.length < 6) {
        showRegisterError('Password must be at least 6 characters.');
        return;
    }

    if (password !== confirmPassword) {
        showRegisterError('Passwords do not match.');
        return;
    }

    showLoading(true);

    try {
        // Check if certificate ID is already taken
        const existingDoc = await db.collection('pilots').doc(certId).get();
        if (existingDoc.exists) {
            showRegisterError('This Certificate ID is already registered. Please login instead.');
            showLoading(false);
            return;
        }

        // Create Firebase Auth account
        const email = `pilot${certId}@acepilotlog.app`;
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;

        // Create pilot document in Firestore
        const pilotData = {
            firstName: firstName,
            lastName: lastName,
            certId: certId,
            gender: gender,
            uid: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

            // Transfer Student
            transferStudent: '',
            transferHours: '',
            transferLandings: '',

            // Solo Flight
            soloDate: '',
            soloAge: '',
            soloHours: '',
            soloLandings: '',
            soloAirplane: '',

            // Private Pilot
            privateDate: '',
            privateAge: '',
            privateHours: '',
            privateLandings: '',
            privateAirplane: '',
            privateWrittenExam: '',
            privateCheckrideAttempts: '',

            // Instrument Rating
            instrumentRating: '',
            instrumentDate: '',
            instrumentHours: '',
            instrumentAirplane: '',
            instrumentWrittenExam: '',

            // Commercial Pilot
            commercialDate: '',
            commercialAge: '',
            commercialHours: '',
            commercialAirplane: '',
            commercialWrittenExam: '',
            commercialCheckrideAttempts: '',

            // Multi-Engine
            multiEngineRating: '',
            multiEngineDate: '',
            multiEngineHours: '',
            multiEngineAirplane: '',

            // CFI
            cfiCertificate: '',
            cfiDate: '',
            cfiHours: '',
            cfiiCertificate: '',
            meiCertificate: '',

            // Education & Career
            collegeAttended: '',
            major: '',
            firstAirlineJob: '',
            additionalRatings: ''
        };

        await db.collection('pilots').doc(certId).set(pilotData);

        currentPilotData = pilotData;
        showAppScreen();
        showToast('Account created successfully!');
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'auth/email-already-in-use') {
            showRegisterError('This Certificate ID is already registered. Please login instead.');
        } else {
            showRegisterError('Registration failed: ' + error.message);
        }
    } finally {
        showLoading(false);
    }
}

/**
 * Load pilot data from Firestore
 */
async function loadPilotData(certId) {
    const doc = await db.collection('pilots').doc(certId).get();
    if (doc.exists) {
        currentPilotData = doc.data();
    } else {
        throw new Error('Pilot data not found.');
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        await auth.signOut();
        currentUser = null;
        currentPilotData = null;
        showLoginScreen();
        showToast('Signed out successfully.');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Switch to app screen
 */
function showAppScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    initializeApp();
}

/**
 * Switch to login screen
 */
function showLoginScreen() {
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');

    // Clear form inputs
    document.getElementById('login-cert-id').value = '';
    document.getElementById('login-password').value = '';
    clearErrors();
}

/**
 * Listen for auth state changes
 */
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        // Extract cert ID from email: pilot12345@acepilotlog.app -> 12345
        const email = user.email;
        const certId = email.replace('pilot', '').replace('@acepilotlog.app', '');

        try {
            await loadPilotData(certId);
            showAppScreen();
        } catch (error) {
            console.error('Failed to load pilot data:', error);
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
    showLoading(false);
});
