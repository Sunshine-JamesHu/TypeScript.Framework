import { BaseEntity } from "../baseEntities/BaseEntity";


export class CouponRule extends BaseEntity<string>{

    constructor() {
        super();

        this.canuseboth = true;

        this.ordercouponrules = {
            limited: false,
            count: 0
        };

        this.productcouponrules = {
            limited: false,
            count: 0
        };
    }

    public canuseboth: boolean; //是否可以同时使用订单券和商品券
    public ordercouponrules: { //订单券规则
        limited: boolean;
        count: number;
    }

    public productcouponrules: { //商品券规则
        limited: boolean;
        count: number;
    }

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "CouponRule",
            Index: "ebossh",
            Type: "couponrules"
        }
    }
}