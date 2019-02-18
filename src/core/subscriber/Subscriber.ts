import { ConfigCenter } from '../config/ConfigCenter';
import { IProductService } from '../../application/products/IProductService';
import { ApplicationServiceFactory } from '../../application/ApplicationServiceFactory';
import { GetCacheInput } from '../cache/dtos/GetCacheInput';

export class Subscriber {
    private static _instance: Subscriber;

    private readonly _baseSubUrl: string; //订阅管道
    private readonly _configCenter: ConfigCenter;

    private readonly _productService: IProductService;

    private constructor() {
        this._configCenter = ConfigCenter.GetInstance();
        this._baseSubUrl = this._configCenter.GetGlobalUrl().PshubApi + "exchange?key=";

        this._productService = ApplicationServiceFactory.GetServiceInstance("IProductService");
    }


    private NchanSubscriber: any = (<any>window).NchanSubscriber; //全局引用上

    private productStatusChange_Timeout: any = null; //商品刷新的定时器

    /**
     * 获取缓存实例
     */
    public static GetInstance(): Subscriber {
        if (!this._instance)
            this._instance = new Subscriber();
        return this._instance;
    }

    private GetFullSubUrl(key: string): string {
        return this._baseSubUrl + key;
    }


    /**
     * 监听停售限售
     */
    SubProductStatusChange() {
        let that = this;

        let storeInfo = this._configCenter.GetStoreInfo();
        let brandInfo = this._configCenter.GetBrandInfo();

        let subKey = "RefreshFood_" + brandInfo.brandId + "_" + storeInfo.storeId;
        let url = this.GetFullSubUrl(subKey);


        console.log("开启连接!", url);
        let foodSub = new this.NchanSubscriber(url, { subscriber: 'websocket' });
        foodSub.on('message', function (data: any) {
            console.log("监听到餐品状态刷新,刷新菜单", data);
            //强制刷新缓存

            //清除之前的定时器(怕他搞事情)
            if (that.productStatusChange_Timeout)
                clearTimeout(that.productStatusChange_Timeout);

            that.productStatusChange_Timeout = setTimeout(() => {
                that._productService.GetStoreProducts({ dataType: 0, refresh: true }).then((res: any) => {
                    console.log(res);
                    console.log(that._configCenter.GetCacheInstance().GetCache(new GetCacheInput("CanSaleProducts")).map["7a8eb2421ef542938b575da08a88097f"]);
                    console.log(res["7a8eb2421ef542938b575da08a88097f"]);
                });
                console.log("定时关闭");
                clearTimeout(that.productStatusChange_Timeout);
            }, 5000);

        });
        foodSub.on('connect', function (connect: any) {
            console.log('连接成功...', connect);
        })
        foodSub.on('error', function (error_code: any, error_description: any) {
            console.log("连接出错..", error_code, error_description);
        });

        foodSub.start();
    }


}