import { webcrypto } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { decryptAttachment } from './attachments';

vi.stubGlobal('crypto', webcrypto);

const noteKeyBase64 = 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=';
const ivBase64 = 'AAAAAAAAAAAAAAAA';
const ciphertextBase64 = '6ZQsl4YqZobV6eRmpDvYrA1WRq78DHJUpMCI';

describe('decryptAttachment', () => {
	it('decrypts the notes.hvck.dev HKDF compatibility vector', async () => {
		const plaintext = await decryptAttachment(noteKeyBase64, ciphertextBase64, ivBase64);

		expect(new TextDecoder().decode(plaintext)).toBe('image bytes');
	});

	it('rejects IVs that are not 12 bytes', async () => {
		await expect(
			decryptAttachment(noteKeyBase64, ciphertextBase64, 'AAAAAAAAAAAA')
		).rejects.toThrow('Invalid attachment IV length');
	});
});
