import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PaymentProviderHealthIndicator } from './payment-provider.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PaymentProviderHealthIndicator],
  exports: [PaymentProviderHealthIndicator],
})
export class HealthModule {}
