// plugins/withGoogleServices.js
const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

function addClasspath(config) {
	return withProjectBuildGradle(config, (config) => {
		config.modResults.contents = config.modResults.contents.replace(
			/dependencies\s*\{/,
			`dependencies {\n        classpath("com.google.gms:google-services:4.4.2")\n`
		);
		return config;
	});
}

function applyPlugin(config) {
	return withAppBuildGradle(config, (config) => {
		// ensure it’s applied after the android and kotlin plugins
		config.modResults.contents = config.modResults.contents.replace(
			/apply plugin: ['"]com\.facebook\.react['"]/,
			`apply plugin: 'com.facebook.react'\napply plugin: 'com.google.gms.google-services'`
		);
		return config;
	});
}

module.exports = function withGoogleServices(config) {
	return applyPlugin(addClasspath(config));
};
