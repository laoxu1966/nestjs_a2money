import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UserService) {
    super();
  }

  serializeUser(
    user: User,
    done: (err: Error | null, user: number) => void,
  ): any {
    return done(null, user.id);
  }

  deserializeUser(
    id: number,
    done: (err: Error | null, payload?: User) => void,
  ): any {
    this.userService
      .findOne(id)
      .then((user) => done(null, user ?? new User()))
      .catch((error) => done(error));
  }
}
