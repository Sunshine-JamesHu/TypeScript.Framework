
import { IApplicationService } from "../IApplicationService";
import { IntegralRule } from "../../core/entities/activities/IntegralRule";

export interface IActivityService extends IApplicationService {

    /**
     * 根据活动类型 获取活动详情
     * @param input 
     */
    GetActivityByType(input: { type: number }): Promise<any>;

    /**
     * 获取会员特价
     */
    GetSpecialOffer(): Promise<any>;

    /**
     * 充值送券活动
     */
    GetRechargeForCoupon(): Promise<any>;

    /**
     * 充值返利活动
     */
    GetRechargeForCash(): Promise<any>;

    /**
     * 获取优惠券礼包
     */
    GetCouponPackage(): Promise<any>;

    /**
     * 获取积分规则
     */
    GetIntegralRule(): Promise<IntegralRule | null>;

    /**
     * 获取充值升级
     */
    GetRechangeLevel(): Promise<any>;

    /**
     * 获取注册送券的活动
     */
    GetRegisterForCoupon(): Promise<any>;


    /**
     * 获取开通会员数据
     */
    GetOpenMemberData(): Promise<any>;
}