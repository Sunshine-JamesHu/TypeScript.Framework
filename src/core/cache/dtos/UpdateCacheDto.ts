
/**
 * 修改缓存Dto
 */
export class UpdateCacheDto {
    key: string;
    data: any;
    /**
     *
     */
    constructor(key: string, data: any) {
        this.key = key;
        this.data = data;
    }

}