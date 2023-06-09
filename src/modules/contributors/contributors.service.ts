import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contributor } from '../../models/Contributor';
import { Brackets, Repository } from 'typeorm';
import {
  CreateContributorOptions,
  DeleteContributorSelections,
  GetContributorsSelections,
  GetOneContributorSelections,
  UpdateContributorOptions,
  UpdateContributorSelections,
} from './contributors.type';
import { useCatch } from '../../app/utils/use-catch';
import { withPagination } from '../../app/utils/pagination/with-pagination';
import { FilterQueryType } from '../../app/utils/search-query/search-query.dto';
import { Project } from '../../models/Project';
import { SubProject } from '../../models/SubProject';
import { SubSubProject } from '../../models/SubSubProject';
import { Organization } from '../../models/Organization';

@Injectable()
export class ContributorsService {
  constructor(
    @InjectRepository(Contributor)
    private driver: Repository<Contributor>,
  ) {}

  async findAll(
    selections: GetContributorsSelections,
  ): Promise<GetContributorsSelections | any> {
    const {
      userId,
      search,
      groupId,
      pagination,
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
      type,
    } = selections;

    let query = this.driver
      .createQueryBuilder('contributor')
      .select('contributor.id', 'id')
      .addSelect('contributor.userCreatedId', 'userCreatedId')
      .addSelect('contributor.userId', 'userId')
      .addSelect('contributor.type', 'type')
      .addSelect('contributor.groupId', 'groupId')
      .addSelect('contributor.organizationId', 'organizationId')
      .addSelect('contributor.projectId', 'projectId')
      .addSelect('contributor.subProjectId', 'subProjectId')
      .addSelect('contributor.subSubProjectId', 'subSubProjectId')
      .addSelect('contributor.subSubSubProjectId', 'subSubSubProjectId')
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "group"."id",
          'name', "group"."name",
          'slug', "group"."slug",
          'description', "group"."description",
          'color', "group"."color",
          'projectId', "group"."projectId",
          'subProjectId', "group"."subProjectId",
          'subSubProjectId', "group"."subSubProjectId",
          'organizationId', "group"."organizationId"
      ) AS "group"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "organization"."id",
          'userId', "organization"."userId",
          'color', "organization"."color",
          'name', "organization"."name"
      ) AS "organization"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "project"."id",
          'name', "project"."name",
          'slug', "project"."slug",
          'description', "project"."description",
          'color', "project"."color",
          'organizationId', "project"."organizationId"
      ) AS "project"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "subProject"."id",
          'name', "subProject"."name",
          'slug', "subProject"."slug",
          'description', "subProject"."description",
          'color', "subProject"."color",
          'projectId', "subProject"."projectId",
          'organizationId', "subProject"."organizationId"
      ) AS "subProject"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "subSubProject"."id",
          'name', "subSubProject"."name",
          'slug', "subSubProject"."slug",
          'description', "subSubProject"."description",
          'color', "subSubProject"."color",
          'projectId', "subSubProject"."projectId",
          'subProjectId', "subSubProject"."subProjectId",
          'organizationId', "subSubProject"."organizationId"
      ) AS "subSubProject"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "subSubSubProject"."id",
          'name', "subSubSubProject"."name",
          'slug', "subSubSubProject"."slug",
          'description', "subSubSubProject"."description",
          'color', "subSubSubProject"."color",
          'projectId', "subSubSubProject"."projectId",
          'subProjectId', "subSubSubProject"."subProjectId",
          'subSubProjectId', "subSubSubProject"."subSubProjectId",
          'organizationId', "subSubSubProject"."organizationId"
      ) AS "subSubSubProject"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
              'firstName', "profile"."firstName",
              'lastName', "profile"."lastName",
              'image', "profile"."image",
              'color', "profile"."color",
              'userId', "user"."id",
              'email', "user"."email"
          ) AS "profile"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'name', "contributor"."role"
      ) AS "role"`,
      )
      .addSelect('contributor.createdAt', 'createdAt')
      .where('contributor.deletedAt IS NULL')
      .andWhere('contributor.type = :type', { type });

    if (groupId) {
      query = query.andWhere('contributor.groupId = :groupId', { groupId });
    }

    if (organizationId) {
      query = query.andWhere('contributor.organizationId = :organizationId', {
        organizationId,
      });
    }

    if (projectId) {
      query = query.andWhere('contributor.projectId = :projectId', {
        projectId,
      });
    }

    if (subProjectId) {
      query = query.andWhere('contributor.subProjectId = :subProjectId', {
        subProjectId,
      });
    }

    if (subSubProjectId) {
      query = query.andWhere('contributor.subSubProjectId = :subSubProjectId', {
        subSubProjectId,
      });
    }

    if (subSubSubProjectId) {
      query = query.andWhere(
        'contributor.subSubSubProjectId = :subSubSubProjectId',
        {
          subSubSubProjectId,
        },
      );
    }

    if (userId) {
      query = query.andWhere('contributor.userId = :userId', { userId });
    }

    if (search) {
      query = query.andWhere(
        new Brackets((qb) => {
          qb.where('organization.name ::text ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere(
              '(profile.firstName ::text ILIKE :search OR profile.lastName ::text ILIKE :search OR profile.phone ::text ILIKE :search)',
              {
                search: `%${search}%`,
              },
            )
            .orWhere(
              '(user.email ::text ILIKE :search OR user.username ::text ILIKE :search)',
              {
                search: `%${search}%`,
              },
            )
            .orWhere('group.name ::text ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('project.name ::text ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('subProject.name ::text ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('subSubProject.name ::text ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('subSubSubProject.name ::text ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    query = query
      .leftJoin('contributor.group', 'group')
      .leftJoin('contributor.project', 'project')
      .leftJoin('contributor.subProject', 'subProject')
      .leftJoin('contributor.subSubProject', 'subSubProject')
      .leftJoin('contributor.subSubSubProject', 'subSubSubProject')
      .leftJoin('contributor.organization', 'organization')
      .leftJoin('organization.user', 'userOrganization')
      .leftJoin('contributor.user', 'user')
      .leftJoin('user.profile', 'profile');

    const [errorRowCount, rowCount] = await useCatch(query.getCount());
    if (errorRowCount) throw new NotFoundException(errorRowCount);

    const [error, users] = await useCatch(
      query
        .orderBy('contributor.createdAt', pagination?.sort)
        .limit(pagination.limit)
        .offset(pagination.offset)
        .getRawMany(),
    );
    if (error) throw new NotFoundException(error);

    return withPagination({
      pagination,
      rowCount,
      value: users,
    });
  }

  async findAllNotPaginate(
    selections: GetContributorsSelections,
  ): Promise<GetContributorsSelections | any> {
    const {
      type,
      userId,
      groupId,
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
    } = selections;

    let query = this.driver
      .createQueryBuilder('contributor')
      .addSelect('contributor.createdAt', 'createdAt')
      .where('contributor.deletedAt IS NULL')
      .andWhere('contributor.type = :type', { type });

    if (groupId) {
      query = query.andWhere('contributor.groupId = :groupId', { groupId });
    }

    if (organizationId) {
      query = query.andWhere('contributor.organizationId = :organizationId', {
        organizationId,
      });
    }

    if (projectId) {
      query = query.andWhere('contributor.projectId = :projectId', {
        projectId,
      });
    }

    if (subProjectId) {
      query = query.andWhere('contributor.subProjectId = :subProjectId', {
        subProjectId,
      });
    }

    if (subSubProjectId) {
      query = query.andWhere('contributor.subSubProjectId = :subSubProjectId', {
        subSubProjectId,
      });
    }

    if (subSubSubProjectId) {
      query = query.andWhere(
        'contributor.subSubSubProjectId = :subSubSubProjectId',
        { subSubSubProjectId },
      );
    }

    if (userId) {
      query = query.andWhere('contributor.userId = :userId', { userId });
    }

    const [error, contributors] = await useCatch(
      query.orderBy('contributor.createdAt', 'DESC').getMany(),
    );
    if (error) throw new NotFoundException(error);

    return contributors;
  }

  async findOneBy(selections: GetOneContributorSelections): Promise<any> {
    const {
      type,
      userId,
      groupId,
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
      contributorId,
    } = selections;

    let query = this.driver
      .createQueryBuilder('contributor')
      .select('contributor.id', 'id')
      .addSelect('contributor.userCreatedId', 'userCreatedId')
      .addSelect('contributor.userId', 'userId')
      .addSelect('contributor.groupId', 'groupId')
      .addSelect('contributor.projectId', 'projectId')
      .addSelect('contributor.subProjectId', 'subProjectId')
      .addSelect('contributor.organizationId', 'organizationId')
      .addSelect('contributor.subSubProjectId', 'subSubProjectId')
      .addSelect('contributor.type', 'type')
      .addSelect('contributor.createdAt', 'createdAt')
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "organization"."id",
          'userId', "organization"."userId",
          'color', "organization"."color",
          'name', "organization"."name"
      ) AS "organization"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'name', "contributor"."role"
      ) AS "role"`,
      )
      .where('contributor.deletedAt IS NULL')
      .leftJoin('contributor.organization', 'organization')
      .leftJoin('organization.user', 'userOrganization')
      .leftJoin('contributor.user', 'user')
      .leftJoin('user.profile', 'profile');

    if (type) {
      query = query.andWhere('contributor.type = :type', { type });
    }

    if (groupId) {
      query = query.andWhere('contributor.groupId = :groupId', { groupId });
    }

    if (organizationId) {
      query = query.andWhere('contributor.organizationId = :organizationId', {
        organizationId,
      });
    }

    if (subSubProjectId) {
      query = query.andWhere('contributor.subSubProjectId = :subSubProjectId', {
        subSubProjectId,
      });
    }

    if (projectId) {
      query = query.andWhere('contributor.projectId = :projectId', {
        projectId,
      });
    }

    if (subProjectId) {
      query = query.andWhere('contributor.subProjectId = :subProjectId', {
        subProjectId,
      });
    }

    if (subSubSubProjectId) {
      query = query.andWhere(
        'contributor.subSubSubProjectId = :subSubSubProjectId',
        { subSubSubProjectId },
      );
    }

    if (userId) {
      query = query.andWhere('contributor.userId = :userId', { userId });
    }

    if (contributorId) {
      query = query.andWhere('contributor.id = :id', { id: contributorId });
    }

    const [error, result] = await useCatch(query.getRawOne());
    if (error)
      throw new HttpException('contributor not found', HttpStatus.NOT_FOUND);

    return result;
  }

  /** Create one Contributor to the database. */
  async createOne(options: CreateContributorOptions): Promise<Contributor> {
    const {
      userId,
      groupId,
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
      userCreatedId,
      role,
      type,
    } = options;

    const contributor = new Contributor();
    contributor.userId = userId;
    contributor.groupId = groupId;
    contributor.type = type;
    contributor.organizationId = organizationId;
    contributor.subProjectId = subProjectId;
    contributor.projectId = projectId;
    contributor.userCreatedId = userCreatedId;
    contributor.subSubProjectId = subSubProjectId;
    contributor.subSubSubProjectId = subSubSubProjectId;
    contributor.role = role;

    const query = this.driver.save(contributor);

    const [error, result] = await useCatch(query);
    if (error) throw new NotFoundException(error);

    return result;
  }

  /** Update one Contributor to the database. */
  async updateOne(
    selections: UpdateContributorSelections,
    options: UpdateContributorOptions,
  ): Promise<Contributor> {
    const { option1 } = selections;
    const { role, deletedAt } = options;

    let findQuery = this.driver.createQueryBuilder('contributor');

    if (option1) {
      const { contributorId } = option1;
      findQuery = findQuery.where('contributor.id = :id', {
        id: contributorId,
      });
    }

    const [errorFind, findItem] = await useCatch(findQuery.getOne());
    if (errorFind) throw new NotFoundException(errorFind);

    findItem.role = role;
    findItem.deletedAt = deletedAt;

    const query = this.driver.save(findItem);
    const [errorUp, result] = await useCatch(query);
    if (errorUp) throw new NotFoundException(errorUp);

    return result;
  }

  /** Update one Contributor to the database. */
  async deleteOne(selections: DeleteContributorSelections): Promise<any> {
    const { option1 } = selections;

    let query = this.driver
      .createQueryBuilder('contributor')
      .delete()
      .from(Contributor);

    if (option1) {
      const { contributorId } = option1;
      query = query.where('id = :id', { id: contributorId });
    }

    const [errorUp, result] = await useCatch(query.execute());
    if (errorUp) throw new NotFoundException(errorUp);

    return result;
  }

  /** Permission. organization */
  async canCheckPermissionOrganization(options: {
    userId: string;
    organization: Organization;
  }): Promise<any> {
    const { userId, organization } = options;

    const findOneContributorOrganization = await this.findOneBy({
      userId: userId,
      organizationId: organization?.id,
      type: FilterQueryType.PROJECT,
    });

    return findOneContributorOrganization;
  }

  /** Permission. project */
  async canCheckPermissionProject(options: {
    userId: string;
    project: Project;
  }): Promise<any> {
    const { userId, project } = options;

    const findOneContributorProject = await this.findOneBy({
      userId: userId,
      projectId: project?.id,
      organizationId: project?.organizationId,
      type: FilterQueryType.PROJECT,
    });

    return findOneContributorProject;
  }
  /** Permission. sub project */
  async canCheckPermissionSubProject(options: {
    userId: string;
    subProject: SubProject;
  }): Promise<any> {
    const { userId, subProject } = options;

    const findOneContributorSubProject = await this.findOneBy({
      userId: userId,
      organizationId: subProject?.organizationId,
      projectId: subProject?.projectId,
      subProjectId: subProject?.id,
      type: FilterQueryType.SUBPROJECT,
    });

    return findOneContributorSubProject;
  }

  /** Permission. sub sub project */
  async canCheckPermissionSubSubProject(options: {
    userId: string;
    projectId: string;
    subSubProjectId: string;
    subProjectId: string;
    organizationId: string;
  }): Promise<any> {
    const { userId, projectId, subProjectId, subSubProjectId, organizationId } =
      options;

    const findOneContributorSubSubProject = await this.findOneBy({
      userId: userId,
      projectId: projectId,
      subSubProjectId: subSubProjectId,
      subProjectId: subProjectId,
      organizationId: organizationId,
      type: FilterQueryType.SUBSUBPROJECT,
    });

    return findOneContributorSubSubProject;
  }

  /** Permission. sub sub sub project */
  async canCheckPermissionSubSubSubProject(options: {
    userId: string;
    projectId: string;
    subSubProjectId: string;
    subSubSubProjectId: string;
    subProjectId: string;
    organizationId: string;
  }): Promise<any> {
    const {
      userId,
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
    } = options;

    const findOneContributorSubSubSubProject = await this.findOneBy({
      userId: userId,
      subSubSubProjectId: subSubSubProjectId,
      subSubProjectId: subSubProjectId,
      subProjectId: subProjectId,
      projectId: projectId,
      organizationId: organizationId,
      type: FilterQueryType.SUBSUBSUBPROJECT,
    });

    return findOneContributorSubSubSubProject;
  }

  /** Permission. group */
  async canCheckPermissionGroup(options: {
    userId: string;
    groupId: string;
    projectId: string;
    subSubProjectId: string;
    subSubSubProjectId: string;
    subProjectId: string;
    organizationId: string;
  }): Promise<any> {
    const {
      userId,
      groupId,
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
    } = options;

    const findOneContributorGroup = await this.findOneBy({
      userId: userId,
      groupId: groupId,
      subSubSubProjectId: subSubSubProjectId,
      subSubProjectId: subSubProjectId,
      subProjectId: subProjectId,
      projectId: projectId,
      organizationId: organizationId,
      type: FilterQueryType.GROUP,
    });

    return findOneContributorGroup;
  }
  /** Permission. project */
  async canCheckPermissionContributor(options: {
    userId: string;
    contributorId: string;
  }): Promise<any> {
    const { userId, contributorId } = options;

    const contributor = await this.findOneBy({
      contributorId,
    });
    if (!contributor)
      throw new HttpException(
        `This contributor dons't exists please change`,
        HttpStatus.NOT_FOUND,
      );

    const findOneContributorProject = await this.findOneBy({
      userId: userId,
      projectId: contributor?.projectId,
      subSubProjectId: contributor?.subSubProjectId,
      subProjectId: contributor?.subProjectId,
      organizationId: contributor?.organizationId,
      type: contributor?.type,
    });

    if (!findOneContributorProject)
      throw new HttpException(
        `This contributor dons't exists please change`,
        HttpStatus.NOT_FOUND,
      );
    /** This condition check if user is ADMIN */
    if (!['ADMIN', 'MODERATOR'].includes(findOneContributorProject?.role?.name))
      throw new UnauthorizedException('Not authorized! Change permission');

    return findOneContributorProject;
  }
}
