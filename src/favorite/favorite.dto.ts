export class CreateFavoriteDto {
  readonly code: number;
  readonly peer: number;
  profile: string;
}

export class UpdateMemoDto {
  readonly favoriteid: number;
  memo: string;
}
