const ATTACHMENT_KEY_INFO = new TextEncoder().encode('notes.hvck.dev/attachment/v1');
const ATTACHMENT_SALT = new Uint8Array(32);

export type EncryptedAttachment = {
	ciphertext: string;
	iv: string;
};

export async function decryptAttachment(
	noteKeyBase64: string,
	ciphertextBase64: string,
	ivBase64: string
): Promise<ArrayBuffer> {
	const iv = base64ToArrayBuffer(ivBase64);
	const ciphertext = base64ToArrayBuffer(ciphertextBase64);

	if (iv.byteLength !== 12) {
		throw new Error('Invalid attachment IV length');
	}

	try {
		return await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: new Uint8Array(iv) },
			await deriveAttachmentKey(noteKeyBase64),
			ciphertext
		);
	} catch (error) {
		if (import.meta.env.DEV) {
			console.debug('Attachment decrypt failed', {
				ciphertextLength: ciphertext.byteLength,
				ivLength: iv.byteLength,
				ivIsTwelveBytes: iv.byteLength === 12
			});
		}
		throw error;
	}
}

export async function encryptAttachment(
	file: Blob,
	noteKeyBase64: string
): Promise<EncryptedAttachment> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		await deriveAttachmentKey(noteKeyBase64),
		await file.arrayBuffer()
	);
	return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

export async function deriveAttachmentKey(noteKeyBase64: string): Promise<CryptoKey> {
	const noteKeyMaterial = await crypto.subtle.importKey(
		'raw',
		base64ToArrayBuffer(noteKeyBase64),
		'HKDF',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: ATTACHMENT_SALT,
			info: ATTACHMENT_KEY_INFO
		},
		noteKeyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
	return btoa(binary);
}
