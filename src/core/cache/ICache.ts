
// import { CacheSourceEnum } from './enums/CacheSourceEnum';
import { AddCacheDto } from './dtos/AddCacheDto';
import { UpdateCacheDto } from './dtos/UpdateCacheDto';
import { GetCacheInput } from './dtos/GetCacheInput';

export interface ICache {
    /**
     * 添加缓存
     */
    AddCache(data: AddCacheDto): boolean;

    /**
     * 修改缓存
     * @param data 新数据
     */
    UpdateCache(data: UpdateCacheDto): boolean;

    /**
     * 获取同步缓存
     * @param input 
     */
    GetCache(input: GetCacheInput): any;

    /**
     * 获取异步缓存
     * @param input 
     */
    GetCacheAsync(input: GetCacheInput): Promise<any>;

    /**
     * 删除缓存
     * @param key  缓存Key
     */
    RemoveCache(key: string): boolean;
}