import { ConfigCenter, GlobalUrlInfo } from "../core/config/ConfigCenter";
import { IRequest } from "../core/request/IRequest";
import { ICache } from "../core/cache/ICache";
import { IApplicationService } from "./IApplicationService";
import { SysInfo } from "../core/entities/systems/SysInfo";
import { BrandInfo } from "../core/entities/brands/BrandInfo";
import { StoreInfo } from "../core/entities/stores/StoreInfo";

export abstract class BaseApplicationService implements IApplicationService {
    protected ConfigCenter: ConfigCenter;
    protected Request: IRequest;
    protected Cache: ICache;
    protected GlobalUrl: GlobalUrlInfo

    constructor() {
        this.ConfigCenter = ConfigCenter.GetInstance();
        this.Cache = this.ConfigCenter.GetCacheInstance();
        this.Request = this.ConfigCenter.GetRequestInstance();
        this.GlobalUrl = this.ConfigCenter.GetGlobalUrl();
    }

    protected GetLoginMemberInfo(): SysInfo {
        return this.ConfigCenter.GetSysInfo();
    }

    protected GetBrandInfo(): BrandInfo {
        return this.ConfigCenter.GetBrandInfo();
    }

    protected GetStoreInfo(): StoreInfo {
        return this.ConfigCenter.GetStoreInfo();
    }

    protected GetResult(): any {
        const result = { success: false, message: "", data: null };
        return result;
    }

    protected RequestError(error: any): any {
        console.error("请求失败", error);
        const result = { success: false, message: "请求失败", data: error };
        return result;
    }

    ImplementsIApplicationService() {
        return true;
    }

    abstract GetImplementsService(): string;

}