/* ============================================
   ACE Pilot Training Log
   Authentication Module
   ============================================ */

// Current user state
let currentUser = null;
let currentPilotData = null;
let isRegistering = false;

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

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email) {
        showLoginError('Email address is required.');
        return;
    }

    if (!password || password.length < 6) {
        showLoginError('Password must be at least 6 characters.');
        return;
    }

    showLoading(true);

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;

        // Load pilot data by UID
        await loadPilotData(currentUser.uid);
        showAppScreen();
        showToast('Welcome back, pilot!');
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
            showLoginError('No account found with this email. Please register first.');
        } else if (error.code === 'auth/wrong-password') {
            showLoginError('Incorrect password. Please try again.');
        } else if (error.code === 'auth/invalid-credential') {
            showLoginError('Invalid credentials. Please check your email and password.');
        } else if (error.code === 'auth/invalid-email') {
            showLoginError('Please enter a valid email address.');
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
    const email = document.getElementById('reg-email').value.trim();
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

    if (!email) {
        showRegisterError('Email address is required.');
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
    isRegistering = true;

    try {
        // Create Firebase Auth account with real email
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;

        // Create pilot document in Firestore
        const pilotData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
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
        isRegistering = false;
        showAppScreen();
        showToast('Account created successfully!');
    } catch (error) {
        console.error('Registration error:', error);
        isRegistering = false;
        if (error.code === 'auth/email-already-in-use') {
            showRegisterError('This email is already registered. Please login instead.');
        } else if (error.code === 'auth/invalid-email') {
            showRegisterError('Please enter a valid email address.');
        } else {
            showRegisterError('Registration failed: ' + error.message);
        }
    } finally {
        showLoading(false);
    }
}

/**
 * Load pilot data from Firestore by UID
 */
async function loadPilotData(uid) {
    const snapshot = await db.collection('pilots').where('uid', '==', uid).limit(1).get();
    if (!snapshot.empty) {
        currentPilotData = snapshot.docs[0].data();
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
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    clearErrors();
}

/**
 * Listen for auth state changes
 */
auth.onAuthStateChanged(async (user) => {
    // Skip if registration is in progress — handleRegister manages the flow
    if (isRegistering) return;

    if (user) {
        currentUser = user;

        try {
            await loadPilotData(user.uid);
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
