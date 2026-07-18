import { expect, describe, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { decrypt, decrypt_v2, decrypt_v3 } from './decrypt';

vi.stubGlobal('crypto', {
	subtle: webcrypto.subtle
});

const TEST_NOTE_V2 = {
	ciphertext: '7u2HlkxEfptYF0KTIkSLHBbNumP58XjfjEuLb2qG0tw=',
	hmac: '6SDEr9vCn4qM0u6+yFt/e+8Z1LLCNcCTw4GB4aNVMXM='
};
const TEST_KEY_V2 = 'fzrpzrhjyeBgZNJTlIQ5GmduQ+AywMUFPY9ZisP6A9c=';
const TEST_PLAINTEXT_V2 = 'This is the test data.';

function bytesToBase64(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes));
}

async function encryptV3(plaintext: string, key: string) {
	const iv = webcrypto.getRandomValues(new Uint8Array(12));
	const cryptoKey = await webcrypto.subtle.importKey(
		'raw',
		Uint8Array.from(atob(key), (c) => c.charCodeAt(0)),
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt']
	);
	const ciphertext = await webcrypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		cryptoKey,
		new TextEncoder().encode(plaintext)
	);

	return {
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
		iv: bytesToBase64(iv)
	};
}

describe('decrypt v2', () => {
	it('returns plaintext with the correct key', async () => {
		const test_plaintext = await decrypt_v2({ ...TEST_NOTE_V2, key: TEST_KEY_V2 });
		expect(test_plaintext).toContain(TEST_PLAINTEXT_V2);
	});

	it('throws with the wrong key', async () => {
		await expect(decrypt_v2({ ...TEST_NOTE_V2, key: '' })).rejects.toThrow('Failed HMAC check');
	});

	it('throws with the wrong HMAC', async () => {
		await expect(decrypt_v2({ ...TEST_NOTE_V2, hmac: '', key: TEST_KEY_V2 })).rejects.toThrow(
			'Failed HMAC check'
		);
	});
});

describe('decrypt v3', () => {
	it('returns plaintext with the correct key', async () => {
		const plaintext = 'This is AES-GCM test data.';
		const encrypted = await encryptV3(plaintext, TEST_KEY_V2);
		const test_plaintext = await decrypt_v3({ ...encrypted, key: TEST_KEY_V2 });
		expect(test_plaintext).toBe(plaintext);
	});

	it('throws with the wrong key', async () => {
		const encrypted = await encryptV3('secret', TEST_KEY_V2);
		await expect(decrypt_v3({ ...encrypted, key: bytesToBase64(new Uint8Array(32)) })).rejects.toThrow();
	});
});

describe('decrypt dispatcher', () => {
	it('rejects unsupported legacy v1 crypto suite', async () => {
		await expect(decrypt({ ...TEST_NOTE_V2, key: TEST_KEY_V2 }, 'v1')).rejects.toThrow(
			'Unsupported crypto version: v1'
		);
	});
});
