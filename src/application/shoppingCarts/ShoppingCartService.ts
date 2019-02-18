import { BaseApplicationService } from "../BaseApplicationService";
import { IShoppingCartService } from "./IShoppingCartService";
import { ProductDto } from "./dtos/ProductDto";
import { ShoppingCartDto } from "./dtos/ShoppingCartDto";
import { GetCacheInput } from "../../core/cache/dtos/GetCacheInput";
import { AddCacheDto } from "../../core/cache/dtos/AddCacheDto";
import { Common } from "../../core/common/Common";

export class ShoppingCartService extends BaseApplicationService implements IShoppingCartService {
    private readonly _shoppingCartCacheKey = "ShoppingCart";
    constructor() {
        super();
    }

    private GetShoppingCartCache(): ShoppingCartDto {
        return this.Cache.GetCache(new GetCacheInput(this._shoppingCartCacheKey));
    }

    /**
     * 初始化购物车
     */
    InitShoppingCart(data: {
        person: number,
        deskId: string,
        deskName?: string,
        memberId?: number,
        orderId?: string,
        areaName?: string,
        eatType?: string
    }): boolean {
        //初始化购物车 (这玩意不要用来清空购物车)
        let shoppingCart = this.GetShoppingCartCache();
        if (!shoppingCart) {
            let shopCart = new ShoppingCartDto({
                deskId: data.deskId,
                deskName: data.deskName,
                memberId: data.memberId,
                person: data.person,
                orderId: data.orderId,
                areaName: data.areaName,
                eatType: data.eatType
            });
            this.Cache.AddCache(new AddCacheDto(this._shoppingCartCacheKey, shopCart, 0));
        }
        else {
            let shopCart = new ShoppingCartDto({
                deskId: data.deskId,
                deskName: data.deskName,
                memberId: data.memberId,
                person: data.person,
                orderId: data.orderId,
                areaName: data.areaName,
                eatType: data.eatType
            });
            this.Cache.UpdateCache({ key: this._shoppingCartCacheKey, data: shopCart });
        }

        return true;
    }

    AddProduct(product: ProductDto): boolean {
        //TODO:这里没执行记录的  在Vuex的严格模式下貌似执行不通过的，希望大佬改进
        let shoppingCart: any = this.GetShoppingCartCache();
        if (shoppingCart) {
            let oldPros = shoppingCart.products.filter((p: ProductDto) => p.id == product.id && p.scaleId == product.scaleId);
            if (oldPros && oldPros.length > 0) {
                let matchComponents = false;
                for (let index = 0; index < oldPros.length; index++) {
                    const oldPro = oldPros[index];
                    if (product.components) {
                        let newCompKey = "";
                        for (let index = 0; index < product.components.length; index++) {
                            const newProComp = product.components[index];
                            newCompKey += "C" + newProComp.id;
                            for (let index = 0; index < newProComp.items.length; index++) {
                                const newProCompItem = newProComp.items[index];
                                newCompKey += ("_I" + newProCompItem.id + "_C" + newProCompItem.count);
                            }

                        }
                        let oldCompKey = "";
                        for (let index = 0; index < oldPro.components.length; index++) {
                            const oldProComp = oldPro.components[index];
                            oldCompKey += "C" + oldProComp.id;
                            for (let index = 0; index < oldProComp.items.length; index++) {
                                const oldProCompItem = oldProComp.items[index];
                                oldCompKey += ("_I" + oldProCompItem.id + "_C" + oldProCompItem.count);
                            }
                        }

                        console.log("Old", oldCompKey);
                        console.log("New", newCompKey);

                        if (newCompKey == oldCompKey)
                            matchComponents = true;
                    }
                    else {
                        oldPro.count += product.count;
                        matchComponents = true;
                        break;
                    }

                    if (matchComponents) {
                        oldPro.count += product.count;
                        matchComponents = true;
                        break;
                    }
                }
                if (!matchComponents)
                    shoppingCart.products.push(product);
            }
            else
                shoppingCart.products.push(product);


            if (product.price)
                this.CtorTotalPrice();

            return true;
        }
        console.error("购物车未定义,请先【InitShoppingCart】!");
        return false;
    }

    DelProduct(product: ProductDto): boolean {
        let shoppingCart: any = this.GetShoppingCartCache();
        if (shoppingCart) {

            let delIndex = -1;
            for (let index = 0; index < shoppingCart.products.length; index++) {
                const element = shoppingCart.products[index];
                if (element.id === product.id && element.scaleId === product.scaleId) {

                    let matchComponents = false;
                    if (product.components) {
                        let newCompKey = "";
                        for (let index = 0; index < product.components.length; index++) {
                            const newProComp = product.components[index];
                            newCompKey += "C" + newProComp.id;
                            for (let index = 0; index < newProComp.items.length; index++) {
                                const newProCompItem = newProComp.items[index];
                                newCompKey += ("_I" + newProCompItem.id + "_C" + newProCompItem.count);
                            }

                        }
                        let oldCompKey = "";
                        for (let index = 0; index < element.components.length; index++) {
                            const oldProComp = element.components[index];
                            oldCompKey += "C" + oldProComp.id;
                            for (let index = 0; index < oldProComp.items.length; index++) {
                                const oldProCompItem = oldProComp.items[index];
                                oldCompKey += ("_I" + oldProCompItem.id + "_C" + oldProCompItem.count);
                            }
                        }

                        if (newCompKey == oldCompKey)
                            matchComponents = true;
                    }
                    else {
                        delIndex = index;
                        break;
                    }
                    if (matchComponents) {
                        delIndex = index;
                        break;
                    }
                }
            }
            if (delIndex > -1) {
                let oldProduct = shoppingCart.products[delIndex];
                if (product.count >= oldProduct.count) {
                    shoppingCart.products.splice(delIndex, 1);
                }
                else
                    shoppingCart.products[delIndex].count -= product.count;

                if (product.price && product.count && product.count > 0)
                    this.CtorTotalPrice();

                return true;
            }
            console.warn("你个宝批龙,找不到这个餐品，删你个仙人板板啊!");
            return false;
        }
        console.error("购物车未定义,请先【InitShoppingCart】!");
        return false;
    }

