/// 서버 요청 주소
import {API_BASE} from "./config.js";
const BASE_URL = API_BASE;

export async function privacy() {

    const res = await fetch(`${BASE_URL}/privacy`, {
        method: 'GET',
        headers: {'Content-Type': 'application/html'},
    });

    if (!res.ok) {
        throw new Error(`개인정보 실패 (${res.status})`);
    }

    return res;
}

export async function terms() {

    const res = await fetch(`${BASE_URL}/terms`, {
        method: 'GET',
        headers: {'Content-Type': 'application/html'},
    });

    if (!res.ok) {
        throw new Error(`개인정보 실패 (${res.status})`);
    }

    return res;
}