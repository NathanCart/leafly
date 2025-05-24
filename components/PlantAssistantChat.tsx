// components/PlantAssistantChat.tsx
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Leaf, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
	Animated,
	FlatList,
	Image,
	KeyboardAvoidingView,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import RNModal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/app/constants/colors';
import { Text } from '@/components/Text';
import { ChatMessage, usePlantChat } from '@/hooks/usePlantChat';
import { Plant } from '@/data/plants';
import { useRevenuecat } from '@/hooks/useRevenuecat';

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
			<Text style={styles.typingLabel}>Pip is typing</Text>
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
			style={[styles.launcher, { bottom: 24, right: insets.right + 20 }]}
			onPress={onPress}
		>
			<MaterialCommunityIcons name="message" size={24} color="#fff" />
		</TouchableOpacity>
	);
}

/* ──────────────────────────────────────────────── */
interface PlantAssistantChatProps {
	/** If supplied, plant data will be forwarded to the backend and shown in chat */
	plant?: Plant | null;
}

export const PlantAssistantChat: React.FC<PlantAssistantChatProps> = ({ plant }) => {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');
	const flatRef = useRef<FlatList<ChatMessage>>(null);
	const insets = useSafeAreaInsets();
	const { messages, send, streaming, reset, setMessages } = usePlantChat();
	const { requireProChat } = useRevenuecat({ offering: 'pips' });

	const gatePremium = async (): Promise<boolean> => {
		return requireProChat((text) =>
			setMessages((prev) => [...prev, { id: `pro-${Date.now()}`, role: 'assistant', text }])
		);
	};

	/* ───── intro greeting once ───── */
	const [introDone, setIntroDone] = useState(false);
	useEffect(() => {
		if (open && !introDone) {
			const m: ChatMessage[] = [];

			// If plant exists, show its card first
			if (plant) {
				m.push({
					id: 'pip-plant-info',
					role: 'assistant',
					subtype: 'plantInfo',
					image: plant.image_url ?? undefined,
					text: `How can I help you with “${plant.nickname || plant.name}”? 🌿`,
				});
			} else {
				m.push({
					id: 'pip-intro',
					role: 'assistant',
					text: 'Hi! I’m Pip 🌿 — ask me anything about your plants.',
				});
			}

			// prepend so that any persisted messages remain
			messages.unshift(...m.reverse()); // reverse because we’re unshifting
			setIntroDone(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	/* ───── auto-scroll control ───── */
	const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
	useEffect(() => {
		if (open && autoScrollEnabled) {
			const t = setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
			return () => clearTimeout(t);
		}
	}, [messages.length, streaming, open, autoScrollEnabled]);

	const unread = !open && messages.some((m) => m.role === 'assistant');

	/* ─────────────────────────────── */
	/*           RENDER ITEM           */
	/* ─────────────────────────────── */
	const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
		// user bubble --------------------------------------------------
		if (item.role === 'user') {
			return (
				<View style={[styles.bubble, styles.userBubble]}>
					<Text style={[styles.bubbleText, { color: '#fff' }]}>{item.text}</Text>
				</View>
			);
		}

		// assistant placeholder (typing) ------------------------------
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

		// plant info card ---------------------------------------------
		if (item.subtype === 'plantInfo') {
			return (
				<View>
					{item.image && (
						<Image
							source={{ uri: item.image }}
							style={styles.plantImg}
							resizeMode="cover"
						/>
					)}
					<View style={styles.row}>
						<View style={styles.avatar}>
							<Leaf size={14} color="#fff" />
						</View>
						<View style={[styles.bubble, styles.botBubble]}>
							<Text style={styles.bubbleText}>{item.text}</Text>
						</View>
					</View>
				</View>
			);
		}

		// normal assistant bubble -------------------------------------
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

	/* ───── FlatList scroll helpers ───── */
	const onScrollBeginDrag = () => setAutoScrollEnabled(false);

	const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const {
			contentOffset: { y: yOffset },
			layoutMeasurement: { height: viewH },
			contentSize: { height: contentH },
		} = e.nativeEvent;
		if (yOffset + viewH >= contentH - 20) setAutoScrollEnabled(true);
	};

	/* helper: build minimal context JSON --------------------------- */
	const buildContext = () => {
		if (!plant) return undefined;
		// send only what’s useful
		return {
			plant: {
				details: plant.raw,
			},
		};
	};

	return (
		<>
			<Launcher onPress={() => setOpen(true)} unread={unread} />

			<RNModal
				isVisible={open}
				onBackdropPress={() => setOpen(false)}
				onBackButtonPress={() => setOpen(false)}
				style={styles.modal}
				propagateSwipe
			>
				<KeyboardAvoidingView
					behavior={Platform.select({ ios: 'padding' })}
					style={styles.wrapper}
				>
					{/* header */}
					<View style={styles.header}>
						<Text style={styles.headerTitle}>Pip – Plant Assistant 🌱</Text>
						<TouchableOpacity
							onPress={() => {
								setOpen(false);
								if (!plant) reset(); // only reset when not on per-plant chat
							}}
						>
							<X size={24} color={COLORS.text.primary.light} />
						</TouchableOpacity>
					</View>

					{/* chat list */}
					<FlatList
						ref={flatRef}
						data={messages}
						keyExtractor={(m) => m.id}
						renderItem={renderItem}
						onScrollBeginDrag={onScrollBeginDrag}
						onMomentumScrollEnd={onMomentumScrollEnd}
						contentContainerStyle={{ paddingHorizontal: 8 }}
					/>

					{/* input row */}
					<View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
						<TextInput
							value={input}
							onChangeText={setInput}
							placeholder="Ask Pip anything..."
							style={styles.input}
							editable={!streaming}
							onSubmitEditing={async () => {
								// 4️⃣ MOD
								const q = input.trim();
								if (!q) return;
								if (!(await gatePremium())) return; // ← paywall gate
								setInput('');
								await send(q, buildContext());
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
								// 4️⃣ MOD
								const q = input.trim();
								if (!q) return;
								if (!(await gatePremium())) return; // ← paywall gate
								setInput('');
								await send(q, buildContext());
							}}
						>
							<MaterialCommunityIcons name="message" size={20} color="#fff" />
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
	/* existing styles ... (unchanged) */
	launcher: {
		position: 'absolute',
		width: 48,
		height: 48,
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
	/* bubbles */
	row: {
		flexDirection: 'row',
		alignItems: 'flex-end',
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
	/* input row */
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
	/* NEW: plant preview image */
	plantImg: {
		width: 154,
		height: 120,
		borderRadius: 12,
		marginBottom: 8,
		paddingLeft: 34,
		alignSelf: 'flex-start',
	},
});
