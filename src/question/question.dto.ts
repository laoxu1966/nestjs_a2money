export class CreateQuestionDto {
  readonly title: string;
  readonly des: string;
  readonly classification: number;
  readonly tag: string;
  pics: string;
  files: string;
  readonly captcha: string;
}

export class UpdateQuestionDto {
  readonly id: number;
  readonly title: string;
  readonly des: string;
  readonly classification: number;
  readonly tag: string;
  pics: string;
  files: string;
}
