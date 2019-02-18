import { ICache } from './ICache';
import { AddCacheDto } from './dtos/AddCacheDto';
import { UpdateCacheDto } from './dtos/UpdateCacheDto';
import { GetCacheInput } from './dtos/GetCacheInput';



/**
 * 缓存父类
 */
class BaseCache {
    protected Cache: any;

    /**
     * 构造函数
     */
    protected constructor() { this.Cache = {}; }

    /**
     * 检查这个缓存Key是否为空
     * @param key 缓存Key
     */
    protected CheckEmptyKey(key: string): boolean {
        if (key == '') return true;
        return false;
    }

    /**
     * 检查这个缓存Key是否存在
     * @param key 缓存Key
     */
    protected CheckCacheKey(key: string): boolean {
        if (this.Cache[key]) return true;
        else return false;
    }

    /**
     * 检查过期时间
     * @param key 
     * @param isFramework 
     */
    protected CheckDeadLine(key: string): boolean {
        let obj = this.Cache[key];
        let now = new Date().getTime();
        if (obj) {
            if (!obj.data)
                return true;
            else if (obj.timeSpan == 0)
                return false;
            else if (obj.deadline <= now)
                return true;
            else
                return false;
        }
        return false;
    }

}

/**
 * 缓存对象
 */
class CacheInstance {
    timeSpan: number = 1000 * 60 * 30;
    deadline: number;
    data: any;
    key: string;

    /**
     * 构造函数
     */
    constructor(key: string, data: any, timeSpan?: number) {
        this.key = key;
        this.data = data;

        if (timeSpan || timeSpan == 0) {
            this.timeSpan = timeSpan;
        }
        let now = new Date().getTime();
        this.deadline = now + this.timeSpan;
    }
}

/**
 * 框架缓存 -（这个玩意是框架专用的，请不要乱动）
 */
export class FrameworkCache extends BaseCache implements ICache {
    private static _cacheInstance: ICache;

    /**
     * 获取缓存实例
     */
    static GetCacheInstance(): ICache {
        if (!this._cacheInstance)
            this._cacheInstance = new FrameworkCache();
        return this._cacheInstance;
    }

    /**
     * 构造函数
     */
    private constructor() { super(); }

    /**
     * 添加缓存
     */
    AddCache(data: AddCacheDto): boolean {
        if (this.CheckEmptyKey(data.key) && this.CheckCacheKey(data.key)) {
            console.error("该缓存Key已存在，请使用唯一缓存Key!");
            return false;
        }
        let obj = new CacheInstance(data.key, data.data, data.timeSpan);
        this.Cache[data.key] = obj;
        return true;
    }

    /**
     * 修改缓存
     * @param data 新数据
     */
    UpdateCache(data: UpdateCacheDto): boolean {
        if (this.CheckEmptyKey(data.key)) {
            console.error("Key为空,请检查!");
            return false;
        }

        if (!this.CheckCacheKey(data.key)) {
            console.error("不存在该缓存Key，请确认Key值正确");
            return false;
        }
        let obj = this.Cache[data.key];
        if (obj) {
            this.Cache[data.key].data = data.data;
            let now = new Date().getTime();
            this.Cache[data.key].deadline = now + obj.timeSpan;
        }
        else
            return false;

        return true;
    }

    /**
     * 获取同步缓存
     * @param input 
     */
    GetCache(input: GetCacheInput): any {
        if (this.CheckEmptyKey(input.key)) {
            console.error("缓存Key为空")
            return null;
        }

        if (!this.CheckCacheKey(input.key)) {
            let addCacheDto = new AddCacheDto(input.key, null);
            this.AddCache(addCacheDto);
        }

        let cacheData = this.Cache[input.key].data;
        if (this.CheckDeadLine(input.key)) {
            if (input.callBack) {
                return input.callBack(input.param).then((res: any) => {
                    let updateDto = new UpdateCacheDto(input.key, res);
                    this.UpdateCache(updateDto);
                    return res;
                });
            }
            // TODO:"返回一个Null"
            // console.warn("缓存已经过期,但是没有回调函数，返回上一次的缓存。", key);
            return null;
        }
        return cacheData;
    }

