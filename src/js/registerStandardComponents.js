import Vue from 'vue';
import PowerList from "@/components/PowerList.vue";
import Power from "@/components/Power.vue";
import NumberDisplay from "@/components/NumberDisplay.vue";
import ModifiableNumberDisplay from "@/components/ModifiableNumberDisplay.vue";
import NumberEntry from "@/components/NumberEntry.vue";
import StringEntry from "@/components/StringEntry.vue";
import SelectEntry from "@/components/SelectEntry.vue";
import YesNoToggle from "@/components/YesNoToggle.vue";
import EditCheckbox from "@/components/EditCheckbox.vue";
import EditButton from "@/components/EditButton.vue";
import BoxedSection from "@/components/BoxedSection.vue"
import CollapsingSection from "@/components/CollapsingSection.vue";
import ModalLightbox from "@/components/ModalLightbox.vue";
import PencilIcon from "@/components/PencilIcon.vue";
import TrashIcon from "@/components/TrashIcon.vue";
import DocsLookup from "@/components/DocsLookup.vue";


// Pre-register all components that will be involved in recursion or are widely used
const registerStandardComponents = function() {
  Vue.component("PowerList", PowerList);
  Vue.component("Power", Power);
  Vue.component("NumberDisplay", NumberDisplay);
  Vue.component("ModifiableNumberDisplay", ModifiableNumberDisplay);
  Vue.component("NumberEntry", NumberEntry);
  Vue.component("StringEntry", StringEntry);
  Vue.component("SelectEntry", SelectEntry);
  Vue.component("YesNoToggle", YesNoToggle);
  Vue.component("EditCheckbox", EditCheckbox);
  Vue.component("EditButton", EditButton);
  Vue.component("BoxedSection", BoxedSection);
  Vue.component("CollapsingSection", CollapsingSection);
  Vue.component("ModalLightbox", ModalLightbox);
  Vue.component("PencilIcon", PencilIcon);
  Vue.component("TrashIcon", TrashIcon);
  Vue.component("DocsLookup", DocsLookup);
}

export {
  registerStandardComponents,
};
