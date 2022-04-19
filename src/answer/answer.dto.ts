export class CreateAnswerDto {
  questionid: number;
  qustionuid: number;
  des: string;
  readonly captcha: string;
}

export class UpdateAnswerDto {
  readonly id: number;
  readonly des: string;
}
