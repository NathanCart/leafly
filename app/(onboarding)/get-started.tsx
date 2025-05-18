import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useMixpanel } from '@/hooks/useMixpanel';

export default function GetStartedScreen() {
	const videoUrl = 'https://merlin-cloud.s3.eu-west-2.amazonaws.com/video-2.mp4';

	const player = useVideoPlayer(videoUrl, (p) => {
		p.loop = true;
		p.muted = true;
		p.play();
	});

	// ensure playback on re-mount / Hot-Reload
	useEffect(() => player.play(), [player]);

	useMixpanel('get_started');

	return (
		<View style={styles.container}>
			{/* ── Hero video ───────────────────────────────────────── */}
			<View style={styles.videoContainer}>
				<VideoView
					contentFit="cover"
					style={styles.video} // fills its own container only
					player={player}
					allowsFullscreen={false}
					allowsPictureInPicture={false}
				/>
			</View>

			{/* ── Footer (below the video) ────────────────────────── */}
			<View style={styles.footer}>
				<Text style={styles.heading}>Effortless Plant Care at Home With Florai</Text>

				<Button
					style={{ width: '100%' }}
					size="large"
					variant="primary"
					onPress={() => router.push('/how-did-you-find')}
				>
					Continue
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* Root */
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},

	/* Video takes **all** remaining vertical space */
	videoContainer: {
		height: '70%',
		overflow: 'hidden', // crops any spill-over
	},
	video: {
		objectFit: 'contain', // fills the video container
		height: '100%',
		...StyleSheet.absoluteFillObject, // pins to all edges *inside* videoContainer
	},

	/* Footer never overlaps video; it sits underneath */
	footer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
	},

	heading: {
		fontSize: 32,
		marginBottom: 24,
		textAlign: 'center',
	},
});
