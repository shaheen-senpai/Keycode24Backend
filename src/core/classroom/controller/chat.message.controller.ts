import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ChatMessageService } from './../service/chat.message.service';
import ChatMessage from '../entity/chat.message.entity';

@Controller('chats/:chatId/messages')
export class ChatMessageController {
  constructor(private readonly chatMessageService: ChatMessageService) {}

  /**
   * Send a message in a chat
   * @param chatId The ID of the chat
   * @param senderId The ID of the sender (user)
   * @param content The content of the message
   * @returns The saved message
   */
  @Post()
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body('senderId') senderId: string,
    @Body('content') content: string,
  ): Promise<ChatMessage> {
    return await this.chatMessageService.sendMessage(chatId, senderId, content);
  }

  /**
   * Get all messages in a chat
   * @param chatId The ID of the chat
   * @returns A list of messages in the chat
   */
  @Get()
  async getMessagesByChatId(
    @Param('chatId') chatId: string,
  ): Promise<ChatMessage[]> {
    return await this.chatMessageService.getMessagesByChatId(chatId);
  }

  /**
   * Get a specific message by its ID
   * @param chatId The ID of the chat
   * @param messageId The ID of the message
   * @returns The message with the given ID
   */
  @Get(':messageId')
  async getMessageById(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ): Promise<ChatMessage> {
    return await this.chatMessageService.getMessageById(messageId);
  }
}
