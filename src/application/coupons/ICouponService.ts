import { IApplicationService } from "../IApplicationService";

export interface ICouponService extends IApplicationService {

  /**
   * 获取品牌的优惠券使用规则
   */
  GetBrandCouponRule(): Promise<any>;


  /**
   * 获取优惠券详情
   */
  GetCouponInfoByIds(ids: number[]): Promise<any>;

}
