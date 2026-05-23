import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { sql } from 'drizzle-orm';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    @Inject('DATABASE') private readonly db: any,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Verifica que el proceso está vivo y responde. No comprueba dependencias.',
  })
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Verifica conectividad a MySQL (Drizzle). Úsalo para readiness en Kubernetes/Docker.',
  })
  readiness() {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const key = 'database';
    try {
      await this.db.execute(sql`SELECT 1`);
      return { [key]: { status: 'up' } };
    } catch (error) {
      return {
        [key]: {
          status: 'down',
          message: error instanceof Error ? error.message : 'unknown error',
        },
      };
    }
  }
}
