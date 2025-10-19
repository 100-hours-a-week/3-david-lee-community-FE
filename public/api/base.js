export async function authFetch(url, options = {}) {
    const token = localStorage.getItem('accessToken');

    /// access_token 쿠키 전송
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    /// refresh_token 쿠키 전송
    const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (!res.ok) {
        const msg = `요청 실패 (${res.status})`;
        throw new Error(msg);
    }

    return res;
}
