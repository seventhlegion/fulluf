import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_reactions')
@Unique(['messageId', 'senderHash', 'emoji'])
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  messageId!: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message!: Message;

  /** Hashed username (e.g. #a1b2c3d4) */
  @Column()
  senderHash!: string;

  @Column({ type: 'varchar', length: 16 })
  emoji!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
