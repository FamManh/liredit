import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolvers } from "./resolvers/user";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  orm.getMigrator().up();

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only work in https
      },
      saveUninitialized: false,
      secret: "liredit-secret",
      resave: false,
    })
  );

  let apolloServer = null;
  const startServer = async () => {
    apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [HelloResolver, PostResolver, UserResolvers],
        validate: false,
      }),
      context: ({ req, res }): MyContext => ({
        em: orm.em,
        req,
        res,
      }),
    });
    await apolloServer.start();

    apolloServer.applyMiddleware({ app });
  };

  startServer();

  app.listen(4000, () => {
    console.info(`Server is running on port ${40000}`);
  });
};
main().catch((err) => {
  console.error(err);
});
