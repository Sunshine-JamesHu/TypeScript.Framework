import { BaseEntity } from "../baseEntities/BaseEntity";

class IntegralRuleDiscount {
    public price?: string;
    public integral?: number;
    public limitPrice?: string;
    public limitType?: number;

}

class IntegralRuleBase {
    public name?: string;
    public status?: number;
    public type?: string;

    public discount?: IntegralRuleDiscount;
}



export class IntegralRule extends BaseEntity<string> {
    constructor() {
        super();
        this.type = "integral";
        this.allStore = true;
        this.base = undefined;
    }

    public type?: string;
    public allStore?: boolean;
    public base?: IntegralRuleBase;

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "IntegralRule",
            Index: "activity",
            Type: "activities"
        }
    }
}