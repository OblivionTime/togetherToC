/*
 * @Description:
 * @Version: 2.0
 * @Autor: solid
 * @Date: 2021-12-23 22:30:23 +0800
 * @LastEditors: solid
 * @LastEditTime: 2022-12-13 13:43:25
 */
import axios from 'axios'
var baseURL
if (process.env.NODE_ENV == "development") {
	baseURL = `http://192.168.6.24:1015/api/`;
} else {
	if (window.api) {
		baseURL = `http://${window.api.getIpAddress()}:1015/api/`;
	} else {
		baseURL = `http://${window.location.host}/api/`;
	}
}
const service = axios.create({
	baseURL: baseURL,
	// withCredentials: true,
	timeout: 500000
})

// request interceptor
service.interceptors.request.use(
	(config) => {
		return config
	},
	(error) => {
		// do something with request error
		return Promise.reject(error)
	}
)

// response interceptor
service.interceptors.response.use(
	/**
	 * If you want to get http information such as headers or status
	 * Please return  response => response
	 */

	/**
	 * Determine the request status by custom code
	 * Here is just an example
	 * You can also judge the status by HTTP Status Code
	 */
	response => {
		// if the custom code is not 20000, it is judged as an error.
		return response.data
	},
	error => {
		console.log(error);
	}
)

export default service
