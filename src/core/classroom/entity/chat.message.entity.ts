import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import User from './../../authorization/entity/user.entity';
import Chat from './chat.entity';

@Entity()
class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'text' })
  public content!: string;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn()
  public sender!: User;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  @JoinColumn()
  public chat!: Chat;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public sentAt!: Date;
}

export default ChatMessage;
