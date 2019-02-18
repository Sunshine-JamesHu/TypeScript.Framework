import { BaseApplicationService } from "../BaseApplicationService";
import { IBehaviorLogService } from "./IBehaviorLogService";
import { BehaviorLogEnum } from "../../core/enums/BehaviorLogEnum";
import { IRepository } from "../../core/repository/IRepository";
import { OrderLog } from "../../core/entities/behaviorLogs/OrderLog";
import { RepositoryFactory } from "../../core/repository/RepositoryFactory";


export class BehaviorLogService extends BaseApplicationService implements IBehaviorLogService {
    private readonly _orderLogR: IRepository<OrderLog, string>;

    constructor() {
        super();
        this._orderLogR = RepositoryFactory.GetRepositoryInstance(OrderLog);
    }

    SaveBehaviorLog(data: { type: BehaviorLogEnum; data: any; }): Promise<any> {
        //保证Es不会死
        if (data.type == BehaviorLogEnum.OrderLog) {
            return this.SaveOrderLog((data)); //实在没办法，后来人看着修改
        }
        return Promise.resolve("没有Type,休想添加日志!");
    }

    private SaveOrderLog(data: any): Promise<any> {
        let bigData: { [key: string]: string } = {};

        //详情
        if (data.details) {
            bigData.details = JSON.stringify(data.details);
            data.details = undefined;
        }

        //支付方式
        if (data.payment) {
            bigData.payment = JSON.stringify(data.payment);
            data.payment = undefined;
        }

        //优惠
        if (data.discount) {
            bigData.discount = JSON.stringify(data.payment);
            data.discount = undefined;
        }

        data.bigData = bigData;
        return this._orderLogR.Create(data);
    }


    GetImplementsService(): string {
        return "IBehaviorLogService";
    }
}