
import { BaseApplicationService } from "../BaseApplicationService";
import { IBrandService } from "./IBrandService";

export class BrandService extends BaseApplicationService implements IBrandService {

    private readonly _urls = {
        StoreList: 'IBrands/storeList',
        BrandGrades: 'IMemberGrades/getMemberGradeInfo',
        SendMsg: "VerificationCodes/send"
    };

    private GetFullUrl(url: string) {
        return this.GlobalUrl.CloudStoreApi + url;
    }


    public GetBrandStores(): Promise<{ brand: any, data: [] }> {
        let url = this.GetFullUrl(this._urls.StoreList);

        return this.Request.Request("POST", url, {
            p: {
                brandId: this.GetBrandInfo().brandId
            }
        }).then((res: any) => {
            return res;
        });
    }

    public GetBrandGrades(): Promise<[]> {
        let url = this.GetFullUrl(this._urls.BrandGrades);

        return this.Request.Request("POST", url, {
            brandId: this.GetBrandInfo().brandId
        }).then((res: any) => {
            return res
        });
    }

    public SendMessage(phone: string, type?: string): Promise<any> {
        let result = { success: false, message: "", data: null };

        if (!phone || phone.length != 11) {
            console.warn("手机号格式错误!");
            result.message = "手机号格式错误";
            return Promise.resolve(result);
        }

        let url = this.GetFullUrl(this._urls.SendMsg);

        let reqData = {
            allowtrycount: 3,
            mobile: phone,
            type: type ? type : "mobilecode"
        };
        return this.Request.Request("POST", url, reqData).then((res: any) => {
            console.log(res);
            if (res && res.result && res.result.message == "") {
                result.success = true;
                result.data = res.result.data;
            }
            else
                result.message = res.result.message;

            return result;
        });
    }


    GetImplementsService(): string {
        return "IBrandService";
    }

}
