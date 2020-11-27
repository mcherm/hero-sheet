<template>
  <div>
    <div>
      This is the character summary
    </div>
    <div>
      {{
        [
          [{text: 'Abilities', style: 'subheader'}, {text: ''}]
        ].concat(Object.keys(getCharsheet().abilities).map(
          (ability) => [ability,getCharsheet().abilities[ability].ranks]
        ))
      }}
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
  const pdfFonts = require("pdfmake/build/vfs_fonts.js");
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

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