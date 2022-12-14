/*
 * @Description: 
 * @Version: 1.0
 * @Autor: solid
 * @Date: 2022-12-12 14:27:26
 * @LastEditors: solid
 * @LastEditTime: 2022-12-13 10:27:45
 */
import Vue from 'vue'
import App from './App.vue'
import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(Element)
import VueClipboard from 'vue-clipboard2'

Vue.use(VueClipboard)
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
