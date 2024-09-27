import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import ChatMessage from './chat.message.entity';
import User from 'src/core/authorization/entity/user.entity';

@Entity()
class Chat {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar' })
  public name?: string;

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.chat)
  public messages!: ChatMessage[];

  @OneToOne(() => ChatMessage, { nullable: true })
  @JoinColumn() // This creates a foreign key column in the Chat table
  public recentMessage?: ChatMessage; // Reference to the last sent message

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' }) // This creates a foreign key column in the Chat table
  public createdBy?: User; // Reference to the user who created the chat

  @Column({ type: 'uuid' })
  public createdById!: string;
}

export default Chat;
