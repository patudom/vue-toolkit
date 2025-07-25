<template>
  <div id="speed-control">
    <div id="speed-buttons">
      <icon-button
        @activate="() => {
          reverseRate();
          emit('update:reverse', playbackRate < 0);
        }"
        :md-icon="playbackRate < 0 ? 'mdi-step-forward-2' : 'mdi-step-backward-2'"
        :color="color"
        :focus-color="color"
        :tooltip-text="playbackRate < 0 ? 'Play time forward' : 'Play time backwards'"
        tooltip-location="top"
        tooltip-offset="5px"
        :show-tooltip="!mobile"
        md-size="18"
      >
      </icon-button>
      
      <icon-button 
        id="play-pause-icon"
        :fa-icon="!timePlaying ? 'play' : 'pause'"
        fa-size="1x"
        @activate="
          () => {
            timePlaying = !timePlaying;
            emit('update:modelValue', timePlaying);
          }
        "
        :color="color"
        :focus-color="color"
        tooltip-text="Play/Pause"
        tooltip-location="top"
        tooltip-offset="5px"
        :show-tooltip="!mobile"
      ></icon-button>
      
      <icon-button 
        id="slow-down"
        :fa-icon="'angles-down'"
        fa-size="1x"
        @activate="
          () => {
            decreaseRate();
            timePlaying = true;
            emit('slow-down', playbackRate);
          }
        "
        :color="color"
        :focus-color="color"
        :tooltip-text="`Slow down ${rateDelta}x`"
        tooltip-location="top"
        tooltip-offset="5px"
        :show-tooltip="!mobile"
      ></icon-button>
      
      <icon-button 
        id="speed-up"
        :fa-icon="'angles-up'"
        fa-size="1x"
        @activate="
          () => {
            increaseRate();
            timePlaying = true;
            emit('speed-up', playbackRate);
          }
        "
        :color="color"
        :focus-color="color"
        :tooltip-text="`Speed up ${rateDelta}x`"
        tooltip-location="top"
        tooltip-offset="5px"
        :show-tooltip="!mobile"
      ></icon-button>

      <icon-button 
        id="reset"
        :fa-icon="'rotate'"
        fa-size="1x"
        @activate="
          () => {
            playbackRate = defaultRate;
            timePlaying = false;
            forceRate = false;
            emit('reset');
          }
        "
        :color="color"
        :focus-color="color"
        tooltip-text="Reset"
        tooltip-location="top"
        tooltip-offset="5px"
        :show-tooltip="!mobile"
      ></icon-button>

      <v-dialog
        v-if="!useInline"
        v-model="playbackVisible"
        :scrim="false"
        location="top"
        offset="40"
        location-strategy="connected"
        persistent
        no-click-animation
        :retain-focus="false"
      >
        <template v-slot:activator>
          <icon-button
            id="speed-control-icon"
            @activate="
              () => {
                playbackVisible = !playbackVisible;
              }
            "
            :fa-icon="playbackVisible ? 'times' : 'gauge-high'"
            fa-size="1x"
            :color="color"
            :focus-color="color"
            tooltip-text="More Speed Controls"
            tooltip-location="top"
            tooltip-offset="5px"
            :show-tooltip="!mobile"
          ></icon-button>
        </template>
        <playback-control
          class="desktop-playback-control"
          v-if="playbackVisible"
          :model-value="playbackRate"
          @update:modelValue="
            forceRate = false;
            playbackRate = $event;
            emit('set-rate', $event);
          "
          :paused="!timePlaying"
          @paused="
            timePlaying = !$event;
            emit('update:modelValue', !$event);
          "
          :max-power="Math.log10(maxSpeed)"
          :max="Math.log10(maxSpeed) + 1"
          :color="color"
          :inline="false"
          show-close-button
          @close="
            () => {
              playbackVisible = false;
            }
          "
        />
      </v-dialog>
      <div v-if="useInline" id="inline-speed-control">
        <icon-button
          id="speed-control-icon"
          @activate="
            () => {
              playbackVisible = !playbackVisible;
              allowClickOutside = false; // prevent onClickOutside from hiding it.
            }
          "
          :fa-icon="playbackVisible ? 'times' : 'gauge-high'"
          :color="color"
          :focus-color="color"
          tooltip-text="Time Controls"
          tooltip-location="top"
          tooltip-offset="5px"
          faSize="1x"
          :show-tooltip="!mobile"
        ></icon-button>

        <playback-control
          class="mobile-playback-control"
          v-show="playbackVisible"
          :model-value="playbackRate"
          @update:modelValue="
            forceRate = false;
            playbackRate = $event;
            emit('set-rate', $event);
          "
          :paused="!timePlaying"
          @paused="timePlaying = !$event"
          :max-power="Math.log10(maxSpeed)"
          :max="Math.log10(maxSpeed) + 1"
          :color="color"
          :inline="true"
          inline-button
          v-click-outside="onClickOutside"
          @close="
            () => {
              playbackVisible = false;
            }
          "
        />
      </div>
    </div>
    
    <div v-if="showStatus" id="speed-text">{{ Math.round(playbackRate) }}x {{ timePlaying ? '' : '(Paused)'  }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faPause, faAnglesDown, faAnglesUp, faRotate, faTimes, faGaugeHigh } from "@fortawesome/free-solid-svg-icons";

