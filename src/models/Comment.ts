import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './Document';
import { BaseDeleteEntity } from '../app/databases/common/BaseDeleteEntity';
import { Post } from './Post';
import { User } from './User';

@Entity('comment')
export class Comment extends BaseDeleteEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  documentId?: string;
  @ManyToOne(() => Document, (document) => document.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  document?: Document;

  @Column({ type: 'uuid', nullable: true })
  postId?: string;
  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  post?: Post;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn()
  user?: User;
}
