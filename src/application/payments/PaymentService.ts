import { BaseApplicationService } from "../BaseApplicationService";
import { IRepository } from "../../core/repository/IRepository";
import { RepositoryFactory } from "../../core/repository/RepositoryFactory";
import { IPaymentService } from "./IPaymentService";
import { OrderLog } from "../../core/entities/behaviorLogs/OrderLog";
import { VoucherPayment } from "../../core/entities/payments/VoucherPayment";
import { AddCacheDto } from "../../core/cache/dtos/AddCacheDto";
import { GetCacheInput } from "../../core/cache/dtos/GetCacheInput";
import { EsQuery } from "../../core/repository/dtos/EsQuery";


export class PaymentService extends BaseApplicationService implements IPaymentService {
    

    private readonly _voucherR: IRepository<VoucherPayment, string>;
    private readonly _storePayTypes = 'StorePayTypes';
    
    private GetFullUrl(url: string) {
        return this.GlobalUrl.CloudOrderApi + url;
    }
    private readonly _urls = {
        StorePaytypeList: 'PaymentTypes/getStorePaytypeList'
    };

    constructor() {
        super();
    
        this._voucherR = RepositoryFactory.GetRepositoryInstance(VoucherPayment);
        this.Cache.AddCache(new AddCacheDto(this._storePayTypes, null, 0));
    }

    GetImplementsService(): string {
        return "IPaymentService";
    }

    GetStorePaytypeList(): Promise<any> {
        let that = this;
        return this.Cache.GetCacheAsync(new GetCacheInput(this._storePayTypes, () => {
            let url = that.GetFullUrl(that._urls.StorePaytypeList);
            let reqData = {
                storeId: "#", brandId: "#" 
            };

           
            return that.Request.Request('POST', url, reqData).then( (res: any) => {
                if(res && res.result && res.result.data && res.result.data.length) {
                    return JSON.parse(res.result.data);
                }
                else
                    return null;
            })
            })).then((res:any)=>{
                let result = that.GetResult();
                if(res) {
                    result.success = true;
                    result.data = res;
                }
                else
                    result.message = '请求失败';
                return result;
            })
        
    }
    GetVouchers(): Promise<any> {
        let query = new EsQuery({
            Filter: {
                brandId: "#",
                storeId: "#"
            },
            Size: 500
        })
        return this._voucherR.GetAll(query).then((res: any) => {
            return res;
        });
        
    }

}