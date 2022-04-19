import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { join } from 'path';
import { createClient } from 'redis';

import * as fs from 'fs';
//import * as helmet from 'helmet';
import * as passport from 'passport';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';

const RedisStore = connectRedis(session);

import { HttpExceptionFilter } from './filter/exception.filter';
import { TransformInterceptor } from './interceptor/transform.interceptor';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions: {
      key: fs.readFileSync('./secrets/www.a2money.com.key'),
      cert: fs.readFileSync('./secrets/www.a2money.com.pem'),
    },
    //cors: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.set('view engine', 'hbs');
  app.set('view options', { layout: 'main' });

  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },
    legacyMode: true,
  });
  await redisClient.connect();

  app.use(
    session({
      secret: fs.readFileSync('./secrets/session.key').toString(),
      resave: false,
      saveUninitialized: false,
      store: new RedisStore({
        client: redisClient,
      }),
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  //app.use(helmet());

  await app.listen(3000);
}
bootstrap();
