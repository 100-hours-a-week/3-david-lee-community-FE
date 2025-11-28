import { EMAIL_RE, NICK_RE, PW_COMPLEXITY_RE } from '../public/utils/validators.js';

describe('validators', () => {
    describe('EMAIL_RE', () => {
        it('should validate correct email format', () => {
            expect(EMAIL_RE.test('test@example.com')).toBe(true);
            expect(EMAIL_RE.test('user.name@domain.co.kr')).toBe(true);
        });

        it('should reject invalid email format', () => {
            expect(EMAIL_RE.test('invalid')).toBe(false);
            expect(EMAIL_RE.test('@example.com')).toBe(false);
            expect(EMAIL_RE.test('test@')).toBe(false);
        });
    });

    describe('NICK_RE', () => {
        it('should validate correct nickname format', () => {
            expect(NICK_RE.test('닉네임')).toBe(true);
            expect(NICK_RE.test('user123')).toBe(true);
            expect(NICK_RE.test('테스트_유저')).toBe(true);
        });

        it('should reject invalid nickname format', () => {
            expect(NICK_RE.test('a')).toBe(false); // too short
            expect(NICK_RE.test('12345678901')).toBe(false); // too long
            expect(NICK_RE.test('nick name')).toBe(false); // contains space
        });
    });

    describe('PW_COMPLEXITY_RE', () => {
        it('should validate password with all required characters', () => {
            expect(PW_COMPLEXITY_RE.test('Test1234!')).toBe(true);
            expect(PW_COMPLEXITY_RE.test('MyP@ssw0rd')).toBe(true);
        });

        it('should reject password without required characters', () => {
            expect(PW_COMPLEXITY_RE.test('password')).toBe(false); // no uppercase, digit, special char
            expect(PW_COMPLEXITY_RE.test('PASSWORD123!')).toBe(false); // no lowercase
            expect(PW_COMPLEXITY_RE.test('Password!')).toBe(false); // no digit
        });
    });
});