    ClearShoppingCart(): boolean {
        let shopCart = this.GetShoppingCartCache();
        shopCart.products = [];
        shopCart.totalPrice = 0;

        return true;
    }

    RemoveShoppingCart(): boolean {
        return this.Cache.RemoveCache(this._shoppingCartCacheKey);
    }

    GetShoppingCartInfo(): ShoppingCartDto {
        return this.GetShoppingCartCache();
    }

    GetSaveOrderData(): any {
        let storeInfo = this.ConfigCenter.GetStoreInfo();
        let shopCart: any = this.GetShoppingCartCache();
        let data: { info?: any, products: any[], payMode: string, optype?: any, deskType?: string };
        data = { info: {}, products: [], optype: null, payMode: "post-pay", deskType: "桌号" };

        if (shopCart.orderId) {
            data.info.ordersId = shopCart.orderId;

            data.info.deskId = shopCart.deskId;
            data.info.deskName = shopCart.deskName;
            data.info.eatType = shopCart.eatType;

            data.optype = 'update'; //设置为加菜
        }
        else {
            data.info = {
                deskId: shopCart.deskId,
                deskName: shopCart.deskName,
                eatType: shopCart.eatType,
                memberId: shopCart.memberId,
                person: shopCart.person
            }
        }

        // 先付费 后付费
        if (storeInfo.payMode && storeInfo.payMode == 0)
            data.payMode = "pay-first";



        data.products = this.CtorSubProducts(shopCart.products);

        //单独构建自选套餐的数据结构 (就是这么的恶心)
        if (data.products && data.products.length > 0) {
            data.products.forEach(element => {
                if (element && element.type == "zixuan") {
                    let zixuanPros = Common.GroupBy(element.products as [], "groupId", 1);
                    let newPros: { id: string | number, products: [] }[] = [];
                    for (let index = 0; index < zixuanPros.length; index++) {
                        const zixuanProList = zixuanPros[index];
                        newPros.push({
                            id: index,
                            products: zixuanProList
                        });
                    }
                    element.products = newPros;
                }
            });
        }

        console.log("下单数据", data);
        return data;
    }

    private CtorSubProducts(products: any[]) {
        let data: any[] = [];
        products.forEach((element: any) => {
            if (element) {
                let product: {
                    id: string,
                    scaleId: string,
                    name?: string,
                    cnt?: number,
                    c?: number,
                    type: string,
                    components: { id: string, items: { id: string, c: number }[] }[],
                    exinfo?: any;
                    products?: any,
                    scaleName?: string,
                    groupId?: number | string,
                    groupName?: string,
                    kitchen: any,
                    weight?: number
                }
                //两个 cnt 和 c 全部构建上  (自选用的c  其他的用的cnt)
                product = { id: element.id, scaleId: element.scaleId, name: element.name, cnt: element.count, c: element.count, components: [], type: element.type, kitchen: element.kitchen };

                if (element.exinfo)
                    product.exinfo = element.exinfo;

                if (element.scaleName)
                    product.scaleName = element.scaleName;

                if (element.groupId || element.groupId == 0)
                    product.groupId = element.groupId;

                if (element.groupName)
                    product.groupName = element.groupName;

                if (element.weight) {
                    product.weight = element.weight;
                }



                if (element.components && element.components.length > 0) {
                    element.components.forEach((item: any) => {
                        if (item) {
                            let component: { id: string, items: { id: string, price?: number, c: number, name: string }[] } = { id: item.id, items: [] };
                            item.items.forEach((childItem: any) => {
                                if (childItem) {
                                    component.items.push({
                                        id: childItem.id,
                                        name: childItem.name,
                                        price: childItem.price ? childItem.price.toFixed(2) : null,
                                        c: childItem.count
                                    });
                                }
                            });
                            product.components.push(component);
                        }
                    });
                }

                if (element.products && element.products.length > 0) {
                    product.products = this.CtorSubProducts(element.products);
                }

                data.push(product);
            }
        });
        return data;
    }

    //计算购物车总价格
    private CtorTotalPrice() {
        let shoppingCart: ShoppingCartDto = this.GetShoppingCartCache();
        if (shoppingCart && shoppingCart.products) {
            let totalPrice = 0;
            shoppingCart.products.forEach((element: any) => {
                // 张青修改了一波 称斤商品的计算
                if (element.price && element.price > 0 && element.count > 0) {
                    if (element.weight)
                        totalPrice += ((element.price / 2) * element.count);
                    else
                        totalPrice += (element.price * element.count);
                }
                if (element.components && element.components.length > 0) {
                    element.components.forEach((comp: any) => {
                        if (comp.items && comp.items.length > 0) {
                            comp.items.forEach((item: any) => {
                                if (item.count > 0 && item.price > 0) {
                                    totalPrice += (item.price * item.count);
                                }
                            });
                        }
                    });
                }
            });
            shoppingCart.totalPrice = +totalPrice.toFixed(2);
        }
    }

    UpdateShopCartInfo(infos: { key: string; val: any; }[]) {
        let shopCart: any = this.GetShoppingCartCache();
        infos.forEach(element => {
            shopCart[element.key] = element.val;
        });
    }

    GetImplementsService(): string {
        return "IShoppingCartService";
    }

}