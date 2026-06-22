import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { buildConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { CalculationsModule } from './modules/calculations/calculations.module';
import { EmissionFactorsModule } from './modules/emission-factors/emission-factors.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (raw) => {
        const validated = validateEnv(raw);
        return { ...validated, ...buildConfig(validated) };
      },
    }),
    DatabaseModule,
    MaterialsModule,
    EmissionFactorsModule,
    CalculationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
