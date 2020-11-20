<template>
  <div>
    <div>
      This is the character summary
    </div>
    <div>
      strength = {{getCharsheet().abilities.strength.ranks}}
    </div>
    <edit-button :on-click="() => {openPDF();}" :is-navigation="true">Show PDF</edit-button>
    <edit-button :on-click="() => {downloadPDF();}" :is-navigation="true">Download PDF</edit-button>
  </div>
</template>

<script>
  import {documentDefinition} from "../js/pdf.js";

  const pdfMake = require("pdfmake/build/pdfmake.js");

  export default {
    name: "CharacterSummary",
    inject: ["getCharsheet"],
    methods: {
      openPDF: function() {
        pdfMake.createPdf(documentDefinition(this.getCharsheet())).open();
      },
      downloadPDF: function() {
        pdfMake.createPdf(documentDefinition(this.getCharsheet())).download();
      },
    }
  }
</script>

<style scoped>

</style>