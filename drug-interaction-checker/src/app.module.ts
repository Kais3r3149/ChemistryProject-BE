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
import { parseDatabaseUrl } from './database/parse-database-url';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM + PostgreSQL (Supabase)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const parsed = parseDatabaseUrl(
          configService.get<string>('DATABASE_URL'),
        );
        const isDev =
          configService.get<string>('NODE_ENV') === 'development';

        return {
          type: 'postgres' as const,
          host: parsed?.host ?? configService.get<string>('DB_HOST', 'localhost'),
          port: parsed?.port ?? configService.get<number>('DB_PORT', 5432),
          username: parsed?.username ?? configService.get<string>('DB_USERNAME', 'postgres'),
          password: parsed?.password ?? configService.get<string>('DB_PASSWORD', ''),
          database: parsed?.database ?? configService.get<string>('DB_DATABASE', 'postgres'),
          autoLoadEntities: true,
          synchronize: isDev,
          ssl: parsed?.ssl ?? { rejectUnauthorized: false },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
