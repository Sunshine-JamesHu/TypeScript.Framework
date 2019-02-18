import { BaseEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

// globalbase

export class StoreInfo extends BaseEntity<string> implements IStore {
    constructor(storeId?: any, storeName?: any) {
        super();

        this.storeId = storeId;
        this.id = storeId;
        this.storeName = storeName;
        this.tableCount = 0;
    }

    //这里的字段名称有点难受 
    //所以 这里查询的时候我自己写了 Source


    storeId?: number;
    storeName?: string;

    //品牌名称
    brandName?: string;

    //付费模式  先付费 后付费
    payMode?: number;
    payModeName?: string;

    //抹零规则
    molingGlobal?: number;
    molingRules?: number;
    molingRuleName?: string;


    tableCount: number;

    // name: string;
    // storeName: string;

    // tel: string;
    // mobile: string;
    // address: string;
    // city_code: string;

    // opening_time: number;
    // opening_status: number;
    // closing_time: number;

    // pay_mode_name: string;
    // pay_mode: number;


    // maling_global: number;
    // maling_rules: number;
    // maling_rules_name: number;

    // brand_id: string;
    // brand_name: string;



    // type: "store"
    // store_id: 330881
    // id: 330881
    // brand_id: "100224"
    // name: "测试数据门店"
    // tel: "13524542656"
    // mobile: null
    // address: "嘉定北-地铁站"
    // city_code: "上海市"
    // region: "021"
    // discount: null
    // kitchen_program: "1"
    // kitchen_program_name: "打印机"
    // open_supply_chain: 0
    // open_mobile_ordering: 1
    // auto_receive: 1
    // open_reservation: 1
    // pay_mode: 1
    // pay_mode_name: "后付费"
    // dining_mode: 2
    // dining_mode_name: "送餐制"
    // table_num: null
    // opening_time: 1511452800000
    // opening_status: 1
    // closing_time: 1514989829390
    // lbs_lng: "121.2374848057769"
    // lbs_lat: "31.391551182452094"
    // maling_global: 1
    // maling_rules: 0
    // maling_rules_name: "不抹零"
    // is_show_selling_time: 0
    // show_mode: 1
    // show_mode_name: "瀑布流模式"
    // memo: null
    // status: 1
    // created: 1511522798977
    // modified: 1540361599352
    // tablecount: 20
    // order_mode: 2
    // brand_name: "上海壹向火锅测试"

    // open_take_away: 0
    // is_location: 0
    // step: 100
    // open_wechat: 100



    ImplementsIStore(): boolean {
        return true;
    }

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "StoreInfo",
            Index: "globalbase",
            Type: "store"
        }
    }
}