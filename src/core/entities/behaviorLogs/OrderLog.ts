import { BehaviorLog } from "./BehaviorLog";

export class OrderLog extends BehaviorLog {

    constructor() {
        super();

        this.createTime = new Date().getTime();
    }

    public createTime: number;

    //新的字段
    public accountName?: string;
    public accountId?: number;

    public memberId?: number;
    public memberName?: string;

    public bigData?: any; //这是一段Json

    //老的字段
    public accountid?: number;
    public name?: string;
    public orderId?: string
    public operator?: string;

    public discount?: any;
    public payment?: any;

    //退款
    public authorizer?: string; // 授权人
    public authId?: number; // 授权人Id
    public details?: any;
    public detailIds?: string;


    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        let entityInfo = super.GetEntityInfo();
        entityInfo.Type = "orderLog";
        return entityInfo;
    }

}