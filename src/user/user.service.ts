import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';

import { User } from './user.entity';

import {
  CreateUserDto,
  UpdateUsernameDto,
  UpdatePasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UpdateEmailDto,
  UpdateTelDto,
} from './user.dto';

@Injectable()
export class UserService {
  private saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User | undefined> {
    return await this.userRepository.findOne(id);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      username: createUserDto.username,
    });
    if (user) {
      throw new ConflictException();
    }

    createUserDto.password = await this.hash(createUserDto.password);

    const profile = JSON.parse(createUserDto.profile ?? '{}');
    profile.avatar = 'mock/avatar/' + Math.floor(Math.random() * 128) + '.jpg';
    createUserDto.profile = JSON.stringify(profile);

    return await this.userRepository.save(createUserDto);
  }

  async signout(id: number): Promise<DeleteResult> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }

    const profile = JSON.parse(user.profile ?? '{}');
    profile.displayName = '该账号已注销';
    profile.avatar = '';
    profile.description = '';

    this.userRepository.query(
      'UPDATE ABILITY SET EMAIL = ?, TEL = ?, GEO = ?, PROFILE = ? WHERE UID = ?',
      ['', '', '', JSON.stringify(profile), user.id],
    );

    this.userRepository.query('UPDATE RESPOND SET PROFILE = ? WHERE UID = ?', [
      JSON.stringify(profile),
      user.id,
    ]);

    this.userRepository.query('UPDATE QUESTION SET PROFILE = ? WHERE UID = ?', [
      JSON.stringify(profile),
      user.id,
    ]);

    this.userRepository.query('UPDATE ANSWER SET PROFILE = ? WHERE UID = ?', [
      JSON.stringify(profile),
      user.id,
    ]);

    return await this.userRepository.delete(id);
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<UpdateResult> {
    const user = await this.userRepository.findOne({
      username: resetPasswordDto.username,
    });
    if (!user) {
      throw new NotFoundException();
    }

    return await this.userRepository.update(
      { username: resetPasswordDto.username },
      {
        password: await this.hash(resetPasswordDto.password),
      },
    );
  }

  async updatePassword(
    user: User,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<UpdateResult> {
    return await this.userRepository.update(user.id, {
      password: await this.hash(updatePasswordDto.password),
    });
  }

  async updateProfile(
    user: User,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateResult> {
    const user_profile = JSON.parse(user.profile ?? '{}');
    const dto_profile = JSON.parse(updateProfileDto.profile ?? '{}');
    if (
      user_profile.avatar != dto_profile.avatar &&
      user_profile.avatar.startsWith('avatar/')
    ) {
      if (fs.existsSync('public' + '/' + user_profile.avatar))
        fs.unlinkSync('public' + '/' + user_profile.avatar);
    }

    await this.userRepository.query(
      'UPDATE ability SET profile = ? WHERE uid = ?',
      [updateProfileDto.profile, user.id],
    );
    await this.userRepository.query(
      'UPDATE respond SET profile = ? WHERE uid = ?',
      [updateProfileDto.profile, user.id],
    );
    return await this.userRepository.update(user.id, {
      profile: updateProfileDto.profile,
    });
  }

  async updateUsername(
    user: User,
    updateUsernameDto: UpdateUsernameDto,
  ): Promise<UpdateResult> {
    const newuser = await this.userRepository.findOne({
      username: updateUsernameDto.username,
    });
    if (newuser && user.username != updateUsernameDto.username) {
      throw new ConflictException();
    }

    return await this.userRepository.update(user.id, {
      username: updateUsernameDto.username,
    });
  }

  async updateEmail(
    user: User,
    updateEmailDto: UpdateEmailDto,
  ): Promise<UpdateResult> {
    return await this.userRepository.update(user.id, {
      email: updateEmailDto.email,
    });
  }

  async updateTel(
    user: User,
    updateTelDto: UpdateTelDto,
  ): Promise<UpdateResult> {
    return await this.userRepository.update(user.id, {
      tel: updateTelDto.tel,
    });
  }

  async compare(pass: string, hash: string) {
    return await bcrypt.compare(pass, hash);
  }

  async hash(pass: string) {
    return await bcrypt.hash(pass, this.saltRounds);
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: [{ username: username }],
    });
    if (!user) {
      return null;
    }

    const compare = await this.compare(password, user.password);
    if (!compare) {
      return null;
    }

    if (user.role == -1) {
      if (
        new Date().getTime() - user.updated.getTime() >=
        1000 * 60 * 60 * 24 * 7
      ) {
        await this.userRepository.update(
          { id: user.id, role: -1 },
          { role: 0 },
        );
      }
    }

    return user;
  }
}
