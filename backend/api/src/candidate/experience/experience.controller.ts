import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Candidate Experience')
@Controller('candidate/experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new experience' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  create(@Body() createDto: CreateExperienceDto) {
    return this.experienceService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all experiences for a candidate' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findAll(@Body() { candidateId }: any) {
    return this.experienceService.findAll(candidateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific experience by ID' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.experienceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a specific experience by ID' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateDto: UpdateExperienceDto) {
    return this.experienceService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific experience by ID' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.experienceService.remove(id);
  }
}
