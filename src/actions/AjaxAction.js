import { ETHERSCAN_API_KEY } from '../config/privateApiKeys';
import Axios from '../axios/Axios';
const getGasPrice = params => {
    return fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle&gasprice=2000000000&apiKey=' + ETHERSCAN_API_KEY)
        .then((response) => response.json())        // json方式解析，如果是text就是 response.text()
        .then((responseData) => {   // 获取到的数据处理
            if(responseData){
                let sliderValue = (responseData.FastGasPrice).toFixed(4);
                return Promise.resolve(sliderValue);
            }
        })
        .catch((error) => {     // 错误处理
            return Promise.reject(0);
        })
};
const getAppUpdate = params => {
    return Axios.GET('/app/update',params)
        .then(resp => {
            return Promise.resolve(resp);
        })
        .catch(resp => {
            return Promise.reject(resp);
        });
};
const getNadiPrice = params => {
  return fetch('https://api.naaidepin.com/api/price').then((response) => response.json())
    .then((responseData) => {   // 获取到的数据处理
      if(responseData){
        return Promise.resolve(responseData.data.price);
      }
    })
    .catch((error) => {     // 错误处理
      return Promise.reject(0);
    })
};
module.exports = {
    getGasPrice,
    getAppUpdate,
  getNadiPrice
};