    /**
     * 获取异步缓存
     * @param input 
     */
    GetCacheAsync(input: GetCacheInput): Promise<any> {
        if (this.CheckEmptyKey(input.key)) {
            console.error("缓存Key为空")
            return Promise.resolve(null);
        }

        if (!this.CheckCacheKey(input.key)) {
            let addCacheDto = new AddCacheDto(input.key, null);
            this.AddCache(addCacheDto);
        }

        let cacheData = this.Cache[input.key].data;
        if (this.CheckDeadLine(input.key)) {
            console.log("===  缓存过期  ===");
            if (input.callBack) {
                return input.callBack(input.param).then((res: any) => {
                    let updateDto = new UpdateCacheDto(input.key, res);
                    this.UpdateCache(updateDto);
                    return res;
                });
            }
            // TODO:"返回一个Null"
            // console.warn("缓存已经过期,但是没有回调函数，返回上一次的缓存。", key);
            return Promise.resolve(null);
        }
        console.log("===  缓存未过期  ===");
        // console.log("缓存数据----", key, cacheData.data);
        return Promise.resolve(cacheData);
    }

    /**
     * 删除缓存
     * @param key  缓存Key
     */
    RemoveCache(key: string): boolean {
        if (!this.CheckCacheKey(key)) {
            console.error("Key值不存在，请检查.");
            return false;
        }
        delete this.Cache[key];
        return true;
    }
}

/**
 * 内存缓存 - 这个地方是公共调用的
 */
export class MemoryCache extends BaseCache implements ICache {
    private static _cacheInstance: ICache;

    /**
     * 获取缓存实例
     */
    static GetCacheInstance(): ICache {
        if (!this._cacheInstance)
            this._cacheInstance = new MemoryCache();
        return this._cacheInstance;
    }

    /**
     * 构造函数
     */
    private constructor() { super(); }

    /**
     * 添加缓存
     */
    AddCache(data: AddCacheDto): boolean {
        if (this.CheckEmptyKey(data.key) && this.CheckCacheKey(data.key)) {
            console.error("该缓存Key已存在，请使用唯一缓存Key!");
            return false;
        }
        let obj = new CacheInstance(data.key, data.data, data.timeSpan);
        this.Cache[data.key] = obj;
        return true;
    }

    /**
     * 修改缓存
     * @param data 新数据
     */
    UpdateCache(data: UpdateCacheDto): boolean {
        if (this.CheckEmptyKey(data.key)) {
            console.error("Key为空,请检查!");
            return false;
        }

        if (!this.CheckCacheKey(data.key)) {
            console.error("不存在该缓存Key，请确认Key值正确");
            return false;
        }
        let obj = this.Cache[data.key];
        if (obj) {
            this.Cache[data.key].data = data.data;
            let now = new Date().getTime();
            this.Cache[data.key].deadline = now + obj.timeSpan;
        }
        else
            return false;

        return true;
    }

    /**
     * 获取同步缓存
     * @param input 
     */
    GetCache(input: GetCacheInput): any {
        if (this.CheckEmptyKey(input.key)) {
            console.error("缓存Key为空")
            return null;
        }

        if (!this.CheckCacheKey(input.key)) {
            let addCacheDto = new AddCacheDto(input.key, null);
            this.AddCache(addCacheDto);
        }

        let cacheData = this.Cache[input.key].data;
        if (input.forceRefresh || this.CheckDeadLine(input.key)) {
            if (input.callBack) {
                return input.callBack(input.param).then((res: any) => {
                    let updateDto = new UpdateCacheDto(input.key, res);
                    this.UpdateCache(updateDto);
                    return res;
                });
            }
            // TODO:"返回一个Null"
            // console.warn("缓存已经过期,但是没有回调函数，返回上一次的缓存。", key);
            return null;
        }
        // console.log("缓存数据----", key, cacheData.data);
        return cacheData;
    }

    /**
     * 获取异步缓存
     * @param input 
     */
    GetCacheAsync(input: GetCacheInput): Promise<any> {
        if (this.CheckEmptyKey(input.key)) {
            console.error("缓存Key为空")
            return Promise.resolve(null);
        }

        if (!this.CheckCacheKey(input.key)) {
            let addCacheDto = new AddCacheDto(input.key, null);
            this.AddCache(addCacheDto);
        }

        let cacheData = this.Cache[input.key].data;

        if (input.forceRefresh || this.CheckDeadLine(input.key)) {
            if (input.callBack) {
                return input.callBack(input.param).then((res: any) => {
                    let updateDto = new UpdateCacheDto(input.key, res);
                    this.UpdateCache(updateDto);
                    return res;
                });
            }
            // TODO:"返回一个Null"
            // console.warn("缓存已经过期,但是没有回调函数，返回上一次的缓存。", key);
            return Promise.resolve(null);
        }
        // console.log("缓存数据----", key, cacheData.data);
        return Promise.resolve(cacheData);
    }

