const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    loginMessage.textContent = 'Đang đăng nhập...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = 'Đăng nhập thất bại: ' + error.message;
        return;
    }

    loginMessage.textContent = 'Đăng nhập thành công!';

    window.location.href = 'dashboard.html';
});