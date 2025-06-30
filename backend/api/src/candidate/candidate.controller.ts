import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidateQueryDto } from './dto/candidate-list-query.dto';

@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get()
  findAll(@Query() query: CandidateQueryDto) {
    return this.candidateService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidateService.findOne(id);
  }

  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateDto: UpdateCandidateDto) {
  //   console.log(id);
  //   return this.candidateService.update(id, updateDto);
  // }
}
