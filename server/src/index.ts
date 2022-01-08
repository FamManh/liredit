import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  orm.getMigrator().up();

  // const post = await orm.em.create(Post, { title: "My first post" });
  // await orm.em.persistAndFlush(post);
  // console.log("--------------sql 2 ----------");
  // await orm.em.nativeInsert(Post, { title: "My second post" });

  // console.log(post);
  // const posts = await orm.em.find(Post, {});
  // console.log(posts);

  const app = express();
  let apolloServer = null;
  const startServer = async () => {
    apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [HelloResolver, PostResolver],
        validate: false,
      }),
      context: () => ({
        em: orm.em,
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
