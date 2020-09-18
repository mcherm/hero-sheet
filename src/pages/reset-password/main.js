import Vue from 'vue'
import App from './App.vue'

// Pre-register all components that will be involved in recursion or are widely used
import PowerList from "@/components/PowerList.vue"
Vue.component("PowerList", PowerList);
import Power from "@/components/Power.vue"
Vue.component("Power", Power);
import NumberDisplay from "@/components/NumberDisplay.vue"
Vue.component("NumberDisplay", NumberDisplay);
import ModifiableNumberDisplay from "@/components/ModifiableNumberDisplay.vue"
Vue.component("ModifiableNumberDisplay", ModifiableNumberDisplay);
import NumberEntry from "@/components/NumberEntry.vue"
Vue.component("NumberEntry", NumberEntry);
import StringEntry from "@/components/StringEntry.vue"
Vue.component("StringEntry", StringEntry);
import YesNoToggle from "@/components/YesNoToggle.vue";
Vue.component("YesNoToggle", YesNoToggle);
import BoxedSection from "@/components/BoxedSection.vue"
Vue.component("BoxedSection", BoxedSection);
import ModalLightbox from "@/components/ModalLightbox.vue";
Vue.component("ModalLightbox", ModalLightbox);
import PencilIcon from "@/components/PencilIcon.vue";
Vue.component("PencilIcon", PencilIcon);
import TrashIcon from "@/components/TrashIcon.vue";
Vue.component("TrashIcon", TrashIcon);
import DocsLookup from "@/components/DocsLookup.vue";
Vue.component("DocsLookup", DocsLookup);

const app = new Vue({
  el: "#app",
  render: h => h(App)
});
Vue.config.devtools = true;
