export class CreateRespondDto {
  abilityid: number;
  abilityuid: number;
  contractAB: string;
  readonly captcha: string;
}

export class UpdateContractABDto {
  readonly id: number;
  readonly contractAB: string;
}

export class UpdateContractDto {
  readonly id: number;
  readonly contract: string;
}

export class UpdateSettlementABDto {
  readonly id: number;
  readonly settlementAB: string;
}

export class UpdateSettlementDto {
  readonly id: number;
  readonly settlement: string;
}

export class UpdateMemoDto {
  readonly id: number;
  memo: string;
}
