import { Controller, Get } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  uptime: number;
}

/**
 * Endpoint publico de salud (liveness) usado por el HEALTHCHECK de Docker,
 * docker-compose, las probes de Kubernetes y el target group del ALB.
 * No requiere autenticacion ni toca la base de datos.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
    };
  }
}