    /**
     * 删除缓存
     * @param key  缓存Key
     */
    RemoveCache(key: string): boolean {
        if (!this.CheckCacheKey(key)) {
            console.error("Key值不存在，请检查.");
            return false;
        }
        delete this.Cache[key];
        return true;
    }
}

/**
 * VueX缓存实现
 */
export class VueXCache extends BaseCache implements ICache {
    constructor(vuex: any) {
        super();
        this.Cache = vuex;
        this.InitVuex();
    }

    private AddMutations(type: string, handler: Function) {
        let store: any = this.Cache;
        let entry = store._mutations[type] || (store._mutations[type] = []);
        entry.push(function wrappedMutationHandler(payload: any) {
            handler.call(store, store._modules.root.context.state, payload);
        });
    }

    private InitVuex() {
        if (!this.Cache._mutations.UpdateCache) {
            this.AddMutations("UpdateCache", function (state: any, data: any) {
                let obj = state[data.key];
                if (obj) {
                    let now = new Date().getTime();
                    obj.data = data.data;
                    obj.deadline = now + obj.timeSpan;
                }
            });
        }

        if (!this.Cache._mutations.RemoveCache) {
            this.AddMutations("RemoveCache", function (state: any, key: string) {
                state[key] = undefined;
            });
        }
    }

    AddCache(data: AddCacheDto): boolean {
        if (this.CheckEmptyKey(data.key) && this.CheckCacheKey(data.key)) {
            console.error("该缓存Key已存在，请使用唯一缓存Key!");
            return false;
        }
        let obj = new CacheInstance(data.key, data.data, data.timeSpan);
        this.Cache.state[data.key] = obj;
        return true;
    }

    UpdateCache(data: UpdateCacheDto): boolean {
        if (this.CheckEmptyKey(data.key)) {
            console.error("Key为空,请检查!");
            return false;
        }

        if (!this.CheckCacheKey(data.key)) {
            console.error("不存在该缓存Key，请确认Key值正确");
            return false;
        }

        this.Cache.commit("UpdateCache", data);
        return true;
    }

    GetCache(input: GetCacheInput) {
        if (this.CheckEmptyKey(input.key)) {
            console.error("缓存Key为空")
            return null;
        }

        if (!this.CheckCacheKey(input.key)) {
            let addCacheDto = new AddCacheDto(input.key, null);
            this.AddCache(addCacheDto);
        }


        let cacheData = this.Cache.state[input.key].data;
        if (this.CheckDeadLine(input.key)) {
            if (input.callBack) {
                let res = input.callBack(input.param);
                let updateDto = new UpdateCacheDto(input.key, res);
                this.UpdateCache(updateDto);
                return res;
            }
            // TODO:"返回一个Null"
            // console.warn("缓存已经过期,但是没有回调函数，返回上一次的缓存。", key);
            return null;
        }
        // console.log("缓存数据----", key, cacheData.data);
        return cacheData;
    }

    GetCacheAsync(input: GetCacheInput): Promise<any> {
        if (this.CheckEmptyKey(input.key)) {
            console.error("缓存Key为空")
            return Promise.resolve(null);
        }

        if (!this.CheckCacheKey(input.key)) {
            let addCacheDto = new AddCacheDto(input.key, null);
            this.AddCache(addCacheDto);
        }

        let cacheData = this.Cache.state[input.key].data;
        if (this.CheckDeadLine(input.key)) {
            if (input.callBack) {
                return input.callBack(input.param).then((res: any) => {
                    let updateDto = new UpdateCacheDto(input.key, res);
                    this.UpdateCache(updateDto);
                    return res;
                });
            }
            // TODO:"返回一个Null"
            // console.warn("缓存已经过期,但是没有回调函数，返回上一次的缓存。", key);
            return Promise.resolve(null);
        }
        // console.log("缓存数据----", key, cacheData.data);
        return Promise.resolve(cacheData);;
    }

    RemoveCache(key: string): boolean {
        if (!this.CheckCacheKey(key)) {
            console.error("Key值不存在，请检查.");
            return false;
        }
        this.Cache.commit("RemoveCache", key);
        return true;
    }

    protected CheckDeadLine(key: string): boolean {
        let obj = this.Cache.state[key];
        let now = new Date().getTime();
        if (obj) {
            if (!obj.data)
                return true;
            else if (obj.timeSpan == 0)
                return false;
            else if (obj.deadline <= now)
                return true;
            else
                return false;
        }
        return false;
    }

    protected CheckCacheKey(key: string): boolean {
        if (this.Cache.state[key]) return true;
        return false;
    }


}

//TODO:如果需要IndexDb的缓存,请实现ICache接口


