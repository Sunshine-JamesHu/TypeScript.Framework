import { IApplicationService } from "../IApplicationService";

export interface IBrandService extends IApplicationService {
    /**
     * 获取商家列表
     */
    GetBrandStores(): Promise<{ brand: any, data: [] }>;

    /**
     * 获取商家会员等级
     */
    GetBrandGrades(): Promise<[]>;

    /**
     * 发送验证码
     * @param phone 手机号
     */
    SendMessage(phone: string, type?: string): Promise<any>
}