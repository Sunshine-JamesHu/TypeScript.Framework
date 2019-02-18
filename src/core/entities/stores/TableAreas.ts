import { FullAuditEntity, BaseEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class TableAreas extends BaseEntity<string> implements IStore {
    areas?: any[];
    luckyNumber?: boolean;
    storeId?: number;
    constructor() {
        super();
        this.storeId = undefined;
        this.areas = undefined;
        this.luckyNumber = false;
        this.storeId = undefined;
    }

    ImplementsIStore(): boolean {
        return true;
    }

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "TableAreas",
            Index: "ebossh",
            Type: "tableAreas"
        }
    }

}