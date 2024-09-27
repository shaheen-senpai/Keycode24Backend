import { Controller, Get, Post, Param, Body, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { ChatService } from '../service/chat.service';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';
import { AuthUser } from 'src/core/authorization/authorization.constants';

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
    @Res() response: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const user = request.user as AuthUser;
    const chat = await this.chatService.createChat(name, user.id);
    return response.status(201).json(chat);
  }

  /**
   * Get chat by ID
   * @param chatId The ID of the chat
   * @returns The chat with the given ID
   */
  @Get(':chatId')
  async getChatById(
    @Param('chatId') chatId: string,
    @Res() response: Response,
  ) {
    const chat = await this.chatService.getChatById(chatId);
    return response.status(200).json(chat);
  }

  /**
   * Get all chats
   * @returns A list of all chats
   */
  @UseAuthGuard()
  @Get()
  async getAllChats(@Req() request: Request, @Res() response: Response) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const user = request.user as AuthUser;
    const chats = await this.chatService.getAllChats(user.id);
    return response.status(200).json(chats);
  }
}
