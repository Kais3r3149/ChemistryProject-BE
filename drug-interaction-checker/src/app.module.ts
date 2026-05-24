import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DrugsModule } from './drugs/drugs.module';
import { DdiModule } from './ddi/ddi.module';
import { DtiModule } from './dti/dti.module';
import { PpiModule } from './ppi/ppi.module';
import { GdaModule } from './gda/gda.module';
import { DrugResponseModule } from './drug-response/drug-response.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchHistoryModule } from './search-history/search-history.module';
import { DrugFoodModule } from './drug-food/drug-food.module';
import { DrugConditionModule } from './drug-condition/drug-condition.module';
import { DrugSideEffectModule } from './drug-side-effect/drug-side-effect.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM + SQL Server (SSMS)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev =
          configService.get<string>('NODE_ENV') !== 'production';

        return {
          type: 'mssql' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 1433),
          username: configService.get<string>('DB_USERNAME', 'sa'),
          password: configService.get<string>('DB_PASSWORD', ''),
          database: configService.get<string>('DB_DATABASE', 'DrugInteractionDB'),
          options: {
            instanceName: configService.get<string>('DB_INSTANCE', ''),
            encrypt: false,
            trustServerCertificate: true,
          },
          autoLoadEntities: true,
          synchronize: isDev,
          logging: isDev,
        };
      },
    }),

    // Feature modules
    AuthModule,
    DrugsModule,
    DdiModule,
    DtiModule,
    PpiModule,
    GdaModule,
    DrugResponseModule,
    DashboardModule,
    SearchHistoryModule,
    DrugFoodModule,
    DrugConditionModule,
    DrugSideEffectModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
