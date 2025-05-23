// hooks/usePlantChat.ts
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
type SendFn = (question: string) => Promise<void>;

const FUNCTION_URL = 'https://kvjaxrtgtjbqopegbshw.supabase.co/functions/v1/chat-completion';

export function usePlantChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [streaming, setStreaming] = useState(false);
	const { session } = useAuth();

	/* replace assistant text */
	const replaceAssistant = (id: string, text: string) =>
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text } : m)));

	const send: SendFn = async (question) => {
		if (!question.trim()) return;

		/* optimistic user bubble */
		const userId = Date.now().toString();
		const userMsg: ChatMessage = { id: userId, role: 'user', text: question.trim() };

		/* assistant placeholder (empty text!) */
		const botId = `${userId}-bot`;
		const botStub: ChatMessage = { id: botId, role: 'assistant', text: '' };

		/* push both at once */
		setMessages((m) => [...m, userMsg, botStub]);
		setStreaming(true);

		/* history (last 10 turns BEFORE current question) */
		const history = [...messages, userMsg].slice(-10).map(({ role, text }) => ({ role, text }));

		try {
			const res = await fetch(FUNCTION_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(session && { Authorization: `Bearer ${session.access_token}` }),
				},
				body: JSON.stringify({ question, history }),
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
