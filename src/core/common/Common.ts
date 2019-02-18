import { Md5 } from "./encrypt/Md5";

export class Common {
    /**
     * 获取Guid
     */
    static GetGuid(): string {
        let s: any = [];
        let hexDigits = "0123456789abcdef";

        for (let index = 0; index < 36; index++) {
            s[index] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    }

    /**
     * 获取UUID
     */
    static GetUuid(): string {
        let guid = this.GetGuid();
        return guid.replace(new RegExp("-", "gm"), "");
    }



    /**
     * Md5加密
     * @param str 加密字符
     */
    static Md5Encrypt(str: string): string {
        return Md5.hashStr(str) as string;
    }


    /**
     * 数组分组
     * @param array 原数组
     * @param key 分组Key
     * @param type 分组后数据类型 0 Map , 1 List
     */
    static GroupBy(array: any[], key: string, type?: number): any {
        let groups: { [key: string]: any } = {};
        array.forEach(function (o) {
            let group = null;
            if (key.indexOf('.')) {
                let keys = key.split('.');
                let data = o;
                keys.forEach(element => {
                    data = data[element];
                });
                group = data;
            }
            else {
                group = o[key];
            }

            if (group) {
                if (typeof group == "string" || typeof group == "number") {
                    groups[group] = groups[group] || [];
                    groups[group].push(o);
                }
                else
                    throw new Error("分组Key不是String | Number 格式!")
            }
        });

        if (type) {
            return Object.keys(groups).map(function (group) {
                return groups[group];
            });
        }
        return groups;
    }

    static Distinct(array: any[], key?: string): any[] {
        let temp = [];
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            if (index == 0)
                temp.push(element);
            else {
                let hasThis;
                if (key)
                    hasThis = temp.filter((p: any) => p[key] == element[key])[0];
                else
                    hasThis = temp.filter((p: any) => p == element)[0];
                if (!hasThis) {
                    temp.push(element);
                }
            }
        }
        return temp;
    }

    /**
     * 数组 Sum 聚合
     * @param array 数组
     * @param key key
     */
    static Sum(array: any[], key?: string): number {
        let sum = 0;
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            let val = key ? element[key] : element;
            if (typeof val == "string")
                sum += Number(val);
            else if (typeof val == "number")
                sum += val;
            else
                throw new Error("请聚合[Number]类型");
        }
        return +sum.toFixed(2);
    }

    /**
     * 数组排序
     * @param array 数组
     * @param key 排序字段 (这个字段目前只能是[number]类型)
     */
    static Sort(array: any[], key: string): any[] {
        //老项目拿过来的。
        function sortCompare(propName: string) {
            return function (object1: any, object2: any) {
                var value1 = object1[propName];
                var value2 = object2[propName];

                if (value2 < value1) {
                    return 1;
                } else if (value2 > value1) {
                    return - 1;
                } else {
                    return 0;
                }
            }
        }
        return array.sort(sortCompare(key));
    }





    /**
     * 深拷贝
     * @param source  源数据
     */
    static Clone(source: Object | Array<any>): Object | Array<any> {
        if (Array.isArray(source)) {
            return [...source];
        }
        else {

            let sourceJson = JSON.stringify(source);
            if (sourceJson.length > 100000) {
                console.warn("对象有点大，深拷贝可能会影响性能!");
            }
            else if (sourceJson.length > 1000000) {
                throw new Error("对象太大，在安卓中会造成线程卡死的情况,所以不准深拷贝,请瘦身后再试!");
            }
            let prop = Object.getPrototypeOf(source);
            let cloneObj = JSON.parse(sourceJson);
            return Object.assign(Object.create(prop), cloneObj);
        }
    }
}