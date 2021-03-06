<template>
  <i
    :id="vmId"
    :class="vmClass"
    style="display: none !important;">
    <slot>
      <FillStyle
        :id="'vl-' + id + '-default-fill-style'"
        color="#222" />
      <StrokeStyle
        :id="'vl-' + id + '-default-stroke-style'"
        color="#eee" />
    </slot>
    <BackgroundStyle :id="'vl-' + id + '-background-style'">
      <slot name="background" />
    </BackgroundStyle>
  </i>
</template>

<script>
  import debounce from 'debounce-promise'
  import { Text as TextStyle } from 'ol/style'
  import { fillStyleContainer, FRAME_TIME, strokeStyleContainer, style } from '../../mixins'
  import { dumpFillStyle, dumpStrokeStyle } from '../../ol-ext'
  import { clonePlainObject, isEqual, isFunction, mergeDescriptors, sequential } from '../../utils'
  import BackgroundStyle from './background.vue'
  import FillStyle from './fill.vue'
  import StrokeStyle from './stroke.vue'

  export default {
    name: 'VlStyleText',
    components: {
      BackgroundStyle,
      FillStyle,
      StrokeStyle,
    },
    mixins: [
      fillStyleContainer,
      strokeStyleContainer,
      style,
    ],
    stubVNode: {
      empty: false,
      attrs () {
        return {
          id: this.vmId,
          class: this.vmClass,
        }
      },
    },
    props: {
      font: {
        type: String,
        default: '10px sans-serif', // css font format https://developer.mozilla.org/en-US/docs/Web/CSS/font?v=control
      },
      maxAngle: Number,
      placement: String,
      offsetX: {
        type: Number,
        default: 0,
      },
      offsetY: {
        type: Number,
        default: 0,
      },
      overflow: Boolean,
      rotateWithView: {
        type: Boolean,
        default: false,
      },
      rotation: {
        type: Number,
        default: 0,
      },
      scale: {
        type: Number,
        default: 1,
      },
      text: String,
      textAlign: String, // left, right, center, end, start
      textBaseline: String, // bottom, top, middle, alphabetic, hanging, ideographic
      padding: {
        type: Array,
        default: () => [0, 0, 0, 0],
        validate: val => val.length && val.length === 4,
      },
    },
    computed: {
      currentBackgroundFill () {
        if (!(this.rev && this.$bgFill)) return

        return dumpFillStyle(this.$bgFill)
      },
      currentBackgroundStroke () {
        if (!(this.rev && this.$bgStroke)) return

        return dumpStrokeStyle(this.$bgStroke)
      },
    },
    watch: {
      font: /*#__PURE__*/sequential(async function (value) {
        await this.setFont(value)
      }),
      maxAngle: /*#__PURE__*/sequential(async function (value) {
        await this.setMaxAngle(value)
      }),
      placement: /*#__PURE__*/sequential(async function (value) {
        await this.setPlacement(value)
      }),
      offsetX: /*#__PURE__*/sequential(async function (value) {
        await this.setOffsetX(value)
      }),
      offsetY: /*#__PURE__*/sequential(async function (value) {
        await this.setOffsetY(value)
      }),
      overflow: /*#__PURE__*/sequential(async function (value) {
        await this.setOverflow(value)
      }),
      rotation: /*#__PURE__*/sequential(async function (value) {
        await this.setRotation(value)
      }),
      rotateWithView: /*#__PURE__*/sequential(async function (value) {
        await this.setRotateWithView(value)
      }),
      scale: /*#__PURE__*/sequential(async function (value) {
        await this.setScale(value)
      }),
      text: /*#__PURE__*/sequential(async function (value) {
        await this.setText(value)
      }),
      textAlign: /*#__PURE__*/sequential(async function (value) {
        await this.setTextAlign(value)
      }),
      textBaseline: /*#__PURE__*/sequential(async function (value) {
        await this.setTextBaseline(value)
      }),
      padding: /*#__PURE__*/sequential(async function (value) {
        await this.setPadding(value)
      }),
      currentBackgroundFill: {
        deep: true,
        handler: /*#__PURE__*/debounce(function (value, prev) {
          if (isEqual(value, prev)) return

          this.$emit('update:backgroundFill', value && clonePlainObject(value))
        }, FRAME_TIME),
      },
      currentBackgroundStroke: {
        deep: true,
        handler: /*#__PURE__*/debounce(function (value, prev) {
          if (isEqual(value, prev)) return

          this.$emit('update:backgroundStroke', value && clonePlainObject(value))
        }, FRAME_TIME),
      },
    },
    created () {
      this._bgFill = null
      this._bgFillVm = null
      this._bgStroke = null
      this._bgStrokeVm = null

      this::defineServices()
    },
    methods: {
      /**
       * @returns {Text}
       * @protected
       */
      createStyle () {
        return new TextStyle({
          font: this.font,
          maxAngle: this.maxAngle,
          placement: this.placement,
          offsetX: this.offsetX,
          offsetY: this.offsetY,
          overflow: this.overflow,
          rotateWithView: this.rotateWithView,
          rotation: this.rotation,
          scale: this.scale,
          text: this.text,
          textAlign: this.textAlign,
          textBaseline: this.textBaseline,
          padding: this.padding,
          fill: this.$fill,
          stroke: this.$stroke,
          backgroundFill: this.$bgFill,
          backgroundStroke: this.$bgStroke,
        })
      },
      /**
       * @return {Promise<void>}
       * @protected
       */
      async mount () {
        if (this.$textStyleContainer) {
          await this.$textStyleContainer.setText(this)
        }

        return this::style.methods.mount()
      },
      /**
       * @return {Promise<void>}
       * @protected
       */
      async unmount () {
        if (this.$textStyleContainer && this.$textStyleContainer.getTextVm() === this) {
          await this.$textStyleContainer.setText(null)
        }

        return this::style.methods.unmount()
      },
      /**
       * @return {Promise}
       */
      async refresh () {
        this::style.methods.refresh()

        if (this.$textStyleContainer) {
          this.$textStyleContainer.refresh()
        }
      },
      /**
       * @returns {Object}
       * @protected
       */
      getServices () {
        const vm = this

        return mergeDescriptors(
          this::style.methods.getServices(),
          this::fillStyleContainer.methods.getServices(),
          this::strokeStyleContainer.methods.getServices(),
          {
            get bgStyleContainer () { return vm },
          },
        )
      },
      async getFont () {
        return (await this.resolveStyle()).getFont()
      },
      async setFont (font) {
        if (font === await this.getFont()) return

        (await this.resolveStyle()).setFont(font)
        await this.scheduleRefresh()
      },
      async getMaxAngle () {
        return (await this.resolveStyle()).getMaxAngle()
      },
      async setMaxAngle (maxAngle) {
        if (maxAngle === await this.getMaxAngle()) return

        (await this.resolveStyle()).setMaxAngle(maxAngle)
        await this.scheduleRefresh()
      },
      async getOffsetX () {
        return (await this.resolveStyle()).getOffsetX()
      },
      async setOffsetX (offsetX) {
        if (offsetX === await this.getOffsetX()) return

        (await this.resolveStyle()).setOffsetX(offsetX)
        await this.scheduleRefresh()
      },
      async getOffsetY () {
        return (await this.resolveStyle()).getOffsetY()
      },
      async setOffsetY (offsetY) {
        if (offsetY === await this.getOffsetY()) return

        (await this.resolveStyle()).setOffsetY(offsetY)
        await this.scheduleRefresh()
      },
      async getOverflow () {
        return (await this.resolveStyle()).getOverflow()
      },
      async setOverflow (overflow) {
        if (overflow === await this.getOverflow()) return

        (await this.resolveStyle()).setOverflow(overflow)
        await this.scheduleRefresh()
      },
      async getPadding () {
        return (await this.resolveStyle()).getPadding()
      },
      async setPadding (padding) {
        if (isEqual(padding, await this.getPadding())) return

        (await this.resolveStyle()).setPadding(padding)
        await this.scheduleRefresh()
      },
      async getPlacement () {
        return (await this.resolveStyle()).getPlacement()
      },
      async setPlacement (placement) {
        if (placement === await this.getPlacement()) return

        (await this.resolveStyle()).setPlacement(placement)
        await this.scheduleRefresh()
      },
      async getRotateWithView () {
        return (await this.resolveStyle()).getRotateWithView()
      },
      async setRotateWithView (rotateWithView) {
        if (rotateWithView === await this.getRotateWithView()) return

        (await this.resolveStyle()).setRotateWithView(rotateWithView)
        await this.scheduleRefresh()
      },
      async getRotation () {
        return (await this.resolveStyle()).getRotation()
      },
      async setRotation (rotation) {
        if (rotation === await this.getRotation()) return

        (await this.resolveStyle()).setRotation(rotation)
        await this.scheduleRefresh()
      },
      async getScale () {
        return (await this.resolveStyle()).getScale()
      },
      async setScale (scale) {
        if (scale === await this.getScale()) return

        (await this.resolveStyle()).setScale(scale)
        await this.scheduleRefresh()
      },
      async getText () {
        return (await this.resolveStyle()).getText()
      },
      async setText (text) {
        if (text === await this.getText()) return

        (await this.resolveStyle()).setText(text)
        await this.scheduleRefresh()
      },
      async getTextAlign () {
        return (await this.resolveStyle()).getTextAlign()
      },
      async setTextAlign (textAlign) {
        if (textAlign === await this.getTextAlign()) return

        (await this.resolveStyle()).setTextAlign(textAlign)
        await this.scheduleRefresh()
      },
      async getTextBaseline () {
        return (await this.resolveStyle()).getTextBaseline()
      },
      async setTextBaseline (textBaseline) {
        if (textBaseline === await this.getTextBaseline()) return

        (await this.resolveStyle()).setTextBaseline(textBaseline)
        await this.scheduleRefresh()
      },
      async getFillStyleTarget () {
        const style = await this.resolveStyle()

        return {
          setFill: async fill => {
            style.setFill(fill)
            await this.scheduleRefresh()
          },
        }
      },
      async getStrokeStyleTarget () {
        const style = await this.resolveStyle()

        return {
          setStroke: async stroke => {
            style.setStroke(stroke)
            await this.scheduleRefresh()
          },
        }
      },
      getBackgroundFill () {
        return this._bgFill
      },
      async setBackgroundFill (fill) {
        if (fill && isFunction(fill.resolveOlObject)) {
          fill = await fill.resolveOlObject()
        }
        fill || (fill = null)

        if (fill === this._bgFill) return

        this._bgFill = fill
        this._bgFillVm = fill?.vm && fill.vm[0]
        const style = await this.resolveStyle()
        style.setBackgroundFill(fill)
        await this.scheduleRefresh()
      },
      getBackgroundStroke () {
        return this._bgStroke
      },
      async setBackgroundStroke (stroke) {
        if (stroke && isFunction(stroke.resolveOlObject)) {
          stroke = await stroke.resolveOlObject()
        }
        stroke || (stroke = null)

        if (stroke === this._bgStroke) return

        this._bgStroke = stroke
        this._bgStrokeVm = stroke?.vm && stroke.vm[0]
        const style = await this.resolveStyle()
        style.setBackgroundStroke(stroke)
        await this.scheduleRefresh()
      },
    },
  }

  function defineServices () {
    Object.defineProperties(this, {
      $textStyleContainer: {
        enumerable: true,
        get: () => this.$services?.textStyleContainer,
      },
      $bgFill: {
        enumerable: true,
        get: this.getBackgroundFill,
      },
      $bgFillVm: {
        enumerable: true,
        get: () => this._bgFillVm,
      },
      $bgStroke: {
        enumerable: true,
        get: this.getBackgroundStroke,
      },
      $bgStrokeVm: {
        enumerable: true,
        get: () => this._bgStrokeVm,
      },
    })
  }
</script>
