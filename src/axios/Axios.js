/**
 * Created by zh on 2019/08/05.
 * 基于 axios 的网络请求组件
 * Axios-based network request component
 */
import axios from 'axios/index';

let defaultConfig = {
  timeout: 90000,
  headers: {
    "Accept": "application/json",
    "Content-Type": 'application/json',
    "Connection": "close",
  }
};
let instance = axios;
// 请求地址 host
const hosts = 'http://154.91.90.118:9000' ;


class Axios {
  constructor(props) {
    if (props && typeof props == 'object') {
      instance = axios.create(props);
    } else {
      instance = axios.create(defaultConfig);
    }
  }

  // get 请求
  GET(url,params) {
    return get(hosts + url,params);
  }
  // post 请求
  POST(url, params) {
    return post(hosts + url,params);
  }
}

async function get(url,params, callback) {
  try {
    let response = await instance.get(url,{params}).catch(resp => {
      return resp;
    });
    // 判断服务器返回状态，根据 code 来判断，没有则表示服务器状态异常
    if (response.status === 200) {
      console.log("response",response.data)
      // 判断业务逻辑返回状态值
      return response.data;
    } else {
      return Promise.reject(response.message);
    }
  } catch (e) {
    console.log(e);
  }
}

async function post(url, params, callback) {
  try {
    let response = await instance.post(url, params).catch(resp => {
      return resp;
    });
    // 判断服务器返回状态，根据 code 来判断，没有则表示服务器状态异常
    if (response.status === 200) {
      console.log("response",response.data)
      // 判断业务逻辑返回状态值
      return response.data;
    } else {
      return Promise.reject(response.message);
    }
  } catch (e) {
    console.log('---->' + e);
  }
}

const Instance = new Axios();

export default Instance;
