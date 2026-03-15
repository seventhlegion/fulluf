import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Encrypted content (JSON: { body } for text, { mediaPath, mimeType } for media) */
  @Column('text')
  contentEncrypted!: string;

  @Column({ type: 'text' })
  type!: MessageType;

  /** Hashed username from IP (e.g. #a1b2c3d4) */
  @Column()
  senderHash!: string;

  /** ID of the message being replied to (null if not a reply) */
  @Column({ type: 'uuid', nullable: true })
  replyToId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
