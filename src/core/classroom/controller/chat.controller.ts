import { Controller, Get, Post, Param, Body, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { ChatService } from '../service/chat.service';
import Chat from '../entity/chat.entity';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';
import { AuthUser } from 'src/core/authorization/authorization.constants';
import { HttpStatusCode } from 'axios';
import { Http } from 'winston/lib/winston/transports';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Create a new chat
   * @param name Name of the chat
   * @returns The newly created chat
   */
  @UseAuthGuard()
  @Post()
  async createChat(
    @Body('name') name: string,
    @Req() request: Request,
  ): Promise<Chat> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const user = request.user as AuthUser;
    const chat = await this.chatService.createChat(name, user.id);
    return chat;
  }

  /**
   * Get chat by ID
   * @param chatId The ID of the chat
   * @returns The chat with the given ID
   */
  @Get(':chatId')
  async getChatById(@Param('chatId') chatId: string): Promise<Chat> {
    return await this.chatService.getChatById(chatId);
  }

  /**
   * Get all chats
   * @returns A list of all chats
   */
  @Get()
  async getAllChats(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Chat[]> {
    return await this.chatService.getAllChats();
  }
}
