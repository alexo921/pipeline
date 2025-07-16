import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { JobService } from './job.service';
import { JobQueryDto } from './dto/job-query.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Job')
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  dummyCreate() {
    // Create a dummy job for testing
    const dummyJobData = {
      title: 'Test Job',
      description: 'This is a test job',
      location: 'Austin, TX 78701',
      zipCode: '78701',
      company: 'Test Company',
      salary: '$50,000 - $60,000',
      requirements: 'Some requirements',
      benefits: 'Some benefits'
    };
    return this.jobService.create(dummyJobData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  findAll(@Query() query: JobQueryDto) {
    return this.jobService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
  //   return this.jobService.update(+id, updateJobDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.jobService.remove(+id);
  // }
}
