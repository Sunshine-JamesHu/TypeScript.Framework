export class GetCacheInput {
    key: string;
    callBack?: Function;
    param: any;
    forceRefresh?: boolean;

    /**
     * 构造函数
     */
    constructor(key: string, callBack?: Function, param?: any, forceRefresh?: boolean) {
        this.key = key;
        this.callBack = callBack;
        this.param = param;
        this.forceRefresh = forceRefresh;
    }
}