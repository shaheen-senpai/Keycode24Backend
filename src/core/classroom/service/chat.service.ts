import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Chat from '../entity/chat.entity';
import ChatMessage from './../entity/chat.message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  /**
   * Create a new chat
   * @param name Name of the chat
   * @returns The newly created chat
   */
  async createChat(name: string, userId: string): Promise<Chat> {
    const chat = new Chat();
    chat.name = name;
    chat.createdById = userId;
    return await this.chatRepository.save(chat);
  }

  /**
   * Get chat by ID
   * @param chatId The ID of the chat
   * @returns The chat with the given ID
   */
  async getChatById(chatId: string): Promise<Chat> {
    return await this.chatRepository.findOneOrFail({
      where: { id: chatId },
      relations: ['recentMessage'],
    });
  }

  /**
   * Update the last message in a chat
   * @param chatId The ID of the chat
   * @param recentMessage The new last message to update
   * @returns The updated chat
   */
  async updateRecentMessage(
    chatId: string,
    recentMessage: ChatMessage,
  ): Promise<Chat> {
    const chat = await this.getChatById(chatId);
    chat.recentMessage = recentMessage;
    return await this.chatRepository.save(chat);
  }

  /**
   * Get all chats created by a user
   * @returns List of all chats
   */
  async getAllChats(userId: string): Promise<Chat[]> {
    return await this.chatRepository.find({
      where: { createdById: userId },
      relations: ['recentMessage'],
    });
  }
}
