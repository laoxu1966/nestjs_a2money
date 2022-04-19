import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import * as fs from 'fs';

import AlipaySdk from 'alipay-sdk';
import AlipayFormData from 'alipay-sdk/lib/form';

import { Token } from './token.entity';
import { User } from '../user/user.entity';
import { Respond } from '../respond/respond.entity';

@Injectable()
export class TokenService {
  constructor(
    private connection: Connection,
    private configService: ConfigService,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(Respond)
    private respondRepository: Repository<Respond>,
  ) {}

  async findAll(user: User, uid: number): Promise<Token[]> {
    if (uid == 0) uid = user.id;

    return await this.tokenRepository.find({
      where: { uid: uid },
      order: {
        id: 'DESC',
      },
    });
  }

  async freeze(user: User, host: string, tokenid: number): Promise<any> {
    const token = await this.tokenRepository.findOne(tokenid);
    if (!token || token.uid != user.id || token.freeze > 0) {
      throw new NotFoundException();
    }

    // 查询预授权状态
    if (token.msg != '{}') {
      const body: any = this.freezeQuery(JSON.parse(token.msg ?? '{}'));
      if (body.status == 'SUCCESS') {
        return await this.tokenRepository.update(tokenid, {
          msg: JSON.stringify(body),
          // 利用out_request_no存储payer_user_id
          out_request_no: body.payerUserId ?? body.payer_user_id,
          freeze: Number(body.amount),
        });
      }
    }

    const out_request_no = Date.now().toString();
    const out_order_no = out_request_no;

    await this.tokenRepository.update(tokenid, {
      out_request_no,
      msg: JSON.stringify({ out_request_no, out_order_no }),
    });

    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('notifyUrl', 'https://' + host + '/pay/freezeNotify');
    formData.addField('bizContent', {
      out_order_no,
      out_request_no,
      order_title: '能力变现平台预授权',
      payee_user_id: this.configService.get<string>('SELLER_ID'),
      amount: token.payable.toFixed(2),
      product_code: 'PRE_AUTH_ONLINE',
    });

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    return await alipaySdk.exec(
      'alipay.fund.auth.order.app.freeze',
      {},
      { formData: formData },
    );
  }

  async freezeNotify(body: any): Promise<any> {
    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    delete body.sign_type;
    const sign: boolean = alipaySdk.checkNotifySign(body);
    if (!sign) {
      return false;
    }

    const app_id = this.configService.get<string>('APP_ID');
    const seller_id = this.configService.get<string>('SELLER_ID');
    if (app_id != body.app_id || seller_id != body.payee_user_id) {
      return false;
    }

    delete body.sign;

    if (body.status == 'SUCCESS') {
      const updateResult: UpdateResult = await this.tokenRepository.update(
        { out_request_no: body.out_request_no },
        {
          freeze: Number(body.amount),
          msg: JSON.stringify(body),
          // 利用out_request_no存储payer_user_id
          out_request_no: body.payerUserId ?? body.payer_user_id,
        },
      );

      if (updateResult.affected == 1) return true;
    }

    return false;
  }

  async freezeQuery(msg: any): Promise<any> {
    const out_order_no = msg.outOrderNo ?? msg.out_order_no;
    const out_request_no = msg.outRequestNo ?? msg.out_request_no;

    const bizContent: any = {
      out_order_no,
      out_request_no,
      operation_type: 'FREEZE',
    };

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    return await alipaySdk.exec(
      'alipay.fund.auth.operation.detail.query',
      { bizContent: bizContent },
      {},
    );
  }

