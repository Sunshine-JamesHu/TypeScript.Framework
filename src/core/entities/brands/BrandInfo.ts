import { IBrand } from "../baseEntities/IBrand";

/**
 * 品牌信息
 */
export class BrandInfo implements IBrand {

    constructor(brandId?: number, brandName?: string, logo?: string) {
        this.brandId = brandId ? brandId : 0;
        this.brandName = brandName ? brandName : "";
        this.logo = logo;
    }

    /**
     * 品牌ID
     */
    brandId: number;

    /**
     * 品牌名称
     */
    brandName: string;

    /**
     * 品牌Logo
     */
    logo?: string;


    ImplementsIBrand() {
        return true;
    }
}