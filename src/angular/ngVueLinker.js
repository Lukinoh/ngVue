import Vue from 'vue'
import getVueComponent from '../components/getVueComponent'
import getPropExprs from '../components/props/getExpressions'
import watchPropExprs from '../components/props/watchExpressions'
import evalPropValues from '../components/props/evaluateValues'
import evalPropEvents from '../components/props/evaluateEvents'
import evaluateDirectives from '../directives/evaluateDirectives'

export function ngVueLinker (componentName, jqElement, elAttributes, scope, $injector) {
  const $ngVue = $injector.has('$ngVue') ? $injector.get('$ngVue') : null

  const dataExprsMap = getPropExprs(elAttributes)
  const Component = getVueComponent(componentName, $injector)
  const directives = evaluateDirectives(elAttributes, scope) || []
  const reactiveData = { _v: evalPropValues(dataExprsMap, scope) || {} }
  const on = evalPropEvents(dataExprsMap, scope) || {}

  const inQuirkMode = $ngVue ? $ngVue.inQuirkMode() : false
  const vueHooks = $ngVue ? $ngVue.getVueHooks() : {}
  const vuexStore = $ngVue ? {store: $ngVue.getVuexStore()} : {}
  const vueI18n = $ngVue ? {i18n: $ngVue.getVueI18n()} : {}

  const watchOptions = {
    depth: elAttributes.watchDepth,
    quirk: inQuirkMode
  }
  watchPropExprs(dataExprsMap, reactiveData, watchOptions, scope)

  const vueInstance = new Vue({
    name: 'NgVue',
    el: jqElement[0],
    data: reactiveData,
    render (h) {
      return (
        <Component {...{ directives }} {...{ props: reactiveData._v, on }}>
          {jqElement.html()}
        </Component>
      )
    },
    ...vueHooks,
    ...vuexStore,
    ...vueI18n
  })

  scope.$on('$destroy', () => {
    vueInstance.$destroy()

    if (vueInstance.$el.remove) {
      vueInstance.$el.remove()
    }
  })
}
