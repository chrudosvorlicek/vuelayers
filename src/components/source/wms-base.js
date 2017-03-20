/**
 * Base mixin for WMS sources
 */
import { omit, mapKeys } from 'vl-utils/func'
import ol, { consts as olConsts, coord as coordHelper } from 'vl-ol'
import tileSource from 'vl-components/source/tile-base'

const props = {
  layers: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: olConsts.WMS_VERSION
  },
  styles: String, // WMS Request styles
  extParams: Object, // Additional WMS Request params
  gutter: Number,
  hidpi: Boolean,
  serverType: String
}

const computed = {
  currentLayers () {
    return this.layers
  },
  currentVersion () {
    return this.version
  },
  currentStyles () {
    return this.styles
  },
  currentServerType () {
    return this.serverType
  },
  currentExtParams () {
    return this.extParams
  }
}

const toUpperCase = x => x.toUpperCase()
const mapKeysToUpperCase = mapKeys(toUpperCase)
const cleanExtParams = params => omit(['LAYERS', 'VERSION', 'STYLES'], mapKeysToUpperCase(params))

const methods = {
  createSource () {
    return new ol.source.TileWMS({
      attributions: this.currentAttributions,
      cacheSize: this.cacheSize,
      params: {
        ...cleanExtParams(this.currentExtParams),
        LAYERS: this.currentLayers,
        STYLES: this.currentStyles,
        VERSION: this.currentVersion
      },
      crossOrigin: this.crossOrigin,
      gutter: this.gutter,
      hidpi: this.hidpi,
      logo: this.logo,
      tileGrid: this.tileGrid,
      projection: this.currentProjection,
      reprojectionErrorThreshold: this.reprojectionErrorThreshold,
      serverType: this.currentServerType,
      wrapX: this.wrapX,
      url: this.replaceUrlTokens()
    })
  },
  /**
   * @param {number[]} coordinate Coordinate in EPSG:4326
   * @param {number} [resolution]
   * @param {string} [projection]
   * @param {Object} [params] GetFeatureInfo params. `info_format` at least should be provided.
   *                          If `query_layers` is not provided then the layers specified in the `layers` prop will be used.
   *                          `version` should not be specified here (value from `version` prop will be used).
   * @return {string|undefined}
   */
  getGetFeatureInfoUrl (coordinate, resolution = this.view.getResolution(), projection = this.currentProjection, params = {}) {
    return this.source.getFeatureInfoUrl(
      coordHelper.pointFromLonLat(coordinate, projection),
      resolution,
      projection,
      cleanExtParams(params)
    )
  }
}

const watch = {
  currentLayers (value) {
    this.updateParams({
      LAYERS: value
    })
  },
  currentVersion (value) {
    this.updateParams({
      VERSION: value
    })
  },
  currentStyles (value) {
    this.updateParams({
      STYLES: value
    })
  },
  currentExtParams (value) {
    this.updateParams(cleanExtParams(value))
  }
}

export default {
  mixins: [ tileSource ],
  props,
  computed,
  methods,
  watch
}
