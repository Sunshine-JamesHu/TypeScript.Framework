import { BrandInfo } from "../entities/brands/BrandInfo";
import { StoreInfo } from "../entities/stores/StoreInfo";
import { AddCacheDto } from "../cache/dtos/AddCacheDto";
import { ICache } from "../cache/ICache";
import { GetCacheInput } from "../cache/dtos/GetCacheInput";
import { UpdateCacheDto } from "../cache/dtos/UpdateCacheDto";
import { FrameworkCache, MemoryCache } from "../cache/Cache";
import { IRequest } from "../request/IRequest";
import { SysInfo } from "../entities/systems/SysInfo";

export class ConfigCenter {
    private static _configCenter: ConfigCenter;


    private readonly _frameworkCache: ICache;
    private _cache: ICache;



    private readonly _brandCacheKey = "BrandInfo";
    private readonly _storeCacheKey = "StoreInfo";
    private readonly _sysMemberCacheKey = "SysMember";

    private readonly _requestInstanceCacheKey = "RequestInstance";
    private readonly _repositoryInstanceCacheKey = "R";
    private readonly _esClientCacheKey = "EsClient";
    private readonly _businessCacheKey = "BusinessCache";

    private readonly _channleInfoCacheKey = "ChannleInfo";



    private readonly _globalUrlCacheKey = "GlobalUrl";

    /**
     * 构造函数
     */
    private constructor() {
        this._frameworkCache = FrameworkCache.GetCacheInstance();
        this._cache = this.GetCacheInstance();
    }

    /**
     * 获取缓存实例
     */
    static GetInstance(): ConfigCenter {
        if (!this._configCenter)
            this._configCenter = new ConfigCenter();
        return this._configCenter;
    }

    /**
     * 设置门店信息
     * @param brandInfo 品牌信息
     */
    SetBrandInfo(brandInfo: BrandInfo): boolean {
        let obj = new AddCacheDto(this._brandCacheKey, brandInfo, 0);
        this._cache.AddCache(obj);
        this._frameworkCache.AddCache(obj);
        return true;
    }
    GetBrandInfo(): BrandInfo {
        let input = new GetCacheInput(this._brandCacheKey);
        return this._frameworkCache.GetCache(input);
    }
    UpdateBrandInfo(brandInfo: BrandInfo): boolean {
        let obj = new UpdateCacheDto(this._brandCacheKey, brandInfo);
        this._cache.UpdateCache(obj);
        this._frameworkCache.UpdateCache(obj);
        return true;
    }



    /**
     * 设置门店信息
     * @param storeInfo 门店信息
     */
    SetStoreInfo(storeInfo: StoreInfo): boolean {
        let obj = new AddCacheDto(this._storeCacheKey, storeInfo, 0);
        this._frameworkCache.AddCache(obj);

        if (this._cache) {
            this._cache.AddCache(obj);
        }

        return true;
    }
    GetStoreInfo(): StoreInfo {
        let input = new GetCacheInput(this._storeCacheKey);
        return this._frameworkCache.GetCache(input);
    }
    UpdateStoreInfo(storeInfo: StoreInfo): boolean {
        let obj = new UpdateCacheDto(this._storeCacheKey, storeInfo);
        this._frameworkCache.UpdateCache(obj);
        if (this._cache) {
            this._cache.UpdateCache(obj);
        }

        return true;
    }


    /**
     * 设置门店信息
     * @param brandInfo 品牌信息
     */
    SetSysInfo(sysInfo: SysInfo): boolean {
        let timeSpan = 1000 * 60 * 60 * 2; //两个小时失效
        let obj = new AddCacheDto(this._sysMemberCacheKey, sysInfo, timeSpan);
        this._frameworkCache.AddCache(obj);
        if (this._cache) {
            this._cache.AddCache(obj);
        }
        return true;
    }
    GetSysInfo(): SysInfo {
        let input = new GetCacheInput(this._sysMemberCacheKey);
        return this._frameworkCache.GetCache(input);
    }
    UpdateSysInfo(sysInfo: SysInfo): boolean {
        let obj = new UpdateCacheDto(this._sysMemberCacheKey, sysInfo);
        this._frameworkCache.UpdateCache(obj);
        if (this._cache) {
            this._cache.UpdateCache(obj);
        }
        return true;
    }


    SetGlobalUrl(globalUrlInfo: GlobalUrlInfo): boolean {
        let obj = new AddCacheDto(this._globalUrlCacheKey, globalUrlInfo, 0);
        this._frameworkCache.AddCache(obj);
        return true;
    }
    GetGlobalUrl(): GlobalUrlInfo {
        let input = new GetCacheInput(this._globalUrlCacheKey);
        return this._frameworkCache.GetCache(input);
    }

    SetRequestInstance(request: IRequest): boolean {
        let obj = new AddCacheDto(this._requestInstanceCacheKey, request, 0);
        this._frameworkCache.AddCache(obj);
        return true;
    }
    GetRequestInstance(): IRequest {
        let input = new GetCacheInput(this._requestInstanceCacheKey);
        return this._frameworkCache.GetCache(input);
    }

    /**
     * 获取仓储实例
     * @param key index_type 这样的格式
     */
    GetRepositoryInstance(key: string) {
        let cashKey = this._repositoryInstanceCacheKey + "_" + key;
        let input = new GetCacheInput(cashKey);
        return this._frameworkCache.GetCache(input);
    }

    /**
     * 设置EsClient
     * @param esClient 
     */
    SetEsClientInstance(esClient: any) {
        let obj = new AddCacheDto(this._esClientCacheKey, esClient, 0);
        this._frameworkCache.AddCache(obj);
        return true;
    }

    /**
     * 获取EsClient
     * @param esClient 
     */
    GetEsClientInstance() {
        let input = new GetCacheInput(this._esClientCacheKey);
        return this._frameworkCache.GetCache(input);
    }

    SetCacheInstance(cacheInstance: ICache): boolean {
        //更新配置中心的缓存
        this._cache = cacheInstance;

        let obj = new AddCacheDto(this._businessCacheKey, cacheInstance, 0);
        this._frameworkCache.AddCache(obj);
        return true;
    }
    /**
     * 获取缓存实例
     */
    GetCacheInstance(): ICache {
        let input = new GetCacheInput(this._businessCacheKey);
        return this._frameworkCache.GetCache(input);
    }


    //框架使用者
    SetChannleInfo(channleInfo: { name: string, type: string }) {
        let obj = new AddCacheDto(this._channleInfoCacheKey, channleInfo, 0);
        this._frameworkCache.AddCache(obj);
        if (this._cache) {
            this._cache.AddCache(obj);
        }
        return true;
    }
    GetChannleInfo(): { name: string, type: string } {
        let input = new GetCacheInput(this._channleInfoCacheKey);
        return this._frameworkCache.GetCache(input);
    }

}

export class GlobalUrlInfo {

    /**
     * 构造函数
     */
    constructor(info: { EsProxyUrl: string, CloudStoreApi: string, CloudOrderApi: string, SsoApi: string, PshubApi: string }) {
        this.EsProxyUrl = info.EsProxyUrl;
        this.CloudStoreApi = info.CloudStoreApi;
        this.CloudOrderApi = info.CloudOrderApi;
        this.SsoApi = info.SsoApi;
        this.PshubApi = info.PshubApi;
    }

    public EsProxyUrl: string;
    public CloudStoreApi: string;
    public CloudOrderApi: string;
    public SsoApi: string;
    public PshubApi: string;

}
