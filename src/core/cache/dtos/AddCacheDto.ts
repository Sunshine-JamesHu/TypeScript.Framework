
/**
 * 添加缓存Dto
 */
export class AddCacheDto {
    key: string;
    data: any;
    timeSpan?: number;

    /**
     *
     */
    constructor(key: string, data: any, timeSpan?: number) {
        this.key = key;
        this.data = data;
        this.timeSpan = timeSpan;
    }
}