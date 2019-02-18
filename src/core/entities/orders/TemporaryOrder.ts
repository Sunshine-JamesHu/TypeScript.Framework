import { FullAuditEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class TemporaryOrder extends FullAuditEntity<string> implements IStore {
    orderId?: string;
    person?: number;
    memberRemark?: string;
    deskNo?: string;
    userInfo?: any;
    openId?: string;
    tOrderId?: string;
    createTime?: number;
    constructor() {
        super();

        this.storeId = undefined;
        this.orderId = undefined;
        this.person = undefined;
        this.memberRemark = undefined;
        this.deskNo = undefined;
        this.userInfo = undefined;
        this.openId = undefined;
        this.tOrderId = undefined;
        this.createTime = undefined;
        this.created = this.createTime;
    }

    ImplementsIStore(): boolean {
        return true;
    }
    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "TemporaryOrder",
            Index: "ebossh",
            Type: "temporaryOrder"
        }
    }

}