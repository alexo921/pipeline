import { Controller, Get, Param, Query } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CandidateQueryDto } from './dto/candidate-list-query.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Candidate')
@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all candidates' })
  findAll(@Query() query: CandidateQueryDto) {
    return this.candidateService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  findOne(@Param('id') id: string) {
    return this.candidateService.findOne(id);
  }

  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateDto: UpdateCandidateDto) {
  //   console.log(id);
  //   return this.candidateService.update(id, updateDto);
  // }
}