import { usePlaybackControl } from "../composables/playbackControl";
import { supportsTouchscreen } from "../utils";
import { SpeedControlProps } from "../types";

import { VDialog } from 'vuetify/lib/components/index.mjs';
import { IconButton, PlaybackControl } from '..';

import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

library.add(faAnglesDown);
library.add(faAnglesUp);
library.add(faGaugeHigh);
library.add(faPause);
library.add(faPlay);
library.add(faRotate);
library.add(faTimes);

const props = withDefaults(defineProps<SpeedControlProps>(), {
  color: "white",
  maxSpeed: 10000,
  defaultRate: 1,
  showStatus: false,
  rateDelta: 10,
  useInline: false,
  modelValue: false,
});

const minSpeed = 1;

const emit = defineEmits<{
  /** Fired whenever the reset button is pressed .*/
  (event: "reset"): void
  /** Fired whenever the reverse button is pressed. The event value is a boolean that is true if playback is now reversed. */
  (event: "update:reverse", reverse: boolean): void
  /** Fired whenever the playback is started or paused. The event value is a boolean that is true if time is now playing. */
  (event: "update:modelValue", playing: boolean): void
  /** Fired whenever the slowdown button is pressed. The event value is the new playback rate */
  (event: "slow-down", rate: number): void
  /** Fired whenever the speed up button is pressed. The event value is the new playback rate. */
  (event: "speed-up", rate: number): void
  /** Fired whenever the playback rate is changed. The event value is the new playback rate. */
  (event: "set-rate", rate: number): void
}>();

const playbackVisible = ref(false);
const forceRate = ref(false);

const { timePlaying, clockRate, setSpeed } = usePlaybackControl(props.store, false);
const { smAndDown } = useDisplay();
const mobile = computed(() => smAndDown && supportsTouchscreen());

timePlaying.value = props.modelValue;
setSpeed(props.defaultRate);

watch(() => props.modelValue, (v) => { timePlaying.value = v; });
watch(timePlaying, (v) => { emit("update:modelValue", v); });

function clamp(val: number) {
  return Math.min(Math.max(val, minSpeed), props.maxSpeed);
}

const playbackRate = computed({
  get: function(): number {
    if (forceRate.value) {
      const sign = Math.sign(clockRate.value);
      return sign * Math.min(10, sign * clockRate.value);
    }
    return clockRate.value;
  },
  set: function(value: number) {
    clockRate.value = Math.sign(value) * clamp(Math.abs(value));
  }
});

function reverseRate() {
  playbackRate.value = -playbackRate.value;
}

function increaseRate() {
  const sign = Math.sign(playbackRate.value);
  const abs = Math.abs(playbackRate.value);
  const newRate = abs * props.rateDelta;
  playbackRate.value = sign * clamp(newRate);
}
function decreaseRate() {
  const sign = Math.sign(playbackRate.value);
  const abs = Math.abs(playbackRate.value);
  const newRate = abs / props.rateDelta;
  playbackRate.value = sign * clamp(newRate);
}


const allowClickOutside = ref(false);
function onClickOutside() {
  if (playbackVisible.value && allowClickOutside.value) {
    playbackVisible.value = false;
    return;
  }
  allowClickOutside.value = playbackVisible.value;
}
</script>

<style lang="less">

:root {
  --default-font-size: clamp(0.7rem, min(1.7vh, 1.7vw), 1.1rem);
  --default-line-height: clamp(1rem, min(2.2vh, 2.2vw), 1.6rem);
}

#speed-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  //margin-left: 10px;

  #speed-buttons {
    display: flex;
    flex-direction: row;
    align-items: center;

    @media (max-width: 600px) {
      gap: 20px;
    }

    @media (min-width: 601px) {
      gap: 10px;
    }

  }
  
  @media (orientation: landscape) {
    // margin-left: 3rem;
  }
  
  .icon-wrapper {
    padding-inline: calc(0.3 * var(--default-line-height));
    padding-block: calc(0.4 * var(--default-line-height));
    border: 2px solid var(--accent-color);
  }

}

#enclosing-playback-container.desktop-playback-control {
  --tick-font-size: 12px;
  margin-bottom: calc(2.5rem + 5px);
  padding-right: 1rem;
  
}

// account for the long 10000x text
#enclosing-playback-container.inset {
  padding-right: 1rem;
}


#inline-speed-control {
  display: flex; 
  flex-grow: 0;
  align-items: flex-end; 
  position: relative; 
  gap: 6px;

#enclosing-playback-container.mobile-playback-control {
    position: fixed;
    width: calc(90% - 1rem);
    left: calc(50% - 11px); // 9px is half the size close button
    --off: 0; //calc(50%);
    transform: translateX(-50%) translateY(var(--off)) !important;
  }

}


#speed-text {
  background-color: rgba(0, 0, 0, 0.5);
  padding-inline: 0.4em;
  border-radius: 0.3em;
  font-size: calc(1 * var(--default-font-size));
  text-wrap: nowrap;  
  width: fit-content;
  align-self: center;
}

</style>
