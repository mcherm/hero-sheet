<template functional>
  <svg class="pencil" :class="{isModified: props.isModified}" @click="listeners['icon-click']()" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512">
    <path d="M 332.99999,66.23072 102.86266,265.26266 C 85.998019,279.51825 39.380015,435.10415 32.902771,467.99362 64.238238,466.01824 203.04269,450.86712 221.44578,430.11084 L 461.05036,210.67712 C 475.4256,197.30834 505.72061,151.17483 453.1535,89.060723 400.58639,26.946617 348.62083,52.376467 332.99999,66.23072 Z"/>
    <line x1="143.11326" y1="330.64095" x2="356.5494" y2="133.24337"/>
    <line x1="181.35904" y1="381.84096" x2="398.49638" y2="180.74218"/>
    <path d="m 301.03132,94.997579 c 23.52348,-21.013396 61.98477,-34.311899 116.81487,29.977201 54.83009,64.2891 34.46555,92.25119 13.34417,112.51921"/>
    <path d="m 106.71808,261.86023 c -4.34566,37.95952 14.74966,65.43229 46.79919,58.36048 -4.96594,32.26731 14.12592,52.81415 40.6202,50.53688 -1.15717,25.57528 14.5582,50.31658 39.03843,47.17013"/>
    <path d="m 263.27256,126.64534 c 22.90662,-18.54593 60.13417,-36.162501 114.96427,28.1266 54.83009,64.2891 39.40049,96.56926 16.4285,116.83728"/>
    <path class="tip" d="m 53.229811,389.20026 a 91.296387,90.67952 0 0 1 61.672379,71.11785 L 30,470 Z"/>
  </svg>
</template>

<script>
  export default {
    name: "PencilIcon",
    props: {
      isModified: { type: Boolean, required: true }
    }
  }
</script>

<style scoped>
  svg.pencil {
    width: 8px;
    height: 8px;
  }
  svg.pencil.isModified {
    width: 20px;
    height: 20px;
  }
  line {
    stroke: #000;
    stroke-linecap: butt;
    stroke-width: 32px;
  }
  path {
    fill: none;
    stroke: #000;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 32px;
  }
  path.tip {
    fill: #000;
    fill-rule: evenodd;
    stroke: none;
  }
</style>