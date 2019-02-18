import { BaseEntity, FullAuditEntity } from "../baseEntities/BaseEntity";

//支付的父类
export class CustomPayment extends FullAuditEntity<string>{

    constructor() {
        super();

        this.payType = undefined;
        this.payType = undefined;
        this.name = undefined;
        this.isFlagPay = undefined;
        this.isTop = undefined;
        this.isTuan = undefined;
        this.status = undefined;
        this.isUsed = undefined;
        this.isEnabled = undefined;

        this.created = undefined;
        this.modified = undefined;
    }

    public payType?: string;
    public name?: string;
    public isFlagPay?: number;
    public isTop?: number;
    public isTuan?: number;
    public status?: number;

    public isUsed?: boolean;
    public isEnabled?: boolean;

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "CustomPayment",
            Index: "ebossh",
            Type: "custompaymenttype"
        }
    }

}