  async unfreezeorpay(
    user: User,
    respondid: number,
    tokenid: number,
  ): Promise<any> {
    const respond = await this.respondRepository.findOne(respondid, {
      relations: ['tokens'],
    });
    if (!respond || (respond.uid != user.id && respond.abilityuid != user.id)) {
      throw new NotFoundException();
    }

    let paying: number;
    let payable: number;

    if (respond.settlement == '{}') {
      const contract = JSON.parse(respond.contract ?? '{}');
      paying = Number(contract.paying);
      payable = Number(contract.payable);
    } else {
      const settlement = JSON.parse(respond.settlement ?? '{}');
      paying = Number(settlement.paying);
      payable = Number(settlement.payable);
    }

    if (
      (paying == 0 && respond.abilityuid == user.id) ||
      (paying == 1 && respond.uid == user.id)
    ) {
      return this.unfreeze(user, respondid, tokenid);
    } else {
      return this.pay(user, respondid, tokenid, payable, respond.tokens);
    }
  }

  async unfreeze(user: User, respondid: number, tokenid: number): Promise<any> {
    const token = await this.tokenRepository.findOne(tokenid);
    if (
      !token ||
      token.respondid != respondid ||
      token.freeze == 0 ||
      token.unfreeze > 0 ||
      token.uid != user.id
    ) {
      throw new NotFoundException();
    }

    // 查询解除预授权状态
    if (token.msg != '{}') {
      const body: any = this.freezeQuery(JSON.parse(token.msg ?? '{}'));
      if (body.status == 'SUCCESS') {
        return await this.tokenRepository.update(tokenid, {
          msg: JSON.stringify(body),
          unfreeze: Number(body.amount),
        });
      }
    }

    const msg = JSON.parse(token.msg ?? '{}');
    const auth_no = msg.authNo ?? msg.auth_no;
    const out_request_no = Date.now().toString();

    const bizContent = {
      auth_no,
      out_request_no,
      amount: token.payable.toFixed(2),
      remark: '能力变现平台解除预授权',
    };

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    const body: any = await alipaySdk.exec(
      'alipay.fund.auth.order.unfreeze',
      { bizContent: bizContent },
      {},
    );

    if (body.status != 'SUCCESS') {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: JSON.stringify(body),
      });
    }

    return await this.tokenRepository.update(tokenid, {
      msg: JSON.stringify(body),
      unfreeze: Number(body.amount),
    });
  }

  async unfreezeQuery(msg: any): Promise<any> {
    const out_order_no = msg.outOrderNo ?? msg.out_order_no;
    const out_request_no = msg.outRequestNo ?? msg.out_request_no;

    const bizContent: any = {
      out_order_no,
      out_request_no,
      operation_type: 'UNFREEZE',
    };

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    return await alipaySdk.exec(
      'alipay.fund.auth.operation.detail.query',
      { bizContent: bizContent },
      {},
    );
  }

  async pay(
    user: User,
    respondid: number,
    tokenid: number,
    payable: number,
    tokens: Token[],
  ): Promise<any> {
    const token = await this.tokenRepository.findOne(tokenid);
    if (
      !token ||
      token.respondid != respondid ||
      token.freeze == 0 ||
      token.pay > 0 ||
      token.uid != user.id
    ) {
      throw new NotFoundException();
    }

    // 查询预授权转支付状态
    if (token.msg != '{}') {
      const body: any = this.payQuery(JSON.parse(token.msg ?? '{}'));
      if (body.status == 'SUCCESS') {
        return await this.tokenRepository.update(tokenid, {
          msg: JSON.stringify(body),
          pay: Number(body.amount),
        });
      }
    }

    let totalpay = 0.0;
    let peerid = 0;
    tokens.forEach((element) => {
      totalpay = totalpay + Math.abs(element.pay);
      if (element.peerid == token.peerid && element.uid != user.id)
        peerid = element.id;
    });

    if (payable <= totalpay) {
      throw new PreconditionFailedException();
    }

    const paid =
      payable - totalpay < token.freeze ? payable - totalpay : token.freeze;

    const msg = JSON.parse(token.msg ?? '{}');
    const auth_no = msg.authNo ?? msg.auth_no;
    const payer_user_id = msg.payerUserId ?? msg.payer_user_id;
    const out_trade_no = Date.now().toString();

    const bizContent = {
      out_trade_no,
      auth_no,
      product_code: 'PRE_AUTH_ONLINE',
      total_amount: paid.toFixed(2),
      subject: '能力变现平台预授权转支付',
      seller_id: this.configService.get<string>('SELLER_ID'),
      buyer_id: payer_user_id,
      auth_confirm_mode: 'COMPLETE',
    };

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    const body: any = await alipaySdk.exec(
      'alipay.trade.pay',
      { bizContent: bizContent },
      {},
    );

    if (body.msg != 'Success') {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: JSON.stringify(body),
      });
    }

    const receipt_amount = body.receiptAmount ?? body.receipt_amount;

    return await this.connection.transaction(async (manager) => {
      manager.update(Token, tokenid, {
        pay: Number(receipt_amount),
        msg: JSON.stringify(body),
      });

      manager.update(Token, peerid, {
        income: parseFloat((Number(receipt_amount) * 0.9).toFixed(3)),
        fee: parseFloat((Number(receipt_amount) * 0.1).toFixed(3)),
      });
    });
  }

  async payQuery(msg: any): Promise<any> {
    const out_order_no = msg.outOrderNo ?? msg.out_order_no;
    const out_request_no = msg.outRequestNo ?? msg.out_request_no;

    const bizContent: any = {
      out_order_no,
      out_request_no,
      operation_type: 'PAY',
    };

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    return await alipaySdk.exec(
      'alipay.fund.auth.operation.detail.query',
      { bizContent: bizContent },
      {},
    );
  }

  async trans(user: User, respondid: number, tokenid: number): Promise<any> {
    const token = await this.tokenRepository.findOne(tokenid);
    if (
      !token ||
      token.respondid != respondid ||
      token.income == 0 ||
      token.cash > 0 ||
      token.uid != user.id
    ) {
      throw new NotFoundException();
    }

    // 查询提现状态
    if (token.msg != '{}') {
      const body: any = this.transQuery(JSON.parse(token.msg ?? '{}'));
      if (body.status == 'SUCCESS') {
        return await this.tokenRepository.update(tokenid, {
          msg: JSON.stringify(body),
          cash: Number(body.amount),
        });
      }
    }

    const msg = JSON.parse(token.msg ?? '{}');
    const out_request_no = msg.outRequestNo ?? msg.out_request_no;

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    const bizContent: any = {
      out_biz_no: out_request_no,
      trans_amount: Number(token.income).toFixed(2),
      product_code: 'TRANS_ACCOUNT_NO_PWD',
      biz_scene: 'DIRECT_TRANSFER',
      order_title: '能力变现平台提现',
      payee_info: {
        // 从out_request_no字段读出payer_user_id
        identity: token.out_request_no,
        identity_type: 'ALIPAY_USER_ID',
      },
    };

    const body: any = await alipaySdk.exec(
      'alipay.fund.trans.uni.transfer',
      { bizContent: bizContent },
      {},
    );

    if (body.status != 'SUCCESS') {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: JSON.stringify(body),
      });
    }

    return await this.tokenRepository.update(tokenid, {
      msg: JSON.stringify(body),
      cash: Number(token.income),
    });
  }

  async transQuery(msg: any): Promise<any> {
    const out_biz_no = msg.outBizNo ?? msg.out_biz_no;
    const order_id = msg.orderId ?? msg.order_id;

    const bizContent: any = {
      product_code: 'TRANS_ACCOUNT_NO_PWD',
      biz_scene: 'DIRECT_TRANSFER',
      out_biz_no,
      order_id,
    };

    const alipaySdk = new AlipaySdk({
      appId: this.configService.get<string>('APP_ID'),
      privateKey: fs.readFileSync('./secrets/alipay-private-key.pem', 'ascii'),
      alipayRootCertPath: './secrets/alipayRootCert.crt',
      appCertPath: './secrets/appCertPublicKey.crt',
      alipayPublicCertPath: './secrets/alipayCertPublicKey_RSA2.crt',
      signType: 'RSA2',
    });

    return await alipaySdk.exec(
      'alipay.fund.trans.common.query',
      { bizContent: bizContent },
      {},
    );
  }
}
