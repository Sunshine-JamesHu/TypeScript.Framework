import { IApplicationService } from "../IApplicationService";

export interface IPaymentService extends IApplicationService {
   /**
     * 获取用户信息
     * @param ids 
     */
    GetStorePaytypeList(): Promise<any>;

      /**
     * 第三方代金券
     * @param ids 
     */
    GetVouchers(): Promise<any>;
}