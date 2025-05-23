import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Animated,
} from 'react-native';
import { MessageCircle, X, Leaf } from 'lucide-react-native';
import RNModal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { COLORS } from '@/app/constants/colors';
import { usePlantChat } from '@/hooks/usePlantChat';

/* ──────────────────────────────────────────────── */
/* Typing indicator                                 */
/* ──────────────────────────────────────────────── */
const TypingIndicator = () => {
	const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0.2)).current);

	useEffect(() => {
		dots.forEach((val, i) =>
			Animated.loop(
				Animated.sequence([
					Animated.delay(i * 250),
					Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
					Animated.timing(val, { toValue: 0.2, duration: 400, useNativeDriver: true }),
				])
			).start()
		);
	}, []);

	return (
		<View style={styles.typingWrap}>
			<Text style={styles.typingLabel}>Sprouty is typing</Text>
			{dots.map((o, idx) => (
				<Animated.View key={idx} style={[styles.dot, { opacity: o }]} />
			))}
		</View>
	);
};

/* ──────────────────────────────────────────────── */
function Launcher({ onPress, unread }: { onPress: () => void; unread: boolean }) {
	const insets = useSafeAreaInsets();
	return (
		<TouchableOpacity
			style={[styles.launcher, { bottom: 24, right: insets.right + 16 }]}
			onPress={onPress}
		>
			<MessageCircle size={28} color="#fff" />
			{unread && <View style={styles.badge} />}
		</TouchableOpacity>
	);
}

/* ──────────────────────────────────────────────── */
export const PlantAssistantChat: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');
	const flatRef = useRef<FlatList>(null);
	const insets = useSafeAreaInsets();

	const { messages, send, streaming } = usePlantChat();

	/* intro greeting once */
	const [introDone, setIntroDone] = useState(false);
	useEffect(() => {
		if (open && !introDone) {
			messages.unshift({
				id: 'sprouty-intro',
				role: 'assistant',
				text: 'Hi! I’m Sprouty 🌿 — ask me anything about your plants.',
			});
			setIntroDone(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	/* auto-scroll */
	useEffect(() => {
		if (!open) return;
		const t = setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
		return () => clearTimeout(t);
	}, [messages.length, streaming, open]);

	const unread = !open && messages.some((m) => m.role === 'assistant');

	/* row renderer */
	const renderItem = ({ item, index }: { item: any; index: number }) => {
		/* USER */
		if (item.role === 'user')
			return (
				<View style={[styles.bubble, styles.userBubble]}>
					<Text style={[styles.bubbleText, { color: '#fff' }]}>{item.text}</Text>
				</View>
			);

		/* ASSISTANT placeholder (empty text) */
		const isLast = index === messages.length - 1;
		if (isLast && item.text === '') {
			return streaming ? (
				<View style={styles.row}>
					<View style={styles.avatar}>
						<Leaf size={14} color="#fff" />
					</View>
					<View style={[styles.bubble, styles.botBubble]}>
						<TypingIndicator />
					</View>
				</View>
			) : null;
		}

		/* ASSISTANT regular */
		return (
			<View style={styles.row}>
				<View style={styles.avatar}>
					<Leaf size={14} color="#fff" />
				</View>
				<View style={[styles.bubble, styles.botBubble]}>
					<Text style={styles.bubbleText}>{item.text}</Text>
				</View>
			</View>
		);
	};

	return (
		<>
			<Launcher onPress={() => setOpen(true)} unread={unread} />

			<RNModal
				isVisible={open}
				onBackdropPress={() => setOpen(false)}
				onBackButtonPress={() => setOpen(false)}
				style={styles.modal}
				swipeDirection="down"
				propagateSwipe
			>
				<KeyboardAvoidingView
					behavior={Platform.select({ ios: 'padding' })}
					style={styles.wrapper}
				>
					{/* header */}
					<View style={styles.header}>
						<Text style={styles.headerTitle}>Sprouty – Plant Assistant 🌱</Text>
						<TouchableOpacity onPress={() => setOpen(false)}>
							<X size={24} color={COLORS.text.primary.light} />
						</TouchableOpacity>
					</View>

					{/* chat list */}
					<FlatList
						ref={flatRef}
						data={messages}
						keyExtractor={(m) => m.id}
						renderItem={renderItem}
					/>

					{/* input row */}
					<View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
						<TextInput
							value={input}
							onChangeText={setInput}
							placeholder="Ask Sprouty anything..."
							style={styles.input}
							editable={!streaming}
							onSubmitEditing={async () => {
								const q = input;
								setInput('');
								await send(q);
							}}
							returnKeyType="send"
						/>
						<TouchableOpacity
							style={[
								styles.sendBtn,
								{ opacity: input.trim() && !streaming ? 1 : 0.4 },
							]}
							disabled={!input.trim() || streaming}
							onPress={async () => {
								const q = input;
								setInput('');
								await send(q);
							}}
						>
							<MessageCircle size={20} color="#fff" />
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</RNModal>
		</>
	);
};

/* ──────────────────────────────────────────────── */
/* Styles                                           */
/* ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
	launcher: {
		position: 'absolute',
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
		...COLORS.shadowLg,
		zIndex: 20,
	},
	badge: {
		position: 'absolute',
		top: 8,
		right: 8,
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#FF5252',
	},
	modal: { margin: 0, justifyContent: 'flex-end' },
	wrapper: {
		height: '60%',
		backgroundColor: COLORS.surface.light,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		overflow: 'hidden',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderColor: COLORS.border,
	},
	headerTitle: { fontSize: 16, fontWeight: '700' },

	/* rows & avatar */
	row: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		marginLeft: 8,
		marginVertical: 4,
	},
	avatar: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 6,
	},

	/* bubbles */
	bubble: {
		maxWidth: '75%',
		borderRadius: 16,

		paddingVertical: 8,
		paddingHorizontal: 6,
	},
	botBubble: { backgroundColor: `${COLORS.border}` },
	userBubble: {
		alignSelf: 'flex-end',
		backgroundColor: COLORS.primary,
		marginHorizontal: 8,
		marginVertical: 4,
	},
	bubbleText: { fontSize: 14 },

	/* typing */

	typingWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 4,
		borderRadius: 10,
		backgroundColor: COLORS.border,
	},
	typingLabel: { fontSize: 14, color: COLORS.text.secondary.light, marginRight: 4 },
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: COLORS.text.primary.light,
		marginHorizontal: 1,
	},

	/* input */
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderTopWidth: 1,
		borderColor: COLORS.border,
	},
	input: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 20,
		backgroundColor: '#fff',
		marginRight: 8,
		fontSize: 14,
	},
	sendBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
