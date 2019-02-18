import { FullAuditEntity } from "../baseEntities/BaseEntity";

//空仓储 (用来实现子仓储的)
export class BehaviorLog extends FullAuditEntity<string> {
    
    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "BehaviorLog",
            Index: "behaviorlog",
            Type: ""
        }
    }
}