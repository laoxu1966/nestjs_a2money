export class CreateAbilityDto {
  readonly paying: number;
  readonly classification: number;
  readonly tag: string;
  readonly title: string;
  readonly des: string;
  readonly risk: string;
  readonly respondDate: string;
  readonly respondTime: string;
  pics: string;
  files: string;
  readonly email: string;
  readonly tel: string;
  readonly geo: string;
  readonly captcha: string;
}

export class UpdateAbilityDto {
  readonly id: number;
  readonly classification: string;
  readonly tag: string;
  readonly title: string;
  readonly des: string;
  readonly risk: string;
  readonly respondDate: string;
  readonly respondTime: string;
  pics: string;
  files: string;
  readonly email: string;
  readonly tel: string;
  readonly geo: string;
}
