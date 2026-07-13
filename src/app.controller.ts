import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns overall service status plus Groq LLM reachability. ' +
      'status stays "ok" in degraded mode (groq.reachable = false).',
  })
  async health() {
    return this.appService.getHealth();
  }
}
