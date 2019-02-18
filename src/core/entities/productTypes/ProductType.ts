import { BaseEntity } from "../baseEntities/BaseEntity";

export class ProductType extends BaseEntity<string> {
    constructor() {
        super();
        this.name = undefined;
        this.allStore = undefined;
        this.isvalid = undefined;
        this.sortIndex = undefined;
        this.options = undefined;
    }

    public name?: string;
    public allStore?: boolean;
    public isvalid?: boolean;
    public sortIndex?: number;
    public options?: { [key: number]: any };

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "ProductType",
            Index: "ebossh",
            Type: "productTypes"
        }
    };

}