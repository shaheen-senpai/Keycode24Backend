import { Controller, Get, Post, Param, Body, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { ChatMessageService } from './../service/chat.message.service';
import ChatMessage from '../entity/chat.message.entity';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';

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
  @UseAuthGuard()
  @Post()
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body('content') content: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const user = request.user as AuthUser;
    const res = await this.chatMessageService.sendMessage(
      chatId,
      user.id,
      content,
    );
    return response.status(201).json(res);
  }

  /**
   * Get all messages in a chat
   * @param chatId The ID of the chat
   * @returns A list of messages in the chat
   */
  @Post('list')
  async getMessagesByChatId(
    @Param('chatId') chatId: string,
    @Res() response: Response,
  ) {
    const res = await this.chatMessageService.getMessagesByChatId(chatId);
    return response.status(200).json(res);
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
