import { BaseEntity, IEntity } from "../baseEntities/BaseEntity";

export class TopProduct implements IEntity<string> {

    
    constructor() {
        this._id = undefined;
        this.id = undefined;
        this.allStore = undefined;
        this.enabled = undefined;
        this.products = undefined;
        this.stores = undefined;
    }
    public _id?: string;
    public id?: string;
    public allStore?: boolean;
    public enabled?: boolean;
    public products?: any[];
    public stores?: any[];
    

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "TopProduct",
            Index: "ebossh",
            Type: "topProduct"
        };
    }

    CheckImplements(interfaceName: string): boolean {
        let implementsKey = "Implements" + interfaceName;
        let obj = <any>this;
        let func: Function | undefined = obj[implementsKey]
        if (func && func())
            return true;
        return false;
    }

    ImplementsIStore(): boolean {
        return true;
    }

}