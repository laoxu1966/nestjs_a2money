export class CreateUserDto {
  readonly username: string;
  password: string;
  profile: string;
}

export class UpdatePasswordDto {
  readonly password: string;
}

export class ResetPasswordDto {
  readonly username: string;
  readonly hash: string;
  readonly password: string;
}

export class UpdateProfileDto {
  profile: string;
}

export class UpdateUsernameDto {
  readonly username: string;
}

export class UpdateEmailDto {
  readonly email: string;
  readonly hash: string;
}

export class UpdateTelDto {
  readonly tel: string;
  readonly hash: string;
}
