import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as Slug from 'slug';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../models/User';
import { Brackets, Repository } from 'typeorm';
import {
  CreateUserOptions,
  GetOneUserSelections,
  GetOnUserPublic,
  GetUsersSelections,
  UpdateUserOptions,
  UpdateUserSelections,
} from './users.type';
import { useCatch } from '../../app/utils/use-catch';
import { generateLongUUID } from '../../app/utils/commons/generate-random';
import { withPagination } from '../../app/utils/pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private driver: Repository<User>,
  ) {}

  async findAll(selections: GetUsersSelections): Promise<any> {
    const { search, pagination } = selections;
    let query = this.driver
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .addSelect('user.email', 'email')
      .addSelect('user.confirmedAt', 'confirmedAt')
      .addSelect('user.profileId', 'profileId')
      .addSelect('user.createdAt', 'createdAt')
      .addSelect(
        'user.organizationInUtilizationId',
        'organizationInUtilizationId',
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "profile"."id",
          'userId', "user"."id",
          'firstName', "profile"."firstName",
          'lastName', "profile"."lastName",
          'image', "profile"."image",
          'color', "profile"."color",
          'currencyId', "profile"."currencyId",
          'countryId', "profile"."countryId",
          'url', "profile"."url"
      ) AS "profile"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "organization"."id",
          'color', "organization"."color",
          'userId', "organization"."userId",
          'name', "organization"."name"
      ) AS "organization"`,
      )
      .where('user.deletedAt IS NULL')
      .leftJoin('user.profile', 'profile')
      .leftJoin('profile.currency', 'currency')
      .leftJoin('user.organizationInUtilization', 'organization');

    if (search) {
      query = query.andWhere(
        new Brackets((qb) => {
          qb.where('user.email ::text ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere(
              '(profile.firstName ::text ILIKE :search OR profile.lastName ::text ILIKE :search OR profile.phone ::text ILIKE :search)',
              {
                search: `%${search}%`,
              },
            )
            .orWhere('organization.name ::text ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    const [errorRowCount, rowCount] = await useCatch(query.getCount());
    if (errorRowCount) throw new NotFoundException(errorRowCount);

    const [error, users] = await useCatch(
      query
        .orderBy('user.createdAt', pagination?.sort)
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

  async findOneBy(selections: GetOneUserSelections): Promise<User> {
    const { option1, option2, option5, option6 } = selections;
    let query = this.driver
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect(
        'user.organizationInUtilization',
        'organizationInUtilization',
      );

    if (option1) {
      const { userId } = option1;
      query = query.andWhere('user.id = :id', { id: userId });
    }

    if (option2) {
      const { email } = option2;
      query = query.andWhere('user.email = :email', { email });
    }

    if (option5) {
      const { token } = option5;
      query = query
        .andWhere('user.token = :token', { token })
        .andWhere('user.confirmedAt IS NULL');
    }

    if (option6) {
      const { userId, email } = option6;
      query = query
        .andWhere('user.id = :id', { id: userId })
        .andWhere('user.email = :email', { email });
    }

    const [error, result] = await useCatch(query.getOne());
    if (error) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return result;
  }

  /** FindOne one User to the database. */
  async findOneInfoBy(
    selections: GetOneUserSelections,
  ): Promise<GetOnUserPublic> {
    const { option1, option2 } = selections;
    let query = this.driver
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .addSelect('user.createdAt', 'createdAt')
      .addSelect('user.email', 'email')
      .addSelect('user.confirmedAt', 'confirmedAt')
      .addSelect('user.profileId', 'profileId')
      .addSelect(
        'user.organizationInUtilizationId',
        'organizationInUtilizationId',
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "profile"."id",
          'userId', "user"."id",
          'firstName', "profile"."firstName",
          'lastName', "profile"."lastName",
          'image', "profile"."image",
          'color', "profile"."color",
          'currencyId', "profile"."currencyId",
          'countryId', "profile"."countryId",
          'url', "profile"."url"
      ) AS "profile"`,
      )
      .addSelect(
        /*sql*/ `(
      SELECT
          CAST(COUNT(DISTINCT con) AS INT)
      FROM "contributor" "con"
      WHERE ("con"."userId" = "user"."id"
      AND "con"."type" IN ('ORGANIZATION'))
      GROUP BY "con"."userId", "con"."type", "user"."id"
      ) AS "organizationTotal"`,
      )
      .addSelect(
        /*sql*/ `(
        SELECT jsonb_build_object(
        'name', "con"."role"
        )
        FROM "contributor" "con"
        WHERE "user"."id" = "con"."userId"
        AND "user"."organizationInUtilizationId" = "con"."organizationId"
        AND "con"."type" IN ('ORGANIZATION')
        ) AS "role"`,
      )
      .addSelect(
        /*sql*/ `jsonb_build_object(
          'id', "organization"."id",
          'color', "organization"."color",
          'userId', "organization"."userId",
          'name', "organization"."name"
      ) AS "organization"`,
      )
      .where('user.deletedAt IS NULL')
      .leftJoin('user.profile', 'profile')
      .leftJoin('profile.currency', 'currency')
      .leftJoin('user.organizationInUtilization', 'organization');

    if (option1) {
      const { userId } = option1;
      query = query.andWhere('user.id = :id', { id: userId });
    }

    if (option2) {
      const { email } = option2;
      query = query.andWhere('user.email = :email', { email });
    }

    const [error, result] = await useCatch(query.getRawOne());
    if (error) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return result;
  }

  /** Create one User to the database. */
  async createOne(options: CreateUserOptions): Promise<User> {
    const {
      email,
      username,
      password,
      profileId,
      organizationInUtilizationId,
    } = options;

    const user = new User();
    user.token = generateLongUUID(50);
    user.email = email.toLowerCase();
    user.hashPassword(password);
    user.username = username;
    user.profileId = profileId;
    user.organizationInUtilizationId = organizationInUtilizationId;

    const query = this.driver.save(user);

    const [error, result] = await useCatch(query);
    if (error) throw new NotFoundException(error);

    return result;
  }

  /** Update one User to the database. */
  async updateOne(
    selections: UpdateUserSelections,
    options: UpdateUserOptions,
  ): Promise<User> {
    const { option1, option2 } = selections;
    const {
      email,
      username,
      password,
      accessToken,
      refreshToken,
      organizationInUtilizationId,
      deletedAt,
      confirmedAt,
    } = options;

    let findQuery = this.driver.createQueryBuilder('user');

    if (option1) {
      const { userId } = option1;
      findQuery = findQuery.where('user.id = :id', {
        id: userId,
      });
    }

    if (option2) {
      const { email } = option2;
      findQuery = findQuery.where('user.email = :email', { email });
    }

    const [errorFind, findItem] = await useCatch(findQuery.getOne());
    if (errorFind) throw new NotFoundException(errorFind);

    findItem.email = email;
    findItem.username = username;
    if (password) {
      findItem.hashPassword(password);
    }
    findItem.accessToken = accessToken;
    findItem.refreshToken = refreshToken;
    findItem.organizationInUtilizationId = organizationInUtilizationId;
    findItem.deletedAt = deletedAt;
    findItem.confirmedAt = confirmedAt;

    const query = this.driver.save(findItem);
    const [errorUp, result] = await useCatch(query);
    if (errorUp) throw new NotFoundException(errorUp);

    return result;
  }

  /** Permission. */
  async canPermission(options: { userId: string }): Promise<any> {
    const { userId } = options;

    const findOneUser = await this.findOneInfoBy({
      option1: { userId: userId },
    });

    /** This condition check if user is ADMIN */
    if (!['ADMIN'].includes(findOneUser?.role?.name))
      throw new UnauthorizedException('Not authorized! Change permission');

    return findOneUser;
  }
}
