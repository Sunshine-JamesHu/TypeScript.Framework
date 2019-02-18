
import { BaseEntity, FullAuditEntity } from "../baseEntities/BaseEntity";

//支付的父类
export class VoucherPayment extends FullAuditEntity<string>{

    constructor() {
        super();
        this.faceValue = 0;
        this.isOverlay = false;
        this.name = undefined;
        this.price = 0;
    }

    public faceValue: number;
    public isOverlay: boolean;
    public name?: string;
    public price: number;

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "VoucherPayment",
            Index: "ebossh",
            Type: "thirdPartyVouchers"
        }
    }
}
