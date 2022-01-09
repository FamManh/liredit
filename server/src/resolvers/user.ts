import { User } from "../entities/User";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolvers {
  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    // validate
    if (options.username?.length < 2) {
      return {
        errors: [
          {
            field: "username",
            message: "Username must be greater than 2",
          },
        ],
      };
    }
    if (options.password?.length < 3) {
      return {
        errors: [
          {
            field: "username",
            message: "Username must be greater than 3",
          },
        ],
      };
    }

    const isExistedUser = await em.findOne(User, {
      username: options.username,
    });
    if (isExistedUser) {
      return {
        errors: [
          {
            field: "Username",
            message: "This username is existed",
          },
        ],
      };
    }
    // encrypt password
    const password = await argon2.hash(options.password);
    const user = await em.create(User, { ...options, password });
    em.persistAndFlush(user);
    return { user };
  }

  @Mutation(() => UserResponse, { nullable: true })
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse | null> {
    const user = await em.findOne(User, {
      username: options.username,
    });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "Not found",
          },
        ],
      };
    }
    const isValidPassword = await argon2.verify(
      user.password,
      options.password
    );
    if (!isValidPassword) {
      return {
        errors: [
          {
            field: "password",
            message: "Password does not matches",
          },
        ],
      };
    }
    return { user };
  }
}
