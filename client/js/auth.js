let authMode = 'login'; // 'login' or 'register'
const authToken = localStorage.getItem('token');
let currentUser = null;

$(document).ready(function() {
    const $modal = $('#auth-modal');
    const $form = $('#auth-form');
    const $error = $('#auth-error');
    const $title = $('#auth-title');
    const $btnSubmit = $('#btn-submit-auth');
    const $switchLink = $('#auth-switch-link');
    const $switchText = $('#auth-switch-text');

    // Check if user is already logged in
    if (authToken) {
        // Optimistically hide auth
        $modal.addClass('hidden');
        $('#btn-start').show();
        // Decode logic or fetch profile could go here, for now trust token
        // But for robust socket handling, you'd send token to server during connection
    }

    $switchLink.on('click', function(e) {
        e.preventDefault();
        $error.text('');
        if (authMode === 'login') {
            authMode = 'register';
            $title.text('Create Account');
            $btnSubmit.text('Sign Up');
            $switchText.text('Already have an account?');
            $(this).text('Login');
        } else {
            authMode = 'login';
            $title.text('Welcome Back');
            $btnSubmit.text('Login');
            $switchText.text("Don't have an account?");
            $(this).text('Sign up');
        }
    });

    $form.on('submit', async function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        const endpoint = authMode === 'login' ? `${BACKEND_URL}/api/auth/login` : `${BACKEND_URL}/api/auth/register`;

        $btnSubmit.prop('disabled', true).text('Please wait...');
        $error.text('');

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Success
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            
            // Update UI
            $('.player-info.you .name').text(currentUser.username);
            $modal.addClass('hidden');
            $('#btn-start').show();

        } catch (err) {
            $error.text(err.message);
        } finally {
            $btnSubmit.prop('disabled', false).text(authMode === 'login' ? 'Login' : 'Sign Up');
        }
    });

    // Make btn-start hidden by default unles authenticated
    if (!authToken) {
        $('#btn-start').hide();
    }
});
