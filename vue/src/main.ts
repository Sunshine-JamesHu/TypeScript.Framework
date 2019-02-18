import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios';
import { EshineFramework } from '../../src/EshineFramework'

import { GlobalUrlInfo } from '../../src/core/config/ConfigCenter';
import { AxiosRequest } from '../../src/core/request/RequestFactory';
import { BrandInfo } from '../../src/core/entities/brands/BrandInfo';
import { StoreInfo } from '../../src/core/entities/stores/StoreInfo';
import { VueXCache } from '../../src/core/cache/Cache';

Vue.config.productionTip = false;
// Vue.config.devtools = true;

(<any>window).NchanSubscriber = require("nchan");

//测试代码
let config = {
  GlobalUrlInfo: new GlobalUrlInfo({
    EsProxyUrl: "http://esproxy.xxxx.xx/",
    CloudStoreApi: "http://cloudstoreapi.xxxx.xx:10100/sapi/",
    CloudOrderApi: "http://ecloudorders.xxxx.xx:10300/api/",
    SsoApi: "http://ssoapi.xxxx.xx:10403/api/",
    PshubApi: 'http://pshub.xxxx.xx/'
  }),
  Request: new AxiosRequest(axios),
  EsClient: undefined,
  Cache: new VueXCache(store)
}

let framework = new EshineFramework();

let channle = { name: "自助点餐", type: "h5" };
framework.InitializationFramework({ channle: channle });

let brandInfo = new BrandInfo(100224, "上海壹向测试");
framework.SetBrandInfo(brandInfo);

let storeInfo = new StoreInfo(330881);
framework.SetStoreInfo(storeInfo);

let request = new AxiosRequest(axios);
framework.SetRequest(request);

let globalUrl = new GlobalUrlInfo({
  EsProxyUrl: "http://esproxy.xxxx.xx/",
  CloudStoreApi: "http://cloudstoreapi.xxxx.xx:10100/sapi/",
  CloudOrderApi: "http://ecloudorders.xxxx.xx:10300/api/",
  SsoApi: "http://ssoapi.xxxx.xx:10403/api/",
  PshubApi: 'http://pshub.xxxx.xx/'
});

framework.SetGlobalUrl(globalUrl);



//登录后会有Token 才能去获取BrandId
framework.Service.IMemberService.AccountLogin({ phone: "13524542656", password: "a123456" }).then((res: any) => {
  framework.Service.IStoreService.GetBrandStoreinfoByApi();
  // framework.TestDiscount();
  // framework.TestOrder();
  // framework.TestStore();
  // framework.TestShoppingCart();
  // framework.TestShoppingCart();
  // framework.TestMembers();
  framework.TestProduct();
  // framework.TestOrder();
});

console.log("框架对象", framework);

// framework.Service.IActivityService.GetRechargeForCoupon().then((res: any) => {
//   console.log(res);
// })

framework.Service.IProductService.GetLimitSaleProducts().then((res: any) => {
  console.log(res);
})




new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
