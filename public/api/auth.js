const BASE_URL = 'http://localhost:8080/v1/auth';

/// 로그인
export async function login(loginData) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: loginData})
    });

    if (!res.ok) throw new Error(`로그인 실패 (${res.status})`);
    return await res.json();
}

/// 로그아웃
export async function logout() {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
    });

    if (!res.ok) throw new Error(`로그아웃 실패 (${res.status})`);
    return await res.json();
}


/// 토큰 재발급
export async function reissue() {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
    });

    if (!res.ok) throw new Error(`재발급 등록 실패 (${res.status})`);
    return await res.json();
}