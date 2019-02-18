import { IApplicationService } from "../IApplicationService";

export interface IDiscountService extends IApplicationService {

    /**
     * 获取本订单的优惠实例
     * @param orderInfo  订单信息
     */
    GetDiscountInstance(orderInfo: any): Promise<any>;

}