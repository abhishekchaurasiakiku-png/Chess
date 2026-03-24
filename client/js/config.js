// ============================================
// CONFIGURATION: SET YOUR RENDER API URL HERE!
// ============================================

// If you are testing locally, this automatically uses localhost:3000.
// If you are on Vercel, replacing the string below will connect your app to Render.

const PROD_BACKEND_URL = 'https://YOUR_WEBSERVICE_URL_HERE.onrender.com'; // ⚠️ <--- REPLACE THIS URL AFTER DEPLOYING BACKEND TO RENDER!

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : PROD_BACKEND_URL;
