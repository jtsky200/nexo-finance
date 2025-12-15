/**
 * Chat History Management - Firebase Version
 * Handles multiple chat conversations with titles and timestamps
 * All data is stored in Firebase for cross-device synchronization
 */

import { 
  useChatConversations, 
  createChatConversation, 
  updateChatConversation, 
  deleteChatConversation,
  type ChatConversation 
} from './firebaseHooks';

export type { ChatConversation };

const MAX_CHAT_HISTORY = 50; // Maximum number of saved chats

/**
 * Get all chat conversations from Firebase
 * This is now a React hook that must be used in components
 */
export function useChatHistory() {
  return useChatConversations();
}

/**
 * Get all chat conversations (for non-React contexts)
 * Note: This is a legacy function. Use useChatHistory() hook in React components instead.
 */
export function getChatHistory(): ChatConversation[] {
  // This is a fallback that returns empty array
  // Components should use useChatHistory() hook instead
  console.warn('[chatHistory] getChatHistory() is deprecated. Use useChatHistory() hook instead.');
  return [];
}

/**
 * Save a chat conversation to Firebase
 */
export async function saveChatConversation(conversation: ChatConversation): Promise<void> {
  try {
    if (conversation.id && conversation.id.startsWith('chat_')) {
      // Update existing conversation
      await updateChatConversation(conversation.id, {
        title: conversation.title,
        messages: conversation.messages,
      });
    } else {
      // Create new conversation
      const result = await createChatConversation({
        title: conversation.title,
        messages: conversation.messages,
      });
      
      // Update the conversation ID
      conversation.id = result.id;
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Chat-Historie:', error);
    throw error;
  }
}

/**
 * Delete a chat conversation from Firebase
 */
export async function deleteChatConversationById(chatId: string): Promise<void> {
  try {
    await deleteChatConversation(chatId);
  } catch (error) {
    console.error('Fehler beim Löschen der Chat-Historie:', error);
    throw error;
  }
}

/**
 * Get a specific chat conversation by ID
 * Note: This requires the conversations to be loaded via useChatHistory() hook
 */
export function getChatConversation(chatId: string, conversations: ChatConversation[]): ChatConversation | null {
  return conversations.find(c => c.id === chatId) || null;
}

/**
 * Generate a title from the first user message
 */
export function generateChatTitle(firstUserMessage: string): string {
  // Take first 50 characters and add ellipsis if longer
  const maxLength = 50;
  if (firstUserMessage.length <= maxLength) {
    return firstUserMessage;
  }
  return firstUserMessage.substring(0, maxLength) + '...';
}

/**
 * Create a new chat conversation
 * Note: This creates a local object. Call saveChatConversation() to persist to Firebase.
 */
export function createNewChat(): ChatConversation {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  
  return {
    id,
    userId: '', // Will be set by Firebase
    title: 'Neue Konversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

