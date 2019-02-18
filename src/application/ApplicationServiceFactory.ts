import { ConfigCenter } from "../core/config/ConfigCenter";
import { ICache } from "../core/cache/ICache";
import { FrameworkCache } from "../core/cache/Cache";
import { IApplicationService } from "./IApplicationService";
import { AddCacheDto } from "../core/cache/dtos/AddCacheDto";
import { GetCacheInput } from "../core/cache/dtos/GetCacheInput";

export class ApplicationServiceFactory {
    // private static readonly ConfigCenter: ConfigCenter = ConfigCenter.GetInstance();
    private static readonly FrameworkCache: ICache = FrameworkCache.GetCacheInstance();

    static RegisterServiceInstance<TService extends TIService, TIService extends IApplicationService>(Service: { new(): TService }): TIService {
        let service = new Service();
        let serviceKey = service.GetImplementsService();
        let cashKey = "S_" + serviceKey;

        let obj = new AddCacheDto(cashKey, service, 0);
        this.FrameworkCache.AddCache(obj);
        return service;
    }

    static GetServiceInstance<TIService extends IApplicationService>(name: string) {
        let cashKey = "S_" + name;
        let input = new GetCacheInput(cashKey);
        let cacheData = this.FrameworkCache.GetCache(input);
        if (!cacheData) {
            throw new Error("注册中心没有该接口的实现");
        }
        return <TIService>cacheData;
    }
}