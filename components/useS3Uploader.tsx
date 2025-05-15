// hooks/useS3Uploader.ts
import { useState } from 'react';
import { s3Client } from '@/lib/s3Client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

interface UploadResult {
	url: string;
	key: string;
}

export function useS3Uploader(
	bucketName: string,
	maxFileSize = 5 * 1024 * 1024 // 5 MB default
) {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	/** Helper to decode a base-64 string to Uint8Array */
	const base64ToUint8 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

	const uploadFile = async (
		localUri: string,
		explicitContentType?: string // optional override
	): Promise<UploadResult> => {
		setIsUploading(true);
		setError(null);

		try {
			let body: Uint8Array;
			let contentType = explicitContentType ?? 'application/octet-stream';
			let filename = `${Date.now()}`;

			// ────────────────────────────────
			//  1.  Handle data-URLs
			// ────────────────────────────────
			if (localUri.startsWith('data:')) {
				// data:image/jpeg;base64,AAAA…
				const match = localUri.match(/^data:([^;]+);base64,(.*)$/);
				if (!match) throw new Error('Malformed data URL');

				contentType = match[1]; // image/jpeg
				body = base64ToUint8(match[2]); // Uint8Array
				filename = `inline.${contentType.split('/')[1] || 'bin'}`;

				// ────────────────────────────────
				//  2.  Handle file- or http-URLs
				// ────────────────────────────────
			} else {
				const res = await fetch(localUri);
				const buffer = await res.arrayBuffer();
				body = new Uint8Array(buffer);

				// use caller-supplied type or sniff from file extension
				if (!explicitContentType) {
					const ext = (localUri.split('?')[0].split('.').pop() || 'bin').toLowerCase();
					contentType =
						ext === 'jpg' || ext === 'jpeg'
							? 'image/jpeg'
							: ext === 'png'
							? 'image/png'
							: ext === 'gif'
							? 'image/gif'
							: 'application/octet-stream';
				}
				filename = localUri.split('/').pop() ?? filename;
			}

			// ────────────────────────────────
			//  3.  Enforce max size
			// ────────────────────────────────
			if (body.byteLength > maxFileSize) {
				throw new Error(
					`File is ${(body.byteLength / 1024 / 1024).toFixed(2)} MB. ` +
						`Limit is ${(maxFileSize / 1024 / 1024).toFixed(2)} MB.`
				);
			}

			// ────────────────────────────────
			//  4.  Upload
			// ────────────────────────────────
			const key = `${Date.now()}-${filename}`;

			await s3Client.send(
				new PutObjectCommand({
					Bucket: bucketName,
					Key: key,
					Body: body,
					ContentType: contentType, //   ✅ now a short, valid value
				})
			);

			const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
			return { url, key };
		} catch (err: any) {
			setError(err);
			throw err;
		} finally {
			setIsUploading(false);
		}
	};

	return { uploadFile, isUploading, error };
}
