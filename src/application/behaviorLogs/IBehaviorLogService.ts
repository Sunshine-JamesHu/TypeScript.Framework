import { IApplicationService } from "../IApplicationService";
import { BehaviorLogEnum } from "../../core/enums/BehaviorLogEnum";


export interface IBehaviorLogService extends IApplicationService {

    /**
     * 记录行为日志
     * @param data 日志
     */
    SaveBehaviorLog(data: { type: BehaviorLogEnum, data: any }): Promise<any>;

}