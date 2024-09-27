import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ChatMessage from './../entity/chat.message.entity';
import { ChatService } from './chat.service';

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly chatService: ChatService, // Inject ChatService
  ) {}

  /**
   * Send a message in a chat
   * @param chatId The ID of the chat
   * @param senderId The ID of the sender (user)
   * @param content The content of the message
   * @returns The saved message
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
  ): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      content,
      sender: { id: senderId },
      chat: { id: chatId },
    });

    // Save the message
    const savedMessage = await this.chatMessageRepository.save(message);

    // Update the last message in the chat
    await this.chatService.updateRecentMessage(chatId, savedMessage);

    return savedMessage;
  }

  /**
   * Get all messages in a chat
   * @param chatId The ID of the chat
   * @returns List of messages in the chat
   */
  async getMessagesByChatId(chatId: string): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { chat: { id: chatId } },
      order: { sentAt: 'ASC' }, // Sort by sent time
      relations: ['sender'], // Include sender information
    });
  }

  /**
   * Get a specific message by its ID
   * @param messageId The ID of the message
   * @returns The message with the given ID
   */
  async getMessageById(messageId: string): Promise<ChatMessage> {
    return await this.chatMessageRepository.findOneOrFail({
      where: { id: messageId },
      relations: ['sender', 'chat'],
    });
  }
}
