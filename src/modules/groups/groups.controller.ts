import {
  Controller,
  Post,
  NotFoundException,
  Body,
  Param,
  ParseUUIDPipe,
  Delete,
  UseGuards,
  Put,
  Res,
  Req,
  Get,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { reply } from '../../app/utils/reply';
import { CreateOrUpdateGroupsDto, GroupsDto } from './groups.dto';
import { JwtAuthGuard } from '../users/middleware';

import { GroupsService } from './groups.service';
import { RequestPaginationDto } from '../../app/utils/pagination/request-pagination.dto';
import {
  FilterQueryType,
  SearchQueryDto,
} from '../../app/utils/search-query/search-query.dto';
import {
  addPagination,
  PaginationType,
} from '../../app/utils/pagination/with-pagination';
import { ContributorsService } from '../contributors/contributors.service';
import { ContributorRole } from '../contributors/contributors.type';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly contributorsService: ContributorsService,
  ) {}

  /** Get all Groups Contribute */
  // @Get(`/`)
  // @UseGuards(JwtAuthGuard)
  // async findAllGroups(
  //   @Res() res,
  //   @Req() req,
  //   @Query() requestPaginationDto: RequestPaginationDto,
  //   @Query() searchQuery: SearchQueryDto,
  // ) {
  //   const { user } = req;
  //   /** get contributor filter by Project */
  //   const { search } = searchQuery;

  //   const { take, page, sort } = requestPaginationDto;
  //   const pagination: PaginationType = addPagination({ page, take, sort });

  //   const groups = await this.groupsService.findAll({
  //     userId: user?.id,
  //     search,
  //     pagination,
  //     type: FilterQueryType.GROUP,
  //   });

  //   return reply({ res, results: groups });
  // }
  /** Get all Groups */
  @Get(`/contributes`)
  @UseGuards(JwtAuthGuard)
  async findAllContributorsBy(
    @Res() res,
    @Req() req,
    @Query() requestPaginationDto: RequestPaginationDto,
    @Query() searchQuery: SearchQueryDto,
    @Query() query: GroupsDto,
  ) {
    const { user } = req;
    const {
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
    } = query;

    const { search } = searchQuery;

    const { take, page, sort } = requestPaginationDto;
    const pagination: PaginationType = addPagination({ page, take, sort });

    const groups = await this.contributorsService.findAll({
      userId: user?.id,
      organizationId,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
      search,
      pagination,
      type: FilterQueryType.GROUP,
    });

    return reply({ res, results: groups });
  }

  /** Create Group */
  @Post(`/`)
  @UseGuards(JwtAuthGuard)
  async createOneGroup(
    @Res() res,
    @Req() req,
    @Body() body: CreateOrUpdateGroupsDto,
  ) {
    const { user } = req;
    const {
      name,
      description,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
    } = body;

    const group = await this.groupsService.createOne({
      name,
      description,
      projectId,
      subProjectId,
      subSubProjectId,
      subSubSubProjectId,
      userCreatedId: user?.id,
      organizationId: user?.organizationInUtilizationId,
    });

    /** Create Contributor */
    await this.contributorsService.createOne({
      userId: user?.id,
      userCreatedId: user?.id,
      role: ContributorRole.ADMIN,
      groupId: group?.id,
      projectId: projectId,
      subProjectId: subProjectId,
      subSubProjectId: subSubProjectId,
      subSubSubProjectId: subSubSubProjectId,
      organizationId: group?.organizationId,
      type: FilterQueryType.GROUP,
    });
    return reply({ res, results: group });
  }

  /** Update Group */
  @Put(`/:groupId`)
  @UseGuards(JwtAuthGuard)
  async updateOneGroup(
    @Res() res,
    @Req() req,
    @Body() body: CreateOrUpdateGroupsDto,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    const { name, description } = body;

    const findOneGroup = await this.groupsService.findOneBy({
      groupId,
    });
    if (!findOneGroup)
      throw new HttpException(
        `This Group ${groupId} dons't exist please change`,
        HttpStatus.NOT_FOUND,
      );

    const group = await this.groupsService.updateOne(
      { option1: { groupId: findOneGroup?.id } },
      { name, description },
    );

    return reply({ res, results: group });
  }

  /** Get Group */
  @Get(`/show`)
  @UseGuards(JwtAuthGuard)
  async getOneByUUIDGroup(
    @Res() res,
    @Req() req,
    @Query('groupId', ParseUUIDPipe) groupId: string,
  ) {
    const { user } = req;

    const getOneGroup = await this.groupsService.findOneBy({
      groupId,
    });
    if (!getOneGroup)
      throw new HttpException(
        `Project ${groupId} don't exist please change`,
        HttpStatus.NOT_FOUND,
      );

    const getOneContributor = await this.contributorsService.findOneBy({
      userId: user?.id,
      groupId: getOneGroup?.id,
      projectId: getOneGroup?.projectId,
      subProjectId: getOneGroup?.subProjectId,
      organizationId: getOneGroup?.organizationId,
      type: FilterQueryType.GROUP,
    });
    if (!getOneContributor)
      throw new HttpException(
        `Not authorized in this group ${groupId} please change`,
        HttpStatus.NOT_FOUND,
      );

    return reply({
      res,
      results: { ...getOneGroup, role: getOneContributor?.role },
    });
  }

  /** Delete Group */
  @Delete(`/:groupId`)
  @UseGuards(JwtAuthGuard)
  async deleteOneGroup(
    @Res() res,
    @Req() req,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    const findOneGroup = await this.groupsService.findOneBy({
      groupId,
    });
    if (!findOneGroup)
      throw new HttpException(
        `This Group ${groupId} dons't exist please change`,
        HttpStatus.NOT_FOUND,
      );

    const group = await this.groupsService.updateOne(
      { option1: { groupId: findOneGroup?.id } },
      { deletedAt: new Date() },
    );

    return reply({ res, results: group });
  }
}
