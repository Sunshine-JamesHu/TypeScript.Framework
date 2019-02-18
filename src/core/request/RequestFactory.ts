
import { IRequest } from "./IRequest";
import { ConfigCenter } from "../config/ConfigCenter";

/**
 * Request的辅助功能
 */
abstract class BaseRequest {
    protected ConfigCenter: ConfigCenter;
    constructor() {
        this.ConfigCenter = ConfigCenter.GetInstance();
    }

    protected SetDefaultParms(filter: any): any {
        let storeInfo = this.ConfigCenter.GetStoreInfo();
        let brandInfo = this.ConfigCenter.GetBrandInfo();
        let sysInfo = this.ConfigCenter.GetSysInfo();
        if (filter && typeof filter === "object") {
            for (const key in filter) {
                if (filter.hasOwnProperty(key)) {
                    if (filter[key] && typeof filter[key] === "object") {

                        if (key === "brandId" || key === "brand_id" || key === "BrandId") {
                            if (Object.prototype.toString.call(filter[key]) === '[object Array]') {
                                for (let index = 0; index < filter[key].length; index++) {
                                    const element = filter[key][index];
                                    if (element === '#')
                                        filter[key][index] = brandInfo.brandId + "";
                                }
                            }
                        }
                        else if (key === "storeId" || key === "store_id" || key === "StoreId") {
                            if (Object.prototype.toString.call(filter[key]) === '[object Array]') {
                                for (let index = 0; index < filter[key].length; index++) {
                                    const element = filter[key][index];
                                    if (element === '#')
                                        filter[key][index] = storeInfo.storeId + "";
                                }
                            }
                        }
                        else if (key === "token" || key === "Token") {
                            if (Object.prototype.toString.call(filter[key]) === '[object Array]') {
                                for (let index = 0; index < filter[key].length; index++) {
                                    const element = filter[key][index];
                                    if (element === '#')
                                        filter[key][index] = sysInfo.token.token;
                                }
                            }
                        }
                        else
                            this.SetDefaultParms(filter[key]);
                    }
                    else {
                        //给品牌Id赋值
                        if ((key === "brandId" || key === "brand_id" || key === "BrandId") && filter[key] === '#') {
                            filter[key] = brandInfo.brandId + '';
                        }
                        //给门店Id赋值
                        else if ((key === "storeId" || key === "store_id" || key === "StoreId") && filter[key] === '#') {
                            filter[key] = storeInfo.storeId + '';
                        }
                        //给门店Id赋值
                        else if ((key === "token" || key === "Token") && filter[key] === '#') {
                            filter[key] = sysInfo.token.token;
                        }
                    }
                }
            }
        }
        return filter;
    }

}

/**
 * Axios实现
 */
export class AxiosRequest extends BaseRequest implements IRequest {
    private readonly _axios: any;

    /**
     * 构造函数
     */
    constructor(axios: any) {
        super();

        this._axios = axios;

        this.InitInterceptors();
    }

    /**
     * 初始化拦截器
     */
    private InitInterceptors() {
        //请求拦截器
        this._axios.interceptors.request.use(function (config: any) {
            return config;
        }, function (error: any) {
            return Promise.reject(error);
        });

        //响应拦截器
        this._axios.interceptors.response.use(function (response: any) {

            return response;
        }, function (error: any) {
            let response = error.response;
            if (response.status == 401) {
                alert("权限受限,试试刷新!");
            }
            return Promise.resolve(error);
        });
    }

    private GetAuth(): string | null {
        let sysInfo = this.ConfigCenter.GetSysInfo()
        if (sysInfo && sysInfo.token && sysInfo.token.token) {
            return sysInfo.token.token;
        }
        return null;
    }

    Request(method: string, url: string, data?: any): Promise<any> {
        let options: any = { method: method, url: url };

        let token = this.GetAuth();
        if (token && token != "") {
            let needToken = true;
            if (url.indexOf("http://ssoapi.xxxx.cn:10403/api/genToken") > -1) {
                needToken = false;
            }
            if (needToken) {
                options.headers = {
                    'token': token,
                    'Content-Type': "application/json; charset=utf-8"
                };
            }
        }

        //带参Get单独处理
        if (method.toUpperCase() === "GET" && data)
            options.params = this.SetDefaultParms(data);
        else
            options.data = this.SetDefaultParms(data);

        return this._axios(options).then((res: any) => {
            // console.log("----- Axios返回数据 -----", res);
            return Promise.resolve(res.data);
        }, (err: any) => {
            return Promise.reject(err);
        });
    }

    All(promise: ({}[] | Promise<{}[]>)[]): Promise<{}[][]> {
        return this._axios.all(promise);
    }
}

/**
 * XmlHttpRequest 实现
 */
export class XmlHttpRequest extends BaseRequest implements IRequest {
    Request(method: string, url: string, data?: any): Promise<any> {
        return Promise.resolve(null);
    }
    All(promise: ({}[] | Promise<{}[]>)[]): Promise<{}[][]> {
        throw new Error("没有实现!")
    }
}

/**
 * anglar 采用 httpClient实现
 */
export class HttpClientRequest extends BaseRequest implements IRequest {
    constructor(private httpClient: any) {
        super();
    }

    private GetAuth(): string | null {
        let sysInfo = this.ConfigCenter.GetSysInfo()
        if (sysInfo && sysInfo.token && sysInfo.token.token) {
            return sysInfo.token.token;
        }
        return null;
    }

    Request(method: string, url: string, data?: any): Promise<any> {
        let options: { [key: string]: any } = {
            responseType: "json"
        };
        let token = this.GetAuth();
        if (token && token != "") {
            let needToken = true;
            if (url.indexOf("http://ssoapi.xxx.cn:10403/api/genToken") > -1) {
                needToken = false;
            }
            if (needToken) {
                options.headers = {
                    'token': token,
                    'Content-Type': "application/json; charset=utf-8"
                };
            }
        }

        //带参Get单独处理
        if (method.toUpperCase() === "GET" && data) {
            let params = this.SetDefaultParms(data);
            let anglarParams: { [key: string]: string } = {};
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    const element = params[key];
                    anglarParams[key] = JSON.stringify(element);
                }
            }
            console.log(anglarParams);
            options.params = anglarParams;
        }
        else
            options.body = this.SetDefaultParms(data);

        return this.httpClient.request(method.toUpperCase(), url, options).toPromise();
    }

    All(promise: ({}[] | Promise<{}[]>)[]): Promise<{}[][]> {
        return Promise.all(promise);
    }
}



