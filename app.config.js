// app.config.js
import fs from 'fs';
import path from 'path';
import { withDangerousMod } from '@expo/config-plugins';

export default ({ config }) => {
	return withDangerousMod(config, [
		'android',
		async (config) => {
			const sdkPath =
				process.env.ANDROID_SDK_ROOT ||
				process.env.ANDROID_HOME ||
				path.join(process.env.HOME || '', 'Library/Android/sdk');

			const localProps = `sdk.dir=${sdkPath.replace(/\\/g, '/')}\n`;
			const localPath = path.resolve(
				config.modRequest.projectRoot,
				'android',
				'local.properties'
			);

			fs.writeFileSync(localPath, localProps, { encoding: 'utf8' });
			return config;
		},
	]);
};
