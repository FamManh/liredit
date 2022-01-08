import { Ctx, Query, Resolver } from "type-graphql";
import { MyContext } from "../types";
import { Post } from "../entities/Post";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    const posts = await em.find(Post, {});
    return posts;
  }
}
