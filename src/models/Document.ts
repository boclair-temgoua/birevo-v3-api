import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FilterQueryType } from '../app/utils/search-query';
import { BaseDeleteEntity } from '../app/databases/common/BaseDeleteEntity';
import { Organization } from './Organization';
import { Project } from './Project';
import { SubProject } from './SubProject';
import { Comment } from './Comment';
import { SubSubProject } from './SubSubProject';
import { SubSubSubProject } from './SubSubSubProject';

@Entity('document')
export class Document extends BaseDeleteEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  typeFile?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({
    type: 'enum',
    enum: FilterQueryType,
    default: FilterQueryType.ORGANIZATION,
  })
  type?: FilterQueryType;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;
  @ManyToOne(() => Organization, (organization) => organization.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  organization?: Organization;

  @Column({ type: 'uuid', nullable: true })
  projectId?: string;
  @ManyToOne(() => Project, (project) => project.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project?: Project;

  @Column({ type: 'uuid', nullable: true })
  subProjectId?: string;
  @ManyToOne(() => SubProject, (subProject) => subProject.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  subProject?: SubProject;

  @Column({ type: 'uuid', nullable: true })
  subSubProjectId?: string;
  @ManyToOne(() => SubSubProject, (subSubProject) => subSubProject.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  subSubProject?: SubSubProject;

  @Column({ type: 'uuid', nullable: true })
  subSubSubProjectId?: string;
  @ManyToOne(
    () => SubSubSubProject,
    (subSubSubProject) => subSubSubProject.documents,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn()
  subSubSubProject?: SubSubSubProject;

  @OneToMany(() => Comment, (comment) => comment.document, {
    onDelete: 'CASCADE',
  })
  comments?: Comment[];
}
