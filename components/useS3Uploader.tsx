import { useState } from 'react';
import { s3Client } from '@/lib/s3Client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

interface UploadResult {
	url: string;
	key: string;
}

export function useS3Uploader(bucketName: string, maxFileSize = 5 * 1024 * 1024) {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const uploadFile = async (localUri: string, contentType: string): Promise<UploadResult> => {
		setIsUploading(true);
		setError(null);
		try {
			const response = await fetch(localUri);
			const buffer = await response.arrayBuffer();
			const body = new Uint8Array(buffer);
			const filename = localUri.split('/').pop() || `${Date.now()}`;
			const key = `${Date.now()}-${filename}`;

			await s3Client.send(
				new PutObjectCommand({
					Bucket: bucketName,
					Key: key,
					Body: body,
					ContentType: contentType,
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
