/// 서버 요청 주소
import {USER_URL} from "./config.js";
const BASE_URL = USER_URL;

/// 인증 요청
import { authFetch } from './authFetch.js';

/// 회원가입
export async function signUp(userData) {

    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(userData),
    });

    if (!res.ok) {
        throw new Error(`회원가입 실패 (${res.status})`);
    }

    return await res.json();
}

/// 이메일 중복 체크
export async function checkDuplicateEmail(email) {

    const res = await fetch(`${BASE_URL}/email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) {
        throw new Error(`이메일 중복 체크 실패 (${res.status})`);
    }

    return await res.json();
}


/// 닉네임 중복 체크
export async function checkDuplicateNickname(nickName) {

    const res = await fetch(`${BASE_URL}/nickname?nickName=${encodeURIComponent(nickName)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
        throw new Error(`닉네임 중복 체크 실패 (${res.status})`);
    }

    return await res.json();
}

/// 마이페이지 조회
export async function getMyPage() {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/mypage`, {method: 'GET'});

    if (!res.ok) {
        throw new Error(`마이페이지 조회 실패 (${res.status})`);
    }

    return await res.json();
}

/// 타 유저 조회
export async function getOtherUser(userId) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/${encodeURIComponent(userId)}`, {
        method: 'GET'
    });

    if (!res.ok) {
        throw new Error(`타 유저 조회 실패 (${res.status})`);
    }

    return await res.json();
}

/// 개인정보 수정
export async function updateMyPage(changeableData) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/mypage`, {
        method: 'PUT',
        body: JSON.stringify(changeableData),
    });

    if (!res.ok) {
        throw new Error(`개인정보 수정 실패 (${res.status})`);
    }

    return await res.json();
}

/// 비밀번호 수정
export async function updatePassword(changeableData) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/password`, {
        method: 'PUT', body: JSON.stringify(changeableData)
    });

    if (!res.ok) {
        throw new Error(`마이페이지 조회 실패 (${res.status})`);
    }

    return await res.json();
}

/// 회원 탈퇴
export async function withdraw() {

    /// 인증 요청
    const res = await authFetch(BASE_URL, {
        method: 'PUT'
    });

    if (!res.ok) {
        throw new Error(`회원 탈퇴 실패 (${res.status})`);
    }

    return await res.json();
}
