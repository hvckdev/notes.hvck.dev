const ATTACHMENT_KEY_INFO = new TextEncoder().encode('notes.hvck.dev/attachment/v1');
const ATTACHMENT_SALT = new Uint8Array(32).buffer;

type EncryptedAttachment = {
	ciphertext: string;
	iv: string;
};

export async function decryptAttachment(
	attachment: EncryptedAttachment,
	noteKey: string,
	mimeType: string
): Promise<Blob> {
	const key = await deriveAttachmentKey(noteKey);
	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: base64ToArrayBuffer(attachment.iv) },
		key,
		base64ToArrayBuffer(attachment.ciphertext)
	);
	return new Blob([plaintext], { type: mimeType });
}

export async function encryptAttachment(file: Blob, noteKey: string): Promise<EncryptedAttachment> {
	const key = await deriveAttachmentKey(noteKey);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: iv.buffer },
		key,
		await file.arrayBuffer()
	);
	return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

async function deriveAttachmentKey(noteKey: string): Promise<CryptoKey> {
	const noteKeyMaterial = await crypto.subtle.importKey('raw', base64ToArrayBuffer(noteKey), 'HKDF', false, [
		'deriveKey'
	]);
	return crypto.subtle.deriveKey(
		{ name: 'HKDF', hash: 'SHA-256', salt: ATTACHMENT_SALT, info: ATTACHMENT_KEY_INFO },
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
