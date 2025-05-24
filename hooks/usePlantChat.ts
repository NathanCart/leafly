// hooks/usePlantChat.ts
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export type ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	text: string;
	/** optional richer content */
	image?: string;
	subtype?: 'plantInfo' | 'normal';
};

type SendFn = (question: string, extraContext?: unknown) => Promise<void>;

const FUNCTION_URL = 'https://kvjaxrtgtjbqopegbshw.supabase.co/functions/v1/chat-completion';

export function usePlantChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [streaming, setStreaming] = useState(false);
	const { session } = useAuth();

	/* helper ------------------------------------------------------- */
	const replaceAssistant = (id: string, text: string) =>
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text } : m)));

	/* main send ---------------------------------------------------- */
	const send: SendFn = async (question, extraContext) => {
		if (!question.trim()) return;

		/* optimistic UI --------------------------------------------- */
		const userId = Date.now().toString();
		const userMsg: ChatMessage = {
			id: userId,
			role: 'user',
			text: question.trim(),
		};
		const botId = `${userId}-bot`;
		const botStub: ChatMessage = {
			id: botId,
			role: 'assistant',
			text: '', // shows typing indicator
		};
		setMessages((m) => [...m, userMsg, botStub]);
		setStreaming(true);

		/* last 10 turns of history BEFORE current question ----------- */
		const history = [...messages, userMsg].slice(-10).map(({ role, text }) => ({ role, text }));

		/* build body ------------------------------------------------- */
		const body: Record<string, unknown> = {
			question,
			history,
		};
		if (extraContext) {
			// EXACT property name as requested (spaces included)
			body['important details to consider'] = extraContext;
		}

		/* call edge function ---------------------------------------- */
		try {
			const res = await fetch(FUNCTION_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(session && { Authorization: `Bearer ${session.access_token}` }),
				},
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const detail = await res.text();
				console.error('Sprouty error', res.status, detail);
				replaceAssistant(botId, '😵 Sprouty had a hiccup.');
				return;
			}

			const { answer } = await res.json();
			replaceAssistant(botId, answer);
		} catch (err) {
			console.error(err);
			replaceAssistant(botId, '😵 Network issue.');
		} finally {
			setStreaming(false);
		}
	};

	return {
		messages,
		send,
		reset: () => setMessages([]),
		streaming,
	};
}
