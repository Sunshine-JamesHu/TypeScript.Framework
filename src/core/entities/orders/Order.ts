import { BaseEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class Order extends BaseEntity<string> implements IStore {

    //不好意思这个对象实在是太复杂了,我决定自己写_Sourse去查询.
    //而且这玩意也不需要自己手动去添加

    storeId?: number;

    ImplementsIStore(): boolean {
        return true;
    }
    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "Order",
            Index: "report",
            Type: "orders"
        }
    }

}